import fs from 'node:fs';
const {families} = JSON.parse(fs.readFileSync('src/data/deep-sea-terrain.json','utf8'));
Object.assign(families, JSON.parse(fs.readFileSync('src/data/glacial-terrain.json','utf8')).families);
const layouts = {...JSON.parse(fs.readFileSync('src/data/deep-sea-markers.json','utf8')), ...JSON.parse(fs.readFileSync('src/data/glacial-markers.json','utf8'))};
const colors = {oxygen:'#90e9ff',rescue:'#8df1c7',teleport:'#63e5bb',supply:'#f2ca65',weapon:'#ff8790',ammo:'#ff8790',amethyst:'#d4a2ed',catseye:'#bce9da',diamond:'#c1daff',topaz:'#f4c374',aquamarine:'#75e2e8',uraninite:'#95d775',ruby:'#f275a5',fish:'#f2ca65'};
const labels = {oxygen:'氧气',rescue:'救生舱',teleport:'传送镜',supply:'补给箱',weapon:'武器箱',ammo:'弹药',amethyst:'紫水晶',catseye:'猫眼石',diamond:'钻石',topaz:'黄玉',aquamarine:'海蓝宝石',uraninite:'铜铀云母',ruby:'红宝石',fish:'鱼类'};
function icon(kind) {
  switch(kind) {
    case 'oxygen':return '<circle r=".48"/><circle r=".21" fill="white"/>';
    case 'rescue':return '<rect x="-.45" y="-.5" width=".9" height="1" rx=".16"/><path d="M-.16-.35V.35" stroke="white" stroke-width=".14"/>';
    case 'teleport':return '<circle r=".57"/><circle r=".26" fill="white"/><path d="M-.48 .48L.48-.48" fill="none" stroke="white" stroke-width=".1"/>';
    case 'supply':return '<rect x="-.5" y="-.36" width="1" height=".72" rx=".05"/><path d="M-.5-.1H.5M0-.35V.36" stroke="#92722b" stroke-width=".09"/>';
    case 'weapon':return '<rect x="-.5" y="-.36" width="1" height=".72" rx=".05"/><path d="M-.27 0H.27" stroke="white" stroke-width=".22"/>';
    case 'ammo':return '<path d="M0-.55L.55.4H-.55Z"/>';
    case 'catseye':return '<ellipse rx=".43" ry=".52"/><ellipse rx=".13" ry=".35" fill="#087f8c"/>';
    case 'amethyst':case 'diamond':case 'topaz':case 'aquamarine':case 'uraninite':case 'ruby':return '<path d="M0-.6L.45-.18L.32.45L0 .6L-.32.45L-.45-.18Z"/><path d="M0-.48V.48M-.4-.18H.4" stroke="white" stroke-width=".09"/>';
    default:return '<path d="M-2 0Q0-1.3 2.2 0Q0 1.3-2 0L-2.8-.9V.9Z"/><path d="M-.3-.55L.2-1.15L.6-.55"/><circle cx="1.5" cy="-.1" r=".12" fill="#10283e"/>';
  }
}
fs.mkdirSync('maps', {recursive:true});
let exported = 0;
for (const [key, points] of Object.entries(layouts)) {
  if (process.argv[2] && key[0] !== process.argv[2]) continue;
  if (key[0] === 'C') {
    exportGlacial(key, points);
    exported++;
    continue;
  }
  const cells = families[key[0]].flatMap((line,y)=>[...line].map((cell,x)=>cell==='#'?'':`<rect x="${x}" y="${y}" width="1" height="1" fill="${cell==='p'?'#705a8b':'#227c96'}"/>`)).join('');
  const markers = points.map(p=>`<g transform="translate(${p.x} ${p.y})" fill="${colors[p.kind]}" stroke="#10283e" stroke-width=".12"><title>${p.label || labels[p.kind]}</title>${icon(p.kind)}${p.label ? `<text y="1.65" text-anchor="middle" fill="white" stroke="#10283e" stroke-width=".13" paint-order="stroke" font-size="1.15">${p.label}</text>`:''}</g>`).join('');
  const entries = key[0]==='A' ? [[62,28,'海底湖 →'],[45,34,'洞窟'],[62,64,'鲛人村 →']] : [[62,34,'海底湖 →'],[27,31,'洞窟'],[62,65,'鲛人村 →'],[61,22,'公主']];
  const legend = ['oxygen','rescue','supply','weapon','ammo','amethyst','catseye','diamond','fish'].map((kind,i)=>`<g transform="translate(${(i%5)*12.8+2} ${72+Math.floor(i/5)*2.5})" fill="${colors[kind]}">${icon(kind)}<text x="1" y=".35" font-size=".95" fill="#102e43">${labels[kind]}</text></g>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="1260" viewBox="-1 -5 66 86" role="img" aria-labelledby="title" font-family="Microsoft YaHei, sans-serif"><title id="title">蓝洞深海 ${key[0]} 类 · 分布 ${key.slice(1)}</title><desc>水域为蓝绿色，岩石为深蓝色。根据 CleverLab / 甜菜参考图重绘，标记为示意位置。</desc><rect x="-1" y="-5" width="66" height="86" fill="#f5f8f9"/><text x="0" y="-2.4" font-size="2" font-weight="bold" fill="#102e43">蓝洞深海 · ${key[0]} · ${key.slice(1)}</text><text x="64" y="-2.4" text-anchor="end" font-size="1" fill="#617987">130–250 米 / 示意地图</text><rect width="64" height="69" fill="#10283e"/><g shape-rendering="crispEdges">${cells}</g><defs><pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" fill="none" stroke="#fff" opacity=".08" stroke-width=".04"/></pattern></defs><rect width="64" height="69" fill="url(#grid)"/>${markers}${entries.map(([x,y,name])=>`<text x="${x}" y="${y}" text-anchor="end" fill="#bce9da" stroke="#10283e" stroke-width=".25" paint-order="stroke" font-size="1.1">${name}</text>`).join('')}${legend}<text x="1" y="78" fill="#617987" font-size=".85">深蓝：岩石　蓝绿：水域　紫色：原图紫色岩层</text><text x="1" y="80" fill="#617987" font-size=".75">原图：CleverLab / 甜菜 · SVG 重绘 · 同类地图共用地形</text></svg>`;
  fs.writeFileSync(`maps/deep-sea-${key}.svg`, svg);
  exported++;
}
console.log(`Exported ${exported} standalone SVG maps to maps/.`);

function exportGlacial(key, points) {
  const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  const rows = families.C.length;
  const cells = families.C.flatMap((line,y)=>[...line].map((cell,x)=>cell==='#'?'':`<rect x="${x}" y="${y}" width="1" height="1" fill="#227c96"/>`)).join('');
  const markers = points.map(p=>`<g data-kind="${p.kind}" transform="translate(${p.x} ${p.y})" fill="${colors[p.kind]}" stroke="#10283e" stroke-width=".14"><title>${escape(p.label || labels[p.kind])}</title><g transform="scale(${p.scale ?? 1})">${icon(p.kind)}</g>${p.label ? `<text y="${p.scale ? 1 : 1.65}" text-anchor="middle" fill="white" stroke="#10283e" stroke-width=".2" paint-order="stroke" font-size="${p.scale ? .75 : 1.1}">${escape(p.label)}</text>`:''}</g>`).join('');
  const entries = [[59.5,13,'第一冰河洞穴','middle'],[61,25,'冰河海藻洞穴','end'],[61,47.5,'第三冰河洞穴','end'],[18.5,25,'海流洞穴','middle'],[3,21.7,'冰空间','middle']];
  const kinds = ['oxygen','teleport','supply','weapon','ammo','topaz','aquamarine','uraninite','ruby','fish'];
  const legend = kinds.map((kind,i)=>`<g transform="translate(${(i%5)*12.8+2} ${rows+4+Math.floor(i/5)*2.7})" fill="${colors[kind]}"><g transform="scale(${kind==='fish'?.35:1})">${icon(kind)}</g><text x="1" y=".35" font-size=".95" fill="#102e43">${labels[kind]}</text></g>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="1193" viewBox="-1 -5 66 82" role="img" aria-labelledby="title" font-family="Microsoft YaHei, sans-serif"><title id="title">冰河＋热泉喷口 · 分布 ${key.slice(1)}</title><desc>三张地图共用地形。浅蓝为冰河岩壁，浅橙为热泉岩壁，蓝绿为水域。原图未注明名称的鱼类保留点位并标为未标名。标记为示意位置。</desc><defs><linearGradient id="rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e8f4f7"/><stop offset="63%" stop-color="#e8f4f7"/><stop offset="88%" stop-color="#f5ccb4"/><stop offset="100%" stop-color="#eab39c"/></linearGradient><pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" fill="none" stroke="white" opacity=".09" stroke-width=".035"/></pattern></defs><rect x="-1" y="-5" width="66" height="82" fill="#f5f8f9"/><text x="0" y="-2.4" font-size="1.7" font-weight="bold" fill="#102e43">冰河＋热泉喷口 · ${key.slice(1)} / 450–570 米</text><rect x="-1" y="-1" width="66" height="64" fill="url(#rock)"/><g data-layer="terrain" data-family="C" shape-rendering="crispEdges">${cells}</g><rect width="64" height="62" fill="url(#grid)"/><g data-layer="markers">${markers}</g><g fill="#bce9da" stroke="#10283e" stroke-width=".26" paint-order="stroke" font-size="1.1" font-weight="600">${entries.map(([x,y,label,anchor])=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${label}</text>`).join('')}</g>${legend}<text x="1" y="72" fill="#617987" font-size=".85">浅蓝：冰河岩壁　浅橙：热泉岩壁　蓝绿：水域</text><text x="1" y="74" fill="#617987" font-size=".8">原图：CleverLab / 甜菜 · SVG 重绘 · 同类地图共用地形</text></svg>`;
  fs.writeFileSync(`maps/glacial-${key}.svg`, svg);
}
