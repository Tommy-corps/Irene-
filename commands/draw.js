const axios = require("axios");
const fs = require("fs");

// 🔑 Stability AI Text-to-Image
async function stabilityTextToImage(prompt) {
  try {
    const apiKey = "sk-GPrKV4TIpQ8DHxH5LNbwi5xEIxyVsu47r2SoZrcLjjZbmGuK"; // Stability AI Key
    const response = await axios.post(
      "https://api.stability.ai/v1/generation/stable-diffusion-512-v2-1/text-to-image",
      {
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height: 512,
        width: 512,
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
    const imagePath = "./stability_text.png";
    fs.writeFileSync(imagePath, Buffer.from(imageBase64, "base64"));
    return imagePath;
  } catch (e) {
    console.error("❌ Stability Text2Image Error:", e.response?.data || e.message);
    return null;
  }
}

module.exports = {
  name: "draw",
  description: "Generate an AI image using Stability AI 🎨",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) {
      return await sock.sendMessage(from, {
        text: "✍️ *Write a description for the image you want*\nExample: !draw lion wearing sunglasses"
      });
    }

    // React to command
    await sock.sendMessage(from, { react: { text: "🎨", key: msg.key } });

    // Notify user
    await sock.sendMessage(from, { text: "🎨 *Drawing your image, please wait...*" });

    // Generate Image
    const imagePath = await stabilityTextToImage(text);
    if (imagePath) {
      await sock.sendMessage(from, {
        image: fs.readFileSync(imagePath),
        caption: `🖼️ *AI Image Generated Successfully*\n📌 Prompt: ${text}`
      });
    } else {
      await sock.sendMessage(from, { text: "⚠️ *Failed to generate image.*" });
    }
  }
};
