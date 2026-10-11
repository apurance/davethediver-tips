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
    if (entity.type === "recipe") {
      assert.ok(Array.isArray(entity.ingredients), entity.id);
      assert.ok(!("relatedIngredients" in entity), entity.id);
      assert.ok(!getRelatedGroups(entity).some(group => group.type === "ingredient"), entity.id);
      for (const item of entity.ingredients) {
        const ingredient = getEntity(item.ingredientId);
        assert.ok(ingredient?.type === "ingredient", `${entity.id} -> ${item.ingredientId}`);
        assert.ok(ingredient.relatedRecipes.includes(entity.id), `${entity.id} <-> ${item.ingredientId}`);
      }
    }
    if (entity.type === "ingredient") assert.ok(Array.isArray(entity.fishIds), entity.id);
    if (entity.type === "staff") assert.ok(Array.isArray(entity.skills), entity.id);
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
        if (entity.type === "ingredient" && related.type === "recipe") {
          assert.ok(related.ingredients.some(item => item.ingredientId === entity.id), `${entity.id} <-> ${id}`);
        } else {
          const reverse = getRelatedGroups(related).find(group => group.type === entity.type);
          assert.ok(reverse?.ids.includes(entity.id), `${entity.id} <-> ${id}`);
        }
      }
    }
  }
});
