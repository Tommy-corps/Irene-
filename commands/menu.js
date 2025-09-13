// 📂 commands/menu.js
const fs = require("fs");
const path = require("path");

// Rosemary Stylish Font Converter 🌹
const fancy = (text) => {
  const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rosemary = "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩0123456789";
  return text.split("").map(c => {
    const index = normal.indexOf(c);
    return index !== -1 ? rosemary[index] : c;
  }).join("");
};

// Auto-categorize commands
const getCategorizedCommands = () => {
  const commandsPath = path.join(__dirname);
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
  const categories = {};

  for (const file of files) {
    const cmd = require(path.join(commandsPath, file));
    if (!cmd.name) continue;

    const category = cmd.category || "General";
    if (!categories[category]) categories[category] = [];
    categories[category].push(cmd.name);
  }
  return categories;
};

module.exports = {
  name: "menu",
  description: "📜 Show all bot commands in organized categories",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const categories = getCategorizedCommands();

    // 🖼️ Load image
    const imagePath = path.join(__dirname, "../public/IMG-20250530-WA0294.jpg");
    const imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;

    // Build menu text
    let menuText = `
╭━━〔 ${fancy("BOSS GIRL TECH ❤️")} 〕━━┈⊷
┃๏╭───────────
┃๏│▸ ${fancy("Owner")} : Boss Girl Tech ❤️
┃๏│▸ ${fancy("Prefix")} : [ ! ]
┃๏│▸ ${fancy("Mode")} : Public
┃๏│▸ ${fancy("Date")}  : ${new Date().toLocaleDateString()}
┃๏│▸ ${fancy("Time")}  : ${new Date().toLocaleTimeString()}
┃๏│▸ ${fancy("Ping")}  : ...ms
┃๏│▸ ${fancy("Creator")} : Boss Girl Tech ❤️
┃๏└───────────···▸
╰──────────────┈⊷
🌄 ${fancy("Good day! My friend! 🌿")}
    `;

    for (const [category, cmds] of Object.entries(categories)) {
      menuText += `

╭──「 ${fancy(category)} 」──┈⊷
┃╭──────────`;
      cmds.forEach(c => {
        menuText += `\n┃│▸ ${c}`;
      });
      menuText += `\n┃╰────────┈⊷\n╰────────────┈⊷`;
    }

    if (imageBuffer) {
      await sock.sendMessage(from, {
        image: imageBuffer,
        caption: menuText
      }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: menuText }, { quoted: msg });
    }
  }
};
