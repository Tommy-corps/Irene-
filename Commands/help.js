// Dev: Irene & Tommy
const fs = require("fs");
const path = require("path");

const BOT_NAME = "Irene Bot";

module.exports = {
  name: "help",
  description: "📜 Show all commands dynamically with bot logo",
  async execute(sock, msg, args, settings) {
    const from = msg.key.remoteJid;

    // Path to public folder image
    const imagePath = path.join(__dirname, "public", "IMG-20250530-WA0294.jpg");

    if (!fs.existsSync(imagePath)) {
      await sock.sendMessage(from, { text: "⚠️ Help image not found in public folder!" });
      return;
    }

    // Load commands dynamically from commands folder
    const commandsPath = path.join(__dirname);
    const commandFiles = fs.readdirSync(commandsPath)
      .filter(file => file.endsWith(".js") && file !== "index.js" && file !== "help.js");

    let commandsList = [];
    for (let file of commandFiles) {
      try {
        const cmd = require(path.join(commandsPath, file));
        if(cmd.name && cmd.description) {
          commandsList.push(`#${cmd.name} - ${cmd.description}`);
        }
      } catch (e) {
        console.error(`⚠️ Failed to load command ${file}:`, e.message);
      }
    }

    const text = `👋 Hello! I am *${BOT_NAME}*\n\n📜 Available Commands (${commandsList.length}):\n${commandsList.join("\n")}\n\n⚡ Owner-only commands are prefixed with #`;

    try {
      await sock.sendMessage(from, {
        image: fs.readFileSync(imagePath),
        caption: text
      });
    } catch (e) {
      console.error("❌ Help command error:", e.message);
      await sock.sendMessage(from, { text: "⚠️ Failed to send help message!" });
    }
  }
};
