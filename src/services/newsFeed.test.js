import { describe, expect, it } from "vitest";
import { matchHeadlines, mergeHeadlines } from "./newsFeed";
import { checkOffline } from "./verificationService";

const NOW = Date.parse("2026-10-31T12:00:00Z");
const headline = (title, extra = {}) => ({ title, url: `https://example.com/${encodeURIComponent(title)}`, publishedAt: "2026-10-31T08:00:00Z", ...extra });

const SAVED = [
  headline("CBN revokes licences of 100 microfinance banks", { domain: "bbc.com", source: "BBC" }),
  headline("Central Bank of Nigeria revokes microfinance bank licences", { domain: "reuters.com", source: "Reuters" }),
  headline("Super Eagles qualify for World Cup", { domain: "punchng.com", source: "Punch" }),
];

describe("saved newsfeed", () => {
  it("keeps recent headlines, drops old and duplicate ones", () => {
    const merged = mergeHeadlines(
      [headline("New story")],
      [headline("New story"), headline("Old story", { publishedAt: "2026-10-01T00:00:00Z" }), headline("Yesterday", { publishedAt: "2026-10-30T09:00:00Z" })],
      NOW,
    );
    expect(merged.map((h) => h.title)).toEqual(["New story", "Yesterday"]);
  });

  it("matches a claim to related headlines, trusted outlets first", () => {
    const matches = matchHeadlines("CBN revokes microfinance bank licences", SAVED);
    expect(matches).toHaveLength(2);
    expect(matches.every((m) => m.trusted)).toBe(true);
    expect(matchHeadlines("Fuel price rises to 2000 naira", SAVED)).toHaveLength(0);
  });
});

describe("checkOffline", () => {
  it("uses saved headlines to support a claim while offline", () => {
    const { report, notice } = checkOffline("CBN revokes microfinance bank licences", "Nigeria", SAVED);
    expect(report.method).toBe("saved_feed");
    expect(report.checkedOffline).toBe(true);
    expect(report.verdict).toBe("VERIFIED");
    expect(report.confidence).not.toBe("high");
    expect(notice).toMatch(/2 saved headlines match/);
  });

  it("does not mark a claim false just because the saved feed lacks it", () => {
    const { report, notice } = checkOffline("NASA confirms giant diamond found in Lagos lagoon", "Any", SAVED);
    expect(report.verdict).toBe("UNVERIFIED"); // not FAKE: the saved feed is too small to judge absence
    expect(notice).toMatch(/doesn't prove anything/);
  });

  it("falls back to a pattern check when nothing is saved", () => {
    const { report } = checkOffline("Fuel price rise announced", "Any", []);
    expect(report.method).toBe("heuristic");
  });
});
