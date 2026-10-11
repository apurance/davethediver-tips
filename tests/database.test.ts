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
    assert.ok(!("region" in entity.facets), `${entity.id}: region in facets`);
    if (entity.region !== undefined) {
      assert.ok(Array.isArray(entity.region), `${entity.id}: region must be a list`);
      assert.equal(new Set(entity.region).size, entity.region.length, `${entity.id}: repeated region`);
      for (const id of entity.region) assert.ok(names[id], `${entity.id}: ${id}`);
    }
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
    for (const id of entity.skillIds ?? []) assert.ok(names[id], `${entity.id}: ${id}`);
    for (const [key, value] of Object.entries(entity.facets)) {
      assert.ok(value === null || typeof value === "string", `${entity.id}: scalar facet ${key}`);
      if (value == null) continue;
      assert.ok(names[value], `${entity.id}: ${value}`);
      const field = key === "time" ? "active-time" : key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      assert.ok(names[`field/${field}`], `${entity.id}: ${key}`);
      assert.ok(!entity.facts.some(fact => fact.labelId === `field/${field}`), `${entity.id}: duplicate facet`);
    }
    for (const fact of entity.facts) {
      assert.ok(!(fact.values.length === 1 && Object.keys(fact.values[0]).length === 1 && fact.values[0].nameId), `${entity.id}: scalar translation in facts`);
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

test("confirmed fish locations share the canonical region used for filtering", () => {
  for (const [id, expected] of [
    ["fish/zebra-shark", "region/8c354854b261"],
    ["fish/white-shrimp", "region/blue-hole-0-130-meters"],
    ["fish/bluefin-tuna", "region/8c354854b261"],
    ["fish/yellowfin-tuna", "region/8c354854b261"],
    ["fish/megalograptus", "region/hydrothermal-vents"],
    ["fish/antarctic-octopus", "region/glacial-area"],
    ["fish/golden-king-crab", "region/glacial-area"],
    ["fish/antarctic-starry-skate", "region/glacial-area"],
    ["fish/sally-lightfoot-crab", "region/42a2a7652438"],
    ["fish/sailfish", "region/42a2a7652438"],
    ["fish/black-tiger-shrimp", "region/42a2a7652438"],
    ["fish/vampire-squid", "region/22dcf4d19351"],
    ["fish/peacock-squid", "region/22dcf4d19351"],
    ["fish/barreleye", "region/22dcf4d19351"],
    ["fish/blobfish", "region/22dcf4d19351"],
    ["fish/dumbo-octopus", "region/22dcf4d19351"],
    ["fish/pelican-eel", "region/22dcf4d19351"],
    ["fish/clione", "region/721eb9e71c69"],
    ["fish/alaska-pollock", "region/glacial-area-dungeon-1"],
    ["fish/arctic-telescope-fish", "region/glacial-area-dungeon-1"],
    ["fish/bathynomus", "region/glacial-area-dungeon-1"],
    ["fish/allenypterus", "region/hydrothermal-vents"],
    ["fish/dollocaris-ingens", "region/hydrothermal-vents"],
    ["fish/ruby-seadragon", "region/hydrothermal-vents"],
    ["fish/atlantic-anglerfish", "region/limestone-cave"],
    ["fish/atlantic-mackerel", "region/82a8f0e0b78d"],
    ["fish/blackfin-barracuda", "region/82a8f0e0b78d"],
    ["fish/whitetip-reefshark", "region/8c354854b261"],
    ["fish/snub-nosed-spiny-eel", "region/glacial-area-dungeon-3"],
    ["fish/lumpfish", "region/glacial-area-dungeon-3"],
    ["fish/megamouth-shark", "region/721eb9e71c69"],
    ["fish/viperfish", "region/721eb9e71c69"],
    ["fish/bloodskin-shark", "region/a7a86e92fda1"],
    ["fish/dredge-bloodskin-shark", "region/a7a86e92fda1"],
    ["fish/dredge-host-eel", "region/a7a86e92fda1"],
    ["fish/translucent-sturgeon", "region/d3b15f5fc5e0"],
    ["fish/dredge-bony-wreckfish", "region/d3b15f5fc5e0"],
    ["fish/dredge-cortex-decorator", "region/d3b15f5fc5e0"],
    ["fish/gazing-shark", "region/565a3a911b9e"],
    ["fish/dredge-aurora-jellyfish", "region/565a3a911b9e"],
    ["fish/dredge-concertina-barracuda", "region/565a3a911b9e"],
  ]) {
    const fish = byId.get(id)!;
    assert.deepEqual(fish.region, [expected], id);
    assert.ok(!("location" in fish.facets), id);
    assert.ok(!fish.facts.some(fact => fact.labelId === "field/location"), id);
  }
  assert.equal(names["region/glacial-area"], "冰川区域");
  assert.equal(db.fish.filter((fish: Entity) => fish.region?.includes("region/glacial-area")).length, 19);
  assert.equal(names["region/42a2a7652438"], "遇难船");
  assert.equal(names["region/22dcf4d19351"], "冰川通道");
  assert.equal(names["region/glacial-area-dungeon-1"], "第一冰川洞穴");
  assert.equal(names["region/hydrothermal-vents"], "热泉喷口");
  assert.equal(names["region/limestone-cave"], "钟乳石窟");
  assert.equal(names["region/glacial-area-dungeon-3"], "第三冰川洞穴");
  for (const [id, label, count] of [
    ["region/721eb9e71c69", "蓝洞，130-250 米", 29],
    ["region/a7a86e92fda1", "迷雾海岸", 22],
    ["region/d3b15f5fc5e0", "黑色峭壁", 21],
    ["region/565a3a911b9e", "水母盆地", 19],
  ] as const) {
    assert.equal(names[id], label);
    assert.equal(db.fish.filter((fish: Entity) => fish.region?.includes(id)).length, count);
  }
  assert.equal(db.fish.filter((fish: Entity) => fish.region?.includes("region/glacial-area-dungeon-3")).length, 2);
  assert.equal(db.fish.filter((fish: Entity) => fish.region?.includes("region/glacial-area-dungeon-1")).length, 3);
  assert.equal(db.fish.filter((fish: Entity) => fish.region?.includes("region/hydrothermal-vents")).length, 15);
  assert.ok(!db.fish.some((fish: Entity) => fish.region?.includes("region/38d66d9692ac")));
  for (const fish of db.fish as Entity[]) {
    assert.ok(Array.isArray(fish.region), fish.id);
    assert.ok(!("region" in fish.stats), fish.id);
    assert.ok(!("location" in fish.facets), fish.id);
    assert.ok(!fish.facts.some(fact => fact.labelId === "field/location"), fish.id);
  }
});
