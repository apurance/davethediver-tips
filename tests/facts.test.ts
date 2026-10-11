import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatFactValue, getDisplayFacts, resolveFactNumber } from "../src/facts.ts";
import type { DisplayFactValue } from "../src/facts.ts";
import type { Entity } from "../src/catalog.ts";

const load = (file: string) => JSON.parse(readFileSync(new URL(`../src/data/${file}`, import.meta.url), "utf8"));
const db = load("database.json");
const names: Record<string, string> = load("names.zh-CN.json");
const translate = (id: string) => names[id] ?? id;
const all: Entity[] = [...db.recipes, ...db.ingredients, ...db.fish, ...db.staff];
const byId = new Map(all.map(entity => [entity.id, entity]));
const factValue = (entity: Entity, labelId: string) => getDisplayFacts(entity).find(fact => fact.labelId === labelId)!.values[0];

test("currency units are inferred from stat keys and remain translatable", () => {
  const recipe = byId.get("recipe/dredge-sallow-sailfish")!;
  const value = factValue(recipe, "field/base-price");
  assert.equal(recipe.stats.basePrice, 1000);
  assert.deepEqual(value, { stat: "basePrice" });
  assert.equal(resolveFactNumber(value, recipe), 1000);
  assert.equal(formatFactValue(value, recipe, translate), "1,000 金币");
  assert.equal(formatFactValue(value, recipe, id => id === "unit/gold" ? "G" : translate(id)), "1,000 G");
  assert.ok(!names["text/00c77824e4c3"]);
  assert.ok(!names["text/031453045e7f"]);
  for (const [id, text] of Object.entries(names)) {
    assert.ok(!/^[-+]?\d[\d,.]*\s*(?:金币(?:\/kg)?|kg|cm|厘米|%)$/.test(text), id);
  }
});


test("missing or invalid ratio inputs do not produce misleading zero or infinity", () => {
  const value: DisplayFactValue = { computed: "value-per-kilogram", unitId: "unit/gold", perUnitId: "unit/kilogram" };
  for (const stats of [{ sellPrice: null, weight: 2 }, { sellPrice: 17, weight: null }, { sellPrice: 17, weight: 0 }, { sellPrice: 17, weight: -1 }, { sellPrice: Infinity, weight: 1 }]) {
    assert.equal(resolveFactNumber(value, { stats }), null);
    assert.equal(formatFactValue(value, { stats }, translate), "未提供");
    const fish = byId.get("fish/white-shrimp")!;
    assert.ok(!getDisplayFacts({ ...fish, stats }).some(fact => fact.labelId === "field/value-per-kilogram"));
  }
  assert.equal(formatFactValue(value, { stats: { sellPrice: 0, weight: 2 } }, translate), "0 金币/kg");
  assert.equal(formatFactValue({ stat: "sellPrice" }, { stats: {} }, translate), "未提供");
});

test("staff totals reflect edits without maintaining extra database fields", () => {
  const billy = byId.get("staff/billy")!;
  const base = factValue(billy, "field/base-total");
  const max = factValue(billy, "field/max-total");
  assert.equal(resolveFactNumber(base, billy), 198);
  assert.equal(resolveFactNumber(max, billy), 1889);
  assert.equal(resolveFactNumber(base, { stats: { ...billy.stats, baseCooking: 29 } }), 199);
  assert.equal(resolveFactNumber(max, { stats: { ...billy.stats, maxServing: null } }), null);
  assert.ok(!getDisplayFacts({ ...billy, stats: { ...billy.stats, maxServing: null } }).some(fact => fact.labelId === "field/max-total"));
  const davina = byId.get("staff/davina")!;
  assert.equal(resolveFactNumber(factValue(davina, "field/base-total"), davina), 85);
});

test("small weights, quantity templates and identifier leading zeroes remain readable", () => {
  assert.equal(formatFactValue({ number: 0.01, unitId: "unit/kilogram" }, { stats: {} }, translate), "0.01 kg");
  const daily = byId.get("ingredient/common-cat-food")!;
  assert.equal(formatFactValue(factValue(daily, "field/daily-limit"), daily, translate), "每天 1 罐");
  const gim = byId.get("recipe/gim")!;
  assert.equal(formatFactValue(factValue(gim, "field/serving-time"), gim, translate), "每盘 19 秒");
  const bean = byId.get("ingredient/bean")!;
  assert.deepEqual(getDisplayFacts(bean).find(fact => fact.labelId === "field/purchase-price")!.values.map(value => formatFactValue(value, bean, translate)), ["200 金币（Otto）", "／", "170 金币（Jango）"]);
  const parrotfish = byId.get("fish/mediterranean-parrotfish")!;
  assert.equal(formatFactValue(factValue(parrotfish, "field/encyclopedia-number"), parrotfish, translate), "0016");
});

