require("dotenv").config();
const fs = require("fs");
const path = require("path");
const os = require("os");
const P = require("pino");
const express = require("express");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

// ---------------- CONFIG ----------------
const OWNER_JID = "255624236654@s.whatsapp.net"; // 👑 Change to your number
const PREFIX = "!";
const PORT = process.env.PORT || 3000;
const WARN_LIMIT = 3;
let BOT_MODE = "public"; // default mode: public

// ---------------- EXPRESS ----------------
const app = express();
app.use(express.json());
app.get("/", (req, res) => res.send("🤖 BOSS GIRL TECH ❤️ Bot is running!"));
app.listen(PORT, () => console.log(`✅ Express running on port ${PORT}`));

// ---------------- FEATURES ----------------
const featureFile = path.join(__dirname, "features.json");
const defaultFeatures = {
  antidelete: true,
  antiLink: true,
  antiLinkAction: "warn", // warn|remove|delete
  faketyping: true,
  fakerecording: true
};
if (!fs.existsSync(featureFile)) fs.writeFileSync(featureFile, JSON.stringify(defaultFeatures, null, 2));

function getFeatures() { return JSON.parse(fs.readFileSync(featureFile)); }
function saveFeatures(fObj) { fs.writeFileSync(featureFile, JSON.stringify(fObj, null, 2)); }
function setFeature(name, value) { 
  const f = getFeatures(); 
  f[name] = value; 
  saveFeatures(f);
}

// ---------------- GLOBAL WARN MAP ----------------
if (!global.warnMap) global.warnMap = new Map(); // groupId -> {userId -> count}

// ---------------- LOAD COMMANDS ----------------
const commands = new Map();
const commandsPath = path.join(__dirname, "commands");
if (fs.existsSync(commandsPath)) {
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
  for (const file of files) {
    try {
      const command = require(path.join(commandsPath, file));
      if (command.name && typeof command.execute === "function") {
        commands.set(command.name.toLowerCase(), command);
        console.log(`✅ Loaded command: ${command.name}`);
      }
    } catch (err) {
      console.error(`❌ Failed to load command ${file}:`, err);
    }
  }
} else {
  fs.mkdirSync(commandsPath);
  console.log("📂 Created commands folder.");
}

// ---------------- PRESENCE HELPERS ----------------
async function doFakeTyping(sock, jid, duration = 1500) {
  try {
    await sock.sendPresenceUpdate("composing", jid);
    await new Promise(r => setTimeout(r, duration));
    await sock.sendPresenceUpdate("paused", jid);
  } catch (e) {
    console.error("doFakeTyping error:", e);
  }
}

async function doFakeRecording(sock, jid, duration = 2500) {
  try {
    await sock.sendPresenceUpdate("recording", jid);
    await new Promise(r => setTimeout(r, duration));
    await sock.sendPresenceUpdate("paused", jid);
  } catch (e) {
    console.error("doFakeRecording error:", e);
  }
}

