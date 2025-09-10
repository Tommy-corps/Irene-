const fs = require("fs");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const axios = require("axios");

// Fancy text (Rosemary)
function fancy(text) {
  const chars = {
    A:'𝓐',B:'𝓑',C:'𝓒',D:'𝓓',E:'𝓔',F:'𝓕',G:'𝓖',H:'𝓗',I:'𝓘',
    J:'𝓙',K:'𝓚',L:'𝓛',M:'𝓜',N:'𝓝',O:'𝓞',P:'𝓟',Q:'𝓠',R:'𝓡',
    S:'𝓢',T:'𝓣',U:'𝓤',V:'𝓥',W:'𝓦',X:'𝓧',Y:'𝓨',Z:'𝓩',
    a:'𝓪',b:'𝓫',c:'𝓬',d:'𝓭',e:'𝓮',f:'𝓯',g:'𝓰',h:'𝓱',i:'𝓲',
    j:'𝓳',k:'𝓴',l:'𝓵',m:'𝓶',n:'𝓷',o:'𝓸',p:'𝓹',q:'𝓺',r:'𝓻',
    s:'𝓼',t:'𝓽',u:'𝓾',v:'𝓿',w:'𝔀',x:'𝔁',y:'𝔂',z:'𝔃'
  };
  return text.split('').map(c=>chars[c]||c).join('');
}

// Img2Img function
async function stabilityImageToImage(imageBuffer, prompt) {
  try {
    const apiKey = process.env.STABILITY_KEY || "sk-GPrKV4TIpQ8DHxH5LNbwi5xEIxyVsu47r2SoZrcLjjZbmGuK";
    const response = await axios.post(
      "https://api.stability.ai/v1/generation/stable-diffusion-512-v2-1/image-to-image",
      {
        init_image: imageBuffer.toString("base64"),
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        strength: 0.65,
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
    const imagePath = "./stability_img2img.png";
    fs.writeFileSync(imagePath, Buffer.from(imageBase64, "base64"));
    return imagePath;
  } catch (e) {
    console.error("❌ Stability Img2Img Error:", e.response?.data || e.message);
    return null;
  }
}

// Command module
module.exports = {
  name: "imagine",
  description: "Transform your image using AI 🖌️",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const text = msg.message?.conversation?.trim() || "A beautiful digital art";

    // React to command
    await sock.sendMessage(from, { react: { text: "🎨", key: msg.key } });

    // Ensure user replied to an image
    if (!msg.message?.imageMessage && !msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
      return await sock.sendMessage(from, { text: fancy("🖼️ Reply to an image with prompt or send an image with text!") });
    }

    // Download media
    let buffer;
    if (msg.message?.imageMessage) {
      buffer = await downloadMediaMessage(msg, "buffer");
    } else {
      buffer = await downloadMediaMessage(
        { message: msg.message.extendedTextMessage.contextInfo.quotedMessage },
        "buffer"
      );
    }

    await sock.sendMessage(from, { text: fancy("🎨 *Transforming your image...*" ) });

    // Generate AI image
    const imagePath = await stabilityImageToImage(buffer, text);
    if (imagePath) {
      await sock.sendMessage(from, {
        image: fs.readFileSync(imagePath),
        caption: fancy(`✨ *AI Image Generated*\n${text}`)
      });
    } else {
      await sock.sendMessage(from, { text: fancy("⚠️ Failed to transform the image.") });
    }
  }
};
