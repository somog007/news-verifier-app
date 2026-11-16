// useTrackedThreads.js - Claims the user has checked, persisted across visits,
// merged with the curated seed threads.
import { useEffect, useMemo, useState } from "react";
import { INITIAL_POSTS } from "../data/newsDatabase";
import { readJSON, writeJSON } from "../lib/storage";
import { normalizeClaim } from "../lib/text";

const STORAGE_KEY = "verifinews-threads-v1";
const MAX_SAVED = 50;
// News moves fast: an earlier result is only reused for a few hours while online.
export const REUSE_FOR_MS = 6 * 60 * 60 * 1000;

/**
 * Whether an earlier check of the same claim can be shown instead of checking again.
 * Offline, any earlier result is better than a pattern check. Online, re-check if the
 * earlier one was only pattern-checked or offline, or if it is older than REUSE_FOR_MS.
 */
export function canReuseCheck(previous, online, now = Date.now()) {
  if (!previous) return false;
  if (!online) return true;
  if (previous.checkedOffline || previous.method === "heuristic") return false;
  const checkedAt = Date.parse(previous.rawTimestamp || "");
  return !Number.isNaN(checkedAt) && now - checkedAt < REUSE_FOR_MS;
}

// The first version of the app saved searches under these keys; nothing reads them now.
function removeLegacyHistory() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key === "recent-checks" || key?.startsWith("verify:")) localStorage.removeItem(key);
    }
  } catch {
    // storage unavailable: nothing to clean
  }
}

const sameCheck = (a, b) =>
  normalizeClaim(a.content) === normalizeClaim(b.content) && (a.country || "Any") === (b.country || "Any");

export function useTrackedThreads() {
  const [userThreads, setUserThreads] = useState(() => {
    removeLegacyHistory();
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
