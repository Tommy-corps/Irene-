// Dev: Irene & Tommy
module.exports = {
  name: "echo",
  description: "Repeat your text 🔁",
  async execute(sock, msg, args) {
    const STATUS_REACT = ["👍","🔥","❤️","😂","😍","😎","✨","👏","💯"];
    await sock.sendMessage(msg.key.remoteJid, { react: { text: STATUS_REACT[Math.floor(Math.random()*STATUS_REACT.length)], key: msg.key } });

    if (!args.length) return sock.sendMessage(msg.key.remoteJid, { text: "✍️ Andika text baada ya #echo" });
    const text = args.join(" ");
    await sock.sendMessage(msg.key.remoteJid, { text });
  }
};
