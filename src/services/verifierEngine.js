// verifierEngine.js - Offline content classification & claim screening
//
// This engine does NOT fact-check. It classifies what was submitted (factual
// claim, likely fabrication, satire, opinion/rhetoric or a link), screens it for
// known misinformation patterns, and assembles a report with links to the
// fact-checkers a person should consult. Live evidence from online sources is
// merged in later by onlineSources.js. Results are deterministic.

import { TRUSTED_DOMAINS } from "../data/newsDatabase";
import { COUNTRY_REGION, getShareAdvice } from "../constants/verdicts";
import { LINK_KINDS } from "../constants/contentTypes";
import { hasAnyTerm, hashString, matchTerms, truncate } from "../lib/text";

// ---------------------------------------------------------------------------
// Signal dictionaries
// ---------------------------------------------------------------------------

// Hallmarks of invented content and chain messages.
const FABRICATION_TERMS = [
  "secretly preparing", "share before deleted", "share before it is deleted", "doctors shocked",
  "miracle cure", "bank ban", "ban physical cash", "leaked video", "leaked memo", "leaked audio", "alien ufo",
  "government hiding", "banned video", "guaranteed trick", "unspoken truth",
  "they don't want you to know", "100% cure", "free laptops", "click the link to claim",
  "as received", "forward to all your contacts", "share widely", "unnamed sources", "insiders reveal",
  "send this to 10", "claim your free", "you have been selected",
];

// Names of reputable bodies. A mention raises confidence but never proves a claim.
const TRUSTED_REFERENCE_TERMS = [
  "nasa", "james webb", "eurostat", "ecb", "reuters", "associated press", "world health organization",
  "fda", "cdc", "united nations", "unesco", "imf", "world bank", "dubawa", "africa check",
  "pesacheck", "news agency of nigeria", "ghana news agency",
];

const SATIRE_TERMS = ["the onion", "babylon bee", "borowitz", "satire", "satirical", "parody", "punocracy", "daily mash"];

const SATIRE_DOMAINS = [
  "theonion.com", "babylonbee.com", "newsthump.com", "thedailymash.co.uk", "waterfordwhispersnews.com",
  "punocracy.com", "thebeaverton.com", "newsbiscuit.com", "clickhole.com", "thespoof.com",
];

const SENSATIONAL_TERMS = ["urgent", "breaking", "shocking", "must share", "forward to all", "before it's too late"];

// Opinion, value judgements and slogans: not checkable as stated.
const OPINION_TERMS = [
  "i think", "i believe", "in my opinion", "imo", "i feel", "we must", "we need to", "should", "shouldn't",
  "shame", "disgrace", "disgraceful", "pathetic", "useless", "worst ever", "best ever", "greatest",
  "evil", "wicked", "wake up", "enough is enough", "god help us", "so-called", "clueless", "incompetent",
];

const HYPERBOLE_TERMS = ["everyone knows", "nobody cares", "the whole world", "literally", "always", "never", "of all time"];

// Signals that a statement contains something specific that can be checked.
const FACT_VERBS = [
  "announced", "confirmed", "signed", "banned", "arrested", "died", "killed", "launched", "approved",
  "declared", "released", "reported", "ordered", "increased", "reduced", "raised", "cut", "won", "lost",
  "resigned", "appointed", "discovered", "detected", "sacked", "suspended", "said", "says", "will",
];

const TOPICS = [
  { topic: "Finance & Economy", terms: ["bank", "naira", "rand", "cedi", "shilling", "finance", "tax", "cash", "currency", "cbn", "cbdc", "inflation", "fuel price"] },
  { topic: "Politics & Governance", terms: ["election", "vote", "president", "governor", "minister", "parliament", "court", "senate", "bill", "law"] },
  { topic: "Health & Science", terms: ["health", "cure", "virus", "doctor", "hospital", "vaccine", "disease", "cancer", "herb"] },
  { topic: "Technology", terms: ["tech", "ai", "artificial intelligence", "space", "quantum", "app", "chip", "telescope", "nasa"] },
  { topic: "Security", terms: ["attack", "army", "police", "security", "explosion", "border", "military"] },
];

