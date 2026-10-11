import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const imported = JSON.parse(await fs.readFile(path.join(root, 'scripts/.source-cache/parsed.json'), 'utf8'));
const hash = text => createHash('sha256').update(text).digest('hex').slice(0, 12);
const slug = text => text.toLowerCase().normalize('NFKD').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const norm = text => slug(text).replace(/-staff$|-bonnet$|-carnage$/g, '').replace(/-/g, '');
const number = text => { const m = text?.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/); return m ? Number(m[0]) : null; };
const fact = (e, ...labels) => labels.map(label => e.facts.find(f => f.label === label)?.text).find(value => value !== undefined);
const stat = (e, ...labels) => number(fact(e, ...labels));
const quality = e => e.facts.length + (fact(e, '满级价格', '满级烹饪') ? 100 : 0);
const aliases = {};
const ingredientPages = imported.filter(e => e.id.startsWith('ingredient/'));
const excluded = [];
const raw = imported.filter(e => {
  if (!e.id.startsWith('fish/')) return true;
  if (fact(e, '类别') === 'Ore' || fact(e, '类别') === 'Loot' || /-gyao$|-catfood$/.test(e.id) || fact(e, '进化') || fact(e, '条目类型')) { excluded.push(e.id); return false; }
  return true;
}).map(e => {
  if (!e.id.startsWith('fish/')) return e;
  const matching = ingredientPages.find(i => i.title === e.title || norm(i.en) === norm(e.en));
  const cookingItem = /^fish\/(meat-|loot-|special-(?:blue|yellow)-fin-tuna)/.test(e.id) || !!fact(e, '采集来源') || /^(?:鸭肉|青蛙肉|蜥蜴肉|野鸡肉|鹌鹑肉|生肉|面粉|辣椒|芝麻|墨角藻|杜氏藻|湖草荸荠)$/.test(e.title);
  if (!matching && !cookingItem) return e;
  const newId = matching?.id ?? e.id.replace('fish/', 'ingredient/');
  aliases[e.id] = newId;
  return { ...e, id: newId };
});
const selected = [];
// The source indexes multiple imported pages for the same game entry.
for (const entity of [...raw].sort((a, b) => quality(b) - quality(a) || a.id.localeCompare(b.id))) {
  const [type, idSlug] = entity.id.split('/');
  const existing = selected.find(other => {
    if (!other.id.startsWith(`${type}/`)) return false;
    const sameName = other.title === entity.title || norm(other.en) === norm(entity.en) || (type === 'recipe' && other.title.replace(/寿司$/, '') === entity.title.replace(/寿司$/, ''));
    const sushiAlias = type === 'recipe' && other.id === `recipe/${idSlug}-sushi`;
    if (!sameName && !sushiAlias) return false;
    if (type !== 'recipe') return true;
    const a = stat(entity, '基础价格', '售价'), b = stat(other, '基础价格', '售价');
    return a !== null && b !== null && a === b;
  });
  if (existing) aliases[entity.id] = existing.id;
  else selected.push(entity);
}
const canonical = id => { const seen = new Set(); while (aliases[id] && !seen.has(id)) { seen.add(id); id = aliases[id]; } return id; };
for (const id of Object.keys(aliases)) aliases[id] = canonical(id);
const names = {};
const byId = new Map(selected.map(e => [e.id, e]));
for (const e of selected) names[e.id] = e.title;
const dictionary = (text, prefix = 'text') => {
  const id = `${prefix}/${hash(text)}`;
  names[id] = text;
  return id;
};
const englishIndex = new Map();
for (const e of selected) for (const key of [norm(e.en), norm(e.id.split('/')[1])]) { englishIndex.set(`${e.id.split('/')[0]}/${key}`, e); if (!englishIndex.has(key)) englishIndex.set(key, e); }
const findEnglish = (name, type) => englishIndex.get(type ? `${type}/${norm(name)}` : norm(name));
const ingredients = new Map();
function ingredient(name, ref) {
  const linked = ref && byId.get(canonical(ref));
  const meatName = slug(name).replace(/^meat-/, '').replace(/-meat$/, '');
  const meatItem = /\bmeat\b/i.test(name) ? selected.find(e => e.id.startsWith('ingredient/') && /\bmeat\b/i.test(e.en) && norm(e.en.replace(/^meat\s+|\s+meat$/gi, '')) === norm(meatName)) : undefined;
  const known = (linked?.id.startsWith('ingredient/') ? linked : undefined) ?? findEnglish(name, 'ingredient') ?? meatItem ?? linked ?? findEnglish(name, 'fish');
  const separateProduct = known?.id.startsWith('fish/') && norm(name) !== norm(known.en);
  const ingredientId = known?.id.startsWith('ingredient/') ? known.id : `ingredient/${separateProduct ? slug(name) : known?.id.split('/')[1] ?? slug(name)}`;
  if (!ingredients.has(ingredientId)) {
    const fish = known?.id.startsWith('fish/') ? known : findEnglish(meatName, 'fish') ?? byId.get(`fish/${slug(name).replace(/-meat$|-fillet$/g, '')}`);
    const source = known?.id.startsWith('ingredient/') ? known : undefined;
    const fishIds = source?.relations.filter(id => id.startsWith('fish/')).map(canonical) ?? [];
    if (fish && !fishIds.includes(fish.id)) fishIds.push(fish.id);
    const nameId = source?.id ?? (separateProduct ? ingredientId : fish?.id) ?? ingredientId;
    if (!names[nameId]) names[nameId] = name;
    // Named meat is a separate item; fish used directly as food shares its name.
    if (fish && /\bmeat\b/i.test(name) && (!known || separateProduct)) {
      names[ingredientId] = `${names[fish.id]}肉`;
    }
    const tunaPart = name.match(/^(Bluefin Tuna|Yellowfin Tuna) (Akami|Chutoro|Ootoro)$/i);
    if (tunaPart) {
      const sourcePart = findEnglish(`Special ${name}`, 'ingredient');
      if (sourcePart) names[ingredientId] = names[sourcePart.id].replace(/^特制/, '');
      const sourceFish = findEnglish(tunaPart[1], 'fish');
      if (sourceFish && !fishIds.includes(sourceFish.id)) fishIds.push(sourceFish.id);
    }
    ingredients.set(ingredientId, { id: ingredientId, type: 'ingredient', nameId: !known && fish ? ingredientId : nameId,
      en: source?.en ?? name, sourceUrls: source ? [source.sourceUrl] : [],
      inferred: !source, fishIds, relatedIds: [], facts: [], stats: {}, facets: {} });
  }
  return ingredientId;
}
// Keep ingredients indexed by the site even if no recipe references them.
for (const e of selected.filter(e => e.id.startsWith('ingredient/'))) ingredient(e.en, e.id);
const strip = s => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const recipeIngredients = e => {
  const f = e.facts.find(f => f.label === '食材');
  if (!f) return [];
  const links = [...f.html.matchAll(/href="\/zh-hans\/(ingredient|fish)\/([^/]+)\/"[^>]*>(.*?)<\/a>/g)]
    .map(m => ({ ref: `${m[1]}/${m[2]}`, name: strip(m[3]) }));
  return f.text.split(/[,，;；]|\s+\+\s+/).filter(part => !/^(?:n\/a|none|#\d+)$/i.test(part.trim())).map(part => {
    let name = part.trim(), quantity = null;
    const before = name.match(/^(\d+)\s+(.+)$/);
    const after = name.match(/^(.+?)\s*[x×]\s*(\d+)$/i);
    if (before) { quantity = Number(before[1]); name = before[2]; }
    else if (after) { name = after[1]; quantity = Number(after[2]); }
    const ref = links.find(link => norm(link.name) === norm(name) || norm(`${link.name} Meat`) === norm(name) || /(?:Akami|Chutoro|Ootoro)$/i.test(name) && norm(name).startsWith(norm(link.name)))?.ref;
    return { ingredientId: ingredient(name, ref), quantity };
  }).filter(x => x.ingredientId !== 'ingredient/');
};
const recipes = selected.filter(e => e.id.startsWith('recipe/')).map(e => ({
  id: e.id, type: 'recipe', nameId: e.id, en: e.en, sourceUrls: [e.sourceUrl], inferred: false,
  relatedIds: e.relations.map(canonical), ingredients: recipeIngredients(e),
  stats: { basePrice: stat(e, '基础价格', '基础售价', '售价'), maxPrice: stat(e, '满级价格', '最高售价'), baseTaste: stat(e, '基础口感', '口感'),
    maxTaste: stat(e, '满级口感', '最高口感'), baseServings: stat(e, '基础菜品', '每盘份数', '每份盘数'), maxServings: stat(e, '满级菜品') },
  facets: {}, facts: [],
}));
const fish = selected.filter(e => e.id.startsWith('fish/')).map(e => ({
  id: e.id, type: 'fish', nameId: e.id, en: e.en, sourceUrls: [e.sourceUrl], inferred: false,
  relatedIds: e.relations.map(canonical), facts: [],
  stats: { rank: stat(e, '等级'), weight: stat(e, '重量'), meat1: stat(e, '鱼肉1'), meat2: stat(e, '鱼肉2'), meat3: stat(e, '鱼肉3'), sellPrice: stat(e, '售价') },
  facets: { region: fact(e, '出没区域', '位置') ? dictionary(fact(e, '出没区域', '位置'), 'region') : null,
    time: fact(e, '活动时间') ? dictionary(fact(e, '活动时间'), 'time') : null },
}));
const staff = selected.filter(e => e.id.startsWith('staff/')).map(e => ({
  id: e.id, type: 'staff', nameId: e.id, en: e.en, sourceUrls: [e.sourceUrl], inferred: false,
  relatedIds: e.relations.map(canonical), facts: [],
  stats: { hiringCost: stat(e, '雇佣费'), wage: stat(e, '工资'), baseCooking: stat(e, '基础烹饪'), baseServing: stat(e, '基础服务'),
    baseProcurement: stat(e, '基础采购'), baseAppeal: stat(e, '基础吸引力'), maxCooking: stat(e, '满级烹饪', '烹饪'),
    maxServing: stat(e, '满级服务', '服务'), maxProcurement: stat(e, '满级采购', '采购'), maxAppeal: stat(e, '满级吸引力', '魅力'), managerRank: stat(e, '经理等级') },
  facets: { tier: fact(e, '评级') ? dictionary(fact(e, '评级'), 'tier') : null },
  skillIds: (fact(e, '特殊技能') ?? '').split(/[、,]/).filter(Boolean).map(name => dictionary(name, 'skill')),
}));
const all = [...recipes, ...fish, ...ingredients.values(), ...staff];
const entities = new Map(all.map(e => [e.id, e]));
const textToken = text => {
  const known = findEnglish(text);
  if (known) return { nameId: known.id, entityId: known.id };
  return /[\u3400-\u9fff]/.test(text) ? { nameId: dictionary(text) } : { text };
};
function values(html) {
  const result = [];
  let cursor = 0;
  for (const m of html.matchAll(/<a[^>]*href="\/zh-hans\/([^/]+)\/([^/]+)\/"[^>]*>(.*?)<\/a>/g)) {
    const before = strip(html.slice(cursor, m.index));
    if (before) result.push(textToken(before));
    const id = canonical(`${m[1]}/${m[2]}`);
    result.push(entities.has(id) ? { entityId: id, nameId: entities.get(id).nameId } : textToken(strip(m[3])));
    cursor = m.index + m[0].length;
  }
  const tail = strip(html.slice(cursor));
  if (tail) result.push(textToken(tail));
  return result;
}
for (const e of all) {
  const source = byId.get(e.id);
  if (source) {
    // Ingredients have a structured linked list below; do not duplicate English names in facts.
    const seenLabels = new Set();
    e.facts = source.facts.filter(f => {
      if ((e.type === 'recipe' && f.label === '食材') || seenLabels.has(f.label)) return false;
      seenLabels.add(f.label); return true;
    }).map(f => ({ labelId: dictionary(f.label, 'field'), values: f.label === '特殊技能' && e.skillIds?.length ? e.skillIds.map(nameId => ({ nameId })) : values(f.html) }));
    e.sourceUrls.push(...Object.entries(aliases).filter(([, id]) => id === e.id).map(([id]) => `https://davethediver.net/zh-hans/${id}/`));
    e.sourceUrls = [...new Set(e.sourceUrls)];
  }
  e.relatedIds = [...new Set(e.relatedIds.map(canonical).filter(id => id !== e.id && entities.has(id)))];
}
function relate(a, b) {
  if (a && b && a.id !== b.id) { if (!a.relatedIds.includes(b.id)) a.relatedIds.push(b.id); if (!b.relatedIds.includes(a.id)) b.relatedIds.push(a.id); }
}
for (const i of ingredients.values()) for (const fishId of i.fishIds) relate(i, entities.get(fishId));
for (const recipe of recipes) for (const item of recipe.ingredients) {
  const i = entities.get(item.ingredientId);
  relate(recipe, i);
  for (const fishId of i?.fishIds ?? []) relate(recipe, entities.get(fishId));
}
for (const entity of all) for (const relatedId of [...entity.relatedIds]) relate(entity, entities.get(relatedId));
const previousNames = process.argv.includes('--fresh-names') ? {} : JSON.parse(await fs.readFile(path.join(root, 'src/data/names.zh-CN.json'), 'utf8').catch(() => '{}'));
await fs.writeFile(path.join(root, 'src/data/names.zh-CN.json'), JSON.stringify(Object.fromEntries(Object.entries(names).sort(([a], [b]) => a.localeCompare(b)).map(([id, value]) => [id, previousNames[id] ?? value])), null, 2) + '\n');
for (const id of Object.keys(aliases)) if (aliases[id] === id) delete aliases[id];
await fs.writeFile(path.join(root, 'src/data/database.json'), JSON.stringify({
  metadata: { source: 'https://davethediver.net/zh-hans/database/', importedAt: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' }), rawPageCount: imported.length, aliasCount: Object.keys(aliases).length, excluded },
  aliases, recipes, fish, ingredients: [...ingredients.values()], staff,
}, null, 2) + '\n');
console.log(JSON.stringify({ recipes: recipes.length, fish: fish.length, ingredients: ingredients.size, staff: staff.length, aliases: Object.keys(aliases).length }));
