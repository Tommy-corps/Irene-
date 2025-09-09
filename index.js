require("dotenv").config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const Boom = require("@hapi/boom");
const fs = require("fs");
const path = require("path");
const P = require("pino");
const express = require("express");
const qrcode = require("qrcode-terminal");


// ----------- CONSTANTS -------------
const OWNER_JID = "255624236654@s.whatsapp.net"; // 👑 Badili namba yako
const PREFIX = "!";
const PORT = process.env.PORT || 3000;

// In-memory structures
const antiLinkGroups = {}; // anti-link settings kwa kila group
const emojiReactions = ["❤️", "😂", "🔥", "👍", "😎", "🤖"];
const randomEmoji = () => emojiReactions[Math.floor(Math.random() * emojiReactions.length)];

// -------- Commands folder --------
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

// -------- START BOT --------
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

  // -------- CONNECTION UPDATE --------
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ Bot connected!");

      // Always recording every 5 seconds
      setInterval(async () => {
        try {
          await sock.sendPresenceUpdate("recording", OWNER_JID);
        } catch (err) {
          console.error("⚠️ Presence error:", err);
        }
      }, 5000);

      await sock.sendMessage(OWNER_JID, {
        text: `👋 Bot is online! Prefix: ${PREFIX}\nType !menu to see commands.`
      });
    }
  });

  // -------- HANDLE MESSAGES --------
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const sender = msg.key.participant || from;
    const body = msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text ||
                msg.message?.imageMessage?.caption || "";

    // -------- ANTI-LINK FEATURE --------
    if (isGroup && body.toLowerCase().startsWith(PREFIX + "antlink")) {
      const args = body.trim().split(" ");
      const sub = args[1]?.toLowerCase();
      const option = args[2]?.toLowerCase();
      antiLinkGroups[from] = antiLinkGroups[from] || { enabled: false, action: "remove" };

      if (sub === "on") {
        antiLinkGroups[from].enabled = true;
        await sock.sendMessage(from, { text: "✅ Anti-Link is now *ON*.", react: { text: "🛡️", key: msg.key } });
      } else if (sub === "off") {
        antiLinkGroups[from].enabled = false;
        await sock.sendMessage(from, { text: "❌ Anti-Link is now *OFF*.", react: { text: "🚫", key: msg.key } });
      } else if (sub === "action" && ["remove", "warn"].includes(option)) {
        antiLinkGroups[from].action = option;
        await sock.sendMessage(from, { text: `⚙️ Action set to *${option}*`, react: { text: "⚠️", key: msg.key } });
      } else {
        await sock.sendMessage(from, {
          text: `🛡️ Use:\n${PREFIX}antlink on\n${PREFIX}antlink off\n${PREFIX}antlink action remove|warn`,
          react: { text: "ℹ️", key: msg.key }
        });
      }
    }

    // enforce anti-link
    if (isGroup && antiLinkGroups[from]?.enabled) {
      const linkRegex = /https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/;
      const action = antiLinkGroups[from].action;

      if (linkRegex.test(body) && sender !== OWNER_JID) {
        try {
          const metadata = await sock.groupMetadata(from);
          const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
          const botAdmin = metadata.participants.find(p => p.id === botNumber)?.admin;

          if (!botAdmin) {
            await sock.sendMessage(from, { text: "⚠️ I'm not admin, can't perform action." });
            return;
          }

          if (action === "warn") {
            await sock.sendMessage(from, {
              text: `⚠️ *@${sender.split("@")[0]}*, link sharing not allowed!`,
              mentions: [sender]
            });
          } else if (action === "remove") {
            await sock.sendMessage(from, {
              text: `🚫 *@${sender.split("@")[0]}* removed for sharing link.`,
              mentions: [sender]
            });
            await sock.groupParticipantsUpdate(from, [sender], "remove");
          }
        } catch (err) {
          console.error("Anti-Link Error:", err);
        }
      }
    }

    // -------- COMMAND EXECUTION --------
    for (const [name, command] of commands) {
      if (body.toLowerCase().startsWith(PREFIX + name)) {
        try {
          const args = body.trim().split(/\s+/).slice(1);
          await command.execute(sock, msg, args);
        } catch (err) {
          console.error(`Error executing command ${name}:`, err);
        }
        break;
      }
    }
  });
}

// -------- EXPRESS KEEP-ALIVE --------
const app = express();
app.use(express.json());
app.get("/", (req, res) => res.send("✅ BEN WHITTAKER TECH BOT is running!"));
app.listen(PORT, () => console.log(`🌐 Web server listening on port ${PORT}`));

// -------- START BOT --------
startBot();
