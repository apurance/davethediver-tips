import {
  DashboardOutlined,
  CompassOutlined,
  ThunderboltOutlined,
  ShopOutlined,
  TeamOutlined,
  ExperimentOutlined,
  CalendarOutlined,
  StarOutlined,
  ExportOutlined,
  ToolOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";
import type { SectionId } from "../../data";
import { Menu } from "antd";
import { sections } from "../../data";
import { Link } from "react-router";
import { sectionPath } from "../../routing/paths";

const icons = [
  <DashboardOutlined />,
  <CompassOutlined />,
  <ThunderboltOutlined />,
  <CompassOutlined />,
  <ShopOutlined />,
  <TeamOutlined />,
  <ExperimentOutlined />,
  <ExperimentOutlined />,
  <ThunderboltOutlined />,
  <CalendarOutlined />,
  <StarOutlined />,
  <ExportOutlined />,
  <ToolOutlined />,
  <FileSearchOutlined />,
];

interface SidebarProps {
  page: SectionId | undefined;
  searchMode: boolean;
  onNavigate: () => void;
}

export function Sidebar({ page, searchMode, onNavigate }: SidebarProps) {
  return (
    <>
      <div className="brand">
        <div className="brand-symbol">
          <CompassOutlined />
        </div>
        <div>
          <strong>BLUE HOLE</strong>
          <span>深蓝攻略手册</span>
        </div>
      </div>
      <div className="nav-caption">DAVE THE DIVER / FIELD NOTES</div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={searchMode || !page ? [] : [page]}
        items={sections.map((s, i) => ({
          key: s.id,
          icon: icons[i],
          label: <Link to={sectionPath(s.id)}>{s.title}</Link>,
        }))}
        onClick={onNavigate}
      />
      <div className="sidebar-bottom">
        <span className="status-dot" /> LOCAL FIELD GUIDE
        <p>
          研究整理 · 2026.10.09
          <br />
          本体攻略 + 扩展附录
        </p>
      </div>
    </>
  );
}
