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

// -------- SETTINGS --------
const OWNER_NUMBER = "255624236654@s.whatsapp.net"; // 👑 Owner
const sessionFolder = "./auth_info";
const PORT = process.env.PORT || 3000;
const STATUS_REACT = ["👍","🔥","❤️","😂","😍","😎","✨","👏","💯"];
const BOT_NAME = "Irene Bot";

// Bot settings for commands
let settings = {
  antilink: false,
  antimention: false,
  antihidetag: false,
  welcome: false,
  goodbye: false,
};

let sock;

// -------- COMMAND LOADER --------
function loadCommands() {
  const commands = {};
  const cmdPath = path.join(__dirname, "commands");
  if (!fs.existsSync(cmdPath)) return commands;

  const files = fs.readdirSync(cmdPath).filter(f => f.endsWith(".js"));
  for (let file of files) {
    try {
      const cmd = require(path.join(cmdPath, file));
      commands[cmd.name] = cmd;
      console.log(`✅ Command loaded: ${cmd.name}`);
    } catch (e) {
      console.error(`⚠️ Failed to load command ${file}:`, e.message);
    }
  }
  return commands;
}

const commands = loadCommands();

// -------- FAKE RECORD FUNCTION --------
async function sendFakeRecording(jid) {
  try {
    await sock.sendPresenceUpdate("recording", jid); // 🎤 fake record
    await new Promise(res => setTimeout(res, 2000)); // 2 sekunde
    await sock.sendPresenceUpdate("available", jid);
  } catch (e) {
    console.error("⚠️ Fake record error:", e.message);
  }
}

// -------- START BOT --------
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    printQRInTerminal: true,
    browser: [BOT_NAME, "Chrome", "1.0.0"],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        P().child({ level: "fatal", stream: "store" })
      ),
    },
  });

  // -------- CONNECTION UPDATE --------
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log("📷 Scan QR code hapa terminal!");
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error;
      if (Boom.isBoom(reason)) console.log("❌ Boom error:", reason.output.payload);

      const statusCode = reason?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`❌ Connection closed (status ${statusCode}). Reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) setTimeout(startBot, 3000); // retry after 3s
    } else if (connection === "open") {
      console.log(`✅ ${BOT_NAME} imeunganishwa!`);
      sock.sendMessage(OWNER_NUMBER, { text: `👋 ${BOT_NAME} imewashwa na iko tayari!` });
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // -------- AUTO VIEW + REACT STATUS --------
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type === "notify") {
      for (let msg of messages) {
        if (msg.key.remoteJid.endsWith("@status")) {
          try {
            await sock.readMessages([msg.key]);
            const react = STATUS_REACT[Math.floor(Math.random() * STATUS_REACT.length)];
            await sock.sendMessage(msg.key.remoteJid, {
              react: { text: react, key: msg.key },
            });
            console.log("✅ Status viewed + reacted:", react);
          } catch (e) {
            console.log("⚠️ View/react status error:", e.message);
          }
        }
      }
    }
  });

  // -------- HANDLE DM & GROUP MESSAGES (OWNER ONLY) --------
  sock.ev.on("messages.upsert", async (m) => {
    try {
      const msg = m.messages?.[0];
      if (!msg?.message) return;

      const from = msg.key.remoteJid;
      const sender = msg.key.participant || from;
      const body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        "";

      // Owner-only
      if (!sender.includes("255624236654")) return;

      // Prefix # logic
      if (body.startsWith("#")) {
        const args = body.slice(1).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();

        if (commands[cmdName]) {
          await sendFakeRecording(from); // 🎤 show fake record before executing
          await commands[cmdName].execute(sock, msg, args, settings);
        } else {
          await sendFakeRecording(from);
          await sock.sendMessage(from, { text: `🚀 ${BOT_NAME}: Hakuna command inayoitwa *${cmdName}*` });
        }
      }
    } catch (e) {
      console.error("❌ messages.upsert error:", e);
    }
  });
}

// -------- START BOT --------
startBot();

// -------- EXPRESS WEB SERVER --------
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send(`✅ ${BOT_NAME} is running (Owner-only, Prefix #, Auto Status View/React, Fake Record)`);
});

app.listen(PORT, () => console.log(`🌐 Web server listening on :${PORT}`));
