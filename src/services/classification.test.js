import { describe, expect, it } from "vitest";
import { analyzeClaim, analyzeLink, detectRhetoric, parseClaimInput } from "./verifierEngine";
import { applyEvidence, extractKeywords, isRelevant, ratingToVerdict } from "./onlineSources";
import { verifyClaim } from "./verificationService";

const link = (url) => analyzeLink(parseClaimInput(url));

describe("content type classification", () => {
  it("classifies chain-message hoaxes as fabricated", () => {
    const r = analyzeClaim("As received: the government is giving free laptops, share widely");
    expect(r.contentType).toBe("fabricated");
    expect(r.verdict).toBe("FAKE");
  });

  it("classifies satire", () => {
    const r = analyzeClaim("The Onion: Nation's politicians agree to stop talking for one full day");
    expect(r.contentType).toBe("satire");
    expect(r.verdict).toBe("SATIRE");
  });

  it("classifies pure opinion and rhetorical questions as rhetoric", () => {
    const r = analyzeClaim("Why should we trust these clueless leaders? Enough is enough!");
    expect(r.contentType).toBe("rhetoric");
    expect(r.verdict).toBe("RHETORIC");
  });

  it("keeps opinionated text with a checkable fact as a factual claim", () => {
    const r = analyzeClaim("This useless government raised fuel price to 1200 naira");
    expect(r.contentType).toBe("factual_claim");
    expect(r.rhetoricSignals.length).toBeGreaterThan(0);
  });

  it("classifies a bare URL as a link", () => {
    expect(analyzeClaim("https://www.bbc.com/news/world-africa-123").contentType).toBe("link");
  });

  it("detects rhetorical questions", () => {
    expect(detectRhetoric("Isn't it obvious they are lying?").signals).toContain("rhetorical question");
  });
});

describe("link analysis", () => {
  it("recognises trusted publishers", () => {
    expect(link("https://www.reuters.com/world/").kind).toBe("trusted");
  });

  it("recognises satire sites", () => {
    expect(link("https://www.theonion.com/story").kind).toBe("satire");
    expect(analyzeClaim("https://babylonbee.com/news/x").verdict).toBe("SATIRE");
  });

  it("flags sites impersonating trusted brands", () => {
    expect(link("https://reuters.com.fake-news.biz/story").kind).toBe("impersonation");
    expect(analyzeClaim("http://bbc-news-update.co/story").verdict).toBe("FAKE");
  });

  it("does not flag unrelated domains that merely share letters", () => {
    expect(link("https://nationalnews.com/a").kind).not.toBe("impersonation");
  });

  it("flags shortened and suspicious links", () => {
    expect(link("https://bit.ly/3abc").kind).toBe("shortener");
    expect(link("http://free-gift-cards-now.xyz/claim").kind).toBe("suspicious");
  });

  it("uses links embedded in text", () => {
    const r = analyzeClaim("Government grant for youths, apply here https://bit.ly/3abc");
    expect(r.linkAnalysis.kind).toBe("shortener");
    expect(r.verdict).toBe("MISLEADING");
  });
});

describe("online evidence helpers", () => {
  it("extracts distinctive keywords", () => {
    expect(extractKeywords("BREAKING: The Central Bank of Nigeria will ban cash")).toEqual(["central", "bank", "nigeria", "ban", "cash"]);
  });

  it("checks headline relevance", () => {
    expect(isRelevant("Central Bank denies cash ban rumour", ["central", "bank", "cash"])).toBe(true);
    expect(isRelevant("Football results", ["central", "bank", "cash"])).toBe(false);
  });

  it("maps fact-checker ratings", () => {
    expect(ratingToVerdict("False")).toBe("FAKE");
    expect(ratingToVerdict("Not true")).toBe("FAKE");
    expect(ratingToVerdict("Partly true")).toBe("MISLEADING");
    expect(ratingToVerdict("Mostly True")).toBe("VERIFIED");
    expect(ratingToVerdict("Satire")).toBe("SATIRE");
  });
});

describe("applyEvidence", () => {
  const empty = { keywords: [], factChecks: [], news: [], background: [], searched: ["News"], failed: [], reachable: true, newsSearched: true };

  it("lets published fact-checks decide the verdict", () => {
    const base = analyzeClaim("Central bank to ban cash next week");
    const r = applyEvidence(base, {
      ...empty,
      factChecks: [{ publisher: "Africa Check", rating: "False", url: "https://africacheck.org/a", claim: "bank ban cash" }],
    });
    expect(r.verdict).toBe("FAKE");
    expect(r.confidence).toBe("high");
    expect(r.method).toBe("online");
    expect(r.corroboratingSources[0].url).toBe("https://africacheck.org/a");
  });

  it("verifies claims reported by two trusted outlets", () => {
    const base = analyzeClaim("Ghana central bank cuts policy rate");
    const r = applyEvidence(base, {
      ...empty,
      news: [
        { title: "Ghana central bank cuts rate", url: "https://reuters.com/x", domain: "reuters.com", trusted: true },
        { title: "Bank of Ghana cuts rate", url: "https://bbc.com/y", domain: "bbc.com", trusted: true },
      ],
    });
    expect(r.verdict).toBe("VERIFIED");
  });

  it("downgrades name-dropping claims that no outlet reported", () => {
    const base = analyzeClaim("NASA confirms giant diamond found in Lagos lagoon");
    expect(base.verdict).toBe("VERIFIED");
    expect(applyEvidence(base, empty).verdict).toBe("UNVERIFIED");
  });

  it("keeps rhetoric as rhetoric whatever the coverage", () => {
    const base = analyzeClaim("Why should we trust these clueless leaders? Enough is enough!");
    expect(applyEvidence(base, empty).verdict).toBe("RHETORIC");
  });
});

describe("verifyClaim offline", () => {
  it("returns a flagged offline result and asks the user to reconnect", async () => {
    const { report, notice } = await verifyClaim("Fuel price rise announced", "Any", { online: false });
    expect(report.checkedOffline).toBe(true);
    expect(notice).toMatch(/Connect to the internet/);
  });
});
