import { Navigate, useLocation } from "react-router";
import type { RouteObject } from "react-router";
import App from "../App";
import { sections } from "../data";
import { useGuideContext } from "../hooks/useGuideContext";
import { OverviewPage } from "../pages/OverviewPage";
import { SectionPage } from "../pages/SectionPage";
import { SearchPage } from "../pages/SearchPage";
import { SourcesPage } from "../pages/SourcesPage";
import { MapsPage } from "../pages/MapsPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { IngredientsPage } from "../pages/IngredientsPage";
import { AllocationPage } from "../pages/AllocationPage";
import { EntityPage } from "../pages/EntityPage";
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
        .filter((section) => !["overview", "sources", "ingredients", "maps", "allocation"].includes(section.id))
        .map((section) => ({
          path: section.id,
          element: <SectionPage section={section.id} />,
          handle: { section: section.id },
        })),
      { path: "ingredients", Component: IngredientsPage, handle: { section: "ingredients" } },
      { path: "allocation", Component: AllocationPage, handle: { section: "allocation" } },
      { path: "maps", Component: MapsPage, handle: { section: "maps" } },
      { path: "fish", element: <IngredientsPage fish />, handle: { section: "ingredients" } },
      { path: "recipes/:slug", element: <EntityPage type="recipe" />, handle: { section: "recipes" } },
      { path: "ingredients/:slug", element: <EntityPage type="ingredient" />, handle: { section: "ingredients" } },
      { path: "fish/:slug", element: <EntityPage type="fish" />, handle: { section: "ingredients" } },
      { path: "staff/:slug", element: <EntityPage type="staff" />, handle: { section: "staff" } },
      { path: "sources", Component: SourcesPage, handle: { section: "sources" } },
      { path: "search", id: "search", Component: SearchPage },
      { path: "bookmarks", id: "bookmarks", Component: SearchPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
];
