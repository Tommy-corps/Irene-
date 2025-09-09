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
const OWNER_NUMBER = "255624236654@s.whatsapp.net"; // 👑 Owner JID
const OWNER = "255624236654"; // 👑 Owner namba
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
  const map = {};
  const cmdPath = path.join(__dirname, "commands");
  if (!fs.existsSync(cmdPath)) {
    console.warn("⚠️ commands/ folder haipo:", cmdPath);
    return map;
  }

  const files = fs.readdirSync(cmdPath).filter(f => f.endsWith(".js"));
  for (const file of files) {
    try {
      const mod = require(path.join(cmdPath, file));
      const cmd = mod?.default || mod; // support ESM default export

      if (!cmd?.name || typeof cmd.execute !== "function") {
        console.error(`⚠️ ${file} haina { name, execute }. Skipping.`);
        continue;
      }

      map[cmd.name.toLowerCase()] = cmd;

      // optional aliases
      if (Array.isArray(cmd.aliases)) {
        for (const a of cmd.aliases) map[a.toLowerCase()] = cmd;
      }

      console.log(`✅ Command loaded: ${cmd.name}`);
    } catch (e) {
      console.error(`⚠️ Failed to load command ${file}:`, e.message);
    }
  }

  console.log("📦 Commands zilizosajiliwa:", Object.keys(map));
  return map;
}

const commands = loadCommands();

// -------- KEEP RECORDING PRESENCE --------
async function alwaysRecording() {
  if (!sock) return;
  try {
    setInterval(async () => {
      await sock.sendPresenceUpdate("recording", OWNER_NUMBER);
    }, 5000); // kila sekunde 5 anatuma "recording"
  } catch (e) {
    console.error("⚠️ Always recording error:", e.message);
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
      alwaysRecording(); // muda wote ionekane inarekodi
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

  // -------- HANDLE DM & GROUP MESSAGES (OWNER ONLY) ---
  const normalize = s => (s || "").replace(/\D/g, "");

  sock.ev.on("messages.upsert", async (m) => {
    try {
      const msg = m.messages?.[0];
      if (!msg?.message) return;

      const from = msg.key.remoteJid;
      const senderJid = msg.key.participant || from;
      const senderNum = normalize(senderJid);

      if (senderNum !== OWNER) return; // owner-only

      const body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        "";

      if (body.startsWith("#")) {
        const args = body.slice(1).trim().split(/\s+/);
        const cmdName = (args.shift() || "").toLowerCase();

        const cmd = commands[cmdName];
        if (!cmd) {
          await sock.sendMessage(from, {
            text: `🚀 ${BOT_NAME}: Hakuna command inayoitwa *${cmdName}*.\n\n🔎 Zilizo-load: ${Object.keys(commands).map(c => `#${c}`).join(", ")}`
          });
          return;
        }

        await cmd.execute(sock, msg, args, settings);
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
  res.send(`✅ ${BOT_NAME} is running (Owner-only, Prefix #, Auto Status View/React, Always Recording)`);
});

app.listen(PORT, () => console.log(`🌐 Web server listening on :${PORT}`));
