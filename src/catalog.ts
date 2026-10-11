import snapshot from "./data/database.json";
import translations from "./data/names.zh-CN.json";

export type EntityType = "recipe" | "ingredient" | "fish" | "staff";
export interface FactValue { text?: string; nameId?: string; entityId?: string }
export interface Entity {
  id: string;
  type: EntityType;
  nameId: string;
  en: string;
  sourceUrls: string[];
  inferred: boolean;
  relatedIds: string[];
  facts: { labelId: string; values: FactValue[] }[];
  stats: Record<string, number | null>;
  facets: Record<string, string | null>;
  ingredients?: { ingredientId: string; quantity: number | null }[];
  fishIds?: string[];
  skillIds?: string[];
}
export const database = snapshot as unknown as {
  metadata: { source: string; importedAt: string; rawPageCount: number; aliasCount: number };
  aliases: Record<string, string>;
  recipes: Entity[]; ingredients: Entity[]; fish: Entity[]; staff: Entity[];
};
const names: Record<string, string> = translations;
export const catalog = [...database.recipes, ...database.ingredients, ...database.fish, ...database.staff];
const byId = new Map(catalog.map(entity => [entity.id, entity]));
export function getEntity(id: string) { return byId.get(database.aliases[id] ?? id); }
export function name(id: string) {
  const entity = getEntity(id);
  const key = entity?.nameId ?? database.aliases[id] ?? id;
  return names[key] ?? entity?.en ?? id;
}
export function translateText(text: string) {
  return text.replace(/\{\{([^{}]+)\}\}/g, (_, id: string) => name(id));
}
export const entityTypes: Record<EntityType, string> = { recipe: "食谱", ingredient: "食材", fish: "鱼类", staff: "员工" };
export const entityLists: Record<EntityType, string> = { recipe: "/recipes", ingredient: "/ingredients", fish: "/fish", staff: "/staff" };
export function entityPath(entity: Entity | string) {
  const id = typeof entity === "string" ? getEntity(entity)?.id ?? entity : entity.id;
  const [type, slug] = id.split("/");
  return `${entityLists[type as EntityType]}/${slug}`;
}
export function searchable(entity: Entity) {
  const ingredients = (entity.ingredients ?? []).map(i => `${name(i.ingredientId)} ${getEntity(i.ingredientId)?.en ?? ""}`);
  return [name(entity.id), entity.en, ...ingredients, ...(entity.skillIds ?? []).map(name),
    ...Object.values(entity.facets).filter((v): v is string => !!v).map(name)]
    .join(" ").toLocaleLowerCase();
}
export function searchCatalog(query: string, type?: EntityType) {
  const term = query.trim().toLocaleLowerCase();
  return catalog.filter(entity => (!type || entity.type === type) && (!term || searchable(entity).includes(term)));
}
