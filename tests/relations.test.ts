import test from "node:test";
import assert from "node:assert/strict";
import { catalog, getEntity, getRelatedGroups } from "../src/catalog.ts";
import { getDisplayFacts } from "../src/facts.ts";

test("relations are grouped by target type and retain valid bidirectional links", () => {
  for (const entity of catalog) {
    assert.ok(!("relatedIds" in entity), entity.id);
    const hasRecipes = entity.type === "fish" || entity.type === "ingredient";
    if (hasRecipes) {
      assert.ok(Array.isArray(entity.relatedRecipes), entity.id);
    } else {
      assert.ok(!("relatedRecipes" in entity), entity.id);
    }
    if (entity.type === "recipe") assert.ok(Array.isArray(entity.ingredients), entity.id);
    if (entity.type === "ingredient") assert.ok(Array.isArray(entity.fishIds), entity.id);
    if (entity.type === "staff") assert.ok(Array.isArray(entity.skillIds), entity.id);
    assert.ok(!entity.facts.some(fact => fact.labelId === "field/related-recipes"), entity.id);
    assert.ok(!getDisplayFacts(entity).some(fact => fact.labelId === "field/related-recipes"), entity.id);

    const groups = getRelatedGroups(entity);
    const ids = groups.flatMap(group => group.ids);
    assert.equal(ids.length, new Set(ids).size, entity.id);
    for (const group of groups) {
      assert.ok(Array.isArray(group.ids), `${entity.id}: ${group.type}`);
      for (const id of group.ids) {
        const related = getEntity(id);
        assert.ok(related, `${entity.id} -> ${id}`);
        assert.equal(related.type, group.type, `${entity.id} -> ${id}`);
        assert.equal(id, related.id, `${entity.id} -> ${id}`);
        assert.notEqual(id, entity.id);
        const reverse = getRelatedGroups(related).find(group => group.type === entity.type);
        assert.ok(reverse?.ids.includes(entity.id), `${entity.id} <-> ${id}`);
      }
    }
  }
});
