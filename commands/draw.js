const axios = require("axios");
const fs = require("fs");

async function stabilityTextToImage(prompt) {
  try {
    const apiKey = "sk-GPrKV4TIpQ8DHxH5LNbwi5xEIxyVsu47r2SoZrcLjjZbmGuK"; // Stability AI key
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

// Command
if (cmd === "draw") {
  if (!text) return sock.sendMessage(from, { text: "✍️ Andika maelezo ya picha unayotaka.\nMfano: !draw lion wearing sunglasses" });

  await sock.sendMessage(from, { text: "🎨 *Ninachora picha yako, subiri...*" });

  const imagePath = await stabilityTextToImage(text);
  if (imagePath) {
    await sock.sendMessage(from, { image: fs.readFileSync(imagePath), caption: `🖼️ *AI Image Generated*\n${text}` });
  } else {
    await sock.sendMessage(from, { text: "⚠️ Imeshindwa kutengeneza picha." });
  }
}
