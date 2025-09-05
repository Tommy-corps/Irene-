// Dev: Irene & Tommy
const BOT_NAME = "Irene Bot";

// Map to track warns per group
const warnMap = {}; // { groupId: { userId: count } }

module.exports = {
  name: "warn",
  description: "⚠️ Warn a user (reply or mention) and track offenses",
  async execute(sock, msg, args, settings) {
    const STATUS_REACT = ["⚠️","🔥","💯","✅"];
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
      // Determine target user: reply or mention
      let targetId;
      if (msg.message.extendedTextMessage?.contextInfo?.participant) {
        targetId = msg.message.extendedTextMessage.contextInfo.participant;
      } else if (args[0]) {
        targetId = args[0].includes("@") ? args[0] : `${args[0]}@s.whatsapp.net`;
      } else {
        return await sock.sendMessage(from, { text: `⚠️ ${BOT_NAME}: Reply to a user or provide number to warn.` });
      }

      // Initialize warnMap
      if (!warnMap[from]) warnMap[from] = {};
      if (!warnMap[from][targetId]) warnMap[from][targetId] = 0;

      // Increment warn
      warnMap[from][targetId] += 1;

      // Send warn message
      await sock.sendMessage(from, { 
        text: `⚠️ ${BOT_NAME}: User @${targetId.split("@")[0]} amepewa warn! (Warn ${warnMap[from][targetId]})`,
        mentions: [targetId],
      });

    } catch (e) {
      console.error("⚠️ Warn command error:", e);
      await sock.sendMessage(from, { text: `⚠️ ${BOT_NAME}: Failed to warn user.` });
    }
  }
};
