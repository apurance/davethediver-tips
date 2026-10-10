import type { Ref } from "react";
import type { InputRef } from "antd";
import { Button, Input, Tooltip, Badge } from "antd";
import { MenuOutlined, SearchOutlined, HeartOutlined } from "@ant-design/icons";

interface TopbarProps {
  title: string;
  searchMode: boolean;
  query: string;
  setQuery: (value: string) => void;
  savedOnly: boolean;
  setSavedOnly: (value: boolean) => void;
  savedCount: number;
  searchRef: Ref<InputRef>;
  onOpenMenu: () => void;
}

export function Topbar({
  title,
  searchMode,
  query,
  setQuery,
  savedOnly,
  setSavedOnly,
  savedCount,
  searchRef,
  onOpenMenu,
}: TopbarProps) {
  return (
    <header className="topbar">
      <Button
        className="mobile-menu"
        aria-label="打开导航目录"
        icon={<MenuOutlined />}
        onClick={onOpenMenu}
      />
      <div className="breadcrumb">
        攻略手册 <span>/</span> {searchMode ? "检索结果" : title}
      </div>
      <Input
        ref={searchRef}
        aria-label="搜索攻略"
        className="global-search"
        placeholder="搜索菜谱、员工、装备…"
        prefix={<SearchOutlined />}
        suffix={<kbd>Ctrl K</kbd>}
        allowClear
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Tooltip title="只看收藏的攻略">
        <Button
          type={savedOnly ? "primary" : "text"}
          icon={<HeartOutlined />}
          aria-label="查看收藏"
          onClick={() => {
            setSavedOnly(!savedOnly);
            setQuery("");
          }}
        >
          <Badge count={savedCount} size="small" color="#087f8c">
            <span className="save-label">收藏</span>
          </Badge>
        </Button>
      </Tooltip>
      </header>
  );
}
