// verdicts.js - Single source of truth for verdict labels, colours and share advice
import { ShieldCheck, ShieldAlert, AlertTriangle, Sparkles, HelpCircle, MessageCircle } from "lucide-react";

export const VERDICTS = {
  VERIFIED: {
    label: "Verified",
    badge: "VERIFIED REAL",
    banner: "VERIFIED REAL NEWS",
    key: "verified",
    color: "var(--verified-green)",
    tone: "success",
    Icon: ShieldCheck,
  },
  FAKE: {
    label: "False / fabricated",
    badge: "FLAGGED FAKE",
    banner: "FLAGGED AS FALSE OR FABRICATED",
    key: "fake",
    color: "var(--fake-red)",
    tone: "danger",
    Icon: ShieldAlert,
  },
  MISLEADING: {
    label: "Misleading",
    badge: "MISLEADING",
    banner: "MISLEADING / CONTEXT NEEDED",
    key: "misleading",
    color: "var(--misleading-amber)",
    tone: "danger",
    Icon: AlertTriangle,
  },
  SATIRE: {
    label: "Satire",
    badge: "SATIRE",
    banner: "SATIRE / PARODY",
    key: "satire",
    color: "var(--satire-purple)",
    tone: "warning",
    Icon: Sparkles,
  },
  RHETORIC: {
    label: "Opinion / rhetoric",
    badge: "OPINION",
    banner: "OPINION / RHETORIC — NOT A CHECKABLE FACT",
    key: "rhetoric",
    color: "var(--accent-blue)",
    tone: "warning",
    Icon: MessageCircle,
  },
  UNVERIFIED: {
    label: "Unverified",
    badge: "UNVERIFIED",
    banner: "UNVERIFIED CLAIM",
    key: "unverified",
    color: "var(--misleading-amber)",
    tone: "warning",
    Icon: HelpCircle,
  },
};

export const VERDICT_ORDER = ["VERIFIED", "FAKE", "MISLEADING", "SATIRE", "RHETORIC", "UNVERIFIED"];

export function getVerdictMeta(verdict) {
  return VERDICTS[verdict] || VERDICTS.UNVERIFIED;
}

export function getShareAdvice(verdict) {
  switch (verdict) {
    case "FAKE":
      return "🛑 DO NOT SHARE — This claim matches known misinformation patterns or has been refuted.";
    case "MISLEADING":
      return "🛑 DO NOT SHARE AS-IS — The claim lacks important context or is framed misleadingly.";
    case "VERIFIED":
      return "✅ LIKELY SAFE TO SHARE — Consistent with reputable sources. Link the original source when you share.";
    case "SATIRE":
      return "⚠️ SATIRE — If you share it, make clear it is a joke, not news.";
    case "RHETORIC":
      return "💬 OPINION — Fine to share as someone's view, but don't present it as established fact.";
    default:
      return "⚠️ VERIFY BEFORE SHARING — No independent confirmation was found.";
  }
}

export const COUNTRIES = ["Any", "Nigeria", "Ghana", "Kenya", "South Africa", "United States", "United Kingdom"];

export const COUNTRY_REGION = {
  Nigeria: "West Africa",
  Ghana: "West Africa",
  Kenya: "East Africa",
  "South Africa": "Southern Africa",
  "United States": "Global",
  "United Kingdom": "Global",
};
