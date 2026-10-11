import { useState, useRef, useEffect, useMemo } from "react";
import type { SectionId, Phase } from "../data";
import { sections, articles, recipes } from "../data";
import { useSaved } from "./useSaved";
import type { InputRef } from "antd";
import { useLocation, useMatches, useNavigate, useSearchParams } from "react-router";
import { sectionPath } from "../routing/paths";
import { searchCatalog } from "../catalog";

export function useGuideState() {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const matches = useMatches();
  const route = matches[matches.length - 1];
  const page = (route.handle as { section?: SectionId } | undefined)?.section;
  const isSearching = route.id === "search";
  const [phase, setPhase] = useSaved<string>("bluehole.phase.v1", "all");
  const [spoilers, setSpoilers] = useSaved<boolean>(
    "bluehole.spoilers.v1",
    false,
  );
  const [saved, setSaved] = useSaved<string[]>("bluehole.bookmarks.v1", []);
  const query = isSearching ? searchParams.get("q") ?? "" : "";
  const savedOnly = route.id === "bookmarks";
  const [mobile, setMobile] = useState(false);
  const calcRecipe =
    recipes.find((recipe) => recipe.id === searchParams.get("recipe"))?.id ??
    "tropical";
  const searchRef = useRef<InputRef>(null);
  const returnTo = typeof location.state?.returnTo === "string"
    ? location.state.returnTo
    : "/";
  const backgroundPath = page ? location.pathname + location.search : returnTo;
  const setQuery = (value: string) => {
    if (value) {
      routerNavigate(`/search?${new URLSearchParams({ q: value })}`, {
        replace: isSearching,
        state: { returnTo: backgroundPath },
        preventScrollReset: true,
      });
    } else if (isSearching) {
      routerNavigate(returnTo, { replace: true });
    }
  };
  const setSavedOnly = (value: boolean) => {
    routerNavigate(value ? "/bookmarks" : returnTo, {
      state: value ? { returnTo: backgroundPath } : null,
    });
  };
  const setCalcRecipe = (id: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("recipe", id);
        return next;
      },
      { replace: true },
    );
  };
  const navigate = (id: SectionId) => {
    routerNavigate(sectionPath(id));
    setMobile(false);
  };
  useEffect(() => {
    setMobile(false);
  }, [location.pathname]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.isComposing || e.keyCode === 229) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape" && isSearching) {
        routerNavigate(returnTo, { replace: true });
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
    };
  }, [isSearching, returnTo, routerNavigate]);
  const toggle = (id: string) =>
    setSaved(
      saved.includes(id) ? saved.filter((v) => v !== id) : [...saved, id],
    );
  const filtered = useMemo(
    () =>
      articles.filter(
        (a) =>
          (phase === "all" || a.phases.includes(phase as Phase)) &&
          (spoilers || !a.spoiler) &&
          (!savedOnly || saved.includes(a.id)) &&
          (!query.trim() ||
            `${a.title} ${a.lead} ${a.steps.join(" ")} ${a.tip}`
              .toLocaleLowerCase()
              .includes(query.trim().toLocaleLowerCase())),
      ),
    [phase, spoilers, savedOnly, saved, query],
  );
  const active = sections.find((s) => s.id === page) ?? {
    title: "页面未找到",
    en: "NOT FOUND",
    desc: "这个地址没有对应的攻略页面。",
  };
  const searchMode = isSearching || savedOnly;
  const matchedCatalog = !savedOnly && query.trim() ? searchCatalog(query) : [];
  const plan = (id: string) => {
    routerNavigate(`/tools?${new URLSearchParams({ recipe: id })}`);
    setMobile(false);
  };

  return {
    page,
    phase,
    setPhase,
    spoilers,
    setSpoilers,
    saved,
    query,
    setQuery,
    savedOnly,
    setSavedOnly,
    mobile,
    setMobile,
    calcRecipe,
    setCalcRecipe,
    searchRef,
    navigate,
    toggle,
    filtered,
    active,
    searchMode,
    matchedCatalog,
    plan,
  };
}

export type GuideState = ReturnType<typeof useGuideState>;
