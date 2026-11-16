// time.js - Relative timestamp formatting

const UNITS = [
  { limit: 60, div: 1, unit: "sec" },
  { limit: 3600, div: 60, unit: "min" },
  { limit: 86400, div: 3600, unit: "hr" },
  { limit: 604800, div: 86400, unit: "day" },
];

export function formatRelative(isoString, now = Date.now()) {
  const then = Date.parse(isoString);
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 30) return "Just now";
  for (const { limit, div, unit } of UNITS) {
    if (seconds < limit) {
      const n = Math.floor(seconds / div);
      return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
    }
  }
  return new Date(then).toLocaleDateString();
}
