// text.js - Small text helpers shared by the verification engine and UI

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Whole-word / whole-phrase match. Avoids false hits such as "ai" in "said"
 * or "un" in "under" that plain substring checks produce.
 */
export function hasTerm(text, term) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(term.toLowerCase())}($|[^a-z0-9])`, "i").test(text);
}

export function matchTerms(text, terms) {
  return terms.filter((t) => hasTerm(text, t));
}

export function hasAnyTerm(text, terms) {
  return terms.some((t) => hasTerm(text, t));
}

/** Normalised form used to detect that two checks are about the same claim. */
export function normalizeClaim(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Stable, short, non-cryptographic hash (used for ids). */
export function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

export function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
