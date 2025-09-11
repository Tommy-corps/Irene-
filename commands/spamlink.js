// 📂 commands/spamlink.js
const { jidDecode } = require("@whiskeysockets/baileys");

const stylish = (text) => {
  const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rosemary = "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩0123456789";
  return text.split("").map(c => {
      const index = normal.indexOf(c);
      return index !== -1 ? rosemary[index] : c;
  }).join("");
};

module.exports = {
  name: "spamlink",
  description: "⚠️ Spam a link multiple times (test anti-link)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const senderJid = msg.key.participant || msg.key.remoteJid;

    // Safe decode user id
    let userId;
    try {
      const decoded = jidDecode(senderJid);
      userId = decoded?.user || senderJid.split("@")[0];
    } catch {
      userId = senderJid.split("@")[0];
    }

    // Default values if user didn't provide
    const link = args[0] || "https://chat.whatsapp.com/EXAMPLEGROUPINVITE";
    const times = parseInt(args[1] || "50");
    const interval = parseInt(args[2] || "3") * 1000; // seconds to ms

    await sock.sendMessage(from, { 
      text: stylish(`🚀 Spamming link ${times} times every ${interval/1000}s... Requested by @${userId}`),
      mentions: [senderJid]
    });

    let count = 0;
    const spamInterval = setInterval(async () => {
      if (count >= times) {
        clearInterval(spamInterval);
        await sock.sendMessage(from, { text: stylish("✅ Spam completed!") });
        return;
      }
      await sock.sendMessage(from, { text: link });
      count++;
    }, interval);
  }
};
