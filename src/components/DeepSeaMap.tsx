import { useId } from "react";
import type { Ref } from "react";
import { landmarks, mapGeometry, mapSettings, markerStyles } from "../deepSea";
import type { MapFamily, MapKey, MapMarker, MarkerKind } from "../deepSea";

export function MapGlyph({ kind }: { kind: MarkerKind }) {
  switch (kind) {
    case "oxygen": return <><circle r=".53" /><circle r=".23" fill="white" stroke="none" /></>;
    case "rescue": return <><rect x="-.45" y="-.52" width=".9" height="1.04" rx=".16" /><path d="M-.16-.35V.35" stroke="white" strokeWidth=".14" /></>;
    case "teleport": return <><circle r=".57" /><circle r=".26" fill="white" stroke="none" /><path d="M-.48 .48L.48-.48" fill="none" stroke="white" strokeWidth=".1" /></>;
    case "supply": return <><rect x="-.53" y="-.4" width="1.06" height=".8" rx=".05" /><path d="M-.5-.1H.5M0-.35V.36" stroke="#92722b" strokeWidth=".09" /></>;
    case "weapon": return <><rect x="-.53" y="-.4" width="1.06" height=".8" rx=".05" /><path d="M-.27 0H.27" stroke="white" strokeWidth=".22" /></>;
    case "ammo": return <path d="M0-.58L.58.43H-.58Z" />;
    case "catseye": return <><ellipse rx=".43" ry=".55" /><ellipse rx=".13" ry=".35" fill="#087f8c" stroke="none" /></>;
    case "amethyst": case "diamond": case "topaz": case "aquamarine": case "uraninite": case "ruby": return <><path d="M0-.6L.45-.18L.32.45L0 .6L-.32.45L-.45-.18Z" /><path d="M0-.48V.48M-.4-.18H.4" stroke="white" strokeWidth=".09" /></>;
    case "fish": return <><path d="M-2 0Q0-1.3 2.2 0Q0 1.3-2 0L-2.8-.9V.9Z" /><path d="M-.3-.55L.2-1.15L.6-.55" /><circle cx="1.5" cy="-.1" r=".12" fill="#10283e" stroke="none" /></>;
  }
}

export function MapLegendIcon({ kind }: { kind: MarkerKind }) {
  return <svg width="22" height="22" viewBox={kind === "fish" ? "-3 -3 6 6" : "-1 -1 2 2"} aria-hidden="true">
    <g fill={markerStyles[kind].color} stroke="#10283e" strokeWidth=".12"><MapGlyph kind={kind} /></g>
  </svg>;
}

interface DeepSeaMapProps {
  family: MapFamily;
  mapKey: MapKey;
  markers: MapMarker[];
  grid: boolean;
  labels: boolean;
  svgRef: Ref<SVGSVGElement>;
}

export function DeepSeaMap({ family, mapKey, markers, grid, labels, svgRef }: DeepSeaMapProps) {
  const id = useId().replaceAll(":", "");
  const settings = mapSettings[family];
  const glacial = family === "C";
  return <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`-1 -1 ${settings.columns + 2} ${settings.rows + 2}`} width="960" height={Math.round(960 * (settings.rows + 2) / (settings.columns + 2))}
    className="deep-sea-svg" role="img" aria-labelledby={`${id}-title ${id}-description`} fontFamily="Microsoft YaHei, sans-serif" data-map={mapKey}>
    <title id={`${id}-title`}>{settings.name} · 分布 {mapKey.slice(1)}</title>
    <desc id={`${id}-description`}>{glacial ? "浅蓝为冰河岩壁，浅橙为热泉岩壁，蓝绿色为水域。" : "深蓝为岩石、蓝绿色为水域、紫色为原图紫色岩层。"}道具以不同形状标记，鱼类附名称。根据 CleverLab / 甜菜的参考图片重绘，位置为示意。</desc>
    {glacial && <defs><linearGradient id={`${id}-rock`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#e8f4f7" /><stop offset="63%" stopColor="#e8f4f7" /><stop offset="88%" stopColor="#f5ccb4" /><stop offset="100%" stopColor="#eab39c" />
    </linearGradient></defs>}
    <rect x="-1" y="-1" width={settings.columns + 2} height={settings.rows + 2} fill={glacial ? `url(#${id}-rock)` : "#10283e"} />
    <g data-layer="terrain" data-family={family} shapeRendering="crispEdges">
      <path d={mapGeometry[family].water} fill="#227c96" />
      <path d={mapGeometry[family].purple} fill="#705a8b" />
    </g>
    {grid && <><defs><pattern id={`${id}-grid`} width="1" height="1" patternUnits="userSpaceOnUse">
      <path d="M1 0H0V1" fill="none" stroke="white" opacity=".09" strokeWidth=".035" />
    </pattern></defs><rect width={settings.columns} height={settings.rows} fill={`url(#${id}-grid)`} pointerEvents="none" /></>}
    <g data-layer="markers">
      {markers.map(marker => <g key={marker.id} transform={`translate(${marker.x} ${marker.y})`} data-kind={marker.kind}
        fill={markerStyles[marker.kind].color} stroke="#10283e" strokeWidth=".14">
        <title>{marker.label ?? markerStyles[marker.kind].label}</title>
        <g transform={`scale(${marker.scale ?? 1})`}><MapGlyph kind={marker.kind} /></g>
        {labels && marker.label && <text y={marker.scale ? 1 : 1.65} textAnchor="middle" fill="white" stroke="#10283e" strokeWidth=".2" paintOrder="stroke" fontSize={marker.scale ? .75 : 1.1}>{marker.label}</text>}
      </g>)}
    </g>
    <g data-layer="landmarks" fill="#bce9da" stroke="#10283e" strokeWidth=".26" paintOrder="stroke" fontSize="1.1" fontWeight="600">
      {landmarks[family].map(point => <text key={point.label} x={point.x} y={point.y} textAnchor={point.anchor}>{point.label}</text>)}
    </g>
  </svg>;
}
