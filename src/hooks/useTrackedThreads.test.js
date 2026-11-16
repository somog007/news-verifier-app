import { describe, expect, it } from "vitest";
import { REUSE_FOR_MS, canReuseCheck } from "./useTrackedThreads";
import { formatRelative } from "../lib/time";
import { INITIAL_POSTS } from "../data/newsDatabase";

const NOW = Date.parse("2026-11-17T12:00:00Z");
const check = (ageMs, extra = {}) => ({ rawTimestamp: new Date(NOW - ageMs).toISOString(), method: "online", ...extra });

describe("reusing an earlier check", () => {
  it("reuses a recent live result", () => {
    expect(canReuseCheck(check(60_000), true, NOW)).toBe(true);
  });

  it("checks again when the earlier result is older than the reuse window", () => {
    expect(canReuseCheck(check(REUSE_FOR_MS + 1), true, NOW)).toBe(false);
    expect(canReuseCheck(check(90 * 86_400_000), true, NOW)).toBe(false);
  });

  it("checks again online when the earlier result was offline or pattern-only", () => {
    expect(canReuseCheck(check(60_000, { checkedOffline: true }), true, NOW)).toBe(false);
    expect(canReuseCheck(check(60_000, { method: "heuristic" }), true, NOW)).toBe(false);
  });

  it("offline, shows any earlier result rather than a pattern check", () => {
    expect(canReuseCheck(check(90 * 86_400_000), false, NOW)).toBe(true);
    expect(canReuseCheck(undefined, false, NOW)).toBe(false);
  });
});

describe("dates of past checks", () => {
  it("curated examples keep a fixed date instead of looking minutes old", () => {
    for (const post of INITIAL_POSTS) {
      expect(formatRelative(post.rawTimestamp, NOW)).not.toMatch(/ago|Just now/);
    }
  });

  it("shows a readable date for checks older than a week", () => {
    expect(formatRelative("2026-09-02T18:00:00Z", NOW)).toMatch(/2026/);
    expect(formatRelative(new Date(NOW - 5 * 60_000).toISOString(), NOW)).toBe("5 mins ago");
  });
});
