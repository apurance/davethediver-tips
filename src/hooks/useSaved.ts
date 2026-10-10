import { useState, useEffect } from "react";

function readSaved<T>(key: string, initial: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : initial;
  } catch {
    return initial;
  }
}

export function useSaved<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readSaved(key, initial));
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Private mode still supports in-session use. */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
