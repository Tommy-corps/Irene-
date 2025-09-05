// Dev: Irene & Tommy
module.exports = {
  name: "ping",
  description: "Check bot speed 🚀",
  async execute(sock, msg) {
    const start = Date.now();
    await sock.sendMessage(msg.key.remoteJid, { text: "⏳ Pinging..." });
    const end = Date.now();
    const speed = end - start;
    await sock.sendMessage(msg.key.remoteJid, { text: `🥊 Pong! Speed: *${speed}ms*` });
    🚀_____________DEV IRENE❤️_______________🚀
  }
};
