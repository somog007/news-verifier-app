// verify-proxy.mjs - Minimal server for live verification. Keeps API keys out of the browser.
//
//   GET  /api/evidence?q=keywords&country=Nigeria
//        News coverage (Google News search) and published fact-checks (Google
//        Fact Check Tools, if GOOGLE_FACTCHECK_API_KEY is set). Needs no AI key.
//   GET  /api/headlines?country=Nigeria
//        Latest headlines (Google News top stories and sections) for the
//        app's newsfeed, which the app saves for offline claim checks.
//   POST /api/verify  { claim, country }
//        Claude researches the claim with web search (and reads the link, if one
//        was submitted). Needs ANTHROPIC_API_KEY.
//
//   cd server && npm install && npm start

import http from "node:http";
import Anthropic from "@anthropic-ai/sdk";

const PORT = Number(process.env.PORT || 8787);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:5173";
const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const MAX_CLAIM_LENGTH = 2000;
const COUNTRIES = new Set(["Any", "Nigeria", "Ghana", "Kenya", "South Africa", "United States", "United Kingdom"]);
const RATE_LIMIT = { windowMs: 60_000, max: 10 };

const FACTCHECK_KEY = process.env.GOOGLE_FACTCHECK_API_KEY || "";
const NEWS_EDITIONS = {
  Nigeria: "hl=en-NG&gl=NG&ceid=NG:en",
  Ghana: "hl=en-GH&gl=GH&ceid=GH:en",
  Kenya: "hl=en-KE&gl=KE&ceid=KE:en",
  "South Africa": "hl=en-ZA&gl=ZA&ceid=ZA:en",
  "United Kingdom": "hl=en-GB&gl=GB&ceid=GB:en",
};

// Created on first use so the evidence endpoint works without an Anthropic key.
let client;
const getClient = () => (client ??= new Anthropic()); // reads ANTHROPIC_API_KEY from the environment

const SYSTEM_PROMPT = `You are a careful news and claim verification assistant for people who are about to share something they saw on social media.

First decide what kind of content this is:
- "factual_claim": a specific, checkable statement about the world.
- "fabricated": invented content, such as made-up quotes, fake official notices, chain messages or scam offers.
- "satire": parody or humour, from a satire outlet or written as a joke.
- "rhetoric": opinion, value judgement, rhetorical question, slogan or exaggeration that cannot be proven true or false as stated. If it contains a checkable factual element, classify it as "factual_claim" and check that element.
- "link": the input is only a URL. Fetch it, decide who published it and whether that publisher is reliable, then check the main claim it makes.

Use web search to find corroborating or refuting evidence from wire services (Reuters, AP, AFP, NAN, GNA, SABC, Nation Africa), fact-checkers (Dubawa, Africa Check, PesaCheck, AFP Fact Check, Snopes, Full Fact) and other reputable outlets. Try to find the earliest origin of the story and how it spread. Only cite URLs you actually found. If the evidence is thin, say so and choose "unverified" rather than guessing. Use "opinion" as the verdict for rhetoric and "satire" for satire.

Respond with a single JSON object and nothing else, matching this schema:
{
  "content_type": "factual_claim" | "fabricated" | "satire" | "rhetoric" | "link",
  "content_type_reason": "one sentence explaining the classification",
  "verdict": "verified" | "likely_true" | "unverified" | "likely_false" | "false" | "satire" | "opinion",
  "confidence": "high" | "medium" | "low",
  "summary": "1-2 plain-language sentences explaining the verdict",
  "industry": "short topic label, e.g. Politics, Health, Finance, Technology, Entertainment, Sports, Security, Environment, Other",
  "country_relevance": ["countries this claim is most relevant to"],
  "origin": { "outlet": "string or null", "date": "string or null", "url": "string or null", "note": "how the origin was determined" },
  "trace": [ { "date": "string", "outlet": "string", "note": "short note" } ],
  "sources": [ { "title": "string", "outlet": "string", "date": "string or null", "url": "string" } ]
}
Keep "trace" and "sources" to at most 5 items each.`;

