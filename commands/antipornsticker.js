// Stylish Rosemary antiPornSticker command
const fancy = (text) => {
  const chars = {
    A:'𝓐',B:'𝓑',C:'𝓒',D:'𝓓',E:'𝓔',F:'𝓕',G:'𝓖',H:'𝓗',I:'𝓘',
    J:'𝓙',K:'𝓚',L:'𝓛',M:'𝓜',N:'𝓝',O:'𝓞',P:'𝓟',Q:'𝓠',R:'𝓡',
    S:'𝓢',T:'𝓣',U:'𝓤',V:'𝓥',W:'𝓦',X:'𝓧',Y:'𝓨',Z:'𝓩',
    a:'𝓪',b:'𝓫',c:'𝓬',d:'𝓭',e:'𝓮',f:'𝓯',g:'𝓰',h:'𝓱',i:'𝓲',
    j:'𝓳',k:'𝓴',l:'𝓵',m:'𝓶',n:'𝓷',o:'𝓸',p:'𝓹',q:'𝓺',r:'𝓻',
    s:'𝓼',t:'𝓽',u:'𝓾',v:'𝓿',w:'𝔀',x:'𝔁',y:'𝔂',z:'𝔃',
    '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
    '!':'!','?':'?','.':'.',',':',',' ':' '
  };
  return text.split('').map(c => chars[c] || c).join('');
};

module.exports = {
  name: "antiPornSticker",
  description: "Delete porn/NSFW text or stickers 🚫",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    const textBody = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const isNSFWText = /porn|xxx|sex/i.test(textBody);

    const isSticker = msg.message?.stickerMessage;

    if (isNSFWText || isSticker) {
      // Delete the message
      await sock.deleteMessage(from, { id: msg.key.id, remoteJid: from, fromMe: false }).catch(()=>{});

      // Send warning
      if (from.endsWith("@g.us")) {
        await sock.sendMessage(from, { 
          text: fancy(`🚫 @${sender.split("@")[0]} 𝓢𝓣𝓞𝓟 𝓢𝓔𝓝𝓓𝓘𝓝𝓖 𝓝𝓢𝓕𝓦 𝓜𝓐𝓣𝓔𝓡𝓘𝓐𝓛! 🤖 𝓑𝓞𝓢𝓢 𝓖𝓘𝓡𝓛 𝓣𝓔𝓒𝓗 ❤️`), 
          mentions: [sender] 
        });
      }
    }
  }
};
