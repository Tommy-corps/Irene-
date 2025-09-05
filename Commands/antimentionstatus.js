// Dev: Irene & Tommy
const BOT_NAME = "Irene Bot";
module.exports = {
  name: "antimentionstatus",
  description: "🚫 Delete status messages with mentions",
  async execute(sock, msg, args, settings) {
    const from = msg.key.remoteJid;

    // Only owner can toggle
    if (!msg.key.participant?.includes("255624236654")) {
      return await sock.sendMessage(from, { text: `❌ ${BOT_NAME}: You cannot use this command!` });
    }

    const option = args[0]?.toLowerCase();
    if(option === "off") {
      settings.antimention = false;
      return await sock.sendMessage(from, { text: `⚡ ${BOT_NAME}: Anti-mention status disabled ❌` });
    }

    settings.antimention = true;
    await sock.sendMessage(from, { text: `✅ ${BOT_NAME}: Anti-mention status enabled!` });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if(!settings.antimention || type !== "notify") return;

      for(let m of messages) {
        if(m.key.remoteJid.endsWith("@status") && m.message?.extendedTextMessage?.text?.includes("@")) {
          try {
            await sock.sendMessage(m.key.remoteJid, { react: { text: "🚫", key: m.key } });
            await sock.sendMessage(m.key.remoteJid, { delete: m.key });
            console.log("🚫 Status with mention deleted!");
          } catch(e) { console.error("⚠️ Error deleting status:", e); }
        }
      }
    });
  }
};
