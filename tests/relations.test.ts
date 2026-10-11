import test from "node:test";
import assert from "node:assert/strict";
import { catalog, getEntity } from "../src/catalog.ts";
import { getDisplayFacts } from "../src/facts.ts";

test("recipe relations use their own field and retain valid bidirectional links", () => {
  for (const entity of catalog) {
    const hasRecipes = entity.type === "fish" || entity.type === "ingredient";
    if (hasRecipes) {
      assert.ok(Array.isArray(entity.relatedRecipes), entity.id);
      assert.ok(!entity.relatedIds.some(id => id.startsWith("recipe/")), entity.id);
      assert.ok(entity.relatedRecipes.every(id => id.startsWith("recipe/")), entity.id);
    } else {
      assert.ok(!("relatedRecipes" in entity), entity.id);
    }
    if (entity.type === "recipe") assert.ok(Array.isArray(entity.ingredients), entity.id);
    if (entity.type === "ingredient") assert.ok(Array.isArray(entity.fishIds), entity.id);
    if (entity.type === "staff") assert.ok(Array.isArray(entity.skillIds), entity.id);
    assert.ok(!entity.facts.some(fact => fact.labelId === "field/related-recipes"), entity.id);
    assert.ok(!getDisplayFacts(entity).some(fact => fact.labelId === "field/related-recipes"), entity.id);

    const ids = [...entity.relatedIds, ...(hasRecipes ? entity.relatedRecipes : [])];
    assert.equal(ids.length, new Set(ids).size, entity.id);
    for (const id of ids) {
      const related = getEntity(id);
      assert.ok(related, `${entity.id} -> ${id}`);
      assert.equal(id, related.id, `${entity.id} -> ${id}`);
      assert.notEqual(id, entity.id);
      const reverse = entity.type === "recipe" && (related.type === "fish" || related.type === "ingredient") ? related.relatedRecipes : related.relatedIds;
      assert.ok(reverse.includes(entity.id), `${entity.id} <-> ${id}`);
    }
  }
});
