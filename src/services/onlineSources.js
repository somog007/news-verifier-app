// onlineSources.js - Live evidence from online sources, merged into a report.
//
// Sources (each optional, each fails independently):
//   • Published fact-checks — Google Fact Check Tools (ClaimReview from Africa Check,
//     Dubawa, PesaCheck, AFP, Reuters…). Needs VITE_FACTCHECK_API_KEY, or the server.
//   • News coverage — via the server's /api/evidence (Google News) when
//     VITE_EVIDENCE_API_URL is set, otherwise GDELT directly (best effort).
//   • Background — Wikipedia search (no key needed).

import { buildOriginRadar, buildSignals, findTrustedDomain, parseClaimInput } from "./verifierEngine";
import { truncate } from "../lib/text";

const FACTCHECK_KEY = import.meta.env.VITE_FACTCHECK_API_KEY || "";
const EVIDENCE_URL = import.meta.env.VITE_EVIDENCE_API_URL || "";
const TIMEOUT_MS = 9000;

const STOPWORDS = new Set(
  ("a an the and or but if of to in on at by for with from as is are was were be been being this that these those it its " +
    "has have had do does did will would can could should may might must not no yes all any some more most very just " +
    "than then there their they them he she his her you your we our us i me my who what when where why how which about " +
    "into over after before new says said say also now next week today news breaking urgent www http https com org").split(" "),
);

/** Up to `max` distinctive keywords, in their original order. */
export function extractKeywords(text, max = 6) {
  const words = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9À-ɏ\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
  return [...new Set(words)].slice(0, max);
}

export function keywordsForInput(text) {
  const info = parseClaimInput(text);
  if (info.isUrl) {
    // Use the article slug, e.g. /2026/10/cbn-bans-cash-withdrawals -> "cbn bans cash withdrawals"
    return extractKeywords(decodeURIComponent(info.path || "").replace(/[/_.]/g, " "));
  }
  return extractKeywords(text);
}

/** True when a headline shares enough keywords with the claim to be about the same thing. */
export function isRelevant(title, keywords) {
  if (!title || keywords.length === 0) return false;
  const lower = title.toLowerCase();
  const hits = keywords.filter((k) => lower.includes(k)).length;
  return hits >= Math.min(2, keywords.length);
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status });
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

const stripHtml = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#039;/g, "'");

const domainOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

// ---------------------------------------------------------------------------
// Individual sources
// ---------------------------------------------------------------------------

async function searchFactChecks(query) {
  const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(query)}&pageSize=10&key=${FACTCHECK_KEY}`;
  const data = await fetchJson(url);
  return (data.claims || []).flatMap((claim) =>
    (claim.claimReview || []).map((review) => ({
      claim: claim.text,
      claimant: claim.claimant,
      publisher: review.publisher?.name || review.publisher?.site || domainOf(review.url),
      url: review.url,
      rating: review.textualRating,
      date: review.reviewDate?.slice(0, 10),
    })),
  );
}

async function searchGdelt(query) {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=15&format=json&timespan=3months&sort=hybridrel`;
  const data = await fetchJson(url);
  return (data.articles || []).map((a) => ({ title: a.title, url: a.url, domain: a.domain || domainOf(a.url), date: a.seendate?.slice(0, 8) }));
}

async function searchEvidenceServer(query, country) {
  const data = await fetchJson(`${EVIDENCE_URL}?q=${encodeURIComponent(query)}&country=${encodeURIComponent(country)}`);
  return { news: data.news || [], factChecks: data.factChecks || [] };
}

