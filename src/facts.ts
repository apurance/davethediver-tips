import type { Entity, FactValue } from "./catalog.ts";
import { formatNumber } from "./utils/formatNumber.ts";

export type DisplayFactValue = FactValue & {
  number?: number;
  unitId?: string;
  perUnitId?: string;
  templateId?: string;
  parameters?: Record<string, string | number | { nameId: string }>;
  stat?: string;
  computed?: "value-per-kilogram" | "base-total" | "max-total";
};
export interface DisplayFact { labelId: string; values: DisplayFactValue[] }
type FactContext = Pick<Entity, "stats">;

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

const additionalStatFields: Record<Entity["type"], [string, string][]> = {
  recipe: [
    ["flame-cost", "flameCost"], ["max-level", "maxLevel"],
    ["ingredient-cost", "ingredientCost"], ["estimated-profit", "estimatedProfit"],
    ["servings-per-plate", "servingsPerPlate"], ["serving-time", "servingTime"],
    ["research-cost", "researchCost"], ["repeat-research-taste", "repeatResearchTaste"],
    ["plates-per-serving", "platesPerServing"],
  ],
  ingredient: [
    ["level", "rank"], ["purchase-price", "purchasePrice"],
    ["region", "region"], ["daily-limit", "dailyLimit"],
  ],
  fish: [
    ["marinca-card-number", "marincaCardNumber"],
    ["length", "length"], ["health", "health"], ["damage", "damage"],
    ["harvest-count", "harvestCount"], ["capture-rank", "captureRank"],
  ],
  staff: [["cooking", "cooking"], ["appeal", "appeal"], ["serving", "serving"]],
};

// Units and quantity templates are determined by the stat key, not stored per entity.
const statUnits: Record<string, string> = {
  ...Object.fromEntries(Object.values(statFields).flat().filter(([, , unit]) => unit).map(([, stat, unit]) => [stat, unit!])),
  ingredientCost: "unit/gold", estimatedProfit: "unit/gold", purchasePrice: "unit/gold",
  length: "unit/centimeter", servingTime: "unit/second", dailyLimit: "unit/can",
};
const statTemplates: Record<string, string> = {
  servingTime: "template/per-plate-quantity", dailyLimit: "template/daily-quantity",
};
const vendors: [string, string][] = [
  ["Otto", "Otto"], ["Mushroomer", "Mushroomer"], ["Jango", "Jango"],
  ["JangoAndMushroomer", "Jango and Mushroomer"],
];
const vendorStats = Object.fromEntries(["purchasePrice", "buyGold"].flatMap(prefix =>
  vendors.map(([suffix, vendor]) => [`${prefix}${suffix}`, vendor])));

/** Source facts contain independent information; presentation-only fields live here. */
export function getDisplayFacts(entity: Entity): DisplayFact[] {
  const facts: DisplayFact[] = [...(entity.facts ?? [])];
  const labels = new Set(facts.map(fact => fact.labelId));
  const append = (field: string, values: DisplayFactValue[]) => {
    const labelId = `field/${field}`;
    if (!labels.has(labelId)) {
      facts.push({ labelId, values });
      labels.add(labelId);
    }
  };
  if ((entity.type === "recipe" || entity.type === "ingredient") && entity["acquisition-method"]) {
    append("acquisition-method", [entity["acquisition-method"]]);
  }
  if (entity.type === "recipe" && entity.event !== undefined) append("event", [{ text: entity.event }]);
  if (entity.type === "staff" && entity.occupation !== undefined) append("occupation", [{ text: entity.occupation }]);
  for (const [field, stat] of [...statFields[entity.type], ...additionalStatFields[entity.type]]) {
    if (entity.stats[stat] != null) append(field, [{ stat }]);
  }
  if (entity.type === "ingredient") for (const [field, prefix] of [["purchase-price", "purchasePrice"], ["buy-gold", "buyGold"]]) {
    const values: DisplayFactValue[] = [];
    for (const [suffix] of vendors) {
      const stat = `${prefix}${suffix}`;
      if (entity.stats[stat] == null) continue;
      if (values.length) values.push({ text: "／" });
      values.push({ stat });
    }
    if (values.length) append(field, values);
  }
  if ((entity.type === "fish" || entity.type === "ingredient") && entity.region?.length) append("region", entity.region.map(nameId => ({ nameId })));
  for (const [key, nameId] of Object.entries(entity.facets)) {
    const field = key === "time" ? "active-time" : key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    if (nameId) append(field, [{ nameId }]);
  }
  if (entity.type === "fish" || entity.type === "ingredient") {
    const value: DisplayFactValue = { computed: "value-per-kilogram", unitId: "unit/gold", perUnitId: "unit/kilogram" };
    if (resolveFactNumber(value, entity) !== null) append("value-per-kilogram", [value]);
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
  if (value.stat === "marincaCardNumber" && number !== null) return String(number);
  // Keep source quantities precise; only the derived ratio is rounded for display.
  const formatted = number === null ? "" : formatNumber(number, value.computed === "value-per-kilogram" ? 1 : 10);
  const vendor = value.stat ? vendorStats[value.stat] : undefined;
  const unitId = value.unitId ?? (value.stat ? vendor ? "unit/gold" : statUnits[value.stat] : undefined);
  const templateId = value.templateId ?? (value.stat ? vendor ? "template/vendor-price" : statTemplates[value.stat] : undefined);
  const unit = unitId ? translate(unitId) + (value.perUnitId ? `/${translate(value.perUnitId)}` : "") : "";
  if (templateId) {
    const parameters: Record<string, string> = { value: formatted, unit };
    if (vendor) parameters.vendor = vendor;
    for (const [key, parameter] of Object.entries(value.parameters ?? {})) {
      parameters[key] = typeof parameter === "number" ? formatNumber(parameter, 10)
        : typeof parameter === "string" ? parameter : translate(parameter.nameId);
    }
    return translate(templateId).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (token, key: string) => parameters[key] ?? token);
  }
  return formatted + (unit ? `${unitId === "unit/percent" ? "" : " "}${unit}` : "");
}
