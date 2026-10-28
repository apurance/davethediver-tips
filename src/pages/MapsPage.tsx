import { useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Button, Card, Checkbox, Segmented, Space, Switch, Tag } from "antd";
import { DownloadOutlined, MinusOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { PageHeading } from "../components/PageHeading";
import { DeepSeaMap, MapLegendIcon } from "../components/DeepSeaMap";
import { mapDistributions, mapSettings, markerKinds, markerStyles, parseMapSelection } from "../deepSea";
import type { MapFamily, MapKey, MapVariant, MarkerKind } from "../deepSea";
import "./maps.css";

const variants: MapVariant[] = ["01", "02", "03"];

function exportSvg(source: SVGSVGElement, mapKey: MapKey, enabled: MarkerKind[]) {
  const family = mapKey[0] as MapFamily;
  const settings = mapSettings[family];
  const glacial = family === "C";
  const height = settings.rows + 20;
  const ns = "http://www.w3.org/2000/svg";
  const svg = source.cloneNode(true) as SVGSVGElement;
  svg.removeAttribute("class");
  svg.setAttribute("width", "960");
  svg.setAttribute("height", String(Math.round(960 * height / 66)));
  svg.setAttribute("viewBox", `-1 -5 66 ${height}`);
  const background = document.createElementNS(ns, "rect");
  Object.entries({ x: "-1", y: "-5", width: "66", height: String(height), fill: "#f5f8f9" }).forEach(([key, value]) => background.setAttribute(key, value));
  svg.insertBefore(background, svg.firstChild);
  const text = (x: number, y: number, label: string, size: number) => {
    const el = document.createElementNS(ns, "text");
    Object.entries({ x: String(x), y: String(y), fill: "#102e43", "font-size": String(size) }).forEach(([key, value]) => el.setAttribute(key, value));
    el.textContent = label;
    svg.appendChild(el);
  };
  text(0, -2.4, `${settings.name} · ${mapKey.slice(1)} / ${settings.depth}`, 1.7);
  // Reuse the screen's vector symbols to keep the downloaded legend consistent.
  enabled.forEach((kind, i) => {
    const marker = source.querySelector(`[data-kind="${kind}"]`);
    if (!marker) return;
    const x = (i % 5) * 12.8 + 2;
    const y = settings.rows + 4 + Math.floor(i / 5) * 2.7;
    const symbol = marker.cloneNode(true) as SVGGElement;
    symbol.setAttribute("transform", `translate(${x} ${y})${kind === "fish" ? " scale(.35)" : ""}`);
    symbol.querySelector("g")?.removeAttribute("transform");
    symbol.querySelectorAll("text").forEach(el => el.remove());
    svg.appendChild(symbol);
    text(x + 1, y + .35, markerStyles[kind].label, .95);
  });
  text(1, settings.rows + 10, glacial ? "浅蓝：冰河岩壁　浅橙：热泉岩壁　蓝绿：水域" : "深蓝：岩石　蓝绿：水域　紫色：原图紫色岩层", .85);
  text(1, settings.rows + 12, "原图：CleverLab / 甜菜 · SVG 重绘 · 标记为示意位置", .8);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`)}`;
}

export function MapsPage() {
  const [params, setParams] = useSearchParams();
  const { family, variant } = parseMapSelection(params);
  const mapKey: MapKey = `${family}${variant}`;
  const settings = mapSettings[family];
  const glacial = family === "C";
  const [enabled, setEnabled] = useState<MarkerKind[]>([...markerKinds]);
  const [grid, setGrid] = useState(true);
  const [labels, setLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [downloadHref, setDownloadHref] = useState<string>();
  const svgRef = useRef<SVGSVGElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const points = mapDistributions[mapKey];
  const visibleMarkers = points.filter(point => enabled.includes(point.kind));
  const counts = Object.fromEntries(settings.kinds.map(kind => [kind, points.filter(point => point.kind === kind).length])) as Record<MarkerKind, number>;

  useLayoutEffect(() => {
    if (svgRef.current) setDownloadHref(exportSvg(svgRef.current, mapKey, settings.kinds.filter(kind => enabled.includes(kind) && counts[kind] > 0)));
  }, [mapKey, enabled, grid, labels]);

  const select = (nextFamily: MapFamily, nextVariant: MapVariant) => {
    setParams(current => {
      const next = new URLSearchParams(current);
      next.set("type", nextFamily);
      next.set("layout", nextVariant);
      return next;
    }, { preventScrollReset: true });
    viewportRef.current?.scrollTo({ top: 0, left: 0 });
  };

  return <>
    <PageHeading title={glacial ? "冰河＋热泉地图" : "深海地图"} eyebrow={settings.eyebrow} description={glacial ? "冰河与热泉喷口共用一套地形，提供 01–03 三套物资与鱼类分布。" : "两种深海地形，六套分布。选择与你这一潜相同的地图。"} />
    <Card className="map-select-card">
      <div className="map-select-row">
        <div className="map-selector"><span>区域</span><Segmented aria-label="地图区域" value={glacial ? "glacial" : "deep-sea"}
          options={[{ value: "deep-sea", label: "蓝洞深海" }, { value: "glacial", label: "冰河＋热泉" }]}
          onChange={value => select(value === "glacial" ? "C" : "A", variant)} /></div>
        {!glacial && <div className="map-selector"><span>地形</span><Segmented aria-label="地图地形" value={family}
          options={[{ value: "A", label: "A 类" }, { value: "B", label: "B 类" }]}
          onChange={value => select(value as MapFamily, variant)} /></div>}
        <div className="map-selector"><span>物资与鱼类分布</span><Segmented aria-label="物资与鱼类分布" value={variant}
          options={variants} onChange={value => select(family, value as MapVariant)} /></div>
        <div className="map-selection-id mono" aria-live="polite">{glacial ? "冰河＋热泉" : family} · {variant}</div>
      </div>
    </Card>
    <div className="map-layout">
      <section className="map-panel" aria-label={`${settings.name}地图视图`}>
        <div className="map-toolbar">
          <strong>{settings.name} · 分布 {variant}</strong>
          <Space size={4} wrap>
            <Button type="text" aria-label="缩小地图" icon={<MinusOutlined />} disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - .25))} />
            <span className="map-zoom mono" aria-live="polite">{Math.round(zoom * 100)}%</span>
            <Button type="text" aria-label="放大地图" icon={<PlusOutlined />} disabled={zoom >= 3} onClick={() => setZoom(value => Math.min(3, value + .25))} />
            <Button type="text" aria-label="重置地图缩放" icon={<ReloadOutlined />} onClick={() => { setZoom(1); viewportRef.current?.scrollTo({ top: 0, left: 0 }); }}>重置</Button>
            <Button icon={<DownloadOutlined />} href={downloadHref} download={`${settings.filePrefix}-${mapKey}.svg`}>下载 SVG</Button>
          </Space>
        </div>
        <div ref={viewportRef} className={`map-viewport${zoom > 1 ? " map-viewport-zoomed" : ""}`} tabIndex={0} aria-label="地图滚动区域">
          <div className="map-canvas" style={{ width: `${zoom * 100}%` }}>
            <DeepSeaMap family={family} mapKey={mapKey} markers={visibleMarkers} grid={grid} labels={labels} svgRef={svgRef} />
          </div>
        </div>
        <div className="map-caption"><span>{visibleMarkers.length} / {points.length} 个标记可见</span><span>放大后可横向、纵向滚动查看</span></div>
      </section>
      <aside className="map-sidebar" aria-label="地图图层与说明">
        <Card title="地图图层" size="small">
          <div className="map-layer-actions"><Button size="small" type="text" onClick={() => setEnabled([...markerKinds])}>全部显示</Button><Button size="small" type="text" onClick={() => setEnabled([])}>仅看地形</Button></div>
          <div className="map-layer-list">
            {settings.kinds.map(kind => <div className="map-layer-row" key={kind}>
              <Checkbox checked={enabled.includes(kind)} onChange={event => setEnabled(current => event.target.checked ? [...current, kind] : current.filter(item => item !== kind))}>
                <span className="map-layer-label"><MapLegendIcon kind={kind} />{markerStyles[kind].label}</span>
              </Checkbox><span className="map-layer-count mono">{counts[kind]}</span>
            </div>)}
          </div>
          <div className="map-display-options">
            <label><span>方格线</span><Switch size="small" aria-label="显示方格线" checked={grid} onChange={setGrid} /></label>
            <label><span>鱼类名称</span><Switch size="small" aria-label="显示鱼类名称" checked={labels} onChange={setLabels} /></label>
          </div>
          <div className="map-terrain-legend"><span><i style={{ background: glacial ? "#e8f4f7" : "#10283e" }} />{glacial ? "冰河岩壁" : "岩石"}</span><span><i style={{ background: "#227c96" }} />水域</span><span><i style={{ background: glacial ? "#eab39c" : "#705a8b" }} />{glacial ? "热泉岩壁" : "紫色岩层"}</span></div>
        </Card>
        <div className="map-help"><Tag color="cyan">{settings.depth}</Tag><p>同类地图共用地形，切换编号只改变物资与鱼类分布。切换区域时保留当前编号与图层选择。</p><p>{glacial ? "浅蓝至浅橙沿用原图冰河至热泉的岩壁配色；未注明名称的鱼类保留点位并标为未标名。" : "标记为参考图上的示意位置，紫色区域沿用原图岩层颜色。"}</p></div>
      </aside>
    </div>
  </>;
}