const SOCIAL_PLATFORMS = [
  { hosts: ["x.com", "twitter.com"], name: "X (formerly Twitter)" },
  { hosts: ["facebook.com", "fb.com", "fb.watch"], name: "Facebook" },
  { hosts: ["instagram.com"], name: "Instagram" },
  { hosts: ["tiktok.com"], name: "TikTok" },
  { hosts: ["youtube.com", "youtu.be"], name: "YouTube" },
  { hosts: ["threads.net"], name: "Threads" },
  { hosts: ["whatsapp.com", "wa.me"], name: "WhatsApp" },
  { hosts: ["t.me", "telegram.me"], name: "Telegram" },
];

const URL_SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "ow.ly", "rebrand.ly", "cutt.ly", "is.gd", "buff.ly", "shorturl.at", "tiny.cc", "rb.gy"];

const SUSPICIOUS_TLDS = ["xyz", "top", "buzz", "click", "online", "site", "live", "icu", "rest", "cfd", "gq", "tk", "ml", "cf"];

// Distinctive brand names that scam sites borrow, mapped to the real domain.
const IMPERSONATED_BRANDS = {
  reuters: "reuters.com", apnews: "apnews.com", bbc: "bbc.com", bloomberg: "bloomberg.com", nasa: "nasa.gov",
  dubawa: "dubawa.org", africacheck: "africacheck.org", pesacheck: "pesacheck.org", nannews: "nannews.ng",
  sabcnews: "sabcnews.com", news24: "news24.com", premiumtimes: "premiumtimesng.com", channelstv: "channelstv.com",
  snopes: "snopes.com", fullfact: "fullfact.org", cbn: "cbn.gov.ng",
};

const URL_LIKE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;
const EMBEDDED_URL = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;

const hostMatches = (domain, host) => domain === host || domain.endsWith(`.${host}`);

// ---------------------------------------------------------------------------
// Input parsing
// ---------------------------------------------------------------------------

function describeUrl(raw) {
  const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  const info = {
    domain: parsed.hostname.toLowerCase().replace(/^www\./, ""),
    cleanUrl: parsed.href,
    protocol: parsed.protocol,
    path: parsed.pathname,
    socialPlatform: null,
    socialHandle: "",
  };
  const platform = SOCIAL_PLATFORMS.find((p) => p.hosts.some((h) => hostMatches(info.domain, h)));
  if (platform) {
    info.socialPlatform = platform.name;
    const first = parsed.pathname.split("/").filter(Boolean)[0];
    if (platform.name.startsWith("X") && first && !["status", "i", "search", "home"].includes(first)) {
      info.socialHandle = `@${first}`;
    }
  }
  return info;
}

/**
 * Identifies whether the input is a link on its own, text containing a link,
 * or plain text.
 */
export function parseClaimInput(inputText) {
  const text = (inputText || "").trim();
  const result = {
    rawText: text, isUrl: false, embeddedUrl: null, domain: "", socialPlatform: null, socialHandle: "", cleanUrl: "", path: "", protocol: "",
  };
  if (!text) return result;

  try {
    if (!/\s/.test(text) && URL_LIKE.test(text)) {
      Object.assign(result, describeUrl(text), { isUrl: true });
    } else {
      const match = text.match(EMBEDDED_URL);
      if (match) result.embeddedUrl = describeUrl(match[1].replace(/[),.]+$/, ""));
    }
  } catch {
    // not a URL after all — treat as text
  }
  return result;
}

export function findTrustedDomain(domain) {
  if (!domain) return null;
  return TRUSTED_DOMAINS.find((d) => hostMatches(domain, d.domain)) || null;
}

