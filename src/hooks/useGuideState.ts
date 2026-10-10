import { useState, useRef, useEffect, useMemo } from "react";
import type { SectionId, Phase } from "../data";
import { sections, articles, recipes } from "../data";
import { useSaved } from "./useSaved";
import type { InputRef } from "antd";

export function useGuideState() {
  const [page, setPage] = useState<SectionId>(() => {
    const id = location.hash.slice(1);
    return sections.some((s) => s.id === id) ? (id as SectionId) : "overview";
  });
  const [phase, setPhase] = useSaved<string>("bluehole.phase.v1", "all");
  const [spoilers, setSpoilers] = useSaved<boolean>(
    "bluehole.spoilers.v1",
    false,
  );
  const [saved, setSaved] = useSaved<string[]>("bluehole.bookmarks.v1", []);
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [calcRecipe, setCalcRecipe] = useState("tropical");
  const searchRef = useRef<InputRef>(null);
  const navigate = (id: SectionId) => {
    setPage(id);
    location.hash = id;
    setQuery("");
    setSavedOnly(false);
    setMobile(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  useEffect(() => {
    const hash = () => {
      const id = location.hash.slice(1);
      if (sections.some((s) => s.id === id)) setPage(id as SectionId);
    };
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setQuery("");
    };
    window.addEventListener("hashchange", hash);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("keydown", key);
    };
  }, []);
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
  const active = sections.find((s) => s.id === page)!;
  const searchMode = !!query.trim() || savedOnly;
  const matchedRecipes = recipes.filter(
    (r) =>
      !savedOnly &&
      !!query.trim() &&
      (phase === "all" || r.phase === phase) &&
      `${r.name} ${r.en} ${r.role} ${r.unlock} ${r.ingredients.map(([n]) => n).join(" ")}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  const plan = (id: string) => {
    setCalcRecipe(id);
    navigate("tools");
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
    matchedRecipes,
    plan,
  };
}

export type GuideState = ReturnType<typeof useGuideState>;
