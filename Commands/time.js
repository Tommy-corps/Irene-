// Dev: Irene & Tommy
module.exports = {
  name: "time",
  description: "Show current time ⏰",
  async execute(sock, msg) {
    const STATUS_REACT = ["👍","🔥","❤️","😂","😍","😎","✨","👏","💯"];
    await sock.sendMessage(msg.key.remoteJid, { react: { text: STATUS_REACT[Math.floor(Math.random()*STATUS_REACT.length)], key: msg.key } });

    const now = new Date();
    const time = now.toLocaleTimeString("en-GB", { timeZone: "Africa/Nairobi" });
    await sock.sendMessage(msg.key.remoteJid, { text: `⏰ Current Time: *${time}*` });
🥊______DEV IRENE❤️_______OMMY⚽🏋️_______🥊
  }
};
