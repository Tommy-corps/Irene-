const axios = require("axios");
function fancy(text){ const chars={A:'𝓐',B:'𝓑',C:'𝓒',D:'𝓓',E:'𝓔',F:'𝓕',G:'𝓖',H:'𝓗',I:'𝓘',
J:'𝓙',K:'𝓚',L:'𝓛',M:'𝓜',N:'𝓝',O:'𝓞',P:'𝓟',Q:'𝓠',R:'𝓡',S:'𝓢',T:'𝓣',U:'𝓤',V:'𝓥',W:'𝓦',X:'𝓧',Y:'𝓨',Z:'𝓩',
a:'𝓪',b:'𝓫',c:'𝓬',d:'𝓭',e:'𝓮',f:'𝓯',g:'𝓰',h:'𝓱',i:'𝓲',j:'𝓳',k:'𝓴',l:'𝓵',m:'𝓶',n:'𝓷',o:'𝓸',p:'𝓹',q:'𝓺',r:'𝓻',s:'𝓼',t:'𝓽',u:'𝓾',v:'𝓿',w:'𝔀',x:'𝔁',y:'𝔂',z:'𝔃'};return text.split('').map(c=>chars[c]||c).join('');}
module.exports={name:"imagesearch",description:"Search images using SerpApi 🖼️",async execute(sock,msg,args){
  const jid=msg.key.remoteJid;
  if(!args[0]) return await sock.sendMessage(jid,{text:fancy("❌ Provide search keywords!")});
  await sock.sendMessage(jid,{react:{text:"🖼️",key:msg.key}});
  try{
    const query=args.join(" ");
    const url=`https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=6084018373e1103ad98c592849e59eb1f0abf4a5996841a2ba78a6c9c70c9058`;
    const res=await axios.get(url);
    const results=res.data.images_results?.slice(0,3)||[];
    if(!results.length) return await sock.sendMessage(jid,{text:fancy("❌ No images found!")});
    for(const img of results){
      await sock.sendMessage(jid,{image:{url:img.original},caption:fancy(`💖 BOSS GIRL TECH ❤️ - Image Result`)});
    }
  }catch(err){console.error(err);await sock.sendMessage(jid,{text:fancy("❌ Error fetching images!")});}
}};
