// Dev: Irene & Tommy
const BOT_NAME = "Irene Bot";
module.exports = {
  name: "antipornsticker",
  description: "🚫 Detect and delete porn stickers",
  async execute(sock, msg, args, settings) {
    const from = msg.key.remoteJid;

    if (!msg.key.participant?.includes("255624236654")) {
      return await sock.sendMessage(from, { text: `❌ ${BOT_NAME}: You cannot use this command!` });
    }

    const option = args[0]?.toLowerCase();
    if(option === "off") {
      settings.antiporn = false;
      return await sock.sendMessage(from, { text: `⚡ ${BOT_NAME}: Anti-porn sticker disabled ❌` });
    }

    settings.antiporn = true;
    await sock.sendMessage(from, { text: `✅ ${BOT_NAME}: Anti-porn sticker enabled!` });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if(!settings.antiporn || type !== "notify") return;

      for(let m of messages) {
        if(m.message?.stickerMessage) {
          try {
            // Simple porn detection (large size as placeholder)
            if(m.message.stickerMessage.fileLength > 500000) {
              await sock.sendMessage(from, { react: { text: "🚫", key: m.key } });
              await sock.sendMessage(from, { delete: m.key });
              console.log("🚫 Porn sticker deleted!");
            }
          } catch(e) { console.error("⚠️ Error deleting sticker:", e); }
        }
      }
    });
  }
};
