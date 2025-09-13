const { fancy } = require("../utils/fancy");

module.exports = {
  name: "antilink",
  description: "🚫 Auto-delete links in groups",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;

    if (!from.endsWith("@g.us")) return; // Only groups

    try {
      const body = msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "";

      // Regex ya kugundua link
      const linkRegex = /(https?:\/\/[^\s]+)/gi;
      if (!linkRegex.test(body)) return; // Hakuna link, acha iendelee

      // Check kama bot ni admin
      const metadata = await sock.groupMetadata(from);
      const botNumber = (await sock.decodeJid(sock.user.id));
      const botParticipant = metadata.participants.find(
        (p) => p.id === botNumber
      );
      const isBotAdmin = botParticipant?.admin;

      if (!isBotAdmin) {
        return sock.sendMessage(
          from,
          { text: fancy("⚠️ I detected a link, but I'm not an admin to delete it!") },
          { quoted: msg }
        );
      }

      // Delete message
      await sock.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: false,
          id: msg.key.id,
          participant: msg.key.participant,
        },
      });

      // Send warning to group
      await sock.sendMessage(
        from,
        {
          text: fancy(
            `🚫 Link detected and removed!\n👤 User: @${
              msg.key.participant.split("@")[0]
            }\n❗ Only admins can share links here!`
          ),
          mentions: [msg.key.participant],
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ AntiLink Error:", err);
    }
  },
};