test("encyclopedia fields translate their label and preserve the raw identifier", () => {
  const parrotfish = byId.get("fish/mediterranean-parrotfish")!;
  assert.equal(parrotfish.fields?.encyclopediaNumber, "0016");
  assert.ok(!parrotfish.facts.some(fact => fact.labelId === "field/encyclopedia-number"));
  const edited = { ...parrotfish, fields: { ...parrotfish.fields, encyclopediaNumber: "0000" } };
  const source = JSON.stringify(edited);
  const fact = getDisplayFacts(edited).find(fact => fact.labelId === "field/encyclopedia-number")!;
  const customTranslate = (id: string) => id === "field/encyclopedia-number" ? "图鉴序号" : `翻译：${id}`;
  assert.equal(customTranslate(fact.labelId), "图鉴序号");
  assert.equal(formatFactValue(fact.values[0], edited, customTranslate), "0000");
  assert.equal(JSON.stringify(edited), source);
  assert.ok(!getDisplayFacts({ ...parrotfish, fields: undefined }).some(fact => fact.labelId === "field/encyclopedia-number"));
});

test("Marinca identifiers retain their original text and differing encyclopedia numbers", () => {
  const coelacanth = byId.get("fish/coelacanth")!;
  assert.equal(coelacanth.fields?.encyclopediaNumber, "0991");
  assert.equal(coelacanth.fields?.marincaCardNumber, "913");
  const customTranslate = (id: string) => id === "field/marinca-card-number" ? "卡片序号" : `翻译：${id}`;
  const card = getDisplayFacts(coelacanth).find(fact => fact.labelId === "field/marinca-card-number")!;
  assert.equal(customTranslate(card.labelId), "卡片序号");
  assert.equal(formatFactValue(card.values[0], coelacanth, customTranslate), "913");
  assert.equal(formatFactValue(factValue(coelacanth, "field/encyclopedia-number"), coelacanth, customTranslate), "0991");
  const narwhal = byId.get("fish/narwhal")!;
  assert.equal(narwhal.fields?.marincaCardNumber, "0315");
  assert.equal(formatFactValue(factValue(narwhal, "field/marinca-card-number"), narwhal, customTranslate), "0315");
  const spinySeahorse = byId.get("fish/spiny-seahorse")!;
  assert.equal(spinySeahorse.fields?.encyclopediaNumber, "0614");
  assert.equal(spinySeahorse.fields?.marincaCardNumber, undefined);
});

test("translated scalar facets restore field labels and resolve current translation IDs", () => {
  const bean = byId.get("ingredient/bean")!;
  assert.equal(bean.facets.gatheringSource, "text/660af5fdf8cd");
  assert.equal(formatFactValue(factValue(bean, "field/gathering-source"), bean, translate), "Otto 农场");
  const fin = byId.get("ingredient/klauss-fin")!;
  assert.equal(fin.facets.time, "text/b77ea2b347b8");
  assert.equal(formatFactValue(factValue(fin, "field/active-time"), fin, translate), translate(fin.facets.time!));

  const fish = byId.get("fish/zebra-shark")!;
  const edited = { ...fish, facets: { ...fish.facets, knockbackResistance: "text/test-resistance", photoMode: null } };
  const source = JSON.stringify(edited);
  const display = getDisplayFacts(edited);
  const resistance = display.find(fact => fact.labelId === "field/knockback-resistance")!;
  const customTranslate = (id: string) => id === "field/knockback-resistance" ? "抗击退" : id === "text/test-resistance" ? "测试值" : translate(id);
  assert.equal(customTranslate(resistance.labelId), "抗击退");
  assert.equal(formatFactValue(resistance.values[0], edited, customTranslate), "测试值");
  assert.ok(!display.some(fact => fact.labelId === "field/photo-mode"));
  assert.equal(JSON.stringify(edited), source);

  const recipe = byId.get("recipe/seadragon-onigiri")!;
  assert.ok(recipe.type === "recipe");
  assert.deepEqual(recipe["acquisition-method"], { entityId: "fish/seadragon" });
  assert.deepEqual(factValue(recipe, "field/acquisition-method"), { entityId: "fish/seadragon" });
  assert.equal(recipe.facets.acquisitionMethod, undefined);
});



