const fs = require("fs");
const path = require("path");

// Fancy font converter
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
  name: "groupinfo",
  description: "Show styled group info with fancy font ℹ️",
  async execute(sock, msg) {
    const groupId = msg.key.remoteJid;

    if (!groupId.endsWith("@g.us")) {
      return await sock.sendMessage(groupId, { text: "❌ This command is only for groups!" });
    }

    // React to command
    await sock.sendMessage(groupId, { react: { text: "ℹ️", key: msg.key } });

    try {
      const metadata = await sock.groupMetadata(groupId);
      const owner = metadata.owner || "Unknown";
      const participants = metadata.participants.map(p => p.id.split("@")[0]);
      const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const botAdmin = metadata.participants.find(p => p.id === botNumber)?.admin ? "Yes" : "No";

      const text = `
💖 *${fancy("BOSS GIRL TECH ❤️ - GROUP INFO")}* 💖

🌟 *${fancy("Group Name:")}* ${metadata.subject}
🆔 *${fancy("Group ID:")}* ${groupId}
👑 *${fancy("Owner:")}* ${owner.split("@")[0]}
👥 *${fancy("Members Count:")}* ${participants.length}
🤖 *${fancy("Bot Admin:")}* ${botAdmin}

✨ *Use !help to see all commands!*
`;

      await sock.sendMessage(groupId, { text });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(groupId, { text: "❌ Failed to fetch group info." });
    }
  }
};
