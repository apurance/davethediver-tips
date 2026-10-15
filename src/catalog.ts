import snapshot from "./data/database.json" with { type: "json" };
import translations from "./data/names.zh-CN.json" with { type: "json" };

export type EntityType = "recipe" | "ingredient" | "fish" | "staff";
export interface FactValue {
  text?: string;
  nameId?: string;
  entityId?: string;
}
export interface AcquisitionMethod {
  text?: string;
  entityId?: string;
}
interface EntityBase {
  id: string;
  nameId: string;
  en: string;
  sourceUrls: string[];
  inferred: boolean;
  facts: { labelId: string; values: FactValue[] }[];
  stats: Record<string, number | null>;
  fields?: Record<string, string>;
  /** Translation IDs for scalar text attributes; null means unprovided. */
  facets: Record<string, string | null>;
}
export interface RecipeEntity extends EntityBase {
  type: "recipe";
  event?: string;
  "acquisition-method"?: AcquisitionMethod;
  ingredients: { ingredientId: string; quantity: number | null }[];
  relatedFish: string[];
}
export interface IngredientEntity extends EntityBase {
  type: "ingredient";
  "acquisition-method"?: AcquisitionMethod;
  relatedRecipes: string[];
  relatedFish: string[];
  fishIds: string[];
  region?: string[];
}
export interface FishEntity extends EntityBase {
  type: "fish";
  drops?: { text?: string; entityId?: string }[];
  relatedRecipes: string[];
  relatedIngredients: string[];
  region?: string[];
}
export interface StaffEntity extends EntityBase {
  type: "staff";
  occupation?: string;
  /** Name and description are translation IDs. */
  skills: { name: string; description: string }[];
}
export type Entity = RecipeEntity | IngredientEntity | FishEntity | StaffEntity;
export const database = snapshot as unknown as {
  metadata: { source: string; importedAt: string; rawPageCount: number };
  recipes: RecipeEntity[]; ingredients: IngredientEntity[]; fish: FishEntity[]; staff: StaffEntity[];
};
const names: Record<string, string> = translations;
export const catalog: Entity[] = [...database.recipes, ...database.ingredients, ...database.fish, ...database.staff];
const byId = new Map(catalog.map(entity => [entity.id, entity]));
export function getEntity(id: string) { return byId.get(id); }
export function name(id: string) {
  const entity = getEntity(id);
  const key = entity?.nameId ?? id;
  return names[key] ?? entity?.en ?? id;
}
export function translateText(text: string) {
  return text.replace(/\{\{([^{}]+)\}\}/g, (_, id: string) => name(id));
}
export const entityTypes: Record<EntityType, string> = { recipe: "食谱", ingredient: "食材", fish: "鱼类", staff: "员工" };
export const entityLists: Record<EntityType, string> = { recipe: "/recipes", ingredient: "/ingredients", fish: "/fish", staff: "/staff" };
export function getRelatedGroups(entity: Entity): { type: EntityType; ids: string[] }[] {
  switch (entity.type) {
    case "recipe": return [{ type: "fish", ids: entity.relatedFish }];
    case "ingredient": return [{ type: "fish", ids: entity.relatedFish }, { type: "recipe", ids: entity.relatedRecipes }];
    case "fish": return [{ type: "ingredient", ids: entity.relatedIngredients }, { type: "recipe", ids: entity.relatedRecipes }];
    case "staff": return [];
  }
}
export function entityPath(entity: Entity | string) {
  const id = typeof entity === "string" ? getEntity(entity)?.id ?? entity : entity.id;
  const [type, slug] = id.split("/");
  return `${entityLists[type as EntityType]}/${slug}`;
}
export function searchable(entity: Entity) {
  const ingredients = entity.type === "recipe" ? entity.ingredients.map(i => `${name(i.ingredientId)} ${getEntity(i.ingredientId)?.en ?? ""}`) : [];
  const skills = entity.type === "staff" ? entity.skills.flatMap(skill => [name(skill.name), name(skill.description)]) : [];
  const regions = entity.type === "fish" || entity.type === "ingredient" ? (entity.region ?? []).map(name) : [];
  const acquisition = entity.type === "recipe" || entity.type === "ingredient" ? entity["acquisition-method"] : undefined;
  return [name(entity.id), entity.en, ...ingredients, ...skills, ...regions,
    acquisition?.text ?? (acquisition?.entityId ? name(acquisition.entityId) : ""),
    ...Object.values(entity.facets).filter((value): value is string => !!value).map(name)]
    .join(" ").toLocaleLowerCase();
}
export function searchCatalog(query: string, type?: EntityType) {
  const term = query.trim().toLocaleLowerCase();
  return catalog.filter(entity => (!type || entity.type === type) && (!term || searchable(entity).includes(term)));
}
