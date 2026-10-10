import { sections } from "../data.ts";
import type { SectionId } from "../data.ts";

export function sectionPath(id: SectionId) {
  return id === "overview" ? "/" : `/${id}`;
}

export function legacySectionPath(hash: string) {
  const section = sections.find((item) => item.id === hash.slice(1));
  return section ? sectionPath(section.id) : null;
}
