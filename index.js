require("dotenv").config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");
const path = require("path");
const express = require("express");

const OWNER_JID = "255624236654@s.whatsapp.net";
const PREFIX = "!";
const PORT = process.env.PORT || 3000;

// Commands folder
const commandsPath = path.join(__dirname, "commands");
const commands = new Map();
if (fs.existsSync(commandsPath)) {
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
    const cmd = require(path.join(commandsPath, file));
    if (cmd.name) commands.set(cmd.name.toLowerCase(), cmd);
  }
} else {
  fs.mkdirSync(commandsPath);
  console.log("📂 Created commands folder.");
}

// Start bot
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P({ level: "silent" }))
    },
    logger: P({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ Bot connected!");
      setInterval(async () => {
        try { await sock.sendPresenceUpdate("recording", OWNER_JID); }
        catch (err) { console.error("⚠️ Presence error:", err); }
      }, 5000);

      await sock.sendMessage(OWNER_JID, {
        text: `👋 Bot is online! Prefix: ${PREFIX}\nType !menu to see commands.`
      });
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    const from = msg.key.remoteJid;

    let body = "";
    if (msg.message.conversation) body = msg.message.conversation;
    else if (msg.message.extendedTextMessage?.text) body = msg.message.extendedTextMessage.text;
    else if (msg.message.imageMessage?.caption) body = msg.message.imageMessage.caption;
    else if (msg.message.videoMessage?.caption) body = msg.message.videoMessage.caption;
    body = body.trim();
    if (!body) return;

    console.log("📩 Message body:", body);

    if (body.startsWith(PREFIX)) {
      const args = body.slice(PREFIX.length).trim().split(/\s+/);
      const cmdName = args.shift().toLowerCase();

      if (commands.has(cmdName)) {
        try {
          console.log("✅ Running command:", cmdName);
          await commands.get(cmdName).execute(sock, msg, args);
        } catch (err) {
          console.error(`Error executing command ${cmdName}:`, err);
        }
      } else {
        await sock.sendMessage(from, { text: `❌ Hakuna command inayoitwa *${cmdName}*.` });
      }
    }
  });
}

// Express keep-alive
const app = express();
app.use(express.json());
app.get("/", (req, res) => res.send("✅ BEN WHITTAKER TECH BOT is running!"));
app.listen(PORT, () => console.log(`🌐 Web server listening on port ${PORT}`));

startBot();
