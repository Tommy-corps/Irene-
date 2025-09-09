module.exports = {
  name: "ping",
  description: "Test responsiveness",
  async execute(sock, msg, args, settings) {
    await sock.sendMessage(msg.key.remoteJid, { text: "🏓 Pong!" });
  }
};
