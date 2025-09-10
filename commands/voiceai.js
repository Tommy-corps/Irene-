const axios = require("axios");
const fs = require("fs");
const path = require("path");

function fancy(text) {
  return text.split('').map(c => ({
    A:'𝓐',B:'𝓑',C:'𝓒',D:'𝓓',E:'𝓔',F:'𝓕',G:'𝓖',H:'𝓗',I:'𝓘',
    J:'𝓙',K:'𝓚',L:'𝓛',M:'𝓜',N:'𝓝',O:'𝓞',P:'𝓟',Q:'𝓠',R:'𝓡',
    S:'𝓢',T:'𝓣',U:'𝓤',V:'𝓥',W:'𝓦',X:'𝓧',Y:'𝓨',Z:'𝓩',
    a:'𝓪',b:'𝓫',c:'𝓬',d:'𝓭',e:'𝓮',f:'𝓯',g:'𝓰',h:'𝓱',i:'𝓲',
    j:'𝓳',k:'𝓴',l:'𝓵',m:'𝓶',n:'𝓷',o:'𝓸',p:'𝓹',q:'𝓺',r:'𝓻',
    s:'𝓼',t:'𝓽',u:'𝓾',v:'𝓿',w:'𝔀',x:'𝔁',y:'𝔂',z:'𝔃'
  }[c] || c)).join('');
}

module.exports = {
  name: "voiceai",
  description: "Generate AI voice from text 🎤",
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!args[0]) return await sock.sendMessage(jid, { text: fancy("❌ Please provide text to speak!") });

    await sock.sendMessage(jid, { react: { text: "🎙️", key: msg.key } });

    try {
      const text = args.join(" ");
      const outputPath = path.join(__dirname, "../tmp/voice.mp3");

      const res = await axios({
        method: "POST",
        url: "https://api.voicerss.org/",
        params: {
          key: process.env.VOICERSS_KEY,
          src: text,
          hl: "en-us",
          c: "MP3"
        },
        responseType: "arraybuffer"
      });

      fs.writeFileSync(outputPath, res.data);
      await sock.sendMessage(jid, { audio: fs.readFileSync(outputPath), mimetype: "audio/mp3" });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: fancy("❌ Error generating voice. Try again later.") });
    }
  }
};
