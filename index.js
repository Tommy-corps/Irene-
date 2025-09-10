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

const OWNER_JID = "255624236654@s.whatsapp.net"; // 👑 Badili namba yako
const PREFIX = "!";
const PORT = process.env.PORT || 3000;

// ---------------- EXPRESS ----------------
const app = express();
app.use(express.json());
app.get("/", (req, res) => res.send("🤖 BEN WHITTAKER TECH BOT is running!"));
app.listen(PORT, () => console.log(`✅ Express running on port ${PORT}`));

// ---------------- FEATURE SETTINGS ----------------
const featureFile = path.join(__dirname, "features.json");
const defaultFeatures = {
  antidelete: true,
  openViewOnce: true,
  antiMention: true,
  antiPorn: true,
  antiVideoSticker: true,
  antiLink: true
};
if (!fs.existsSync(featureFile)) fs.writeFileSync(featureFile, JSON.stringify(defaultFeatures, null, 2));
function getFeatures() { return JSON.parse(fs.readFileSync(featureFile)); }
function setFeature(name, value) { const f = getFeatures(); f[name] = value; fs.writeFileSync(featureFile, JSON.stringify(f, null, 2)); }

// ---------------- LOAD COMMANDS ----------------
const commands = new Map();
const commandsPath = path.join(__dirname, "commands");
if (fs.existsSync(commandsPath)) {
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
    const command = require(path.join(commandsPath, file));
    if (command.name) commands.set(command.name.toLowerCase(), command);
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
      await sock.sendMessage(OWNER_JID, { text: "🤖 Bot online! All automatic features enabled." });

      // Always recording presence
      setInterval(async () => {
        try { await sock.sendPresenceUpdate("recording", OWNER_JID); }
        catch (err) { console.error(err); }
      }, 5000);
    }
  });

  // ---------------- HANDLE MESSAGES ----------------
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

    // ---------------- OPEN VIEW-ONCE ----------------
    if (features.openViewOnce && msg.message.viewOnceMessageV2) {
      try {
        const viewOnce = msg.message.viewOnceMessageV2.message;
        const type = Object.keys(viewOnce)[0];
        const stream = await downloadContentFromMessage(viewOnce[type], type.includes("video") ? "video" : "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await sock.sendMessage(from, { [type]: buffer, caption: "🔓 Opened view-once content" }, { quoted: msg });
      } catch (err) { console.error(err); }
    }

    // ---------------- AUTO DELETE FEATURES ----------------
    if (isGroup) {
      const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      try {
        // Anti-Link
        if (features.antiLink) {
          const linkRegex = /https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/;
          if (linkRegex.test(body) && sender !== OWNER_JID) {
            await sock.sendMessage(from, { text: `🚫 Link removed!`, mentions: [sender] });
            await sock.deleteMessage(from, { id: msg.key.id, remoteJid: from, fromMe: false }).catch(()=>{});
            return;
          }
        }

        // Anti-Mention
        if (features.antiMention && body.includes("@")) {
          const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
          if (mentions.includes(botNumber)) {
            await sock.sendMessage(from, { text: "🚫 Mention removed!" });
            await sock.deleteMessage(from, { id: msg.key.id, remoteJid: from, fromMe: false }).catch(()=>{});
            return;
          }
        }

        // Anti-Porn
        if (features.antiPorn && /porn|xxx|sex/i.test(body)) {
          await sock.sendMessage(from, { text: `🚫 Porn/NSFW removed!`, mentions: [sender] });
          await sock.deleteMessage(from, { id: msg.key.id, remoteJid: from, fromMe: false }).catch(()=>{});
          return;
        }

        // Anti Video/Sticker
        if (features.antiVideoSticker && (msg.message?.videoMessage || msg.message?.stickerMessage)) {
          await sock.sendMessage(from, { text: `🚫 Video/Sticker removed!` });
          await sock.deleteMessage(from, { id: msg.key.id, remoteJid: from, fromMe: false }).catch(()=>{});
          return;
        }

      } catch (err) { console.error(err); }
    }

    // ---------------- COMMAND EXECUTION ----------------
    if (body.startsWith(PREFIX)) {
      const args = body.slice(PREFIX.length).trim().split(/\s+/);
      const cmdName = args.shift().toLowerCase();

      // ---------------- Owner Commands ----------------
      if (cmdName === "set" && args.length === 2) {
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

      // ---------------- LOAD FROM COMMANDS FOLDER ----------------
      if (commands.has(cmdName)) {
        try {
          await commands.get(cmdName).execute(sock, msg, args);
        } catch (err) {
          console.error(`❌ Error executing command ${cmdName}:`, err);
        }
      } else {
        await sock.sendMessage(from, { text: `❌ Hakuna command inayoitwa *${cmdName}*.` });
      }
    }
  });

  // ---------------- ANTI DELETE ----------------
  sock.ev.on("messages.update", async (updates) => {
    const features = getFeatures();
    if (!features.antidelete) return;

    for (const update of updates) {
      if (update.update === "message-revoke") {
        const remoteJid = update.key.remoteJid;
        const participant = update.key.participant || update.participant;
        const sender = participant ? `@${participant.split("@")[0]}` : "Mtu";

        if (update.message?.conversation) {
          await sock.sendMessage(remoteJid, { text: `♻️ Anti-Delete: Meseji iliyofutwa na ${sender}\n\n${update.message.conversation}`, mentions: [participant] });
        }

        if (update.message?.imageMessage || update.message?.videoMessage || update.message?.documentMessage) {
          const mtype = Object.keys(update.message)[0];
          const buffer = await sock.downloadMediaMessage(update);
          await sock.sendMessage(remoteJid, { [mtype.replace("Message","")]: buffer, caption: `♻️ Anti-Delete Media by ${sender}`, mentions: [participant] });
        }
      }
    }
  });
}

startBot();
