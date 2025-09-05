module.exports = {
  name: "lockgroup",
  description: "🔒 Funga group",
  async execute(sock, msg) {
    await sock.groupSettingUpdate(msg.key.remoteJid, "announcement");
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "🔒", key: msg.key },
    });
    await sock.sendMessage(msg.key.remoteJid, { text: "🚫 Group limefungwa (admins only)." });
  },
};
