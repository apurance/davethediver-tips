import { App as AntApp, Drawer, Space, Tag, Button } from "antd";
import { useEffect } from "react";
import { useGuideState } from "./hooks/useGuideState";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { getPageMetadata, renderPageMetadata } from "./routing/seo";

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.head.querySelectorAll("[data-page-seo]").forEach((tag) => tag.remove());
    document.head.insertAdjacentHTML("beforeend", renderPageMetadata(getPageMetadata(pathname)));
  }, [pathname]);

  return (
    <AntApp>
      <GuideApp />
    </AntApp>
  );
}

function GuideApp() {
  const state = useGuideState();
  const {
    page,
    active,
    searchMode,
    mobile,
    setMobile,
    query,
    setQuery,
    savedOnly,
    setSavedOnly,
    saved,
    searchRef,
  } = state;
  const sidebar = (
    <Sidebar
      page={page}
      searchMode={searchMode}
      onNavigate={() => setMobile(false)}
    />
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">{sidebar}</aside>
      <Drawer
        title="深蓝攻略目录"
        placement="left"
        open={mobile}
        onClose={() => setMobile(false)}
        styles={{ body: { padding: 0, background: "#102e43" } }}
      >
        {sidebar}
      </Drawer>
      <div className="workspace">
        <Topbar
          title={active.title}
          searchMode={searchMode}
          query={query}
          setQuery={setQuery}
          savedOnly={savedOnly}
          setSavedOnly={setSavedOnly}
          savedCount={saved.length}
          searchRef={searchRef}
          onOpenMenu={() => setMobile(true)}
        />
        <main>
          <div className="page-controls">
            <Space size={8} wrap>
              <Tag variant="filled" color="cyan">
                本体为主
              </Tag>
              <span className="muted small">资料核对 2026.10.09</span>
            </Space>
          </div>
          <Outlet context={state} />
          <footer>
            <span className="mono">BLUE HOLE / FIELD NOTES</span>
            <span>非官方攻略 · 本地保存收藏与清单 · 数据来源可查</span>
            <Button size="small" type="text" onClick={() => window.print()}>
              打印当前页
            </Button>
          </footer>
        </main>
      </div>
      <ScrollRestoration />
    </div>
  );
}
