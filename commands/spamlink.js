// 📂 commands/spamlink.js
const stylish = (text) => {
    const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const rosemary = "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩0123456789";
    return text.split("").map(c => {
        const index = normal.indexOf(c);
        return index !== -1 ? rosemary[index] : c;
    }).join("");
};

module.exports = {
    name: "spamlink",
    description: "Send a stylish message or link 50 times in 3 seconds 🌸",
    async execute(sock, msg, args, from, isOwner) {
        try {
            if (!isOwner) {
                return sock.sendMessage(from, { 
                    text: stylish("⛔ This command is for bot owner only!") 
                }, { quoted: msg });
            }

            const q = args.join(" ");
            if (!q) {
                return sock.sendMessage(from, { 
                    text: stylish("⚠️ Please provide a message or link to spam.\nExample:\n!spamlink Hello Everyone 😁") 
                }, { quoted: msg });
            }

            const count = 50; 
            const delay = 60; 

            await sock.sendMessage(from, { 
                text: stylish(`🚀 Starting spam...\n📤 Sending ${count} messages in ~3 seconds!\n🔗 Content: ${q}`) 
            }, { quoted: msg });

            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    sock.sendMessage(from, { text: stylish(q) });
                }, i * delay);
            }
        } catch (err) {
            console.error("❌ Error in spamlink command:", err);
            sock.sendMessage(from, { text: stylish("⚠️ Error while executing spamlink command.") }, { quoted: msg });
        }
    }
};
