function fancy(text) {
  const chars = { /* same as above */ };
  return text.split('').map(c => chars[c] || c).join('');
}

module.exports = {
  name: "unmute",
  description: "Unmute the group 🔊",
  async execute(sock, msg) {
    const groupId = msg.key.remoteJid;

    // React
    await sock.sendMessage(groupId, { react: { text: "🔊", key: msg.key } });

    try {
      await sock.groupSettingUpdate(groupId, "not_announcement");
      await sock.sendMessage(groupId, { text: fancy("💖 𝓑𝓞𝓢𝓢 𝓖𝓘𝓡𝓛 𝓣𝓔𝓒𝓗 ❤️ - 𝓖𝓻𝓸𝓾𝓹 𝓲𝓼 𝓾𝓷𝓶𝓾𝓽𝓮𝓭! 🔊 𝓔𝓿𝓮𝓻𝔂𝓸𝓷𝓮 𝓬𝓪𝓷 𝓼𝓮𝓷𝓭 𝓶𝓮𝓼𝓼𝓪𝓰𝓮𝓼") });
    } catch(err) {
      await sock.sendMessage(groupId, { text: fancy("❌ 𝓕𝓪𝓲𝓵𝓮𝓭 𝓽𝓸 𝓾𝓷𝓶𝓾𝓽𝓮. 𝓜𝓪𝓴𝓮 𝓼𝓾𝓻𝓮 𝓘 𝓪𝓶 𝓪𝓭𝓶𝓲𝓷.") });
    }
  }
};
