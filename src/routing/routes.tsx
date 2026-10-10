import { Navigate, useLocation } from "react-router";
import type { RouteObject } from "react-router";
import App from "../App";
import { sections } from "../data";
import { useGuideContext } from "../hooks/useGuideContext";
import { OverviewPage } from "../pages/OverviewPage";
import { SectionPage } from "../pages/SectionPage";
import { SearchPage } from "../pages/SearchPage";
import { SourcesPage } from "../pages/SourcesPage";
import { ToolsPage } from "../pages/ToolsPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { legacySectionPath } from "./paths";

function OverviewRoute() {
  const state = useGuideContext();
  const { hash } = useLocation();
  const legacyPath = legacySectionPath(hash);
  if (legacyPath) return <Navigate to={legacyPath} replace />;
  return <OverviewPage {...state} />;
}

export const routes: RouteObject[] = [
  {
    path: "/",
    Component: App,
    children: [
      { index: true, Component: OverviewRoute, handle: { section: "overview" } },
      { path: "overview", element: <Navigate to="/" replace /> },
      ...sections
        .filter((section) => !["overview", "tools", "sources"].includes(section.id))
        .map((section) => ({
          path: section.id,
          element: <SectionPage section={section.id} />,
          handle: { section: section.id },
        })),
      { path: "tools", Component: ToolsPage, handle: { section: "tools" } },
      { path: "sources", Component: SourcesPage, handle: { section: "sources" } },
      { path: "search", id: "search", Component: SearchPage },
      { path: "bookmarks", id: "bookmarks", Component: SearchPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
];
