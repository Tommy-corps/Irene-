// Fancy text converter (Rosemary)
function fancy(text) {
  const chars = {
    A: '𝓐', B: '𝓑', C: '𝓒', D: '𝓓', E: '𝓔', F: '𝓕', G: '𝓖', H: '𝓗', I: '𝓘',
    J: '𝓙', K: '𝓚', L: '𝓛', M: '𝓜', N: '𝓝', O: '𝓞', P: '𝓟', Q: '𝓠', R: '𝓡',
    S: '𝓢', T: '𝓣', U: '𝓤', V: '𝓥', W: '𝓦', X: '𝓧', Y: '𝓨', Z: '𝓩',
    a: '𝓪', b: '𝓫', c: '𝓬', d: '𝓭', e: '𝓮', f: '𝓯', g: '𝓰', h: '𝓱', i: '𝓲',
    j: '𝓳', k: '𝓴', l: '𝓵', m: '𝓶', n: '𝓷', o: '𝓸', p: '𝓹', q: '𝓺', r: '𝓻',
    s: '𝓼', t: '𝓽', u: '𝓾', v: '𝓿', w: '𝔀', x: '𝔁', y: '𝔂', z: '𝔃'
  };
  return text.split('').map(c => chars[c] || c).join('');
}

module.exports = {
  name: "mute",
  description: "Mute the group 🔇",
  async execute(sock, msg) {
    const groupId = msg.key.remoteJid;

    // React
    await sock.sendMessage(groupId, { react: { text: "🔇", key: msg.key } });

    try {
      await sock.groupSettingUpdate(groupId, "announcement");
      await sock.sendMessage(groupId, { text: fancy("💖 𝓑𝓞𝓢𝓢 𝓖𝓘𝓡𝓛 𝓣𝓔𝓒𝓗 ❤️ - 𝓖𝓻𝓸𝓾𝓹 𝓲𝓼 𝓷𝓸𝔀 𝓶𝓾𝓽𝓮𝓭! 🔇 𝓞𝓷𝓵𝔂 𝓪𝓭𝓶𝓲𝓷𝓼 𝓬𝓪𝓷 𝓼𝓮𝓷𝓭 𝓶𝓮𝓼𝓼𝓪𝓰𝓮𝓼") });
    } catch(err) {
      await sock.sendMessage(groupId, { text: fancy("❌ 𝓕𝓪𝓲𝓵𝓮𝓭 𝓽𝓸 𝓶𝓾𝓽𝓮. 𝓜𝓪𝓴𝓮 𝓼𝓾𝓻𝓮 𝓘 𝓪𝓶 𝓪𝓭𝓶𝓲𝓷.") });
    }
  }
};
