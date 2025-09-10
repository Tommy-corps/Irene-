// commands/set.js
const fs = require("fs");
const path = require("path");

const featureFile = path.join(__dirname, "../features.json");

// Helper functions
function getFeatures() {
  if (!fs.existsSync(featureFile)) return {};
  return JSON.parse(fs.readFileSync(featureFile));
}

function setFeature(name, value) {
  const f = getFeatures();
  f[name] = value;
  fs.writeFileSync(featureFile, JSON.stringify(f, null, 2));
}

module.exports = {
  name: "set",
  description: "Enable/Disable bot features (Owner only) ⚙️",
  async execute(sock, msg, args) {
    const OWNER_JID = "255624236654@s.whatsapp.net"; // Badilisha na namba yako
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    if (sender !== OWNER_JID) {
      return await sock.sendMessage(from, { text: "❌ Huna ruhusa kutumia hii command." });
    }

    if (args.length !== 2) {
      return await sock.sendMessage(from, { text: "⚠️ Format: !set <feature> <on/off>\nMfano: !set antidelete on" });
    }

    const [featureName, valueStr] = args;
    const value = valueStr.toLowerCase() === "on";

    const features = getFeatures();
    if (!features.hasOwnProperty(featureName)) {
      return await sock.sendMessage(from, { text: `❌ Unknown feature: ${featureName}` });
    }

    setFeature(featureName, value);
    await sock.sendMessage(from, { text: `✅ Feature *${featureName}* ime ${value ? "washwa (ON)" : "zimwa (OFF)"} 👍` });
  }
};