// ---------------- START BOT ----------------
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P({ level: "silent" })),
    },
    logger: P({ level: "silent" }),
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      if ((lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) startBot();
    } else if (connection === "open") {
      console.log("✅ Bot connected!");
      try {
        const f = getFeatures();
        f.faketyping = true;
        f.fakerecording = true;
        saveFeatures(f);
        console.log("🔧 Auto-enabled faketyping & fakerecording.");
      } catch (e) {
        console.error("Failed to auto-enable fake features:", e);
      }
      await doFakeTyping(sock, OWNER_JID, 1200);
      await doFakeRecording(sock, OWNER_JID, 900);
      await sock.sendMessage(OWNER_JID, { text: "🤖 BOSS GIRL TECH ❤️ Bot online! faketyping & fakerecording ON ✅" });
    }
  });

  // ---------------- MESSAGE HANDLER ----------------
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const sender = msg.key.participant || from;

    let body = msg.message.conversation ||
               msg.message.extendedTextMessage?.text ||
               msg.message.imageMessage?.caption ||
               msg.message.videoMessage?.caption || "";
    body = body.trim();
    if (!body) return;

    if (BOT_MODE === "private" && sender !== OWNER_JID) return;

    const features = getFeatures();

    // 🟢 AUTO PRESENCE ON EVERY MESSAGE
    if (features.faketyping) await doFakeTyping(sock, from, 1000);
    if (features.fakerecording) await doFakeRecording(sock, from, 1500);

    // ---------------- ANTI-LINK ----------------
    if (isGroup && features.antiLink) {
      const linkRegex = /https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/;
      if (linkRegex.test(body) && sender !== OWNER_JID) {
        const action = features.antiLinkAction || "warn";

        const groupMetadata = await sock.groupMetadata(from);
        const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
        const botIsAdmin = groupMetadata.participants.some(
          p => p.id === botNumber && (p.admin === "admin" || p.admin === "superadmin")
        );

        if (!botIsAdmin) {
          await sock.sendMessage(from, { text: "⚠️ I am not admin, I can't remove links!\n\n🤖 BOSS GIRL TECH ❤️" });
          return;
        }

        try { await sock.deleteMessage(from, { id: msg.key.id, remoteJid: from, fromMe: false }); } catch {}

        if (action === "warn") {
          if (!global.warnMap.has(from)) global.warnMap.set(from, new Map());
          const groupWarns = global.warnMap.get(from);
          const prevWarn = groupWarns.get(sender) || 0;
          const newWarn = prevWarn + 1;
          groupWarns.set(sender, newWarn);

          if (newWarn >= WARN_LIMIT) {
            await sock.sendMessage(from, {
              text: `🚨 @${sender.split("@")[0]} reached warn limit!\nRemoved from group.`,
              mentions: [sender],
            });
            await sock.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
            groupWarns.delete(sender);
          } else {
            await sock.sendMessage(from, {
              text: `⚠️ @${sender.split("@")[0]} warned ${newWarn}/${WARN_LIMIT}\nLink deleted!`,
              mentions: [sender],
            });
          }
        } else if (action === "remove") {
          await sock.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
        }
      }
    }

    // ---------------- OWNER COMMANDS ----------------
    if (body.startsWith(PREFIX)) {
      const args = body.slice(PREFIX.length).trim().split(/\s+/);
      const cmdName = args.shift().toLowerCase();

      if (cmdName === "mode" && sender === OWNER_JID) {
        const mode = args[0]?.toLowerCase();
        if (!["public","private"].includes(mode)) {
          await sock.sendMessage(from, { text: "❌ Invalid mode. Use: !mode public|private" }, { quoted: msg });
        } else {
          BOT_MODE = mode;
          await sock.sendMessage(from, { text: `✅ Bot mode set to: ${mode.toUpperCase()}` }, { quoted: msg });
        }
        return;
      }

      if (cmdName === "set" && args.length === 2 && sender === OWNER_JID) {
        const featureName = args[0];
        const value = args[1].toLowerCase() === "on";
        if (features.hasOwnProperty(featureName)) {
          setFeature(featureName, value);
          await sock.sendMessage(from, { text: `✅ ${featureName} ${value ? "enabled" : "disabled"}` });
        } else {
          await sock.sendMessage(from, { text: `❌ Unknown feature: ${featureName}` });
        }
        return;
      }

      if (commands.has(cmdName)) {
        try { await commands.get(cmdName).execute(sock, msg, args); }
        catch (err) { await sock.sendMessage(from, { text: `❌ Error executing ${cmdName}` }); }
      }
    }
  });

  // ---------------- ANTI-DELETE ----------------
  sock.ev.on("messages.update", async (updates) => {
    const features = getFeatures();
    if (!features.antidelete) return;
    for (const update of updates) {
      if (update.update === "message-revoke") {
        const remoteJid = update.key.remoteJid;
        const participant = update.key.participant || update.participant;
        const sender = participant ? `@${participant.split("@")[0]}` : "Someone";

        let content = "";
        if (update.message?.conversation) content = update.message.conversation;
        else if (update.message?.imageMessage) content = "[🖼️ Image]";
        else if (update.message?.videoMessage) content = "[🎬 Video]";
        else if (update.message?.audioMessage) content = "[🎵 Audio]";
        else content = "[📎 Unknown message type]";

        await sock.sendMessage(remoteJid, {
          text: `♻️ Anti-Delete: ${sender} deleted a message!\nContent: ${content}`,
          mentions: participant ? [participant] : [],
        });
      }
    }
  });

}

startBot().catch(err => console.error("❌ Bot start failed:", err));
