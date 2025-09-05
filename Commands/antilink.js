// Dev: Irene & Tommy
const linkPattern = /(https?:\/\/|www\.)[^\s]+/i;
const offenseMap = {}; // track user offenses per group

module.exports = {
  name: "antilink",
  description: "⚔️ Self-contained anti-link: delete, warn, remove",
  async execute(sock, msg, args, settings) {
    const STATUS_REACT = ["🔗","🛡️","⚡","🔥","✅","💯"];
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    // Only owner can enable
    if (!sender.includes("255624236654")) {
      return await sock.sendMessage(from, { text: "❌ You are not allowed to use this command!" });
    }

    // React to command
    await sock.sendMessage(from, {
      react: { text: STATUS_REACT[Math.floor(Math.random() * STATUS_REACT.length)], key: msg.key },
    });

    const option = args[0]?.toLowerCase();

    if (option === "off") {
      settings.antilink = false;
      return await sock.sendMessage(from, { text: "⚡ Antilink mode disabled ❌" });
    }

    // Enable all auto features
    settings.antilink = true;
    settings.antilink_delete = true;
    settings.antilink_warn = true;
    settings.antilink_remove = true;

    // Success message
    await sock.sendMessage(from, { text: "✅ Successfully enabled antilink mode! (delete, warn, remove enabled)" });

    // -------- Auto handler inside command --------
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (!settings.antilink || type !== "notify") return;

      for (let m of messages) {
        try {
          if (!m.message) continue;
          const f = m.key.remoteJid;
          const s = m.key.participant || f;

          // Only groups
          if (!f.endsWith("@g.us")) continue;

          const text =
            m.message.conversation ||
            m.message.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            "";

          if (linkPattern.test(text)) {
            // Initialize offense count
            if (!offenseMap[f]) offenseMap[f] = {};
            if (!offenseMap[f][s]) offenseMap[f][s] = 0;

            // 1️⃣ Delete
            if (settings.antilink_delete) {
              await sock.sendMessage(f, { delete: { remoteJid: f, id: m.key.id, participant: s } });
            }

            // 2️⃣ Warn
            if (settings.antilink_warn) {
              offenseMap[f][s] += 1;
              await sock.sendMessage(f, { text: `⚠️ @${s.split("@")[0]}, Hakikisha huleti link hapa! (Warn ${offenseMap[f][s]})`, mentions: [s] });
            }

            // 3️⃣ Remove if 2+ offenses
            if (settings.antilink_remove && offenseMap[f][s] >= 2) {
              await sock.groupParticipantsUpdate(f, [s], "remove");
              await sock.sendMessage(f, { text: `🚨 @${s.split("@")[0]} ameondolewa group kwa kutuma link.`, mentions: [s] });
              offenseMap[f][s] = 0; // reset after removal
            }
          }
        } catch (e) {
          console.error("⚠️ Auto antilink error:", e);
        }
      }
    });
  }
};
