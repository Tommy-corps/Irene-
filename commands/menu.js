// 📂 commands/menu.js
const fs = require("fs");
const path = require("path");
const os = require("os");

// Tiny/Compact Stylish Font Converter ✨
const fancy = (text) => {
  const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const tiny = "ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾQᴿˢᵀᵁⱽᵂˣʸᶻ0123456789";
  return text.split("").map(c => {
    const index = normal.indexOf(c);
    return index !== -1 ? tiny[index] : c;
  }).join("");
};

module.exports = {
  name: "menu",
  description: "📜 Show all bot commands with modern tiny style",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;

    // Auto-load all commands from folder
    const commandsPath = path.join(__dirname);
    const files = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
    const commandList = files.map(file => {
      const cmd = require(path.join(commandsPath, file));
      return `✨ ${cmd.name}`; // majina ya commands hayatumii fancy font
    }).join("\n");

    // System info
    const ramUsage = `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`;
    const hostName = os.hostname();
    const pluginCount = files.length;
    const date = new Date().toLocaleString();

    const menuText = `
╔═════════════════════════╗
║ ${fancy("🌟❤️ BOSS GIRL TECH ❤️🌟")} ║
╠═════════════════════════╣
║ ${fancy("📜 Commands Available:")} ║
${commandList.split("\n").map(c => `║ ${c} ║`).join("\n")}  ← majina ya commands hayatumii tiny font
╠═════════════════════════╣
║ ${fancy(`💾 RAM: ${ramUsage}`)} ║
║ ${fancy(`🖥️ Host: ${hostName}`)} ║
║ ${fancy(`🔌 Plugins: ${pluginCount}`)} ║
║ ${fancy(`📅 Date: ${date}`)} ║
╠═════════════════════════╣
║ ${fancy("👑 Owner: 255624236654")} ║
║ ${fancy("⚡ Prefix: !")} ║
║ ${fancy("💻 Powered by Boss girl💕")} ║
╚═════════════════════════╝
    `.trim();

    // Read image from public folder
    const imagePath = path.join(__dirname, "../public/IMG-20250530-WA0294.jpg");
    if (!fs.existsSync(imagePath)) {
      return sock.sendMessage(from, { text: fancy("⚠️ Menu image not found in public folder!") }, { quoted: msg });
    }

    const imageBuffer = fs.readFileSync(imagePath);

    await sock.sendMessage(from, {
      image: imageBuffer,
      caption: menuText
    }, { quoted: msg });
  }
};
