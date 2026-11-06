// newsFeed.js - Latest headlines for the newsfeed, saved on the device so claims
// can still be checked against recent news while offline.
//
// Source: the server's /api/headlines (Google News top stories and sections)
// when VITE_EVIDENCE_API_URL or VITE_HEADLINES_API_URL is set, otherwise GDELT
// directly from the browser (best effort, often rate-limited).

import { findTrustedDomain } from "./verifierEngine";
import { isRelevant, keywordsForInput } from "./onlineSources";
import { readJSON, writeJSON } from "../lib/storage";

const EVIDENCE_URL = import.meta.env.VITE_EVIDENCE_API_URL || "";
const HEADLINES_URL =
  import.meta.env.VITE_HEADLINES_API_URL || (EVIDENCE_URL ? EVIDENCE_URL.replace(/evidence\/?$/, "headlines") : "");

const STORAGE_KEY = "verifinews-headlines-v1";
const TIMEOUT_MS = 12000;
export const FEED_REFRESH_MS = 15 * 60_000;
// Older headlines are kept (up to a limit) so offline checks cover the last few days, not just today.
const KEEP_DAYS = 7;
const MAX_SAVED_PER_COUNTRY = 400;

const GDELT_COUNTRY = { Nigeria: "NI", Ghana: "GH", Kenya: "KE", "South Africa": "SF", "United States": "US", "United Kingdom": "UK" };

const domainOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const withTrust = (item) => ({ ...item, trusted: Boolean(findTrustedDomain(item.domain || domainOf(item.source || ""))) });

// GDELT dates look like 20261031T143000Z
const gdeltDate = (s = "") =>
  /^\d{8}T\d{6}Z$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z` : "";

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromServer(country) {
  const data = await fetchJson(`${HEADLINES_URL}?country=${encodeURIComponent(country)}`);
  return data.items || [];
}

async function fetchFromGdelt(country) {
  const code = GDELT_COUNTRY[country];
  const query = code ? `sourcecountry:${code} sourcelang:english` : "sourcelang:english";
  const data = await fetchJson(
    `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=75&format=json&timespan=1d&sort=datedesc`,
  );
  return (data.articles || []).map((a) => {
    const publishedAt = gdeltDate(a.seendate);
    return { title: a.title, url: a.url, source: a.domain, domain: a.domain || domainOf(a.url), publishedAt, date: publishedAt.slice(0, 10), section: "Latest" };
  });
}

/** Everything saved on this device: { [country]: { fetchedAt, items } }. */
export function loadSavedFeeds() {
  const saved = readJSON(STORAGE_KEY, {});
  return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
}

/** Every saved headline across countries, newest first, without duplicates. */
export function allSavedHeadlines(feeds = loadSavedFeeds()) {
  const seen = new Set();
  return Object.values(feeds)
    .flatMap((f) => f.items || [])
    .filter((item) => item.title && !seen.has(item.title) && seen.add(item.title))
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
}

/** Merges fresh headlines into what was saved before, dropping old ones. */
export function mergeHeadlines(fresh, previous = [], now = Date.now()) {
  const cutoff = new Date(now - KEEP_DAYS * 86_400_000).toISOString();
  const seen = new Set();
  return [...fresh, ...previous]
    .filter((item) => item.title && !seen.has(item.title) && seen.add(item.title))
    .filter((item) => !item.publishedAt || item.publishedAt >= cutoff)
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .slice(0, MAX_SAVED_PER_COUNTRY);
}

/**
 * Downloads the latest headlines for a country and saves them on the device.
 * Resolves with the saved feed { fetchedAt, items }; throws if nothing could be fetched.
 */
export async function refreshHeadlines(country = "Any") {
  const fresh = (HEADLINES_URL ? await fetchFromServer(country) : await fetchFromGdelt(country)).map(withTrust);
  if (fresh.length === 0) throw new Error("No headlines returned");
  const feeds = loadSavedFeeds();
  const feed = { fetchedAt: new Date().toISOString(), items: mergeHeadlines(fresh, feeds[country]?.items) };
  writeJSON(STORAGE_KEY, { ...feeds, [country]: feed });
  return feed;
}

/** Saved headlines that are about the same thing as the claim, trusted outlets first. */
export function matchHeadlines(text, headlines) {
  const keywords = keywordsForInput(text);
  if (keywords.length === 0) return [];
  return headlines
    .filter((item) => isRelevant(item.title, keywords))
    .map(withTrust)
    .sort((a, b) => Number(b.trusted) - Number(a.trusted));
}
