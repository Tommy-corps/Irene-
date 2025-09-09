module.exports = {
  name: "ping",
  description: "Check bot responsiveness",
  async execute(sock, msg, args) {
    const senderName = msg.pushName || msg.key.participant?.split("@")[0] || "Mtu wa kazi";
    await sock.sendMessage(msg.key.remoteJid, {
      text: `🏓 Pong! Hello ${senderName}, bot iko tayari!`
    });
  }
};
