module.exports = {
  name: "hidetag",
  description: "Send message without showing your name 👻",
  async execute(sock, msg) {
    const groupId = msg.key.remoteJid;
    const text = msg.message.conversation || "💖 𝓑𝓞𝓢𝓢 𝓖𝓘𝓡𝓛 𝓣𝓔𝓒𝓗 ❤️ - Hidden message!";
    const metadata = await sock.groupMetadata(groupId);
    const mentions = metadata.participants.map(p => p.id);

    // React to command
    await sock.sendMessage(groupId, { react: { text: "🤫", key: msg.key } });

    await sock.sendMessage(groupId, { text, mentions });
  }
};
