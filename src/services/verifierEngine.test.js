import { describe, expect, it } from "vitest";
import { analyzeClaim, parseClaimInput } from "./verifierEngine";
import { fromAiResult } from "./verificationService";
import { hasTerm } from "../lib/text";

const FIXED_NOW = new Date("2026-10-31T12:00:00Z");

describe("hasTerm", () => {
  it("matches whole words only", () => {
    expect(hasTerm("He said it was fine", "ai")).toBe(false);
    expect(hasTerm("New AI chip launched", "ai")).toBe(true);
    expect(hasTerm("understand the issue", "un")).toBe(false);
  });
});

describe("parseClaimInput", () => {
  it("treats sentences that mention a domain as text, not URLs", () => {
    expect(parseClaimInput("I read on reuters.com that rates fell").isUrl).toBe(false);
  });

  it("detects social platforms and X handles", () => {
    const info = parseClaimInput("https://x.com/somebody/status/123");
    expect(info.socialPlatform).toBe("X (formerly Twitter)");
    expect(info.socialHandle).toBe("@somebody");
  });

  it("does not treat lookalike domains as trusted platforms", () => {
    expect(parseClaimInput("https://notx.com/a").socialPlatform).toBeNull();
  });
});

describe("analyzeClaim", () => {
  it("returns null for empty input", () => {
    expect(analyzeClaim("   ")).toBeNull();
  });

  it("never marks a plain claim with no signals as verified", () => {
    const report = analyzeClaim("The new bridge in town opens next week", "Any", FIXED_NOW);
    expect(report.verdict).toBe("UNVERIFIED");
    expect(report.originRadar.preShareRecommendation).toMatch(/VERIFY BEFORE SHARING/);
  });

  it("flags known misinformation patterns as fake", () => {
    const report = analyzeClaim("URGENT: Central Bank secretly preparing to ban physical cash next Monday");
    expect(report.verdict).toBe("FAKE");
    expect(report.trustScore).toBeLessThan(25);
    expect(report.topic).toBe("Finance & Economy");
  });

  it("is deterministic for the same input", () => {
    const a = analyzeClaim("Doctors shocked by miracle cure", "Any", FIXED_NOW);
    const b = analyzeClaim("Doctors shocked by miracle cure", "Any", FIXED_NOW);
    expect(a).toEqual(b);
  });

  it("marks satire sources as satire rather than false", () => {
    expect(analyzeClaim("The Onion reports moon made of cheese").verdict).toBe("SATIRE");
  });

  it("trusts links published on registry domains", () => {
    const report = analyzeClaim("https://www.reuters.com/world/africa/some-story");
    expect(report.verdict).toBe("VERIFIED");
    expect(report.sourceDomain).toBe("reuters.com");
  });

  it("does not verify lookalike domains", () => {
    expect(analyzeClaim("https://reuters.com.fake-news.biz/story").verdict).not.toBe("VERIFIED");
  });

  it("treats sensational framing without evidence as misleading", () => {
    expect(analyzeClaim("BREAKING!!! SHOCKING NEWS ABOUT THE GOVERNOR").verdict).toBe("MISLEADING");
  });

  it("records country and region for feed filtering", () => {
    const report = analyzeClaim("Fuel price rise announced", "Ghana");
    expect(report.country).toBe("Ghana");
    expect(report.region).toBe("West Africa");
    expect(report.corroboratingSources[0].url).toContain("dubawa.org");
  });
});

describe("fromAiResult", () => {
  it("maps AI verdicts into the shared report shape", () => {
    const report = fromAiResult(
      {
        verdict: "likely_false",
        confidence: "high",
        summary: "No evidence supports this.",
        industry: "Politics",
        sources: [{ title: "Debunk", outlet: "Africa Check", url: "https://africacheck.org/x" }],
      },
      "Governor banned all phones",
      "Nigeria",
    );
    expect(report.method).toBe("ai");
    expect(report.verdict).toBe("MISLEADING");
    expect(report.topic).toBe("Politics");
    expect(report.corroboratingSources).toHaveLength(1);
    expect(report.originRadar.preShareRecommendation).toMatch(/DO NOT SHARE/);
  });

  it("falls back to unverified for unknown verdicts", () => {
    expect(fromAiResult({ verdict: "maybe" }, "Some claim", "Any").verdict).toBe("UNVERIFIED");
  });
});
