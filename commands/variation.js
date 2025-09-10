const fs = require("fs");
const axios = require("axios");

// Fancy Rosemary font
function fancy(text) {
  const chars = {
    A:'𝓐',B:'𝓑',C:'𝓒',D:'𝓓',E:'𝓔',F:'𝓕',G:'𝓖',H:'𝓗',I:'𝓘',
    J:'𝓙',K:'𝓚',L:'𝓛',M:'𝓜',N:'𝓝',O:'𝓞',P:'𝓟',Q:'𝓠',R:'𝓡',
    S:'𝓢',T:'𝓣',U:'𝓤',V:'𝓥',W:'𝓦',X:'𝓧',Y:'𝓨',Z:'𝓩',
    a:'𝓪',b:'𝓫',c:'𝓬',d:'𝓭',e:'𝓮',f:'𝓯',g:'𝓰',h:'𝓱',i:'𝓲',
    j:'𝓳',k:'𝓴',l:'𝓵',m:'𝓶',n:'𝓷',o:'𝓸',p:'𝓹',q:'𝓺',r:'𝓻',
    s:'𝓼',t:'𝓽',u:'𝓾',v:'𝓿',w:'𝔀',x:'𝔁',y:'𝔂',z:'𝔃'
  };
  return text.split('').map(c => chars[c] || c).join('');
}

async function stabilityVariation(imageBuffer) {
  try {
    const apiKey = "sk-GPrKV4TIpQ8DHxH5LNbwi5xEIxyVsu47r2SoZrcLjjZbmGuK";
    const response = await axios.post(
      "https://api.stability.ai/v1/generation/stable-diffusion-512-v2-1/image-to-image",
      {
        init_image: imageBuffer.toString("base64"),
        text_prompts: [{ text: "Different variation, artistic style" }],
        cfg_scale: 8,
        strength: 0.75,
        samples: 1,
        steps: 30
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      }
    );

    const imageBase64 = response.data.artifacts[0].base64;
    const imagePath = "./stability_variation.png";
    fs.writeFileSync(imagePath, Buffer.from(imageBase64, "base64"));
    return imagePath;
  } catch (e) {
    console.error("❌ Stability Variation Error:", e.response?.data || e.message);
    return null;
  }
}

module.exports = {
  name: "variation",
  description: "Create AI variations of an image 🎭",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    if (!msg.message.imageMessage) return sock.sendMessage(from, { text: fancy("📸 Send an image to create a variation.") });

    await sock.sendMessage(from, { react: { text: "🎭", key: msg.key } });

    const buffer = await downloadMediaMessage(msg, "buffer");
    await sock.sendMessage(from, { text: fancy("🎨 Creating a variation of your image...") });

    const imagePath = await stabilityVariation(buffer);
    if (imagePath) {
      await sock.sendMessage(from, { image: fs.readFileSync(imagePath), caption: fancy("🎭 *Variation Created!*") });
    } else {
      await sock.sendMessage(from, { text: fancy("⚠️ Failed to create variation.") });
    }
  }
};
