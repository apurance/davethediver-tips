import { Link } from "react-router";
import { Space } from "antd";
import { PageHeading } from "../components/PageHeading";
import { CatalogSection } from "../components/CatalogSection";

export function IngredientsPage({ fish = false }: { fish?: boolean }) {
  return <>
    <PageHeading eyebrow="INGREDIENTS & MARINE LIFE" title={fish ? "鱼类图鉴" : "食材目录"} description="从鱼类查产出，从食材查菜谱，安排下一次采集。" />
    <Space className="catalog-tabs">
      <Link className={`catalog-tab ${!fish ? "catalog-tab-active" : ""}`} to="/ingredients">全部食材</Link>
      <Link className={`catalog-tab ${fish ? "catalog-tab-active" : ""}`} to="/fish">鱼类图鉴</Link>
    </Space>
    <CatalogSection key={fish ? "fish" : "ingredient"} type={fish ? "fish" : "ingredient"} />
  </>;
}
