import type { Ref } from "react";
import type { InputRef } from "antd";
import { Button, Tooltip, Badge } from "antd";
import { CompositionInput } from "../CompositionInput";
import { GithubOutlined, MenuOutlined, SearchOutlined, HeartOutlined } from "@ant-design/icons";

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
      <CompositionInput
        ref={searchRef}
        aria-label="搜索攻略"
        className="global-search"
        placeholder="搜索食谱、食材、鱼类、员工…"
        prefix={<SearchOutlined />}
        suffix={<kbd>Ctrl K</kbd>}
        allowClear
        value={query}
        onValueChange={setQuery}
      />
      <div className="topbar-actions">
        <Tooltip title="只看收藏的攻略">
          <Button
            type={savedOnly ? "primary" : "text"}
            icon={<HeartOutlined />}
            aria-label="查看收藏"
            onClick={() => setSavedOnly(!savedOnly)}
          >
            <Badge count={savedCount} size="small" color="#087f8c">
              <span className="save-label">收藏</span>
            </Badge>
          </Button>
        </Tooltip>
        <Button
          className="github-link"
          type="text"
          href="https://github.com/apurance/davethediver-tips"
          target="_blank"
          rel="noopener noreferrer"
          icon={<GithubOutlined />}
          aria-label="在 GitHub 查看开源代码（新标签页）"
        >
          <span className="github-label">GitHub</span>
        </Button>
      </div>
    </header>
  );
}
