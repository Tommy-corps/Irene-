// Dev: Irene & Tommy
const BOT_NAME = "Irene Bot";

module.exports = {
  name: "remove",
  description: "🛑 Remove a member from group",
  async execute(sock, msg, args, settings) {
    const STATUS_REACT = ["🛑","⚡","💯","✅"];
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    // Only owner
    if (!sender.includes("255624236654")) {
      return await sock.sendMessage(from, { text: `❌ ${BOT_NAME}: You are not allowed to use this command!` });
    }

    // React
    await sock.sendMessage(from, {
      react: { text: STATUS_REACT[Math.floor(Math.random() * STATUS_REACT.length)], key: msg.key },
    });

    try {
      // Target user: reply or mention
      let targetId;
      if (msg.message.extendedTextMessage?.contextInfo?.participant) {
        targetId = msg.message.extendedTextMessage.contextInfo.participant;
      } else if (args[0]) {
        targetId = args[0].includes("@") ? args[0] : `${args[0]}@s.whatsapp.net`;
      } else {
        return await sock.sendMessage(from, { text: `⚠️ ${BOT_NAME}: Reply to a user or provide number to remove.` });
      }

      await sock.groupParticipantsUpdate(from, [targetId], "remove");
      await sock.sendMessage(from, { text: `✅ ${BOT_NAME}: User @${targetId.split("@")[0]} ameondolewa group!`, mentions: [targetId] });
    } catch (e) {
      console.error("⚠️ Remove command error:", e);
      await sock.sendMessage(from, { text: `⚠️ ${BOT_NAME}: Failed to remove user.` });
    }
  }
};
