module.exports = {
  name: "tagall",
  description: "Mention all group members 📢",
  async execute(sock, msg) {
    const groupId = msg.key.remoteJid;
    const metadata = await sock.groupMetadata(groupId);
    const mentions = metadata.participants.map(p => p.id);

    // React to command
    await sock.sendMessage(groupId, { react: { text: "✨", key: msg.key } });

    // Send tagall message
    await sock.sendMessage(groupId, {
      text: "💖 𝓑𝓞𝓢𝓢 𝓖𝓘𝓡𝓛 𝓣𝓔𝓒𝓗 ❤️ - Attention everyone!",
      mentions
    });
  }
};
