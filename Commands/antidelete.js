// Dev: Irene & Tommy
const deletedMessages = {}; // store deleted messages per group
const BOT_NAME = "Irene Bot";

module.exports = {
  name: "antidelete",
  description: "🛡️ Anti-delete: restore deleted messages with Irene brand",
  async execute(sock, msg, args, settings) {
    const STATUS_REACT = ["🛡️","💬","🔄","✅"];
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    // Only owner can toggle
    if (!sender.includes("255624236654")) {
      return await sock.sendMessage(from, { text: `❌ ${BOT_NAME}: You are not allowed to use this command!` });
    }

    const option = args[0]?.toLowerCase();

    // React to command
    await sock.sendMessage(from, {
      react: { text: STATUS_REACT[Math.floor(Math.random() * STATUS_REACT.length)], key: msg.key },
    });

    if (option === "off") {
      settings.antidelete = false;
      return await sock.sendMessage(from, { text: `⚡ ${BOT_NAME}: Anti-delete mode disabled ❌` });
    }

    // Enable anti-delete
    settings.antidelete = true;
    await sock.sendMessage(from, { text: `✅ ${BOT_NAME}: Successfully enabled anti-delete mode!` });

    // -------- Store all messages for restore --------
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (let m of messages) {
        try {
          if (!m.message) continue;
          const f = m.key.remoteJid;
          const id = m.key.id;

          if (!deletedMessages[f]) deletedMessages[f] = {};
          deletedMessages[f][id] = m; // store original message
        } catch (e) {
          console.error("⚠️ Store message error:", e);
        }
      }
    });

    // -------- Listen for message deletions --------
    sock.ev.on("messages.update", async (updates) => {
      if (!settings.antidelete) return;

      for (let upd of updates) {
        try {
          if (!upd.message) continue;
          const f = upd.key.remoteJid;
          const id = upd.key.id;
          const senderUpd = upd.key.participant || f;

          // Only restore if we have original
          if (deletedMessages[f] && deletedMessages[f][id]) {
            const original = deletedMessages[f][id].message;
            await sock.sendMessage(f, {
              text: `⚠️ ${BOT_NAME}: @${senderUpd.split("@")[0]} alifuta message, nakurejeshea hapa:`,
              mentions: [senderUpd],
            });

            // Send back original message
            await sock.sendMessage(f, original);

            // Optionally react
            await sock.sendMessage(f, { react: { text: "🔄", key: upd.key } });

            // Remove from stored
            delete deletedMessages[f][id];
          }
        } catch (e) {
          console.error("⚠️ Anti-delete restore error:", e);
        }
      }
    });
  }
};
