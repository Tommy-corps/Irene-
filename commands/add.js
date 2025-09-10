const { fancy } = require("../utils/fancy"); // hakikisha unayo fancy function kwenye utils

module.exports = {
  name: "add",
  description: "➕ Add member to group 🌹",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: fancy("❌ This command works only in groups!") }, { quoted: msg });
    }

    if (!args[0]) {
      return sock.sendMessage(from, { 
        text: fancy("📩 Please provide a number to add!\n💡 Example: !add 2557XXXXXXXX") 
      }, { quoted: msg });
    }

    const number = args[0].replace(/[^0-9]/g, "");
    const jid = `${number}@s.whatsapp.net`;

    try {
      await sock.groupParticipantsUpdate(from, [jid], "add");
      await sock.sendMessage(from, { 
        text: fancy(`🌹 Successfully added @${number} to the group! 🎉`),
        mentions: [jid]
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { 
        text: fancy(`⚠️ Failed to add ${number}.\nPossible reasons:\n- Privacy settings of user block adds\n- Bot is not admin in this group`) 
      }, { quoted: msg });
    }
  }
};
