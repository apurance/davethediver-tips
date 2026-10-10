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

const icons = [
  <DashboardOutlined />,
  <CompassOutlined />,
  <ThunderboltOutlined />,
  <ShopOutlined />,
  <TeamOutlined />,
  <ExperimentOutlined />,
  <ThunderboltOutlined />,
  <CalendarOutlined />,
  <StarOutlined />,
  <ExportOutlined />,
  <ToolOutlined />,
  <FileSearchOutlined />,
];

interface SidebarProps {
  page: SectionId;
  searchMode: boolean;
  navigate: (id: SectionId) => void;
}

export function Sidebar({ page, searchMode, navigate }: SidebarProps) {
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
        selectedKeys={searchMode ? [] : [page]}
        items={sections.map((s, i) => ({
          key: s.id,
          icon: icons[i],
          label: s.title,
        }))}
        onClick={({ key }) => navigate(key as SectionId)}
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
