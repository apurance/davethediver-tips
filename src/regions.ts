import type { Entity } from "./catalog.ts";

type RegionalEntity = Pick<Entity, "region">;

export function matchesRegion(entity: RegionalEntity, region: string) {
  return region === "all" || (entity.region ?? []).includes(region);
}

export function getRegions(entities: RegionalEntity[]) {
  return [...new Set(entities.flatMap(entity => entity.region ?? []))];
}
