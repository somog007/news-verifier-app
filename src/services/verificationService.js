// verificationService.js - Single entry point for checking a claim.
//
// Pipeline: classify the content (verifierEngine) -> research it (Claude via the
// server proxy, when VITE_VERIFY_API_URL is set) -> add live evidence from
// online sources (onlineSources). Every path returns the same report shape so
// the UI never has to care which one ran.

import { analyzeClaim, buildOriginRadar, buildSignals, parseClaimInput } from "./verifierEngine";
import { applyEvidence, gatherEvidence, keywordsForInput } from "./onlineSources";
import { matchHeadlines } from "./newsFeed";

const API_URL = import.meta.env.VITE_VERIFY_API_URL || "";

export const isAiEnabled = () => Boolean(API_URL);

const AI_VERDICT_MAP = {
  verified: "VERIFIED",
  likely_true: "VERIFIED",
  unverified: "UNVERIFIED",
  likely_false: "MISLEADING",
  false: "FAKE",
  satire: "SATIRE",
  opinion: "RHETORIC",
};

const AI_CONTENT_TYPES = ["factual_claim", "fabricated", "satire", "rhetoric", "link"];

const AI_TRUST_SCORE = {
  verified: { high: 95, medium: 88, low: 80 },
  likely_true: { high: 80, medium: 74, low: 68 },
  unverified: { high: 50, medium: 50, low: 50 },
  likely_false: { high: 22, medium: 28, low: 34 },
  false: { high: 5, medium: 10, low: 18 },
  satire: { high: 50, medium: 50, low: 50 },
  opinion: { high: 50, medium: 50, low: 50 },
};

async function fetchAiResult(claim, country, signal) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ claim, country }),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Verification service returned ${response.status}`);
  }
  return response.json();
}

/** Merges an AI research result into the standard report shape. */
export function fromAiResult(ai, claim, country, now = new Date()) {
  const base = analyzeClaim(claim, country, now);
  const aiVerdict = AI_VERDICT_MAP[ai.verdict] ? ai.verdict : "unverified";
  const confidence = ["high", "medium", "low"].includes(ai.confidence) ? ai.confidence : "low";
  const verdict = AI_VERDICT_MAP[aiVerdict];
  const trustScore = AI_TRUST_SCORE[aiVerdict][confidence];

  const originSource = ai.origin?.outlet || base.originTrace.originalPublisher;
  const sources = Array.isArray(ai.sources) ? ai.sources.filter((s) => s && s.url) : [];
  const trace = Array.isArray(ai.trace) ? ai.trace : [];

  return {
    ...base,
    method: "ai",
    confidence,
    contentType: AI_CONTENT_TYPES.includes(ai.content_type) ? ai.content_type : base.contentType,
    contentTypeReason: ai.content_type_reason,
    verdict,
    trustScore,
    topic: ai.industry || base.topic,
    summary: ai.summary || base.summary,
    countryRelevance: Array.isArray(ai.country_relevance) ? ai.country_relevance : [],
    originTrace: {
      firstSeen: ai.origin?.date || "Unknown",
      originalPublisher: originSource,
      originalUrl: ai.origin?.url || base.originTrace.originalUrl,
      originNote: ai.origin?.note,
      timeline: trace.length > 0
        ? trace.map((t) => ({ time: t.date || "Undated", event: t.note || "", type: "primary", source: t.outlet || "Source" }))
        : base.originTrace.timeline,
    },
    originRadar: buildOriginRadar({ verdict, originSource, inputInfo: parseClaimInput(claim) }),
    corroboratingSources: sources.length > 0
      ? sources.map((s) => ({
          name: s.outlet || s.title,
          title: s.title,
          url: s.url,
          date: s.date,
          type: "Cited source",
          status: "CITED",
          credibility: null,
        }))
      : base.corroboratingSources,
    signals: buildSignals({ verdict, trustScore, domainAuthority: base.signals.domainAuthority }),
  };
}

/**
 * Offline: pattern checks plus the headlines saved from the newsfeed. A match in
 * the saved feed counts as coverage; no match proves nothing, because the saved
 * feed only holds the last few days of top stories.
 */
export function checkOffline(text, country, savedHeadlines = []) {
  const base = { ...analyzeClaim(text, country), checkedOffline: true };
  const reconnect = "Connect to the internet and check again for results based on live sources.";
  const matches = matchHeadlines(text, savedHeadlines);

  // Patterns alone can't confirm a claim: without coverage it stays unverified.
  if (matches.length === 0 && base.verdict === "VERIFIED" && base.contentType !== "link") {
    Object.assign(base, {
      verdict: "UNVERIFIED",
      trustScore: 45,
      confidence: "low",
      summary: `${base.summary} It can't be confirmed without checking live sources.`,
    });
  }
  if (savedHeadlines.length === 0) {
    return { report: base, notice: `You're offline, so this is only a quick pattern check. ${reconnect}` };
  }

  const report = {
    ...applyEvidence(base, {
      keywords: keywordsForInput(text),
      factChecks: [],
      news: matches,
      background: [],
      searched: [`Saved newsfeed (${savedHeadlines.length} headlines)`],
      failed: [],
      reachable: true,
      newsSearched: false,
    }),
    method: "saved_feed",
    checkedOffline: true,
  };
  if (report.confidence === "high") report.confidence = "medium";
  if (matches.length > 0 && !matches.some((m) => m.trusted)) {
    const outlets = [...new Set(matches.map((m) => m.source || m.domain))].slice(0, 3).join(", ");
    report.summary = `${report.summary} Your saved newsfeed has related coverage from ${outlets}, but not from an outlet on the trusted list.`;
  }

  const notice = matches.length > 0
    ? `You're offline. ${matches.length === 1 ? "1 saved headline matches" : `${matches.length} saved headlines match`} this claim. ${reconnect}`
    : `You're offline. None of the ${savedHeadlines.length} headlines saved on this device mention this claim, which doesn't prove anything either way. ${reconnect}`;
  return { report, notice };
}

/**
 * Checks a claim. Always resolves with a report.
 *
 * Online: AI research (if configured) or the offline classifier, combined with
 * live evidence from fact-checkers, news and Wikipedia.
 * Offline: the classifier only, flagged `checkedOffline` so the UI can ask the
 * user to reconnect and re-check.
 */
export async function verifyClaim(claim, country = "Any", { online = true, savedHeadlines = [] } = {}) {
  const text = (claim || "").trim();
  if (!text) return { report: null, notice: null };

  if (!online) return checkOffline(text, country, savedHeadlines);

  const evidencePromise = gatherEvidence(text, country);
  let base = null;
  let notice = null;

  if (isAiEnabled()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
    try {
      base = fromAiResult(await fetchAiResult(text, country, controller.signal), text, country);
    } catch (err) {
      console.warn("AI verification unavailable, using classifier + online sources.", err);
      notice = "AI research is unavailable right now, so this result is based on live source searches and pattern checks.";
    } finally {
      clearTimeout(timeout);
    }
  }

  const evidence = await evidencePromise;
  base = base || analyzeClaim(text, country);

  if (!evidence.reachable && base.method !== "ai") {
    return {
      report: { ...base, checkedOffline: true },
      notice: "We couldn't reach any online sources. Check your internet connection and try again for results based on live sources.",
    };
  }
  return { report: applyEvidence(base, evidence), notice };
}
