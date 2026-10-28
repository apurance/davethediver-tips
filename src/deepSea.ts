import terrain from "./data/deep-sea-terrain.json" with { type: "json" };
import distributions from "./data/deep-sea-markers.json" with { type: "json" };
import glacialTerrain from "./data/glacial-terrain.json" with { type: "json" };
import glacialDistributions from "./data/glacial-markers.json" with { type: "json" };

export type MapFamily = "A" | "B" | "C";
export type MapVariant = "01" | "02" | "03";
export type MapKey = `${MapFamily}${MapVariant}`;
export const markerKinds = ["oxygen", "rescue", "teleport", "supply", "weapon", "ammo", "amethyst", "catseye", "diamond", "topaz", "aquamarine", "uraninite", "ruby", "fish"] as const;
export type MarkerKind = typeof markerKinds[number];
export interface MapMarker {
  id: string;
  kind: MarkerKind;
  x: number;
  y: number;
  label?: string;
  scale?: number;
}
export const markerStyles: Record<MarkerKind, { label: string; color: string }> = {
  oxygen: { label: "氧气", color: "#90e9ff" },
  rescue: { label: "救生舱", color: "#8df1c7" },
  teleport: { label: "传送镜", color: "#63e5bb" },
  supply: { label: "补给箱", color: "#f2ca65" },
  weapon: { label: "武器箱", color: "#ff8790" },
  ammo: { label: "弹药", color: "#ff8790" },
  amethyst: { label: "紫水晶", color: "#d4a2ed" },
  catseye: { label: "猫眼石", color: "#bce9da" },
  diamond: { label: "钻石", color: "#c1daff" },
  topaz: { label: "黄玉", color: "#f4c374" },
  aquamarine: { label: "海蓝宝石", color: "#75e2e8" },
  uraninite: { label: "铜铀云母", color: "#95d775" },
  ruby: { label: "红宝石", color: "#f275a5" },
  fish: { label: "鱼类", color: "#f2ca65" },
};
export const mapTerrains = { ...terrain.families, ...glacialTerrain.families };
export const mapDistributions = { ...distributions, ...glacialDistributions } as Record<MapKey, MapMarker[]>;
const deepSeaKinds: MarkerKind[] = ["oxygen", "rescue", "supply", "weapon", "ammo", "amethyst", "catseye", "diamond", "fish"];
const glacialKinds: MarkerKind[] = ["oxygen", "teleport", "supply", "weapon", "ammo", "topaz", "aquamarine", "uraninite", "ruby", "fish"];
export const mapSettings = {
  A: { name: "蓝洞深海 A 类", depth: "130–250 米", eyebrow: "BLUE HOLE DEPTHS / 130–250 M", rows: terrain.rows, columns: terrain.columns, kinds: deepSeaKinds, filePrefix: "deep-sea" },
  B: { name: "蓝洞深海 B 类", depth: "130–250 米", eyebrow: "BLUE HOLE DEPTHS / 130–250 M", rows: terrain.rows, columns: terrain.columns, kinds: deepSeaKinds, filePrefix: "deep-sea" },
  C: { name: "冰河＋热泉喷口", depth: "450–570 米", eyebrow: "GLACIAL AREA & HYDROTHERMAL VENTS / 450–570 M", rows: glacialTerrain.rows, columns: glacialTerrain.columns, kinds: glacialKinds, filePrefix: "glacial" },
};

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
  C: { water: terrainPath("C", "."), purple: terrainPath("C", "p") },
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
  C: [
    { x: 59.5, y: 13, label: "第一冰河洞穴", anchor: "middle" },
    { x: 61, y: 25, label: "冰河海藻洞穴", anchor: "end" },
    { x: 61, y: 47.5, label: "第三冰河洞穴", anchor: "end" },
    { x: 18.5, y: 25, label: "海流洞穴", anchor: "middle" },
    { x: 3, y: 21.7, label: "冰空间", anchor: "middle" },
  ],
};

export function parseMapSelection(params: URLSearchParams): { family: MapFamily; variant: MapVariant } {
  return {
    family: params.get("type") === "C" ? "C" : params.get("type") === "B" ? "B" : "A",
    variant: params.get("layout") === "02" ? "02" : params.get("layout") === "03" ? "03" : "01",
  };
}
