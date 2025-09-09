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
const antiLinkGroups = {};

// ---------------- EXPRESS ----------------
const app = express();
app.use(express.json());
app.get("/", (req, res) => res.send("🤖 BEN WHITTAKER TECH BOT is running!"));
app.listen(PORT, () => console.log(`✅ Express running on port ${PORT}`));

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
      const shouldReconnect =
        (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ Bot connected!");
      await sock.sendMessage(OWNER_JID, { text: `🤖 Bot online! Prefix: ${PREFIX}` });

      // Always recording presence
      setInterval(async () => {
        try {
          await sock.sendPresenceUpdate("recording", OWNER_JID);
        } catch (err) { console.error(err); }
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

    console.log("📩 Message body:", body);

    // ---------------- AUTO OPEN VIEW-ONCE ----------------
    if (msg.message.viewOnceMessageV2) {
      try {
        const viewOnce = msg.message.viewOnceMessageV2.message;
        const type = Object.keys(viewOnce)[0];
        const stream = await downloadContentFromMessage(viewOnce[type], type.includes("video") ? "video" : "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await sock.sendMessage(from, { [type]: buffer, caption: "🔓 Opened view-once content" }, { quoted: msg });
      } catch (err) {
        console.error("❌ Error opening view-once message:", err);
      }
    }

    // ---------------- FAKE RECORD ----------------
    await sock.sendPresenceUpdate("recording", from);
    setTimeout(() => sock.sendPresenceUpdate("available", from), 3000);

    // ---------------- ANTI-LINK ----------------
    if (isGroup && body.toLowerCase().startsWith(PREFIX + "antlink")) {
      const args = body.split(" ");
      const sub = args[1]?.toLowerCase();
      const option = args[2]?.toLowerCase();
      antiLinkGroups[from] = antiLinkGroups[from] || { enabled: false, action: "remove" };
      if (sub === "on") antiLinkGroups[from].enabled = true;
      else if (sub === "off") antiLinkGroups[from].enabled = false;
      else if (sub === "action" && ["remove", "warn"].includes(option)) antiLinkGroups[from].action = option;
      await sock.sendMessage(from, { text: `✅ Anti-Link updated: ${JSON.stringify(antiLinkGroups[from])}` });
    }

    if (isGroup && antiLinkGroups[from]?.enabled) {
      const linkRegex = /https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/;
      const action = antiLinkGroups[from].action;
      if (linkRegex.test(body) && sender !== OWNER_JID) {
        try {
          const metadata = await sock.groupMetadata(from);
          const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
          const botAdmin = metadata.participants.find(p => p.id === botNumber)?.admin;
          if (!botAdmin) return await sock.sendMessage(from, { text: "⚠️ I'm not admin." });
          if (action === "warn") await sock.sendMessage(from, { text: `⚠️ *@${sender.split("@")[0]}* no link sharing!`, mentions: [sender] });
          else if (action === "remove") {
            await sock.sendMessage(from, { text: `🚫 Removed *@${sender.split("@")[0]}*`, mentions: [sender] });
            await sock.groupParticipantsUpdate(from, [sender], "remove");
          }
        } catch (err) { console.error(err); }
      }
    }

    // ---------------- COMMAND EXECUTION ----------------
    if (body.startsWith(PREFIX)) {
      const args = body.slice(PREFIX.length).trim().split(/\s+/);
      const cmdName = args.shift().toLowerCase();
      if (commands.has(cmdName)) {
        try {
          await sock.sendMessage(from, { text: "🕐 Loading..." });
          await commands.get(cmdName).execute(sock, msg, args);
        } catch (err) {
          console.error(`❌ Error executing command ${cmdName}:`, err);
        }
      } else {
        await sock.sendMessage(from, { text: `❌ Hakuna command inayoitwa *${cmdName}*.` });
      }
    }

    // ---------------- READ STATUS ----------------
    if (from === "status@broadcast") await sock.readMessages([msg.key]);
  });
}

startBot();