const hits = new Map();
function rateLimited(ip, max = RATE_LIMIT.max) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > max;
}

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let data = "";
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 10_000) throw new Error("Body too large");
  }
  return JSON.parse(data || "{}");
}

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model response");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function researchClaim(claim, country) {
  const userPrompt = `Content to verify:\n"""${claim}"""\n\n${
    country !== "Any"
      ? `The person checking this is in ${country}. Prioritise sources relevant to that country and note if the claim is more relevant elsewhere.`
      : ""
  }`;

  const messages = [{ role: "user", content: userPrompt }];

  // Server-side web search can pause long turns; resume a few times if needed.
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: SYSTEM_PROMPT,
      tools: [
        { type: "web_search_20260209", name: "web_search", max_uses: 5 },
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: 2 },
      ],
      messages,
    });

    if (response.stop_reason === "refusal") {
      throw Object.assign(new Error("The model declined to assess this claim."), { status: 422 });
    }
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return extractJson(text);
  }
  throw new Error("Research did not finish in time");
}

const decodeXml = (s = "") =>
  s.replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const tag = (xml, name) => decodeXml(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] || "").trim();

async function fetchWithTimeout(url, ms = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "VerifiNews/1.0" } });
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}`);
    return response;
  } finally {
    clearTimeout(timer);
  }
}

const editionFor = (country) => NEWS_EDITIONS[country] || "hl=en-US&gl=US&ceid=US:en";

async function readGoogleNewsRss(url, limit) {
  const xml = await (await fetchWithTimeout(url)).text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, limit).map(([, item]) => {
    const sourceUrl = item.match(/<source url="([^"]+)"/)?.[1] || "";
    const source = tag(item, "source");
    const title = tag(item, "title").replace(new RegExp(` - ${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), "");
    let domain = "";
    try {
      domain = new URL(sourceUrl).hostname.replace(/^www\./, "");
    } catch {
      // no source url
    }
    const published = new Date(tag(item, "pubDate"));
    const validDate = !Number.isNaN(published.getTime());
    return {
      title,
      url: tag(item, "link"),
      source,
      domain,
      date: validDate ? published.toISOString().slice(0, 10) : "",
      publishedAt: validDate ? published.toISOString() : "",
    };
  });
}

const searchNews = (query, country) =>
  readGoogleNewsRss(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${editionFor(country)}`, 15);

// Top stories plus a few sections, so the app's saved newsfeed covers enough
// ground to check claims against while offline. Cached briefly per country.
const HEADLINE_SECTIONS = ["", "NATION", "WORLD", "BUSINESS", "HEALTH", "SCIENCE"];
const HEADLINES_TTL_MS = 10 * 60_000;
const headlineCache = new Map();

async function fetchHeadlines(country) {
  const cached = headlineCache.get(country);
  if (cached && Date.now() - cached.at < HEADLINES_TTL_MS) return cached.items;

  const edition = editionFor(country);
  const feeds = await Promise.allSettled(
    HEADLINE_SECTIONS.map((section) =>
      readGoogleNewsRss(
        section ? `https://news.google.com/rss/headlines/section/topic/${section}?${edition}` : `https://news.google.com/rss?${edition}`,
        30,
      ).then((items) => items.map((item) => ({ ...item, section: section ? section[0] + section.slice(1).toLowerCase() : "Top stories" }))),
    ),
  );
  const seen = new Set();
  const items = feeds
    .flatMap((f) => (f.status === "fulfilled" ? f.value : []))
    .filter((item) => item.title && !seen.has(item.title) && seen.add(item.title))
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  if (items.length === 0) throw new Error("No headline feeds could be reached");
  headlineCache.set(country, { at: Date.now(), items });
  return items;
}

