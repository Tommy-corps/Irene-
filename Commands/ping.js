module.exports = {
  name: "ping",
  description: "Test responsiveness and show sender",
  async execute(sock, msg, args) {
    // Pata jina la mtu aliye tuma message
    let senderName = msg.pushName || msg.key.participant?.split("@")[0] || "Mtu wa kazi";

    // Jibu message
    await sock.sendMessage(msg.key.remoteJid, {
      text: `🏓 Pong! 👋 Hello ${senderName}, bot iko tayari!`
    });
  }
};
