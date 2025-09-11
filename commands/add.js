// 📂 commands/add.js
const fs = require("fs");
const path = require("path");

// Fancy text function (copy-paste hii kwenye command zote)
const fancy = (text) => {
  const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rosemary = "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩0123456789";
  return text.split("").map(c => {
    const index = normal.indexOf(c);
    return index !== -1 ? rosemary[index] : c;
  }).join("");
};

module.exports = {
  name: "add",
  description: "➕ Add something",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;

    // Example response using fancy text
    const replyText = fancy("✅ Successfully added! 🌟");

    await sock.sendMessage(from, { text: replyText }, { quoted: msg });
  }
};
