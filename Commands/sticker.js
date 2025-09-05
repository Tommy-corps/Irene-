// Dev: Irene & Tommy
const { writeFileSync } = require("fs");
const { tmpdir } = require("os");
const path = require("path");

module.exports = {
  name: "sticker",
  description: "Convert image to sticker 🎭",
  async execute(sock, msg) {
    const STATUS_REACT = ["👍","🔥","❤️","😂","😍","😎","✨","👏","💯"];
    await sock.sendMessage(msg.key.remoteJid, { react: { text: STATUS_REACT[Math.floor(Math.random()*STATUS_REACT.length)], key: msg.key } });

    try {
      if (!msg.message.imageMessage) {
        return sock.sendMessage(msg.key.remoteJid, { text: "📷 Tuma picha na useme #sticker" });
      }
      const buffer = await sock.downloadMediaMessage(msg);
      const filePath = path.join(tmpdir(), "sticker.webp");
      writeFileSync(filePath, buffer);

      await sock.sendMessage(msg.key.remoteJid, { sticker: { url: filePath } });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Sticker creation failed." });
    }
  }
};
