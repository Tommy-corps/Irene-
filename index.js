require("dotenv").config();
const fs = require("fs");
const path = require("path");
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

// ------------- CONFIG ----------------
const OWNER_JID = "255624236654@s.whatsapp.net"; // 👑 Badili namba yako
const PREFIX = "!";
const PORT = process.env.PORT || 3000;

// ---------------- EXPRESS ----------------
const app = express();
app.use(express.json());
app.get("/", (req, res) => res.send("🤖 BOSS GIRL TECH ❤️ Bot is running!"));
app.listen(PORT, () => console.log(`✅ Express running on port ${PORT}`));

// ---------------- FEATURES ----------------
const featureFile = path.join(__dirname, "features.json");
const defaultFeatures = {
  antidelete: false,
  openViewOnce: false,
  antiMention: false,
  antiPorn: false,
  antiVideoSticker: false,
  antiLink: false,
  antiLinkAction: "remove"
};
if (!fs.existsSync(featureFile)) fs.writeFileSync(featureFile, JSON.stringify(defaultFeatures, null, 2));
function getFeatures() { return JSON.parse(fs.readFileSync(featureFile)); }
function setFeature(name, value) { 
  const f = getFeatures(); 
  f[name] = value; 
  fs.writeFileSync(featureFile, JSON.stringify(f, null, 2)); 
}

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

    // ---------------- OPEN VIEW-ONCE ----------------
    const viewOnce = msg.message.viewOnceMessageV2?.message || msg.message.viewOnceMessage?.message;
    if (features.openViewOnce && viewOnce) {
      try {
        const type = Object.keys(viewOnce)[0];
        const stream = await downloadContentFromMessage(viewOnce[type], type.includes("video") ? "video" : "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await sock.sendMessage(from, { [type]: buffer, caption: "🔓 Opened view-once content - 🤖 BOSS GIRL TECH ❤️" }, { quoted: msg });
      } catch {}
    }

    // ---------------- GROUP AUTO DELETE ----------------
    if (isGroup) {
      try {
        // Anti-Link
        if (features.antiLink) {
          const linkRegex = /https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/;
          if (linkRegex.test(body) && sender !== OWNER_JID) {
            const action = features.antiLinkAction || "remove";
            if (action === "warn") await sock.sendMessage(from, { text: `⚠️ *@${sender.split("@")[0]}* don't send links!`, mentions: [sender] });
            else if (action === "remove") {
              await sock.sendMessage(from, { text: `🚫 Removed *@${sender.split("@")[0]}*`, mentions: [sender] });
              await sock.groupParticipantsUpdate(from, [sender], "remove").catch(()=>{});
            } else if (action === "delete") {
              await sock.sendMessage(from, { text: `🗑️ Link deleted!`, mentions: [sender] });
              await sock.deleteMessage(from, { id: msg.key.id, remoteJid: from, fromMe: false }).catch(()=>{});
            }
          }
        }

        // Anti-Mention
        if (features.antiMention && body.includes("@") && msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(botNumber)) {
          await sock.sendMessage(from, { text: `🚫 Mention removed!` });
          await sock.deleteMessage(from, { id: msg.key.id, remoteJid: from, fromMe: false }).catch(()=>{});
        }

        // Anti-Porn
        if (features.antiPorn && /porn|xxx|sex/i.test(body)) {
          await sock.sendMessage(from, { text: `🚫 Porn/NSFW removed!`, mentions: [sender] });
          await sock.deleteMessage(from, { id: msg.key.id, remoteJid: from, fromMe: false }).catch(()=>{});
        }

        // Anti Video/Sticker
        if (features.antiVideoSticker && (msg.message.videoMessage || msg.message.stickerMessage || msg.message.gifMessage)) {
          await sock.sendMessage(from, { text: `🚫 Video/Sticker removed!` });
          await sock.deleteMessage(from, { id: msg.key.id, remoteJid: from, fromMe: false }).catch(()=>{});
        }
      } catch {}
    }

    // ---------------- OWNER INLINE COMMANDS ----------------
    if (body.startsWith(PREFIX)) {
      const args = body.slice(PREFIX.length).trim().split(/\s+/);
      const cmdName = args.shift().toLowerCase();

      // Owner feature toggle
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
        await sock.sendMessage(from, { text: `❌ Hakuna command inayoitwa *${cmdName}*` });
      }
    }
  });

  // ---------------- ANTI DELETE ----------------
  // ---------------- ANTI DELETE ----------------
  sock.ev.on("messages.update", async (updates) => {
    const features = getFeatures();
    if (!features.antidelete) return;

    for (const update of updates) {
      if (update.update === "message-revoke") {
        const remoteJid = update.key.remoteJid;
        const participant = update.key.participant || update.participant;
        const sender = participant ? `@${participant.split("@")[0]}` : "Mtu";

        // Text messages
        if (update.message?.conversation) {
          await sock.sendMessage(remoteJid, {
            text: `♻️ Anti-Delete: Meseji iliyofutwa na ${sender}\n\n${update.message.conversation}`,
            mentions: participant ? [participant] : []
          });
        }

        // Media messages
        if (update.message?.imageMessage || update.message?.videoMessage || update.message?.documentMessage || update.message?.stickerMessage) {
          const mtype = Object.keys(update.message)[0]; // imageMessage, videoMessage, etc.
          try {
            const buffer = await sock.downloadMediaMessage(update);
            await sock.sendMessage(remoteJid, {
              [mtype.replace("Message","")]: buffer,
              caption: `♻️ Anti-Delete Media by ${sender}`,
              mentions: participant ? [participant] : []
            });
          } catch (err) {
            console.error("AntiDelete Media Error:", err);
          }
        }
      }
    }
  });
}

startBot().catch(err => console.error("❌ Bot start failed:", err));
