import type { Entity, FactValue } from "./catalog.ts";
import { formatNumber } from "./utils/formatNumber.ts";

export type DisplayFactValue = FactValue & {
  stat?: string;
  computed?: "value-per-kilogram" | "base-total" | "max-total" | "recipe-count";
};
export interface DisplayFact { labelId: string; values: DisplayFactValue[] }
type FactContext = Pick<Entity, "stats"> & Partial<Pick<Entity, "relatedIds">>;

const statFields: Record<Entity["type"], [string, string, string?][]> = {
  recipe: [
    ["base-price", "basePrice", "unit/gold"], ["base-taste", "baseTaste"], ["base-servings", "baseServings"],
    ["max-price", "maxPrice", "unit/gold"], ["max-taste", "maxTaste"], ["max-servings", "maxServings"],
  ],
  fish: [
    ["level", "rank"], ["weight", "weight", "unit/kilogram"],
    ["meat-1", "meat1"], ["meat-2", "meat2"], ["meat-3", "meat3"], ["sell-price", "sellPrice", "unit/gold"],
  ],
  ingredient: [["weight", "weight", "unit/kilogram"], ["sell-price", "sellPrice", "unit/gold"]],
  staff: [
    ["base-cooking", "baseCooking"], ["base-serving", "baseServing"],
    ["base-procurement", "baseProcurement"], ["base-appeal", "baseAppeal"],
    ["max-cooking", "maxCooking"], ["max-serving", "maxServing"],
    ["max-procurement", "maxProcurement"], ["max-appeal", "maxAppeal"],
    ["hiring-cost", "hiringCost", "unit/gold"], ["wage", "wage", "unit/gold"], ["manager-rank", "managerRank"],
  ],
};

/** Source facts contain independent information; presentation-only fields live here. */
export function getDisplayFacts(entity: Entity): DisplayFact[] {
  const facts: DisplayFact[] = [...entity.facts];
  const labels = new Set(facts.map(fact => fact.labelId));
  const append = (field: string, values: DisplayFactValue[]) => {
    const labelId = `field/${field}`;
    if (!labels.has(labelId)) {
      facts.push({ labelId, values });
      labels.add(labelId);
    }
  };
  for (const [field, stat, unitId] of statFields[entity.type]) {
    if (entity.stats[stat] != null) append(field, [{ stat, ...(unitId ? { unitId } : {}) }]);
  }
  for (const [facet, field] of [["region", "region"], ["time", "active-time"], ["tier", "tier"]]) {
    if (entity.facets[facet]) append(field, [{ nameId: entity.facets[facet]! }]);
  }
  if (entity.skillIds?.length) append("special-skills", entity.skillIds.map(nameId => ({ nameId })));
  if (entity.type === "fish" || entity.type === "ingredient") {
    const value: DisplayFactValue = { computed: "value-per-kilogram", unitId: "unit/gold", perUnitId: "unit/kilogram" };
    if (resolveFactNumber(value, entity) !== null) append("value-per-kilogram", [value]);
    append("recipe-count", [{ computed: "recipe-count" }]);
  }
  if (entity.type === "staff") for (const computed of ["base-total", "max-total"] as const) {
    const value = { computed };
    if (resolveFactNumber(value, entity) !== null) append(computed, [value]);
  }
  const primaryOrder = new Map(statFields[entity.type].map(([field], index) => [`field/${field}`, index]));
  const remainingOrder = primaryOrder.size;
  return facts.sort((a, b) => (primaryOrder.get(a.labelId) ?? remainingOrder) - (primaryOrder.get(b.labelId) ?? remainingOrder));
}

/** Calculations read the current entity stats, never a preformatted source value. */
export function resolveFactNumber(value: DisplayFactValue, entity: FactContext): number | null {
  if (value.computed === "recipe-count") {
    return entity.relatedIds ? new Set(entity.relatedIds.filter(id => id.startsWith("recipe/"))).size : null;
  }
  if (value.computed === "base-total" || value.computed === "max-total") {
    const prefix = value.computed === "base-total" ? "base" : "max";
    const values = ["Cooking", "Serving", "Procurement", "Appeal"].map(stat => entity.stats[`${prefix}${stat}`]);
    if (values.some(number => number == null || !Number.isFinite(number))) return null;
    const sum = values.reduce<number>((total, number) => total + number!, 0);
    return Number.isFinite(sum) ? sum : null;
  }
  if (value.computed === "value-per-kilogram") {
    const price = entity.stats.sellPrice;
    const weight = entity.stats.weight;
    if (price == null || weight == null || !Number.isFinite(price) || !Number.isFinite(weight) || weight <= 0) return null;
    const result = price / weight;
    return Number.isFinite(result) ? result : null;
  }
  const number = value.stat ? entity.stats[value.stat] : value.number;
  return number != null && Number.isFinite(number) ? number : null;
}

export function formatFactValue(value: DisplayFactValue, entity: FactContext, translate: (id: string) => string): string {
  if (value.nameId) return translate(value.nameId);
  if (value.entityId) return translate(value.entityId);
  if (value.text !== undefined) return value.text;

  const numeric = value.number !== undefined || value.stat !== undefined || value.computed !== undefined;
  const number = numeric ? resolveFactNumber(value, entity) : null;
  if (numeric && number === null) return translate("label/not-provided");
  // Keep source quantities precise; only the derived ratio is rounded for display.
  const formatted = number === null ? "" : formatNumber(number, value.computed === "value-per-kilogram" ? 1 : 10);
  const unit = value.unitId ? translate(value.unitId) + (value.perUnitId ? `/${translate(value.perUnitId)}` : "") : "";
  if (value.templateId) {
    const parameters: Record<string, string> = { value: formatted, unit };
    for (const [key, parameter] of Object.entries(value.parameters ?? {})) {
      parameters[key] = typeof parameter === "number" ? formatNumber(parameter, 10)
        : typeof parameter === "string" ? parameter : translate(parameter.nameId);
    }
    return translate(value.templateId).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (token, key: string) => parameters[key] ?? token);
  }
  return formatted + (unit ? `${value.unitId === "unit/percent" ? "" : " "}${unit}` : "");
}
