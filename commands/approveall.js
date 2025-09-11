// 📂 commands/approveall.js
const stylish = (text) => {
  const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rosemary = "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩0123456789";
  return text.split("").map(c => {
      const index = normal.indexOf(c);
      return index !== -1 ? rosemary[index] : c;
  }).join("");
};

module.exports = {
  name: "approveall",
  description: "✅ Approve all join requests 🌹",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;

    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: stylish("❌ This command only works in groups!") }, { quoted: msg });
    }

    try {
      // Check if bot is admin
      const metadata = await sock.groupMetadata(from);
      const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const isBotAdmin = metadata.participants.some(p => p.id === botNumber && p.admin !== null);

      if (!isBotAdmin) {
        return sock.sendMessage(from, { 
          text: stylish("⚠️ I am not an admin! Please make me admin first.") 
        }, { quoted: msg });
      }

      // Get pending requests
      const requests = await sock.groupRequestParticipantsList(from);
      if (!requests || requests.length === 0) {
        return sock.sendMessage(from, { 
          text: stylish("ℹ️ There are no pending requests at the moment.") 
        }, { quoted: msg });
      }

      // Approve all
      for (const req of requests) {
        await sock.groupRequestParticipantsUpdate(from, [req.jid], "approve");
      }

      await sock.sendMessage(from, { 
        text: stylish(`✅ Successfully approved ${requests.length} join requests! 🌹`) 
      }, { quoted: msg });

    } catch (err) {
      console.error("❌ ApproveAll Error:", err);
      await sock.sendMessage(from, { 
        text: stylish("⚠️ Failed to approve requests. Check if 'Approve New Participants' is enabled.") 
      }, { quoted: msg });
    }
  }
};