test("corrected regions display from the top-level list without the obsolete numeric value", () => {
  for (const [id, expected] of [
    ["fish/white-shrimp", "蓝洞，0-130 米"], ["fish/bluefin-tuna", "蓝洞，0-50 米"],
    ["fish/antarctic-octopus", "冰川区域"], ["fish/black-tiger-shrimp", "遇难船"],
    ["fish/vampire-squid", "冰川通道"], ["fish/clione", "蓝洞，130-250 米"],
    ["fish/alaska-pollock", "第一冰川洞穴"], ["fish/allenypterus", "热泉喷口"],
    ["fish/atlantic-anglerfish", "钟乳石窟"],
    ["fish/warrior-parrotfish", "蓝洞，0-50 米"],
    ["fish/zebra-seahorse", "钟乳石窟"], ["fish/white-spotted-jellyfish", "蓝洞，50-130 米"],
    ["fish/atlantic-mackerel", "蓝洞，50-130 米"], ["fish/blackfin-barracuda", "蓝洞，50-130 米"],
    ["fish/whitetip-reefshark", "蓝洞，0-50 米"], ["fish/snub-nosed-spiny-eel", "第三冰川洞穴"],
    ["fish/megamouth-shark", "蓝洞，130-250 米"], ["fish/viperfish", "蓝洞，130-250 米"],
    ["fish/bloodskin-shark", "迷雾海岸"], ["fish/dredge-host-eel", "迷雾海岸"],
    ["fish/translucent-sturgeon", "黑色峭壁"], ["fish/dredge-cortex-decorator", "黑色峭壁"],
    ["fish/gazing-shark", "水母盆地"], ["fish/dredge-aurora-jellyfish", "水母盆地"],
  ]) {
    const fish = byId.get(id)!;
    const display = getDisplayFacts(fish);
    const regions = display.filter(fact => fact.labelId === "field/region");
    assert.equal(regions.length, 1);
    assert.equal(formatFactValue(regions[0].values[0], fish, translate), expected);
    assert.ok(!display.some(fact => fact.labelId === "field/location"));
  }
});

test("migrated numeric facts display current stats with inferred units and templates", () => {
  const fish = byId.get("fish/zebra-shark")!;
  assert.equal(fish.stats.length, 210);
  assert.equal(fish.stats.health, 250);
  assert.equal(fish.stats.damage, 53);
  assert.equal(formatFactValue(factValue(fish, "field/length"), fish, translate), "210 厘米");
  const editedFish = { ...fish, stats: { ...fish.stats, length: 0, health: 300 } };
  assert.equal(formatFactValue(factValue(editedFish, "field/length"), editedFish, translate), "0 厘米");
  assert.equal(resolveFactNumber(factValue(editedFish, "field/health"), editedFish), 300);
  assert.ok(!getDisplayFacts({ ...fish, stats: { ...fish.stats, length: null } }).some(fact => fact.labelId === "field/length"));

  const gim = byId.get("recipe/gim")!;
  assert.equal(gim.stats.researchCost, 0);
  assert.equal(resolveFactNumber(factValue(gim, "field/research-cost"), gim), 0);
  assert.equal(formatFactValue(factValue(gim, "field/serving-time"), { stats: { ...gim.stats, servingTime: 20 } }, translate), "每盘 20 秒");
  const daily = byId.get("ingredient/common-cat-food")!;
  assert.equal(formatFactValue(factValue(daily, "field/daily-limit"), { stats: { ...daily.stats, dailyLimit: 2 } }, translate), "每天 2 罐");

  const charlie = byId.get("staff/charlie")!;
  assert.equal(charlie.stats.cooking, 858);
  assert.equal(charlie.stats.maxCooking, 908);
  assert.equal(resolveFactNumber(factValue(charlie, "field/cooking"), charlie), 858);
  assert.equal(resolveFactNumber(factValue(charlie, "field/max-cooking"), charlie), 908);
});

test("vendor prices preserve single, multiple and shared vendors without source metadata", () => {
  const bean = byId.get("ingredient/bean")!;
  assert.equal(bean.stats.purchasePriceOtto, 200);
  assert.equal(bean.stats.purchasePriceJango, 170);
  const editedBean = { ...bean, stats: { ...bean.stats, purchasePriceOtto: null, purchasePriceJango: 0 } };
  const prices = getDisplayFacts(editedBean).find(fact => fact.labelId === "field/purchase-price")!.values;
  assert.deepEqual(prices.map(value => formatFactValue(value, editedBean, translate)), ["0 金币（Jango）"]);
  for (const [id, field, expected] of [
    ["ingredient/cucumber", "purchase-price", ["200 金币（Otto）"]],
    ["ingredient/rainbow-cap", "purchase-price", ["735 金币（Mushroomer）", "／", "750 金币（Jango）"]],
    ["ingredient/truffle", "purchase-price", ["650 金币（Jango and Mushroomer）"]],
    ["ingredient/rice", "purchase-price", ["150 金币"]],
    ["ingredient/grade-a-egg", "buy-gold", ["450 金币（Otto）", "／", "382 金币（Jango）"]],
  ] as const) {
    const entity = byId.get(id)!;
    assert.deepEqual(getDisplayFacts(entity).find(fact => fact.labelId === `field/${field}`)!.values.map(value => formatFactValue(value, entity, translate)), [...expected]);
  }
});