/** Classifies who is behind a link and why it may or may not be trustworthy. */
export function analyzeLink(url) {
  if (!url) return null;
  const { domain, protocol } = url;
  const reasons = [];
  const trusted = findTrustedDomain(domain);
  const tld = domain.split(".").pop();
  const label = domain.replace(/[^a-z0-9.]/g, "");
  const impersonated = !trusted &&
    Object.entries(IMPERSONATED_BRANDS).find(([brand, real]) => label.includes(brand) && !hostMatches(domain, real));

  let kind;
  if (trusted) {
    kind = "trusted";
    reasons.push(`${trusted.name} is on the trusted wire registry (trust ${trusted.score}%).`);
  } else if (SATIRE_DOMAINS.some((d) => hostMatches(domain, d))) {
    kind = "satire";
    reasons.push(`${domain} publishes satire and parody, not news.`);
  } else if (URL_SHORTENERS.some((d) => hostMatches(domain, d))) {
    kind = "shortener";
    reasons.push("Shortened links hide their real destination. Open it carefully and check the final address.");
  } else if (impersonated) {
    kind = "impersonation";
    reasons.push(`The address contains "${impersonated[0]}" but is not ${impersonated[1]}. This is a common trick to borrow a trusted name.`);
  } else if (url.socialPlatform) {
    kind = "social";
    reasons.push(`A ${url.socialPlatform} post. We can't read the post itself; paste its text to check the claim.`);
  } else {
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) reasons.push("Uses a raw IP address instead of a domain name.");
    if (domain.includes("xn--")) reasons.push("Uses look-alike international characters (punycode).");
    if (SUSPICIOUS_TLDS.includes(tld)) reasons.push(`The .${tld} ending is often used by throwaway sites.`);
    if ((domain.match(/-/g) || []).length >= 2) reasons.push("Many hyphens in the domain name, common in clickbait sites.");
    if (protocol === "http:") reasons.push("Not a secure (https) connection.");
    kind = reasons.length > 0 ? "suspicious" : "unknown";
    if (kind === "unknown") reasons.push(`${domain} is not on the trusted registry. Check who runs it before trusting it.`);
  }

  return { kind, label: LINK_KINDS[kind], domain, trustedDomain: trusted, reasons };
}

function detectTopic(text) {
  return TOPICS.find(({ terms }) => hasAnyTerm(text, terms))?.topic || "General News";
}

