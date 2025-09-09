module.exports = {
  name: "time",
  description: "Onyesha saa ya sasa",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-GB", { hour12: false });
    const dateString = now.toLocaleDateString("en-GB");
    await sock.sendMessage(from, {
      text: `⏰ Tarehe na Saa ya sasa:\n📅 ${dateString}\n🕒 ${timeString}`
    });
  }
};