async function searchFactChecks(query) {
  if (!FACTCHECK_KEY) return [];
  const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(query)}&pageSize=10&key=${FACTCHECK_KEY}`;
  const data = await (await fetchWithTimeout(url)).json();
  return (data.claims || []).flatMap((claim) =>
    (claim.claimReview || []).map((review) => ({
      claim: claim.text,
      claimant: claim.claimant,
      publisher: review.publisher?.name || review.publisher?.site,
      url: review.url,
      rating: review.textualRating,
      date: review.reviewDate?.slice(0, 10),
    })),
  );
}

async function handleEvidence(req, res) {
  const params = new URL(req.url, "http://localhost").searchParams;
  const query = (params.get("q") || "").trim().slice(0, 200);
  const country = params.get("country") || "Any";
  if (!query) return send(res, 400, { error: "q is required" });
  if (!COUNTRIES.has(country)) return send(res, 400, { error: "Unsupported country" });

  const [news, factChecks] = await Promise.allSettled([searchNews(query, country), searchFactChecks(query)]);
  if (news.status === "rejected") console.warn("News search failed:", news.reason?.message);
  if (factChecks.status === "rejected") console.warn("Fact-check search failed:", factChecks.reason?.message);
  return send(res, 200, {
    news: news.status === "fulfilled" ? news.value : [],
    factChecks: factChecks.status === "fulfilled" ? factChecks.value : [],
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});

  const ip = req.socket.remoteAddress || "unknown";
  if (req.method === "GET" && req.url.startsWith("/api/headlines")) {
    if (rateLimited(`headlines:${ip}`, 20)) return send(res, 429, { error: "Too many requests, please wait a minute." });
    const country = new URL(req.url, "http://localhost").searchParams.get("country") || "Any";
    if (!COUNTRIES.has(country)) return send(res, 400, { error: "Unsupported country" });
    return fetchHeadlines(country)
      .then((items) => send(res, 200, { country, fetchedAt: new Date().toISOString(), items }))
      .catch((err) => {
        console.warn("Headlines failed:", err.message);
        send(res, 502, { error: "Could not load headlines" });
      });
  }
  if (req.method === "GET" && req.url.startsWith("/api/evidence")) {
    if (rateLimited(`evidence:${ip}`, 30)) return send(res, 429, { error: "Too many requests, please wait a minute." });
    return handleEvidence(req, res).catch((err) => {
      console.error(err);
      send(res, 500, { error: "Evidence search failed" });
    });
  }
  if (req.method !== "POST" || !req.url.startsWith("/api/verify")) return send(res, 404, { error: "Not found" });
  if (!process.env.ANTHROPIC_API_KEY) return send(res, 503, { error: "AI research is not configured on this server" });
  if (rateLimited(ip)) return send(res, 429, { error: "Too many requests, please wait a minute." });

  try {
    const { claim, country = "Any" } = await readBody(req);
    if (typeof claim !== "string" || !claim.trim() || claim.length > MAX_CLAIM_LENGTH) {
      return send(res, 400, { error: `claim must be a non-empty string of at most ${MAX_CLAIM_LENGTH} characters` });
    }
    if (!COUNTRIES.has(country)) return send(res, 400, { error: "Unsupported country" });

    const result = await researchClaim(claim.trim(), country);
    return send(res, 200, result);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return send(res, 503, { error: "Upstream rate limit, try again shortly." });
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Invalid ANTHROPIC_API_KEY");
      return send(res, 500, { error: "Server misconfigured" });
    }
    if (err instanceof Anthropic.APIError) {
      console.error(`Claude API error ${err.status}:`, err.message);
      return send(res, 502, { error: "Verification service error" });
    }
    console.error(err);
    return send(res, err.status || 500, { error: err.status ? err.message : "Verification failed" });
  }
});

server.listen(PORT, () => {
  console.log(`VerifiNews server on http://localhost:${PORT}`);
  console.log("  /api/headlines newsfeed");
  console.log(`  /api/evidence  news${FACTCHECK_KEY ? " + fact-checks" : " (set GOOGLE_FACTCHECK_API_KEY for fact-checks)"}`);
  console.log(`  /api/verify    ${process.env.ANTHROPIC_API_KEY ? `AI research (${MODEL})` : "disabled (set ANTHROPIC_API_KEY)"}`);
});
