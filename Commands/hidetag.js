// Dev: Irene & Tommy
const BOT_NAME = "Irene Bot";

module.exports = {
  name: "hidetag",
  description: "🙈 Hidetag all members in group silently",
  async execute(sock, msg, args, settings) {
    const STATUS_REACT = ["🙈","🔕","✨","💯"];
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    // Only owner can execute
    if (!sender.includes("255624236654")) {
      return await sock.sendMessage(from, { text: `❌ ${BOT_NAME}: You are not allowed to use this command!` });
    }

    // React to command
    await sock.sendMessage(from, {
      react: { text: STATUS_REACT[Math.floor(Math.random() * STATUS_REACT.length)], key: msg.key },
    });

    try {
      // Get group metadata
      const metadata = await sock.groupMetadata(from);
      const participants = metadata.participants.map(p => p.id);

      // Message to send
      let text = args.join(" ");
      if (!text) text = `👋 ${BOT_NAME}: Attention everyone!`;

      // Send hidetag message
      await sock.sendMessage(from, {
        text,
        mentions: participants,
      });

      await sock.sendMessage(from, { text: `✅ ${BOT_NAME}: Successfully sent hidetag!` });
    } catch (e) {
      console.error("⚠️ Hidetag error:", e);
      await sock.sendMessage(from, { text: `⚠️ ${BOT_NAME}: Failed to send hidetag.` });
    }
  }
};
