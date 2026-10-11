import type { Entity } from "./catalog.ts";

type RegionalEntity = Entity | { region?: string[] };

export function matchesRegion(entity: RegionalEntity, region: string) {
  return region === "all" || ("region" in entity && (entity.region ?? []).includes(region));
}

export function getRegions(entities: RegionalEntity[]) {
  return [...new Set(entities.flatMap(entity => "region" in entity ? entity.region ?? [] : []))];
}
