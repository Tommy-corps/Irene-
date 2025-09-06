// Dev: Irene & Tommy
module.exports = {
  name: "owner",
  description: "Show owner number 👑",
  async execute(sock, msg) {
    const STATUS_REACT = ["👍","🔥","❤️","😂","😍","😎","✨","👏","💯"];
    await sock.sendMessage(msg.key.remoteJid, { 
      react: { text: STATUS_REACT[Math.floor(Math.random() * STATUS_REACT.length)], key: msg.key } 
    });

    const text = `👑 *BOT OWNER*\n\n📞 wa.me/255624236654\n🤖 Powered by *Irene Bot*`;
    await sock.sendMessage(msg.key.remoteJid, { text });
  }
};