async function searchWikipedia(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=3`;
  const data = await fetchJson(url);
  return (data.query?.search || []).map((r) => ({
    title: r.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
    snippet: stripHtml(r.snippet),
  }));
}

// ---------------------------------------------------------------------------
// Gathering
// ---------------------------------------------------------------------------

const isNetworkError = (err) => err?.name === "AbortError" || err instanceof TypeError;

/**
 * Queries every available online source in parallel. Never throws.
 * `reachable` is false when no source could be reached at all (likely offline).
 */
export async function gatherEvidence(text, country = "Any") {
  const keywords = keywordsForInput(text);
  const evidence = { keywords, factChecks: [], news: [], background: [], searched: [], failed: [], reachable: true };
  if (keywords.length === 0) return evidence;

  const query = keywords.join(" ");
  const tasks = [];

  if (EVIDENCE_URL) {
    tasks.push(["News & fact-checks (server)", searchEvidenceServer(query, country).then((r) => {
      evidence.news.push(...r.news);
      evidence.factChecks.push(...r.factChecks);
    })]);
  } else {
    tasks.push(["News coverage (GDELT)", searchGdelt(query).then((r) => evidence.news.push(...r))]);
  }
  if (FACTCHECK_KEY) {
    tasks.push(["Google Fact Check", searchFactChecks(query).then((r) => evidence.factChecks.push(...r))]);
  }
  tasks.push(["Wikipedia", searchWikipedia(keywords.slice(0, 4).join(" ")).then((r) => evidence.background.push(...r))]);

  const results = await Promise.allSettled(tasks.map(([, p]) => p));
  results.forEach((r, i) => {
    const name = tasks[i][0];
    if (r.status === "fulfilled") evidence.searched.push(name);
    else evidence.failed.push({ name, network: isNetworkError(r.reason) });
  });
  evidence.reachable = evidence.searched.length > 0 || evidence.failed.some((f) => !f.network);

  // Keep only items about this claim, de-duplicated, trusted outlets first.
  const seen = new Set();
  const unique = (item) => item.url && !seen.has(item.url) && seen.add(item.url);
  evidence.factChecks = evidence.factChecks.filter((f) => unique(f) && isRelevant(f.claim || f.title, keywords));
  evidence.news = evidence.news
    .filter((n) => unique(n) && isRelevant(n.title, keywords))
    .map((n) => ({ ...n, trusted: Boolean(findTrustedDomain(n.domain || domainOf(n.url))) }))
    .sort((a, b) => Number(b.trusted) - Number(a.trusted));
  evidence.newsSearched = evidence.searched.some((s) => s.startsWith("News"));
  return evidence;
}

// ---------------------------------------------------------------------------
// Merging into a report
// ---------------------------------------------------------------------------

/** Maps a fact-checker's free-text rating ("False", "Partly true", "Satire"…) to a verdict. */
export function ratingToVerdict(rating) {
  const r = (rating || "").toLowerCase();
  if (!r) return null;
  if (/satire|parody|joke/.test(r)) return "SATIRE";
  if (/not true|untrue|false|fake|fabricat|hoax|scam|incorrect|wrong|pants on fire|baseless|no evidence|debunk/.test(r)) return "FAKE";
  if (/mislead|partly|partially|half|mixture|mixed|missing context|out of context|exaggerat|distort|unproven|unsupported/.test(r)) return "MISLEADING";
  if (/true|correct|accurate|confirmed|verified/.test(r)) return "VERIFIED";
  return null;
}

const SEVERITY = ["FAKE", "MISLEADING", "SATIRE", "VERIFIED"];
const SCORE_FOR = { FAKE: 6, MISLEADING: 25, SATIRE: 50, VERIFIED: 92 };

function consensus(verdicts) {
  const counts = verdicts.reduce((acc, v) => ({ ...acc, [v]: (acc[v] || 0) + 1 }), {});
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a] || SEVERITY.indexOf(a) - SEVERITY.indexOf(b))[0];
}

function evidenceSources(evidence) {
  return [
    ...evidence.factChecks.slice(0, 5).map((f) => ({
      name: f.publisher, title: `${f.publisher} fact-check: "${truncate(f.claim || "", 90)}"`, url: f.url, date: f.date,
      type: "Published fact-check", status: (f.rating || "REVIEWED").toUpperCase(), credibility: null,
    })),
    ...evidence.news.slice(0, 5).map((n) => ({
      name: n.source || n.domain, title: n.title, url: n.url, date: n.date,
      type: n.trusted ? "Trusted outlet coverage" : "News coverage", status: n.trusted ? "REPORTED" : "COVERAGE", credibility: null,
    })),
    ...evidence.background.slice(0, 2).map((b) => ({
      name: "Wikipedia", title: `Background: ${b.title}`, url: b.url, type: "Background reference", status: "BACKGROUND", credibility: null,
    })),
  ];
}

/**
 * Updates a report with live evidence. For AI reports the verdict is kept and
 * the evidence is attached; for offline reports the evidence decides.
 */
export function applyEvidence(base, evidence) {
  const report = { ...base, evidence, method: base.method === "ai" ? "ai" : "online" };
  const notes = [];
  const fcVerdicts = evidence.factChecks.map((f) => ratingToVerdict(f.rating)).filter(Boolean);
  const trustedNews = evidence.news.filter((n) => n.trusted);
  const opinionOrSatire = base.contentType === "rhetoric" || base.contentType === "satire";

  if (base.method !== "ai" && !opinionOrSatire) {
    if (fcVerdicts.length > 0) {
      const verdict = consensus(fcVerdicts);
      const first = evidence.factChecks.find((f) => ratingToVerdict(f.rating) === verdict);
      report.verdict = verdict;
      report.trustScore = SCORE_FOR[verdict];
      report.confidence = "high";
      if (verdict === "SATIRE") report.contentType = "satire";
      report.summary = `${evidence.factChecks.length} published fact-check${evidence.factChecks.length > 1 ? "s" : ""} found. ${first.publisher} rated this claim "${first.rating}". Read the fact-check below for the full evidence.`;
    } else if (base.verdict === "FAKE" && base.contentType !== "link") {
      if (trustedNews.length > 0) notes.push("Reputable outlets have covered this topic; read them below, as they may be reporting a debunk.");
      else if (evidence.newsSearched) notes.push("No reputable outlet reported this, which supports it being fabricated.");
    } else if (trustedNews.length >= 2) {
      report.verdict = "VERIFIED";
      report.trustScore = 85;
      report.confidence = "medium";
      report.summary = `Reported by ${[...new Set(trustedNews.map((n) => n.source || n.domain))].slice(0, 3).join(", ")}. Check the coverage below to confirm it matches the specific claim you saw.`;
    } else if (trustedNews.length === 1 && base.verdict !== "MISLEADING") {
      report.verdict = "VERIFIED";
      report.trustScore = 72;
      report.confidence = "low";
      report.summary = `One trusted outlet (${trustedNews[0].source || trustedNews[0].domain}) has reported on this. Look for a second independent source before sharing.`;
    } else if (evidence.newsSearched && evidence.news.length === 0) {
      if (base.verdict === "VERIFIED" && base.contentType !== "link") {
        report.verdict = "UNVERIFIED";
        report.trustScore = 45;
        report.confidence = "low";
      }
      notes.push("No news coverage was found. Big claims that no outlet is reporting are often false.");
    }
  }

  if (notes.length > 0) report.summary = `${report.summary} ${notes.join(" ")}`;

  report.corroboratingSources = [...evidenceSources(evidence), ...base.corroboratingSources]
    .filter((s, i, all) => all.findIndex((o) => o.url === s.url) === i);

  const found = `${evidence.factChecks.length} fact-check(s), ${evidence.news.length} news report(s), ${evidence.background.length} background article(s)`;
  report.originTrace = {
    ...base.originTrace,
    timeline: [
      ...base.originTrace.timeline.slice(0, 2),
      { time: base.checkedOffline ? "Offline" : "Online", event: `Searched ${evidence.searched.join(", ") || "no sources"}: found ${found}`, type: "wire", source: base.checkedOffline ? "Saved newsfeed" : "Live search" },
      ...base.originTrace.timeline.slice(2),
    ],
  };
  report.originRadar = buildOriginRadar({
    verdict: report.verdict,
    originSource: base.originTrace.originalPublisher,
    inputInfo: parseClaimInput(base.content),
  });
  report.signals = buildSignals({ verdict: report.verdict, trustScore: report.trustScore, domainAuthority: base.signals.domainAuthority });
  return report;
}
