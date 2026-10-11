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

test("currency is a source number with a shared unit, not a translated quantity", () => {
  const recipe = byId.get("recipe/dredge-sallow-sailfish")!;
  const value = factValue(recipe, "field/base-price");
  assert.equal(recipe.stats.basePrice, 1000);
  assert.equal(resolveFactNumber(value, recipe), 1000);
  assert.equal(formatFactValue(value, recipe, translate), "1,000 金币");
  assert.equal(formatFactValue(value, recipe, id => id === "unit/gold" ? "G" : translate(id)), "1,000 G");
  assert.ok(!names["text/00c77824e4c3"]);
  assert.ok(!names["text/031453045e7f"]);
  for (const [id, text] of Object.entries(names)) {
    assert.ok(!/^[-+]?\d[\d,.]*\s*(?:金币(?:\/kg)?|kg|cm|厘米|%)$/.test(text), id);
  }
});

test("derived fields exist only in the frontend and leave source data unchanged", () => {
  const derivedLabels = new Set(["value-per-kilogram", "base-total", "max-total", "recipe-count", "recipes-using-ingredient"].map(field => `field/${field}`));
  let count = 0;
  for (const entity of all) {
    const source = JSON.stringify(entity);
    for (const fact of entity.facts) {
      assert.ok(!derivedLabels.has(fact.labelId), `${entity.id}: ${fact.labelId}`);
      for (const value of fact.values) assert.ok(!("computed" in value) && !("stat" in value), entity.id);
    }
    const display = getDisplayFacts(entity);
    assert.equal(display.length, new Set(display.map(fact => fact.labelId)).size, entity.id);
    assert.equal(JSON.stringify(entity), source, entity.id);
    for (const fact of display) {
      if (fact.labelId !== "field/value-per-kilogram") continue;
      count++;
      assert.equal(fact.values.length, 1);
      const value = fact.values[0];
      assert.equal(value.computed, "value-per-kilogram", entity.id);
      assert.equal(value.number, undefined);
      assert.equal(value.text, undefined);
      assert.equal(value.nameId, undefined);
      assert.equal(resolveFactNumber(value, entity), entity.stats.sellPrice! / entity.stats.weight!, entity.id);
    }
  }
  assert.ok(count > 0);
  for (const id of ["fish/white-shrimp", "fish/black-tiger-shrimp", "ingredient/cherry-tomato"]) {
    const entity = byId.get(id)!;
    const value = factValue(entity, "field/value-per-kilogram");
    assert.equal(formatFactValue(value, entity, translate), "170 金币/kg");
    assert.equal(formatFactValue(value, { stats: { ...entity.stats, sellPrice: 34 } }, translate), "340 金币/kg");
    assert.equal(formatFactValue(value, { stats: { ...entity.stats, weight: 0.2 } }, translate), "85 金币/kg");
  }
  const trevally = byId.get("fish/giant-trevally")!;
  assert.equal(formatFactValue(factValue(trevally, "field/value-per-kilogram"), trevally, translate), "2 金币/kg");
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

test("staff totals and recipe counts reflect edits without maintaining extra database fields", () => {
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
  const tomato = byId.get("ingredient/cherry-tomato")!;
  const count = factValue(tomato, "field/recipe-count");
  assert.equal(resolveFactNumber(count, tomato), 9);
  assert.equal(resolveFactNumber(count, { ...tomato, relatedIds: [...tomato.relatedIds, "recipe/tiger-shark-sushi"] }), 10);
  assert.equal(resolveFactNumber(count, { ...tomato, relatedIds: [...tomato.relatedIds, tomato.relatedIds.find(id => id.startsWith("recipe/"))!] }), 9);
  assert.equal(resolveFactNumber(count, { ...tomato, relatedIds: [] }), 0);
  assert.equal(resolveFactNumber(count, { stats: {} }), null);
  const photo = byId.get("fish/baby-humpback-whale")!;
  assert.equal(resolveFactNumber(factValue(photo, "field/recipe-count"), photo), 0);
});

test("small weights, quantity templates and identifier leading zeroes remain readable", () => {
  assert.equal(formatFactValue({ number: 0.01, unitId: "unit/kilogram" }, { stats: {} }, translate), "0.01 kg");
  const daily = byId.get("ingredient/common-cat-food")!;
  assert.equal(formatFactValue(factValue(daily, "field/daily-limit"), daily, translate), "每天 1 罐");
  const gim = byId.get("recipe/gim")!;
  assert.equal(formatFactValue(factValue(gim, "field/serving-time"), gim, translate), "每盘 19 秒");
  const bean = byId.get("ingredient/bean")!;
  assert.deepEqual(bean.facts.find(fact => fact.labelId === "field/purchase-price")!.values.map(value => formatFactValue(value, bean, translate)), ["200 金币（Otto）", "／", "170 金币（Jango）"]);
  const parrotfish = byId.get("fish/mediterranean-parrotfish")!;
  assert.equal(formatFactValue(factValue(parrotfish, "field/encyclopedia-number"), parrotfish, translate), "0016");
});
