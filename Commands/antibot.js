// Dev: Irene & Tommy
const BOT_NAME = "Irene Bot";
module.exports = {
  name: "antibot",
  description: "🤖 Detect bot accounts and remove",
  async execute(sock, msg, args, settings) {
    const from = msg.key.remoteJid;

    if (!msg.key.participant?.includes("255624236654")) {
      return await sock.sendMessage(from, { text: `❌ ${BOT_NAME}: You cannot use this command!` });
    }

    const option = args[0]?.toLowerCase();
    if(option === "off") {
      settings.antibot = false;
      return await sock.sendMessage(from, { text: `⚡ ${BOT_NAME}: Anti-bot mode disabled ❌` });
    }

    settings.antibot = true;
    await sock.sendMessage(from, { text: `✅ ${BOT_NAME}: Anti-bot mode enabled!` });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if(!settings.antibot || type !== "notify") return;

      for(let m of messages) {
        const sender = m.key.participant || m.key.remoteJid;
        if(sender?.includes("bot")) { // simple bot detection
          try {
            await sock.sendMessage(from, { react: { text: "🤖", key: m.key } });
            await sock.groupParticipantsUpdate(from, [sender], "remove");
            console.log("🤖 Bot removed from group!");
          } catch(e) { console.error("⚠️ Error removing bot:", e); }
        }
      }
    });
  }
};
