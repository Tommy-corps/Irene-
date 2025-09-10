async function stabilityImageToImage(imageBuffer, prompt) {
  try {
    const apiKey = "sk-GPrKV4TIpQ8DHxH5LNbwi5xEIxyVsu47r2SoZrcLjjZbmGuK";
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

// Command
if (cmd === "imagine") {
  if (!msg.message.imageMessage) return sock.sendMessage(from, { text: "🖼️ Tuma picha pamoja na prompt.\nMfano: !imagine make it anime style" });

  const buffer = await downloadMediaMessage(msg, "buffer");
  await sock.sendMessage(from, { text: "🎨 *Inabadilisha picha yako...*" });

  const imagePath = await stabilityImageToImage(buffer, text || "A beautiful digital art");
  if (imagePath) {
    await sock.sendMessage(from, { image: fs.readFileSync(imagePath), caption: `✨ *Image Modified*\n${text}` });
  } else {
    await sock.sendMessage(from, { text: "⚠️ Imeshindwa kubadilisha picha." });
  }
}
