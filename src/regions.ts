import type { Entity } from "./catalog.ts";

/** Shared region enum. Values are stable translation IDs stored in the snapshot. */
export const Region = {
  BlueHoleShallows: "region/blue-hole-shallows",
  BlueHoleMediumDepth: "region/blue-hole-medium-depth",
  LimestoneCave: "region/limestone-cave",
  Shipwreck: "region/shipwreck",
  BlueHoleDepths: "region/blue-hole-depths",
  GlacierPassage: "region/glacier-passage",
  GlacialArea: "region/glacial-area",
  GlacialAreaDungeon1: "region/glacial-area-dungeon-1",
  GlacialAreaDungeon3: "region/glacial-area-dungeon-3",
  HydrothermalVents: "region/hydrothermal-vents",
  ControlRoom: "region/control-room",
  FogCoast: "region/fog-coast",
  BlackCliff: "region/black-cliff",
  JellyfishBasin: "region/jellyfish-basin",
  JungleLakeShallows: "region/jungle-lake-shallows",
  JungleLakeDepths: "region/jungle-lake-depths",
  JungleUnderwaterCave: "region/jungle-underwater-cave",
  JungleRpg: "region/jungle-rpg",
  JungleTropicalZoneInside: "region/jungle-tropical-zone-inside",
  JungleLake20mA: "region/jungle-lake-20m-a",
  JungleLake20mB: "region/jungle-lake-20m-b",
  JungleLake75mE: "region/jungle-lake-75m-e",
  JungleLake75mF: "region/jungle-lake-75m-f",
} as const;

export type Region = typeof Region[keyof typeof Region];
export const REGIONS: readonly Region[] = Object.freeze(Object.values(Region));
const regionIds = new Set<string>(REGIONS);

export function isRegion(value: unknown): value is Region {
  return typeof value === "string" && regionIds.has(value);
}

export function parseRegion(value: string | null): Region | undefined {
  return isRegion(value) ? value : undefined;
}

export function regionFilter(value: string | null): Region | "all" {
  return parseRegion(value) ?? "all";
}

type RegionalEntity = Entity | { region?: readonly Region[] };

export function matchesRegion(entity: RegionalEntity, region: Region | "all") {
  return region === "all" || ("region" in entity && (entity.region ?? []).includes(region));
}

export function getRegions(entities: readonly RegionalEntity[]): Region[] {
  const present = new Set(entities.flatMap(entity => "region" in entity ? entity.region ?? [] : []));
  return REGIONS.filter(region => present.has(region));
}
