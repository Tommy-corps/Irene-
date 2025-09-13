const fetch = require("node-fetch");

// 🌹 Rosemary/Tiny Stylish Font Converter
const fancy = (text) => {
  const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rosemary = "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩0123456789";
  return text
    .split("")
    .map((c) => {
      const index = normal.indexOf(c);
      return index !== -1 ? rosemary[index] : c;
    })
    .join("");
};

module.exports = {
  name: "grouplink",
  description: "🔗 Send group invite link with stylish font and icon",
  async execute(sock, msg, isGroup) {
    const from = msg.key.remoteJid;

    try {
      if (!isGroup) {
        return await sock.sendMessage(from, { text: "❌ Hii sio group!" }, { quoted: msg });
      }

      // 🔹 Check if bot is admin
      const metadata = await sock.groupMetadata(from);
      const botJid = sock.user.id;
      const botMember = metadata.participants.find(p => p.id === botJid);
      const isBotAdmin = botMember && (botMember.admin === "admin" || botMember.admin === "superadmin");

      if (!isBotAdmin) {
        return await sock.sendMessage(from, { text: "❌ Mimi si admin, siwezi kutoa link ya group!" }, { quoted: msg });
      }

      // 🔹 Get group invite code
      const inviteCode = await sock.groupInviteCode(from);
      const groupLink = `https://chat.whatsapp.com/${inviteCode}`;

      // 🔹 Get profile picture
      let groupProfilePic = null;
      try {
        const ppUrl = await sock.profilePictureUrl(from, "image");
        const res = await fetch(ppUrl);
        groupProfilePic = await res.arrayBuffer();
      } catch {
        groupProfilePic = null;
      }

      // 🔹 Send group link with rich preview & stylish font
      await sock.sendMessage(
        from,
        {
          text: `🔗 Join our group:`,
          contextInfo: {
            externalAdReply: {
              title: fancy(metadata.subject || "Group"), // Stylish font
              body: "Click to join!",
              mediaType: 2,
              thumbnail: groupProfilePic ? Buffer.from(groupProfilePic) : undefined,
              sourceUrl: groupLink,
            },
          },
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ Error sending group link:", err);
      await sock.sendMessage(from, { text: "⚠️ Tatizo kuleta group link!" }, { quoted: msg });
    }
  },
};