/** Rhetoric signals: opinions, rhetorical questions and hyperbole. */
export function detectRhetoric(text) {
  const opinions = matchTerms(text, OPINION_TERMS);
  const hyperbole = matchTerms(text, HYPERBOLE_TERMS);
  const rhetoricalQuestion = /\?\s*$/.test(text) &&
    /^(why|how (can|could|come)|who (else|would)|isn't|aren't|don't|doesn't|can't|is it not|what kind)/i.test(text.trim());
  const signals = [
    ...opinions.map((t) => `opinion phrase "${t}"`),
    ...hyperbole.map((t) => `exaggeration "${t}"`),
    ...(rhetoricalQuestion ? ["rhetorical question"] : []),
  ];
  const checkable = /\d/.test(text) || matchTerms(text, FACT_VERBS).length > 0;
  return { signals, checkable };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function sensationalSignals(text) {
  const sensational = matchTerms(text, SENSATIONAL_TERMS);
  const letters = text.replace(/[^A-Za-z]/g, "");
  const shouting = text.length > 20 && letters.length > 0 && text.replace(/[^A-Z]/g, "").length / letters.length > 0.6;
  const exclamations = (text.match(/!/g) || []).length >= 2;
  return sensational.length + (shouting ? 1 : 0) + (exclamations ? 1 : 0);
}

function assess({ text, inputInfo, link }) {
  const fabrication = matchTerms(text, FABRICATION_TERMS);
  // For links, only the domain counts: "reuters" inside a lookalike URL proves nothing.
  const references = inputInfo.isUrl ? [] : matchTerms(text, TRUSTED_REFERENCE_TERMS);
  const satire = inputInfo.isUrl ? [] : matchTerms(text, SATIRE_TERMS);
  const sensationalCount = inputInfo.isUrl ? 0 : sensationalSignals(text);
  const rhetoric = inputInfo.isUrl ? { signals: [], checkable: true } : detectRhetoric(text);

  const result = (contentType, verdict, trustScore, confidence) => ({
    contentType, verdict, trustScore, confidence, fabrication, references, sensationalCount, rhetoric,
  });

  // A link on its own: judge the publisher.
  if (inputInfo.isUrl) {
    switch (link.kind) {
      case "trusted": return result("link", "VERIFIED", link.trustedDomain.score, "medium");
      case "satire": return result("link", "SATIRE", 50, "high");
      case "impersonation": return result("link", "FAKE", 8, "high");
      case "suspicious": return result("link", "MISLEADING", Math.max(15, 40 - link.reasons.length * 7), "medium");
      default: return result("link", "UNVERIFIED", link.kind === "social" ? 40 : 45, "low");
    }
  }

  if (satire.length > 0 || link?.kind === "satire") return result("satire", "SATIRE", 50, "medium");

  if (fabrication.length > 0 || link?.kind === "impersonation") {
    const hits = fabrication.length + (link?.kind === "impersonation" ? 1 : 0);
    return result("fabricated", "FAKE", Math.max(5, 22 - hits * 5 - sensationalCount * 3), hits > 1 ? "high" : "medium");
  }

  if (rhetoric.signals.length > 0 && !rhetoric.checkable) return result("rhetoric", "RHETORIC", 50, "medium");

  if (link?.kind === "suspicious" || link?.kind === "shortener") {
    return result("factual_claim", "MISLEADING", 30, "low");
  }
  if (references.length > 0 && sensationalCount === 0) {
    return result("factual_claim", "VERIFIED", Math.min(90, 76 + references.length * 4), "low");
  }
  if (sensationalCount >= 2) return result("factual_claim", "MISLEADING", 30, "low");

  return result("factual_claim", "UNVERIFIED", inputInfo.socialPlatform ? 40 : 50 - sensationalCount * 8, "low");
}

// ---------------------------------------------------------------------------
// Narrative builders
// ---------------------------------------------------------------------------

function buildSummary({ text, country, topic, scoring, link }) {
  const snippet = `"${truncate(text, 75)}"`;
  const where = country && country !== "Any" ? ` for ${country}` : "";
  const { verdict, contentType, fabrication, rhetoric } = scoring;

  if (contentType === "link") {
    const first = link.reasons[0] || "";
    switch (link.kind) {
      case "trusted": return `This link is from ${link.trustedDomain.name}. ${first} Make sure the article actually says what the post claims.`;
      case "satire": return `${first} Anything it publishes is a joke, not a news report.`;
      case "impersonation": return `Warning: ${first} Treat the content as fabricated.`;
      case "suspicious": return `This web address has warning signs: ${link.reasons.join(" ")}`;
      default: return `${first} Open the link and check the claim it makes against the sources below${where}.`;
    }
  }

  switch (verdict) {
    case "FAKE":
      return fabrication.length > 0
        ? `${snippet} shows hallmarks of fabricated content (${fabrication.join(", ")}). Treat it as false unless an official source confirms it, and check the fact-checkers below${where}.`
        : `${snippet} links to a site impersonating a trusted outlet. Treat it as fabricated.`;
    case "MISLEADING":
      return link?.kind === "suspicious" || link?.kind === "shortener"
        ? `${snippet} relies on a link with warning signs (${link.label.toLowerCase()}). Don't trust it until you see the same claim from a reputable source.`
        : `${snippet} uses sensational framing (urgency, all-caps or alarm language) that is typical of misleading posts. No supporting evidence was detected.`;
    case "SATIRE":
      return `${snippet} references a satire or parody source. It is not intended as factual news.`;
    case "RHETORIC":
      return `${snippet} is opinion or rhetoric (${rhetoric.signals.join(", ")}), not a specific factual claim. It can be agreed or disagreed with, but not fact-checked as stated.`;
    case "VERIFIED":
      return `${snippet} references reputable institutions and shows no misinformation patterns. Open the sources below to confirm the specific statement.`;
    default:
      return `No misinformation patterns or trusted-source references were detected in ${snippet}. This ${topic.toLowerCase()} claim needs independent confirmation from the sources below${where}.`;
  }
}

function getRegionalSources(country, text, encodedQuery) {
  const focus = (c, terms) => country === c || hasAnyTerm(text, terms);

  if (focus("Nigeria", ["nigeria", "lagos", "abuja", "naira", "cbn"])) {
    return [
      { name: "Dubawa West Africa Fact Check", url: `https://dubawa.org/?s=${encodedQuery}`, credibility: 98, type: "African Fact Checker", status: "SEARCH" },
      { name: "Africa Check Nigeria", url: `https://africacheck.org/search?query=${encodedQuery}`, credibility: 98, type: "African Fact Checker", status: "SEARCH" },
      { name: "News Agency of Nigeria (NAN)", url: `https://nannews.ng/?s=${encodedQuery}`, credibility: 96, type: "National News Wire", status: "SEARCH" },
      { name: "Reuters Africa News", url: "https://www.reuters.com/world/africa/", credibility: 98, type: "Global Wire", status: "BROWSE" },
    ];
  }
  if (focus("Ghana", ["ghana", "accra", "cedi"])) {
    return [
      { name: "Dubawa Ghana", url: `https://dubawa.org/?s=${encodedQuery}`, credibility: 97, type: "African Fact Checker", status: "SEARCH" },
      { name: "Ghana News Agency (GNA)", url: `https://gna.org.gh/?s=${encodedQuery}`, credibility: 95, type: "National News Wire", status: "SEARCH" },
      { name: "Africa Check", url: `https://africacheck.org/search?query=${encodedQuery}`, credibility: 98, type: "African Fact Checker", status: "SEARCH" },
      { name: "BBC News Africa", url: "https://www.bbc.com/news/world/africa", credibility: 97, type: "Broadcaster", status: "BROWSE" },
    ];
  }
  if (focus("Kenya", ["kenya", "nairobi", "shilling", "east africa"])) {
    return [
      { name: "PesaCheck East Africa", url: `https://pesacheck.org/search?q=${encodedQuery}`, credibility: 97, type: "African Fact Checker", status: "SEARCH" },
      { name: "Africa Check Kenya", url: `https://africacheck.org/search?query=${encodedQuery}`, credibility: 98, type: "African Fact Checker", status: "SEARCH" },
      { name: "Nation Africa", url: "https://nation.africa/kenya", credibility: 96, type: "Regional News Wire", status: "BROWSE" },
      { name: "Reuters Africa Desk", url: "https://www.reuters.com/world/africa/", credibility: 98, type: "Global Wire", status: "BROWSE" },
    ];
  }
  if (focus("South Africa", ["south africa", "rand", "johannesburg", "joburg", "cape town", "sabc"])) {
    return [
      { name: "Africa Check South Africa", url: `https://africacheck.org/search?query=${encodedQuery}`, credibility: 98, type: "African Fact Checker", status: "SEARCH" },
      { name: "SABC News", url: `https://www.sabcnews.com/sabcnews/?s=${encodedQuery}`, credibility: 96, type: "Public Broadcaster", status: "SEARCH" },
      { name: "News24", url: "https://www.news24.com", credibility: 95, type: "Regional News Outlet", status: "BROWSE" },
      { name: "AFP Fact Check Africa", url: "https://factcheck.afp.com/afp-africa", credibility: 98, type: "International Wire", status: "BROWSE" },
    ];
  }
  return [
    { name: "Africa Check (Pan-Africa)", url: `https://africacheck.org/search?query=${encodedQuery}`, credibility: 98, type: "African Fact Checker", status: "SEARCH" },
    { name: "Dubawa", url: `https://dubawa.org/?s=${encodedQuery}`, credibility: 97, type: "African Fact Checker", status: "SEARCH" },
    { name: "Google Fact Check Explorer", url: `https://toolbox.google.com/factcheck/explorer/search/${encodedQuery}`, credibility: 95, type: "Fact-Check Aggregator", status: "SEARCH" },
    { name: "AP Fact Check", url: "https://apnews.com/hub/ap-fact-check", credibility: 99, type: "Global Wire Service", status: "BROWSE" },
    { name: "Reuters Fact Check", url: "https://www.reuters.com/fact-check/", credibility: 98, type: "Global Wire Service", status: "BROWSE" },
  ];
}

const PRIMARY_WIRE = {
  Nigeria: "NAN (News Agency of Nigeria)",
  Ghana: "GNA (Ghana News Agency)",
  "South Africa": "SABC News",
  Kenya: "Nation Africa",
};

/** Pre-share guidance derived from a verdict. Exported so other result sources reuse it. */
export function buildOriginRadar({ verdict, originSource, inputInfo }) {
  const risky = verdict === "FAKE" || verdict === "MISLEADING";
  return {
    initialNode: originSource,
    nodeType: inputInfo.socialPlatform ? "Social platform post" : inputInfo.isUrl ? "Web publication" : "Pasted text",
    viralStage: risky ? "High spread risk"
      : verdict === "VERIFIED" ? "Reputable source"
      : verdict === "RHETORIC" ? "Opinion"
      : verdict === "SATIRE" ? "Satire"
      : "Unconfirmed",
    viralRiskScore: risky ? 85 : verdict === "VERIFIED" ? 15 : verdict === "RHETORIC" || verdict === "SATIRE" ? 35 : 50,
    preShareRecommendation: getShareAdvice(verdict),
    propagationPath: [
      { stage: "Where you saw it", location: originSource, note: inputInfo.isUrl ? "The link you submitted" : "The text you pasted" },
      {
        stage: "Typical amplification",
        location: inputInfo.socialPlatform ? `${inputInfo.socialPlatform} reposts & groups` : "Messaging apps & forums",
        note: "Where content like this usually spreads",
      },
      {
        stage: "Who to check with",
        location: "Fact-checkers & wire services listed below",
        note: risky ? "Search them for an existing debunk before sharing" : "Confirm the specific statement before sharing",
      },
    ],
  };
}

export function buildSignals({ verdict, trustScore, domainAuthority, sensationalCount = 0 }) {
  return {
    domainAuthority,
    crossConsensus:
      verdict === "VERIFIED" ? "Consistent with reputable sources"
        : verdict === "FAKE" ? "False or fabricated"
        : verdict === "MISLEADING" ? "Misleading or unreliable source"
        : verdict === "SATIRE" ? "Satire source"
        : verdict === "RHETORIC" ? "Opinion, not a factual claim"
        : "Not independently confirmed",
    manipulatedMedia: null, // not assessed: no media analysis is performed
    clickbaitScore: Math.min(100, Math.max(5, 100 - trustScore + sensationalCount * 10)),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classifies and screens a claim or URL and returns a report object (the same
 * shape as the seed posts in newsDatabase.js). Returns null for empty input.
 */
export function analyzeClaim(inputText, country = "Any", now = new Date()) {
  const inputInfo = parseClaimInput(inputText);
  const text = inputInfo.rawText;
  if (!text) return null;

  const link = analyzeLink(inputInfo.isUrl ? inputInfo : inputInfo.embeddedUrl);
  const topic = inputInfo.isUrl ? "Web Link" : detectTopic(text);
  const scoring = assess({ text, inputInfo, link });
  const { verdict, trustScore, confidence, contentType } = scoring;

  const encodedQuery = encodeURIComponent(truncate(text, 100));

  let originSource;
  let originUrl;
  if (inputInfo.socialPlatform) {
    originSource = `${inputInfo.socialPlatform} post${inputInfo.socialHandle ? ` (${inputInfo.socialHandle})` : ""}`;
    originUrl = inputInfo.cleanUrl;
  } else if (inputInfo.isUrl) {
    originSource = inputInfo.domain;
    originUrl = inputInfo.cleanUrl;
  } else if (link) {
    originSource = `Text linking to ${link.domain}`;
    originUrl = inputInfo.embeddedUrl.cleanUrl;
  } else {
    originSource = "Pasted text (origin unknown)";
    originUrl = `https://news.google.com/search?q=${encodedQuery}`;
  }

  const primaryWire = PRIMARY_WIRE[country] || "Reuters / AP";
  const risky = verdict === "FAKE" || verdict === "MISLEADING";

  const domainAuthority = link?.trustedDomain ? link.trustedDomain.score
    : link?.kind === "social" ? 35
    : link?.kind === "impersonation" ? 5
    : link ? 40
    : null;

  return {
    id: `claim-${hashString(`${text}|${country}`)}-${now.getTime()}`,
    method: "heuristic",
    confidence,
    contentType,
    linkAnalysis: link,
    rhetoricSignals: scoring.rhetoric.signals,
    country: country !== "Any" ? country : undefined,
    region: COUNTRY_REGION[country],
    sourceDomain: link?.trustedDomain?.domain,
    author: {
      name: inputInfo.socialPlatform ? `${inputInfo.socialPlatform} post` : inputInfo.domain || "Your check",
      handle: inputInfo.socialHandle || (inputInfo.domain ? `@${inputInfo.domain}` : "@you"),
      avatar: null,
      verified: link?.kind === "trusted",
      platform: inputInfo.socialPlatform ? "social" : "web",
    },
    content: text,
    rawTimestamp: now.toISOString(),
    metrics: null,
    verdict,
    trustScore,
    topic,
    summary: buildSummary({ text, country, topic, scoring, link }),
    originTrace: {
      firstSeen: `Checked ${now.toLocaleString()}`,
      originalPublisher: originSource,
      originalUrl: originUrl,
      timeline: [
        { time: "Step 1", event: `Input received: ${originSource}`, type: "social", source: "Input" },
        { time: "Step 2", event: `Classified as ${contentType.replace("_", " ")} and screened for misinformation patterns; suggested cross-check with ${primaryWire} and regional fact-checkers`, type: "wire", source: "Offline screen" },
        { time: "Step 3", event: risky ? "Flagged: search the fact-checkers below for an existing debunk" : "No refutation patterns found; confirm with the sources below", type: risky ? "debunk" : "primary", source: "Assessment" },
      ],
    },
    originRadar: buildOriginRadar({ verdict, originSource, inputInfo }),
    corroboratingSources: getRegionalSources(country, text, encodedQuery),
    signals: buildSignals({ verdict, trustScore, domainAuthority, sensationalCount: scoring.sensationalCount }),
  };
}
