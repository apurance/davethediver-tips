import terrain from "./data/deep-sea-terrain.json";
import distributions from "./data/deep-sea-markers.json";

export type MapFamily = "A" | "B";
export type MapVariant = "01" | "02" | "03";
export type MapKey = `${MapFamily}${MapVariant}`;
export const markerKinds = ["oxygen", "rescue", "supply", "weapon", "ammo", "amethyst", "catseye", "diamond", "fish"] as const;
export type MarkerKind = typeof markerKinds[number];
export interface MapMarker {
  id: string;
  kind: MarkerKind;
  x: number;
  y: number;
  label?: string;
}
export const markerStyles: Record<MarkerKind, { label: string; color: string }> = {
  oxygen: { label: "氧气", color: "#90e9ff" },
  rescue: { label: "救生舱", color: "#8df1c7" },
  supply: { label: "补给箱", color: "#f2ca65" },
  weapon: { label: "武器箱", color: "#ff8790" },
  ammo: { label: "弹药", color: "#ff8790" },
  amethyst: { label: "紫水晶", color: "#d4a2ed" },
  catseye: { label: "猫眼石", color: "#bce9da" },
  diamond: { label: "钻石", color: "#c1daff" },
  fish: { label: "大鱼", color: "#f2ca65" },
};
export const mapTerrains = terrain.families;
export const mapDistributions = distributions as Record<MapKey, MapMarker[]>;

/** Shared geometry is built once per family, independent of the distribution. */
export function terrainPath(family: MapFamily, cell: "." | "p") {
  return mapTerrains[family].flatMap((row, y) => {
    const runs: string[] = [];
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== cell) continue;
      const start = x;
      while (row[x + 1] === cell) x++;
      const width = x - start + 1;
      runs.push(`M${start} ${y}h${width}v1h-${width}Z`);
    }
    return runs;
  }).join("");
}

export const mapGeometry = {
  A: { water: terrainPath("A", "."), purple: terrainPath("A", "p") },
  B: { water: terrainPath("B", "."), purple: terrainPath("B", "p") },
};

export const landmarks: Record<MapFamily, { x: number; y: number; label: string; anchor: "middle" | "end" }[]> = {
  A: [
    { x: 63, y: 29, label: "海底湖 →", anchor: "end" },
    { x: 45, y: 34.5, label: "洞窟", anchor: "middle" },
    { x: 63, y: 65, label: "鲛人村 →", anchor: "end" },
  ],
  B: [
    { x: 63, y: 34.5, label: "海底湖 →", anchor: "end" },
    { x: 27, y: 31.5, label: "洞窟", anchor: "middle" },
    { x: 63, y: 66, label: "鲛人村 →", anchor: "end" },
    { x: 61.5, y: 22, label: "公主", anchor: "end" },
  ],
};

export function parseMapSelection(params: URLSearchParams): { family: MapFamily; variant: MapVariant } {
  return {
    family: params.get("type") === "B" ? "B" : "A",
    variant: params.get("layout") === "02" ? "02" : params.get("layout") === "03" ? "03" : "01",
  };
}
