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
  DisconnectReason,
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");

// ---------------- CONFIG ----------------
const OWNER_JID = "255624236654@s.whatsapp.net"; // 👑 Change to your number
const PREFIX = "!";
const PORT = process.env.PORT || 3000;
const WARN_LIMIT = 3;

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
};
if (!fs.existsSync(featureFile)) fs.writeFileSync(featureFile, JSON.stringify(defaultFeatures, null, 2));
function getFeatures() { return JSON.parse(fs.readFileSync(featureFile)); }
function setFeature(name, value) { 
  const f = getFeatures(); 
  f[name] = value; 
  fs.writeFileSync(featureFile, JSON.stringify(f, null, 2)); 
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

// ---------------- START BOT ----------------
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
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
      await sock.sendMessage(OWNER_JID, { text: "🤖 BOSS GIRL TECH ❤️ Bot online! All features are OFF by default." });
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

    const features = getFeatures();
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

    
   // ---------------- ANTI-LINK ----------------
    if (isGroup && features.antiLink) {
      const linkRegex = /https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/;
      if (linkRegex.test(body) && sender !== OWNER_JID) {
        const action = features.antiLinkAction || "warn";

        // ✅ Check kama bot ni admin
        const groupMetadata = await sock.groupMetadata(from);
        const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
        const botIsAdmin = groupMetadata.participants.some(
          p => p.id === botNumber && (p.admin === "admin" || p.admin === "superadmin")
        );

        if (!botIsAdmin) {
          await sock.sendMessage(from, {
            text: `⚠️ I am not an admin, so I can't take Anti-Link action!\n\n🤖 BOSS GIRL TECH ❤️`
          });
          return;
        }

        // 🗑️ Delete link message first
        try {
          await sock.deleteMessage(from, { id: msg.key.id, remoteJid: from, fromMe: false });
        } catch (err) {
          console.error("Failed to delete message:", err);
        }

        if (action === "warn") {
          if (!global.warnMap.has(from)) global.warnMap.set(from, new Map());
          const groupWarns = global.warnMap.get(from);
          const prevWarn = groupWarns.get(sender) || 0;
          const newWarn = prevWarn + 1;
          groupWarns.set(sender, newWarn);

          if (newWarn >= WARN_LIMIT) {
            await sock.sendMessage(from, {
              text: `🚨 @${sender.split("@")[0]} has reached the warn limit (${WARN_LIMIT})!\nRemoved from group.\n\n🤖 BOSS GIRL TECH ❤️`,
              mentions: [sender],
            });
            await sock.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
            groupWarns.delete(sender);
          } else {
            await sock.sendMessage(from, {
              text: `⚠️ @${sender.split("@")[0]} received warn ${newWarn}/${WARN_LIMIT}\nLink was deleted!\n\n🤖 BOSS GIRL TECH ❤️`,
              mentions: [sender],
            });
          }
        } else if (action === "remove") {
          await sock.sendMessage(from, {
            text: `🚫 @${sender.split("@")[0]} removed for sending link!\n\n🤖 BOSS GIRL TECH ❤️`,
            mentions: [sender],
          });
          await sock.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
        } else if (action === "delete") {
          await sock.sendMessage(from, {
            text: `🗑️ Link deleted!\n\n🤖 BOSS GIRL TECH ❤️`,
            mentions: [sender],
          });
        }
      }
    }

    // ---------------- OWNER COMMANDS ----------------
    if (body.startsWith(PREFIX)) {
      const args = body.slice(PREFIX.length).trim().split(/\s+/);
      const cmdName = args.shift().toLowerCase();

      // Toggle features
      if (cmdName === "set" && args.length === 2 && sender === OWNER_JID) {
        const featureName = args[0];
        const value = args[1].toLowerCase() === "on";
        if (features.hasOwnProperty(featureName)) {
          setFeature(featureName, value);
          await sock.sendMessage(from, { text: `✅ ${featureName} mode ${value ? "enabled" : "disabled"}` });
        } else {
          await sock.sendMessage(from, { text: `❌ Unknown feature: ${featureName}` });
        }
        return;
      }

      // AntiLink action
      if (cmdName === "antilink" && args[0] === "action" && sender === OWNER_JID) {
        const val = args[1]?.toLowerCase();
        if (["remove","warn","delete"].includes(val)) {
          const f = getFeatures();
          f.antiLinkAction = val;
          fs.writeFileSync(featureFile, JSON.stringify(f, null, 2));
          await sock.sendMessage(from, { text: `✅ AntiLink action set to: ${val}` });
        } else {
          await sock.sendMessage(from, { text: `❌ Invalid action. Use remove|warn|delete` });
        }
        return;
      }

      // ---------------- EXECUTE COMMANDS FROM FOLDER ----------------
      if (commands.has(cmdName)) {
        try {
          await commands.get(cmdName).execute(sock, msg, args);
        } catch (err) {
          console.error(`❌ Error executing command ${cmdName}:`, err);
          await sock.sendMessage(from, { text: `❌ Error executing command: ${cmdName}` });
        }
      } else {
        await sock.sendMessage(from, { text: `❌ Unknown command: ${cmdName}` });
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
          text: `♻️ Anti-Delete: ${sender} deleted a message!\nContent: ${content}\n\n🤖 BOSS GIRL TECH ❤️`,
          mentions: participant ? [participant] : [],
        });
      }
    }
  });

  // ---------------- STATUS REACT ----------------
 // ---------------- STATUS REACT ----------------
  sock.ev.on("presence.update", async (update) => {
    if (update.type === "status") {
      const jid = update.id;
      try {
        await sock.sendMessage(jid, { react: { text: "😀", key: { remoteJid: jid, fromMe: true, id: Date.now().toString() } } });
      } catch (err) {
        console.error("Status react error:", err);
      }
    }
  });

}

startBot().catch(err => console.error("❌ Bot start failed:", err));
