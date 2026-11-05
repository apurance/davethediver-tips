import type { Entity } from "./catalog.ts";

export const partyNames: Record<string, string> = {
  jellyfish: "水母派对",
  tuna: "金枪鱼派对",
  marlin: "旗鱼派对",
  shark: "鲨鱼派对",
  cucumber: "黄瓜派对",
  curry: "咖喱派对",
  shrimp: "虾派对",
  lobster: "龙虾派对",
};

export function partyFilter(value: string | null): string {
  return value && Object.hasOwn(partyNames, value) ? value : "all";
}

export function matchesParty(entity: Entity, party: string): boolean {
  return party === "all" || (entity.type === "recipe" && !!entity.event?.includes(party));
}

export function partyUrl(party: string): string {
  return `/recipes?${new URLSearchParams({ event: party })}`;
}
