import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Entity } from "../src/catalog.ts";

const load = (file: string) => JSON.parse(readFileSync(new URL(`../src/data/${file}`, import.meta.url), "utf8"));
const db = load("database.json");
const names: Record<string, string> = load("names.zh-CN.json");
const all: Entity[] = [...db.recipes, ...db.ingredients, ...db.fish, ...db.staff];
const byId = new Map(all.map(entity => [entity.id, entity]));
// Stable field ID remains valid even when the user edits the Chinese label.
const fishRecipeFieldId = "field/related-recipes";
const declaredRecipes = (fish: Entity) => fish.facts.find(fact => fact.labelId === fishRecipeFieldId)
  ?.values.flatMap(value => value.entityId?.startsWith("recipe/") ? [value.entityId] : []);

test("every catalog identifier and translation reference resolves", () => {
  assert.equal(byId.size, all.length);
  for (const entity of all) {
    assert.ok(names[entity.nameId], entity.id);
    for (const [key, value] of Object.entries(entity.fields ?? {})) {
      assert.equal(typeof value, "string", `${entity.id}: ${key}`);
      const labelId = `field/${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
      assert.ok(names[labelId], `${entity.id}: ${labelId}`);
      assert.ok(!entity.facts.some(fact => fact.labelId === labelId), `${entity.id}: duplicate field`);
    }
    for (const key of ["encyclopediaNumber", "marincaCardNumber"]) assert.ok(!(key in entity.stats), `${entity.id}: ${key}`);
    for (const labelId of ["field/encyclopedia-number", "field/marinca-card-number"]) {
      assert.ok(!entity.facts.some(fact => fact.labelId === labelId), `${entity.id}: ${labelId}`);
    }
    for (const id of [...(entity.skillIds ?? []), ...Object.values(entity.facets).filter(Boolean)]) assert.ok(names[id!], `${entity.id}: ${id}`);
    for (const fact of entity.facts) {
      assert.match(fact.labelId, /^field\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/, entity.id);
      assert.doesNotMatch(fact.labelId, /^field\/[a-f0-9]{12}$/, entity.id);
      assert.ok(names[fact.labelId]);
      for (const value of fact.values) {
        for (const key of ["number", "unitId", "perUnitId", "templateId", "parameters", "stat", "computed"]) {
          assert.ok(!(key in value), `${entity.id}: ${key} in source facts`);
        }
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
      const declared = declaredRecipes(fish);
      assert.equal(fish.relatedIds.includes(recipe.id), declared === undefined || declared.includes(recipe.id), `${fishId}: ${recipe.id}`);
      assert.ok(fish.relatedIds.includes(ingredient.id));
    }
  }
  for (const entity of all) for (const id of entity.relatedIds) {
    assert.ok(byId.has(id), `${entity.id}: ${id}`);
    assert.ok(byId.get(id)!.relatedIds.includes(entity.id), `Reverse link: ${entity.id}: ${id}`);
  }
});

test("fish recipe links follow the declared recipe field and removed entries cannot resolve", () => {
  assert.equal(db.metadata.recipeCleanup.authorityFieldId, fishRecipeFieldId);
  for (const fish of db.fish as Entity[]) {
    const declared = declaredRecipes(fish);
    if (declared === undefined) continue;
    assert.deepEqual(fish.relatedIds.filter(id => id.startsWith("recipe/")).sort(), [...new Set(declared)].sort(), fish.id);
  }
  const parrotfish = byId.get("fish/mediterranean-parrotfish")!;
  assert.deepEqual(declaredRecipes(parrotfish)?.sort(), ["recipe/black-vinegar-braised-parrotfish", "recipe/mediterranean-parrotfish-sushi"]);
  assert.ok(!byId.has("recipe/mediterranean-parrotfish-stewed"));
  assert.ok(byId.has("recipe/black-vinegar-braised-parrotfish"));
  // A recipe declared by another fish is retained; only the conflicting fish link is removed.
  assert.ok(byId.has("recipe/trevally-sandwich"));
  assert.ok(!byId.get("fish/bigeye-scad")!.relatedIds.includes("recipe/trevally-sandwich"));
  assert.ok(byId.get("fish/giant-trevally")!.relatedIds.includes("recipe/trevally-sandwich"));
  assert.ok(byId.has("recipe/godzilla-vs-ebirah-curry"));
  assert.ok(!byId.get("fish/moray-eel")!.relatedIds.includes("recipe/godzilla-vs-ebirah-curry"));
  assert.ok(byId.get("fish/european-lobster")!.relatedIds.includes("recipe/godzilla-vs-ebirah-curry"));
  // Absence of the field is not evidence against vegetable, boss or newer recipes.
  assert.ok(byId.has("recipe/vegetable-sushi"));
  assert.ok(byId.has("recipe/boiled-mantis-shrimp-with-soy-paste"));
  assert.ok(byId.has("recipe/bamboo-shoot-soup"));
  for (const id of db.metadata.recipeCleanup.removedRecipeIds) {
    assert.ok(!byId.has(id), id);
    assert.ok(!(id in names), id);
    assert.ok(!(id in db.aliases), id);
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
