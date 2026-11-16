// useTrackedThreads.js - Claims the user has checked, persisted across visits,
// merged with the curated seed threads.
import { useEffect, useMemo, useState } from "react";
import { INITIAL_POSTS } from "../data/newsDatabase";
import { readJSON, writeJSON } from "../lib/storage";
import { normalizeClaim } from "../lib/text";

const STORAGE_KEY = "verifinews-threads-v1";
const MAX_SAVED = 50;

const sameCheck = (a, b) =>
  normalizeClaim(a.content) === normalizeClaim(b.content) && (a.country || "Any") === (b.country || "Any");

export function useTrackedThreads() {
  const [userThreads, setUserThreads] = useState(() => {
    const saved = readJSON(STORAGE_KEY, []);
    return Array.isArray(saved) ? saved : [];
  });

  useEffect(() => {
    writeJSON(STORAGE_KEY, userThreads);
  }, [userThreads]);

  const threads = useMemo(() => [...userThreads, ...INITIAL_POSTS], [userThreads]);

  const upsertThread = (report) => {
    setUserThreads((prev) => [report, ...prev.filter((p) => !sameCheck(p, report))].slice(0, MAX_SAVED));
  };

  const findPreviousCheck = (claim, country) =>
    userThreads.find((p) => sameCheck(p, { content: claim, country: country === "Any" ? undefined : country }));

  const clearUserThreads = () => setUserThreads([]);

  return { threads, userThreads, upsertThread, findPreviousCheck, clearUserThreads };
}
