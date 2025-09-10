const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Fancy text converter (Rosemary)
function fancy(text) {
  const chars = {
    A:'𝓐', B:'𝓑', C:'𝓒', D:'𝓓', E:'𝓔', F:'𝓕', G:'𝓖', H:'𝓗', I:'𝓘',
    J:'𝓙', K:'𝓚', L:'𝓛', M:'𝓜', N:'𝓝', O:'𝓞', P:'𝓟', Q:'𝓠', R:'𝓡',
    S:'𝓢', T:'𝓣', U:'𝓤', V:'𝓥', W:'𝓦', X:'𝓧', Y:'𝓨', Z:'𝓩',
    a:'𝓪', b:'𝓫', c:'𝓬', d:'𝓭', e:'𝓮', f:'𝓯', g:'𝓰', h:'𝓱', i:'𝓲',
    j:'𝓳', k:'𝓴', l:'𝓵', m:'𝓶', n:'𝓷', o:'𝓸', p:'𝓹', q:'𝓺', r:'𝓻',
    s:'𝓼', t:'𝓽', u:'𝓾', v:'𝓿', w:'𝔀', x:'𝔁', y:'𝔂', z:'𝔃'
  };
  return text.split('').map(c => chars[c] || c).join('');
}

module.exports = {
  name: "tts",
  description: "Convert text to speech using VoiceRSS 🔊",
  async execute(sock, msg, args) {
    const text = args.join(" ");
    if (!text) return await sock.sendMessage(msg.key.remoteJid, {
      text: fancy("❌ Please provide text to convert to audio.\nUsage: !tts Hello World")
    });

    // React to command
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "🔊", key: msg.key } });

    try {
      const apiKey = process.env.VOICERSS_API_KEY;
      if (!apiKey) return await sock.sendMessage(msg.key.remoteJid, { text: fancy("❌ VOICERSS_API_KEY not set in .env") });

      const url = `https://api.voicerss.org/?key=${apiKey}&hl=en-us&src=${encodeURIComponent(text)}&c=MP3`;

      const response = await axios.get(url, { responseType: "arraybuffer" });
      const audioFile = path.join(__dirname, "tts.mp3");
      fs.writeFileSync(audioFile, response.data);

      // Send audio
      await sock.sendMessage(msg.key.remoteJid, { audio: fs.readFileSync(audioFile), mimetype: "audio/mpeg" });

      // Confirmation message
      await sock.sendMessage(msg.key.remoteJid, { text: fancy("✅ Audio sent successfully! 💖 𝓑𝓞𝓢𝓢 𝓖𝓘𝓡𝓛 𝓣𝓔𝓒𝓗 ❤️") });

      // Clean up file
      fs.unlinkSync(audioFile);
    } catch (err) {
      console.error(err);
      await sock.sendMessage(msg.key.remoteJid, { text: fancy("❌ Failed to generate audio.") });
    }
  }
};
