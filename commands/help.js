const fs = require("fs");
const path = require("path");

module.exports = {
  name: "help",
  description: "Onyesha maelezo ya bot na jinsi ya kutumia 🆘",
  async execute(sock, msg) {
    const helpText = `
❤️ *Boss Girl tech - HELP* ❤️

Karibu! 🙌
Bot hii ina zaidi ya *200+ features* ambazo zinaweza kufanya mambo kama:
- Kutengeneza stickers 🎨
- Kuongea na AI 🤖
- Kudownload media 🎬
- Kutafsiri lugha 🌍
- Kudhibiti group ⚙️
- Na mengine mengi...

🔑 *Jinsi ya kutumia:*
1️⃣ Tumia prefix yako (mfano: !)
2️⃣ Andika command unayotaka kutumia

Mfano:
- !menu  → kuona orodha ya commands zote 📋
- !ping  → kuangalia kama bot ipo online 🏓

👑 *Owner:* +255624236654 
📢 *Version:* v6.7.16

Tumia *!menu* kuona list ya commands zote.
`;

    // ✅ Pata path ya picha kwenye public folder
    const imagePath = path.join(__dirname, "../public/IMG-20250530-WA0294.jpg");

    // ✅ Tuma image + caption
    await sock.sendMessage(msg.key.remoteJid, {
      image: fs.readFileSync(imagePath),
      caption: helpText
    });
  }
};
