import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Entity } from "../src/catalog.ts";

const load = (file: string) => JSON.parse(readFileSync(new URL(`../src/data/${file}`, import.meta.url), "utf8"));
const db = load("database.json");
const names: Record<string, string> = load("names.zh-CN.json");
const all: Entity[] = [...db.recipes, ...db.ingredients, ...db.fish, ...db.staff];
const byId = new Map(all.map(entity => [entity.id, entity]));

test("every catalog identifier and translation reference resolves", () => {
  assert.equal(byId.size, all.length);
  for (const entity of all) {
    assert.ok(names[entity.nameId], entity.id);
    for (const id of [...(entity.skillIds ?? []), ...Object.values(entity.facets).filter(Boolean)]) assert.ok(names[id!], `${entity.id}: ${id}`);
    for (const fact of entity.facts) {
      assert.ok(names[fact.labelId]);
      for (const value of fact.values) {
        if (value.nameId) assert.ok(names[value.nameId], `${entity.id}: ${value.nameId}`);
        if (value.entityId) assert.ok(byId.has(value.entityId), `${entity.id}: ${value.entityId}`);
      }
    }
    assert.equal(new Set(entity.sourceUrls).size, entity.sourceUrls.length);
  }
  for (const [alias, canonical] of Object.entries(db.aliases)) {
    assert.notEqual(alias, canonical);
    assert.ok(byId.has(canonical as string), alias);
  }
  const guide = readFileSync(new URL("../src/data.ts", import.meta.url), "utf8");
  for (const match of guide.matchAll(/name\("([^"]+)"\)/g)) assert.ok(byId.has(db.aliases[match[1]] ?? match[1]), `Guide: ${match[1]}`);
});

test("all recipe ingredients and source fish have working reverse links", () => {
  for (const recipe of db.recipes as Entity[]) for (const item of recipe.ingredients ?? []) {
    const ingredient = byId.get(item.ingredientId);
    assert.equal(ingredient?.type, "ingredient", `${recipe.id}: ${item.ingredientId}`);
    assert.ok(ingredient.relatedIds.includes(recipe.id));
    assert.ok(item.quantity === null || (Number.isInteger(item.quantity) && item.quantity > 0));
    for (const fishId of ingredient.fishIds ?? []) {
      const fish = byId.get(fishId);
      assert.equal(fish?.type, "fish");
      assert.ok(fish.relatedIds.includes(recipe.id), `${fishId}: ${recipe.id}`);
      assert.ok(fish.relatedIds.includes(ingredient.id));
    }
  }
  for (const entity of all) for (const id of entity.relatedIds) {
    assert.ok(byId.has(id), `${entity.id}: ${id}`);
    assert.ok(byId.get(id)!.relatedIds.includes(entity.id), `Reverse link: ${entity.id}: ${id}`);
  }
});

test("tiger shark source values and recipe to meat to fish links are preserved", () => {
  const sushi = byId.get("recipe/tiger-shark-sushi")!;
  assert.deepEqual(sushi.stats, { basePrice: 50, maxPrice: 185, baseTaste: 29, maxTaste: 290, baseServings: 1, maxServings: 1 });
  assert.deepEqual(sushi.ingredients, [{ ingredientId: "ingredient/tiger-shark-meat", quantity: 1 }]);
  assert.ok(byId.get("ingredient/tiger-shark-meat")!.fishIds!.includes("fish/tiger-shark"));
  assert.equal(byId.get("fish/tiger-shark")!.stats.meat3, 9);
  assert.equal(byId.get("staff/billy")!.stats.maxServing, 723);
  assert.equal(byId.get("staff/billy")!.skillIds!.length, 2);
});

test("the seven existing level curves use catalog names and matching ingredient identifiers", () => {
  const strategies = load("strategy-recipes.json");
  assert.equal(strategies.length, 7);
  for (const strategy of strategies) {
    const recipe = byId.get(strategy.entityId)!;
    assert.equal(recipe.type, "recipe");
    assert.equal(strategy.prices.length, 10);
    assert.equal(strategy.portions.length, 10);
    assert.equal(strategy.prices[0], recipe.stats.basePrice);
    assert.equal(strategy.prices[9], recipe.stats.maxPrice);
    assert.equal(strategy.portions[9], recipe.stats.maxServings);
    assert.deepEqual(strategy.ingredients.map(([id, quantity]: [string, number]) => ({ ingredientId: id, quantity })), recipe.ingredients);
  }
});

test("unprovided source values remain null and non-food records are excluded", () => {
  assert.ok(db.recipes.some((r: Entity) => r.stats.maxPrice === null));
  assert.ok(db.recipes.some((r: Entity) => r.ingredients?.some(i => i.quantity === null)));
  assert.ok(!byId.has("ingredient/n-a"));
  assert.ok(!byId.has("fish/ore-iron"));
  for (const entity of all) for (const value of Object.values(entity.stats)) assert.ok(value === null || Number.isFinite(value));
});
