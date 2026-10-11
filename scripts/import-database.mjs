// One-time/build-time importer. The app only reads the generated JSON.
import fs from 'node:fs/promises';
import path from 'node:path';

const origin = 'https://davethediver.net';
const root = path.resolve(import.meta.dirname, '..');
const cache = path.join(root, 'scripts/.source-cache');
const output = path.join(root, 'src/data');
await fs.mkdir(cache, { recursive: true });
await fs.mkdir(output, { recursive: true });
const decode = s => s.replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0] === 'x' ? parseInt(n.slice(1), 16) : Number(n)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const plain = s => decode(s.replace(/<[^>]*>/g, '').replace(/<!--.*?-->/g, '')).replace(/\s+/g, ' ').trim();
const slug = s => s.toLowerCase().normalize('NFKD').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const human = s => s.split('-').map(x => x[0]?.toUpperCase() + x.slice(1)).join(' ');
async function get(url, file) {
  try { return await fs.readFile(path.join(cache, file), 'utf8'); } catch {}
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${response.status}: ${url}`);
      const html = await response.text();
      await fs.writeFile(path.join(cache, file), html);
      return html;
    } catch (e) { if (attempt === 3) throw e; await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); }
  }
}
function parse(html, id) {
  const title = plain(html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1] ?? '');
  if (!title) throw new Error(`Missing title: ${id}`);
  const facts = [...html.matchAll(/<div class="entity-fact-row[^>]*><dt>(.*?)<\/dt><dd>(.*?)<\/dd>/gs)]
    .map(m => ({ label: plain(m[1]), text: plain(m[2]), html: m[2] }));
  const relations = [...html.matchAll(/<a class="entity-related-item" href="\/zh-hans\/(recipe|ingredient|fish|staff)\/([^/]+)\/">/g)]
    .map(m => `${m[1]}/${m[2]}`);
  const englishAlt = html.match(/class="entity-infobox-media[^>]*><img[^>]*alt="([^"<>]+)的图片"/s)?.[1];
  const en = englishAlt && !/[\u3400-\u9fff]/.test(englishAlt) ? decode(englishAlt) : human(id.split('/')[1]);
  return { id, title, en, facts, relations, sourceUrl: `${origin}/zh-hans/${id}/` };
}
const sitemap = await get(`${origin}/sitemap.xml`, 'sitemap.xml');
const ids = [...new Set([...sitemap.matchAll(/<loc>https:\/\/davethediver.net\/zh-hans\/(recipe|ingredient|fish|staff)\/([^/]+)\/<\/loc>/g)].map(m => `${m[1]}/${m[2]}`))];
const raw = [];
let completed = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (ids.length) {
    const id = ids.shift();
    const html = await get(`${origin}/zh-hans/${id}/`, `${id.replace('/', '--')}.html`);
    raw.push(parse(html, id));
    if (++completed % 100 === 0) console.log(`Read ${completed} pages`);
  }
}));
raw.sort((a, b) => a.id.localeCompare(b.id));
await fs.writeFile(path.join(cache, 'parsed.json'), JSON.stringify(raw, null, 2));
console.log(`Parsed ${raw.length} pages`);
