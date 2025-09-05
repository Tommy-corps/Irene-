// Dev: Irene & Tommy
const BOT_NAME = "Irene Bot";

module.exports = {
  name: "tagall",
  description: "📣 Tag all members or hidetag in group",
  async execute(sock, msg, args, settings) {
    const STATUS_REACT = ["📣","🔔","✨","💯"];
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

      // Check for hidetag
      const option = args[0]?.toLowerCase();
      if (option === "hidetag") {
        await sock.sendMessage(from, {
          text,
          mentions: participants,
        });
      } else {
        // Normal tag all
        await sock.sendMessage(from, {
          text,
          mentions: participants,
        });
      }

      await sock.sendMessage(from, { text: `✅ ${BOT_NAME}: Successfully sent tagall!` });
    } catch (e) {
      console.error("⚠️ Tagall error:", e);
      await sock.sendMessage(from, { text: `⚠️ ${BOT_NAME}: Failed to send tagall.` });
    }
  }
};
