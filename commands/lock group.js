function fancy(text) { /* same as above */ }

module.exports = {
  name: "lock",
  description: "Lock the group 🔒 (Only admins can send messages)",
  async execute(sock, msg) {
    const groupId = msg.key.remoteJid;
    await sock.sendMessage(groupId, { react: { text: "🔒", key: msg.key } });

    try {
      await sock.groupSettingUpdate(groupId, "announcement");
      await sock.sendMessage(groupId, { text: fancy("💖 𝓑𝓞𝓢𝓢 𝓖𝓘𝓡𝓛 𝓣𝓔𝓒𝓗 ❤️ - 𝓖𝓻𝓸𝓾𝓹 𝓲𝓼 𝓵𝓸𝓬𝓴𝓮𝓭! 🔒 𝓞𝓷𝓵𝔂 𝓪𝓭𝓶𝓲𝓷𝓼 𝓬𝓪𝓷 𝓼𝓮𝓷𝓭 𝓶𝓮𝓼𝓼𝓪𝓰𝓮𝓼") });
    } catch(err) {
      await sock.sendMessage(groupId, { text: fancy("❌ 𝓕𝓪𝓲𝓵𝓮𝓭 𝓽𝓸 𝓵𝓸𝓬𝓴. 𝓜𝓪𝓴𝓮 𝓼𝓾𝓻𝓮 𝓘 𝓪𝓶 𝓪𝓭𝓶𝓲𝓷.") });
    }
  }
};
