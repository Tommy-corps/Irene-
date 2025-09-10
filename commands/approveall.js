const { fancy } = require("../utils/fancy"); 

module.exports = {
  name: "approveall",
  description: "✅ Approve all join requests 🌹",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: fancy("❌ This command works only in groups!") }, { quoted: msg });
    }

    try {
      const requests = await sock.groupRequestParticipantsList(from);
      if (!requests || requests.length === 0) {
        return sock.sendMessage(from, { text: fancy("ℹ️ There are no pending requests right now.") }, { quoted: msg });
      }

      for (const req of requests) {
        await sock.groupRequestParticipantsUpdate(from, [req.jid], "approve");
      }

      await sock.sendMessage(from, { 
        text: fancy(`✅ Approved ${requests.length} join requests successfully! 🌹`) 
      }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { 
        text: fancy("⚠️ Failed to approve requests. Make sure the bot is an admin!") 
      }, { quoted: msg });
    }
  }
};
