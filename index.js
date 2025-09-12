      keys: makeCacheableSignalKeyStore(state.keys, P({ level: "silent" })),
    },
    logger: P({ level: "silent" }),
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      if ((lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) startBot();
    } else if (connection === "open") {
      console.log("✅ Bot connected!");
      try {
        const f = getFeatures();
        f.faketyping = true;
        f.fakerecording = true;
        saveFeatures(f);
      } catch (e) { console.error(e); }
      await doFakeTyping(sock, OWNER_JID, 1200);
      await doFakeRecording(sock, OWNER_JID, 900);
      await sock.sendMessage(OWNER_JID, { text: "🤖 BOSS GIRL TECH ❤️ Bot online! faketyping & fakerecording ON ✅" });
    }
  });

  // ---------------- AUTO VIEW STATUS + RANDOM EMOJI ----------------
  const randomEmojis = ["❤️","👍","😂","🔥","😎","🤩","💯","✨","🥰","😜"];
  async function autoViewStatus() {
    const features = getFeatures();
    if (!features.autoViewStatus) return;

    try {
      const contacts = Object.keys(sock.store.contacts);
      for (const jid of contacts) {
        if (jid === sock.user.id.split(":")[0] + "@s.whatsapp.net") continue;
        const updates = await sock.status(jid);
        if (!updates || !updates.statuses) continue;

        for (const u of updates.statuses) {
          await sock.sendReadReceipt(jid, u.key.participant, [u.key.id]);
          const emoji = randomEmojis[Math.floor(Math.random()*randomEmojis.length)];
          await sock.sendMessage(jid, { react: { text: emoji, key: u.key } });
        }
      }
    } catch (e) { console.error("AutoViewStatus error:", e); }
  }
  setInterval(autoViewStatus, 25000); // run every 25s

  // ---------------- MESSAGE HANDLER ----------------
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const sender = msg.key.participant || from;

    let body = msg.message.conversation ||
               msg.message.extendedTextMessage?.text ||
               msg.message.imageMessage?.caption ||
               msg.message.videoMessage?.caption || "";
    body = body.trim();
    if (!body) return;

    if (BOT_MODE === "private" && sender !== OWNER_JID) return;

    const features = getFeatures();

    if (features.faketyping) await doFakeTyping(sock, from, 1000);
    if (features.fakerecording) await doFakeRecording(sock, from, 1500);

    // ---------------- ANTI-LINK ----------------
    if (isGroup && features.antiLink) {
      const linkRegex = /https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/;
      if (linkRegex.test(body) && sender !== OWNER_JID) {
        const action = features.antiLinkAction || "warn";
        const groupMetadata = await sock.groupMetadata(from);
        const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
        const botIsAdmin = groupMetadata.participants.some(
          p => p.id === botNumber && (p.admin === "admin" || p.admin === "superadmin")
        );

        if (!botIsAdmin) {
          await sock.sendMessage(from, { text: "⚠️ I am not admin, I can't remove links!\n\n🤖 BOSS GIRL TECH ❤️" });
          return;
        }

        try { await sock.deleteMessage(from, { id: msg.key.id, remoteJid: from, fromMe: false }); } catch {}

        if (action === "warn") {
          if (!global.warnMap.has(from)) global.warnMap.set(from, new Map());
          const groupWarns = global.warnMap.get(from);
          const prevWarn = groupWarns.get(sender) || 0;
          const newWarn = prevWarn + 1;
          groupWarns.set(sender, newWarn);

          if (newWarn >= WARN_LIMIT) {
            await sock.sendMessage(from, {
              text: `🚨 @${sender.split("@")[0]} reached warn limit!\nRemoved from group.`,
              mentions: [sender],
            });
            await sock.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
            groupWarns.delete(sender);
          } else {
            await sock.sendMessage(from, {
              text: `⚠️ @${sender.split("@")[0]} warned ${newWarn}/${WARN_LIMIT}\nLink deleted!`,
              mentions: [sender],
            });
          }
        } else if (action === "remove") {
          await sock.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
        }
      }
    }

    // ---------------- AUTO VIEW-ONCE ----------------
    if (features.autoViewOnce) {
      try {
        if (msg.message?.viewOnceMessage?.message) {
          const type = Object.keys(msg.message.viewOnceMessage.message)[0];
          const media = msg.message.viewOnceMessage.message[type];
          const buffer = [];
          const stream = await downloadContentFromMessage(media, type.replace("Message", "").toLowerCase());
          for await (const chunk of stream) buffer.push(chunk);
          const mediaBuffer = Buffer.concat(buffer);
          const prepared = await prepareWAMessageMedia({ [type.replace("Message","").toLowerCase()]: mediaBuffer }, { upload: sock.waUploadToServer });
          const content = generateForwardMessageContent(prepared, false);
          await sock.relayMessage(from, content, { messageId: msg.key.id });
        }
      } catch (err) { console.error("VV2 open failed:", err); }
    }

    // ---------------- OWNER COMMANDS ----------------
    if (body.startsWith(PREFIX)) {
      const args = body.slice(PREFIX.length).trim().split(/\s+/);
      const cmdName = args.shift().toLowerCase();

      if (cmdName === "mode" && sender === OWNER_JID) {
        const mode = args[0]?.toLowerCase();
        if (!["public","private"].includes(mode)) {
          await sock.sendMessage(from, { text: "❌ Invalid mode. Use: !mode public|private" }, { quoted: msg });
        } else {
          BOT_MODE = mode;
          await sock.sendMessage(from, { text: `✅ Bot mode set to: ${mode.toUpperCase()}` }, { quoted: msg });
        }
        return;
      }

      if (cmdName === "set" && args.length === 2 && sender === OWNER_JID) {
        const featureName = args[0];
        const value = args[1].toLowerCase() === "on";
        if (features.hasOwnProperty(featureName)) {
          setFeature(featureName, value);
          await sock.sendMessage(from, { text: `✅ ${featureName} ${value ? "enabled" : "disabled"}` });
        } else {
          await sock.sendMessage(from, { text: `❌ Unknown feature: ${featureName}` });
        }
        return;
      }

      if (commands.has(cmdName)) {
        try { await commands.get(cmdName).execute(sock, msg, args); }
        catch (err) { await sock.sendMessage(from, { text: `❌ Error executing ${cmdName}` }); }
      }
    }
  });

  // ---------------- ANTI-DELETE ----------------
  sock.ev.on("messages.update", async (updates) => {
    const features = getFeatures();
    if (!features.antidelete) return;
    for (const update of updates) {
      if (update.update === "message-revoke") {
        const remoteJid = update.key.remoteJid;
        const participant = update.key.participant || update.participant;
        const sender = participant ? `@${participant.split("@")[0]}` : "Someone";

        let content = "";
        if (update.message?.conversation) content = update.message.conversation;
        else if (update.message?.imageMessage) content = "[🖼️ Image]";
        else if (update.message?.videoMessage) content = "[🎬 Video]";
        else if (update.message?.audioMessage) content = "[🎵 Audio]";
        else content = "[📎 Unknown message type]";

        await sock.sendMessage(remoteJid, {
          text: `♻️ Anti-Delete: ${sender} deleted a message!\nContent: ${content}`,
          mentions: participant ? [participant] : [],
        });
      }
    }
  });
}

startBot().catch(err => console.error("❌ Bot start failed:", err));
