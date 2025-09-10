const axios = require("axios");

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
  name: "gif",
  description: "Search and send GIFs from Tenor 🎬",
  async execute(sock, msg, args) {
    const query = args.join(" ");
    if (!query) {
      return await sock.sendMessage(msg.key.remoteJid, {
        text: fancy("❌ Please provide a keyword to search GIFs.\nUsage: !gif funny cat")
      });
    }

    // React to command
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "🎬", key: msg.key } });

    try {
      const apiKey = process.env.TENOR_API_KEY;
      if (!apiKey) return await sock.sendMessage(msg.key.remoteJid, { text: fancy("❌ TENOR_API_KEY not set in .env") });

      // Tenor API request
      const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&client_key=bossgirltech&limit=1`;
      const response = await axios.get(url);
      const results = response.data.results;
      if (!results || results.length === 0) return await sock.sendMessage(msg.key.remoteJid, { text: fancy("❌ No GIFs found for that query.") });

      const gifUrl = results[0].media_formats.gif.url;

      // Send GIF
      await sock.sendMessage(msg.key.remoteJid, { video: { url: gifUrl }, mimetype: "video/gif" });

      // Success message
      await sock.sendMessage(msg.key.remoteJid, { text: fancy(`✅ GIF sent successfully for "${query}"! 💖 𝓑𝓞𝓢𝓢 𝓖𝓘𝓡𝓛 𝓣𝓔𝓒𝓗 ❤️`) });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(msg.key.remoteJid, { text: fancy("❌ Failed to fetch GIF from Tenor.") });
    }
  }
};
