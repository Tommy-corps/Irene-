const { performance } = require("perf_hooks");

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
  name: "ping",
  description: "Check bot status and latency ⚡",
  async execute(sock, msg) {
    const senderName = msg.pushName || msg.key.participant?.split("@")[0] || "User";
    const jid = msg.key.remoteJid;

    // React immediately
    await sock.sendMessage(jid, { react: { text: "🏓", key: msg.key } });

    // Measure latency
    const start = performance.now();
    const sentMsg = await sock.sendMessage(jid, { text: fancy("💖 BOSS GIRL TECH ❤️ - Pinging...") });
    const end = performance.now();
    const latency = Math.floor(end - start);

    // Edit message with fancy result (if edit supported) or send new
    await sock.sendMessage(jid, {
      text: fancy(`💖 BOSS GIRL TECH ❤️ - Pong! Hello ${senderName} 🥰\nLatency: ${latency}ms\nBot is online and ready 🚀`)
    });
  }
};
