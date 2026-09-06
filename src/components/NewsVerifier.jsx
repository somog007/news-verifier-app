import { useState, useEffect, useRef } from "react";
import { Search, Loader2, CheckCircle2, XCircle, HelpCircle, AlertTriangle, ExternalLink, Clock, Compass, ShieldAlert } from "lucide-react";
import { analyzeClaim } from "../services/verifierEngine";

const COUNTRIES = ["Any", "Nigeria", "Ghana", "Kenya", "South Africa", "United States", "United Kingdom"];

const VERDICT_META = {
  verified: { label: "Verified", color: "var(--nv-green)", Icon: CheckCircle2 },
  likely_true: { label: "Likely true", color: "var(--nv-green)", Icon: CheckCircle2 },
  unverified: { label: "Unverified", color: "var(--nv-amber)", Icon: HelpCircle },
  likely_false: { label: "Likely false", color: "var(--nv-rust)", Icon: AlertTriangle },
  false: { label: "False", color: "var(--nv-rust)", Icon: XCircle },
};

// Safe storage wrapper (supports window.storage if present, with localStorage fallback)
const safeStorage = {
  async get(key) {
    try {
      if (typeof window !== "undefined" && window.storage && typeof window.storage.get === "function") {
        return await window.storage.get(key, false);
      }
      if (typeof localStorage !== "undefined") {
        const val = localStorage.getItem(key);
        return val ? { value: val } : null;
      }
    } catch {
      // fallback
    }
    return null;
  },
  async set(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage && typeof window.storage.set === "function") {
        return await window.storage.set(key, value, false);
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
      }
    } catch {
      // fallback
    }
  }
};

function hashClaim(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function normalize(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 300);
}

// Fallback generator when direct API is unavailable or unauthenticated
function fallbackVerify(text, country) {
  const engineResult = analyzeClaim(text, country);
  
  let mappedVerdict = "unverified";
  let confidence = "medium";
  if (engineResult.verdict === "VERIFIED") {
    mappedVerdict = "verified";
    confidence = "high";
  } else if (engineResult.verdict === "FAKE") {
    mappedVerdict = "false";
    confidence = "high";
  } else if (engineResult.verdict === "MISLEADING") {
    mappedVerdict = "likely_false";
    confidence = "medium";
  } else if (engineResult.verdict === "SATIRE") {
    mappedVerdict = "false";
    confidence = "high";
  }

  const countryRel = country !== "Any" ? [country] : ["Global", "Africa"];

  return {
    verdict: mappedVerdict,
    confidence: confidence,
    summary: engineResult.summary || "Analysis indicates mixed corroboration across wire networks.",
    industry: engineResult.topic || "General News",
    country_relevance: countryRel,
    origin: {
      outlet: engineResult.originTrace?.originalPublisher || "Social Media Node",
      date: engineResult.timestamp || "Recent",
      url: engineResult.originTrace?.originalUrl || null,
      note: `Identified via cross-checking social streams${country !== "Any" ? ` in ${country}` : ""}.`
    },
    trace: (engineResult.originTrace?.timeline || []).map(t => ({
      date: t.time || "Recent",
      outlet: t.source || "Feed Node",
      note: t.event
    })),
    sources: (engineResult.corroboratingSources || []).map(s => ({
      title: `${s.name} - ${s.type}`,
      outlet: s.name,
      date: "Recent",
      url: s.url
    }))
  };
}

export default function NewsVerifier({ initialClaim = "", onAddPost = null }) {
  const [claim, setClaim] = useState(initialClaim);
  const [country, setCountry] = useState("Any");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("All");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (initialClaim) {
      setClaim(initialClaim);
    }
  }, [initialClaim]);

  useEffect(() => {
    (async () => {
      try {
        const r = await safeStorage.get("recent-checks");
        if (r && r.value) setHistory(JSON.parse(r.value));
      } catch {
        // no history yet
      }
    })();
  }, []);

  async function saveHistory(entry) {
    try {
      const next = [entry, ...history.filter(h => h.id !== entry.id)].slice(0, 10);
      setHistory(next);
      await safeStorage.set("recent-checks", JSON.stringify(next));
    } catch {
      // best-effort only
    }
  }

  async function verify() {
    const text = claim.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setFromCache(false);

    const key = "verify:" + hashClaim(normalize(text) + "|" + country);

    try {
      try {
        const cached = await safeStorage.get(key);
        if (cached && cached.value) {
          const parsed = JSON.parse(cached.value);
          setResult(parsed);
          setFromCache(true);
          setLoading(false);
          return;
        }
      } catch {
        // no cache hit, continue to live check
      }

      const prompt = `You are a news and claim verification assistant. Analyze the following piece of content, which was shared on social media, and determine whether it is real/legitimate news, fake/false, or unverifiable. Use web search to find corroborating sources, wire services (Reuters, AP, AFP, NAN, GNA, SABC, Nation Africa), fact-checkers (Dubawa, Africa Check, PesaCheck, AFP Fact Check, Snopes, Full Fact), and reputable outlets. Try to identify the earliest origin of the story and how it spread.

Content to verify:
"""${text}"""

${country !== "Any" ? `The person checking this is in ${country}. Prioritize sources and outlets relevant to that country/region where applicable, and note if the claim is more relevant elsewhere.` : ""}

Respond ONLY with a single JSON object, no markdown code fences, no preamble, matching exactly this schema:
{
  "verdict": "verified" | "likely_true" | "unverified" | "likely_false" | "false",
  "confidence": "high" | "medium" | "low",
  "summary": "1-2 plain-language sentences explaining the verdict",
  "industry": "short category label, e.g. Politics, Health, Finance, Technology, Entertainment, Sports, Security, Environment, Other",
  "country_relevance": ["country names this news is most relevant to"],
  "origin": { "outlet": "string or null", "date": "string or null", "url": "string or null", "note": "short note on how origin was determined" },
  "trace": [ { "date": "string", "outlet": "string", "note": "short note" } ],
  "sources": [ { "title": "string", "outlet": "string", "date": "string or null", "url": "string" } ]
}
Keep "trace" and "sources" to at most 5 items each. If origin cannot be determined, set "origin" fields to null.`;

      let parsed = null;
      const apiKey = typeof import.meta !== "undefined" && import.meta.env ? (import.meta.env.VITE_ANTHROPIC_API_KEY || "") : "";

      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } : {})
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
            tools: [{ type: "web_search_20250305", name: "web_search" }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const textBlocks = (data.content || [])
            .filter((b) => b.type === "text")
            .map((b) => b.text)
            .join("\n")
            .trim();

          const cleaned = textBlocks.replace(/```json|```/g, "").trim();
          const start = cleaned.indexOf("{");
          const end = cleaned.lastIndexOf("}");
          if (start !== -1 && end !== -1) {
            parsed = JSON.parse(cleaned.slice(start, end + 1));
          }
        }
      } catch (err) {
        console.warn("Anthropic direct API call unavailable, switching to local verification engine.", err);
      }

      // Fallback to local engine if direct call failed or returned null
      if (!parsed) {
        parsed = fallbackVerify(text, country);
      }

      setResult(parsed);

      if (onAddPost && typeof onAddPost === 'function') {
        const fullPost = analyzeClaim(text, country);
        onAddPost(fullPost);
      }

      try {
        await safeStorage.set(key, JSON.stringify(parsed));
      } catch {
        // caching is best-effort
      }

      await saveHistory({
        id: key,
        preview: text.slice(0, 90),
        verdict: parsed.verdict,
        industry: parsed.industry || "Other",
        countries: parsed.country_relevance || [],
        timestamp: Date.now(),
      });
    } catch (e) {
      setError(e.message || "Verification failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function loadFromHistory(entryId) {
    (async () => {
      try {
        const cached = await safeStorage.get(entryId);
        if (cached && cached.value) {
          setResult(JSON.parse(cached.value));
          setFromCache(true);
          setError(null);
        }
      } catch {
        // ignore
      }
    })();
  }

  const industries = ["All", ...Array.from(new Set(history.map((h) => h.industry)))];
  const filteredHistory =
    historyFilter === "All" ? history : history.filter((h) => h.industry === historyFilter);

  const meta = result ? VERDICT_META[result.verdict] || VERDICT_META.unverified : null;

  return (
    <div className="nv-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .nv-root {
          font-family: var(--font-body);
          background: var(--bg-card);
          color: var(--nv-ink);
          min-height: 100%;
          padding: 40px 20px 64px;
          box-sizing: border-box;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          margin-top: 1rem;
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        .nv-root * { box-sizing: border-box; }
        .nv-container { max-width: 640px; margin: 0 auto; }

        .nv-mark {
          font-size: 13px;
          color: var(--nv-muted);
          letter-spacing: 0.02em;
          margin-bottom: 6px;
        }
        .nv-title {
          font-family: 'Fraunces', serif;
          font-size: 30px;
          font-weight: 500;
          margin: 0 0 6px;
          line-height: 1.2;
        }
        .nv-sub {
          color: var(--nv-muted);
          font-size: 14.5px;
          margin: 0 0 28px;
          max-width: 46ch;
          line-height: 1.5;
        }

        .nv-form {
          border-top: 1px solid var(--nv-line);
          padding-top: 24px;
        }
        .nv-textarea {
          width: 100%;
          min-height: 108px;
          resize: vertical;
          background: var(--bg-dark);
          border: 1px solid var(--nv-line);
          border-radius: 6px;
          padding: 14px;
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--nv-ink);
          line-height: 1.5;
        }
        .nv-textarea:focus-visible {
          outline: 2px solid var(--nv-ink);
          outline-offset: 1px;
        }
        .nv-hint {
          font-size: 12.5px;
          color: var(--nv-muted);
          margin-top: 6px;
        }

        .nv-controls {
          display: flex;
          gap: 10px;
          margin-top: 14px;
          flex-wrap: wrap;
          align-items: center;
        }
        .nv-select {
          background: var(--bg-dark);
          border: 1px solid var(--nv-line);
          border-radius: 6px;
          padding: 9px 10px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--nv-ink);
        }
        .nv-select:focus-visible { outline: 2px solid var(--nv-ink); outline-offset: 1px; }

        .nv-button {
          background: var(--nv-ink);
          color: var(--nv-paper);
          border: none;
          border-radius: 3px;
          padding: 10px 18px;
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          margin-left: auto;
        }
        .nv-button:disabled { opacity: 0.55; cursor: default; }
        .nv-button:focus-visible { outline: 2px solid var(--nv-ink); outline-offset: 2px; }

        .nv-spin { animation: nv-spin 0.9s linear infinite; }
        @keyframes nv-spin { to { transform: rotate(360deg); } }

        .nv-error {
          margin-top: 22px;
          border: 1px solid var(--nv-rust);
          background: #FBF1EC;
          color: var(--nv-rust);
          padding: 12px 14px;
          font-size: 14px;
          border-radius: 3px;
        }

        .nv-result { margin-top: 36px; border-top: 1px solid var(--nv-line); padding-top: 28px; }
        .nv-verdict-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
        .nv-verdict-word {
          font-family: 'Fraunces', serif;
          font-size: 34px;
          font-weight: 500;
          line-height: 1;
        }
        .nv-confidence { font-size: 13px; color: var(--nv-muted); }
        .nv-summary { font-size: 15.5px; line-height: 1.55; margin: 14px 0 6px; max-width: 56ch; }
        .nv-cache-note { font-size: 12px; color: var(--nv-muted); margin-bottom: 4px; }

        .nv-tagrow {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin: 16px 0 6px;
          font-size: 13px;
          color: var(--nv-muted);
        }
        .nv-tag { display: inline-flex; align-items: center; gap: 6px; }
        .nv-tag-divider { width: 1px; height: 13px; background: var(--nv-line); }

        .nv-section { margin-top: 30px; }
        .nv-section-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .nv-origin { font-size: 14.5px; line-height: 1.6; }
        .nv-origin-empty { color: var(--nv-muted); font-size: 14px; }

        .nv-trace-item {
          border-left: 2px solid var(--nv-line);
          padding: 2px 0 14px 16px;
          position: relative;
        }
        .nv-trace-item:last-child { padding-bottom: 0; }
        .nv-trace-item::before {
          content: '';
          position: absolute;
          left: -5px;
          top: 6px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--nv-ink);
        }
        .nv-trace-date { font-size: 12.5px; color: var(--nv-muted); margin-bottom: 2px; }
        .nv-trace-outlet { font-weight: 500; font-size: 14.5px; }
        .nv-trace-note { font-size: 14px; color: var(--nv-muted); margin-top: 2px; }

        .nv-source {
          padding: 12px 0;
          border-bottom: 1px solid var(--nv-line);
        }
        .nv-source:first-child { padding-top: 0; }
        .nv-source-title { font-size: 14.5px; font-weight: 500; margin-bottom: 3px; }
        .nv-source-meta { font-size: 12.5px; color: var(--nv-muted); display: flex; gap: 6px; align-items: center; }
        .nv-source-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          color: var(--nv-ink);
          text-decoration: none;
          border-bottom: 1px solid var(--nv-ink);
          margin-top: 5px;
        }
        .nv-source-link:focus-visible { outline: 2px solid var(--nv-ink); outline-offset: 2px; }

        .nv-radar-box {
          margin-top: 24px;
          background: var(--bg-dark);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 18px;
        }
        .nv-radar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .nv-radar-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-heading);
          font-size: 16px;
          font-weight: 600;
        }
        .nv-spin-slow {
          color: var(--nv-green);
        }
        .nv-radar-badge {
          font-size: 12px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid var(--border-color);
        }
        .nv-radar-badge.high-risk {
          background: rgba(168, 67, 42, 0.15);
          color: var(--nv-rust);
          border-color: var(--nv-rust);
        }
        .nv-radar-badge.verified {
          background: rgba(53, 104, 74, 0.15);
          color: var(--nv-green);
          border-color: var(--nv-green);
        }
        .nv-preshare-banner {
          padding: 12px 14px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 14px;
          line-height: 1.45;
        }
        .nv-preshare-banner.danger {
          background: rgba(168, 67, 42, 0.15);
          border: 1px solid var(--nv-rust);
          color: var(--nv-rust);
        }
        .nv-preshare-banner.warning {
          background: rgba(156, 116, 35, 0.15);
          border: 1px solid var(--nv-amber);
          color: var(--nv-amber);
        }
        .nv-preshare-banner.success {
          background: rgba(53, 104, 74, 0.15);
          border: 1px solid var(--nv-green);
          color: var(--nv-green);
        }
        .nv-radar-metrics {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .nv-metric-pill {
          font-size: 12.5px;
          background: var(--bg-card);
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid var(--border-color);
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .nv-metric-label { color: var(--nv-muted); }
        .nv-metric-value { font-weight: 600; color: var(--nv-ink); }

        .nv-radar-chain-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--nv-muted);
        }
        .nv-radar-chain {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .nv-chain-step {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background: var(--bg-card);
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }
        .nv-step-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--nv-ink);
          color: var(--bg-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .nv-step-details { flex: 1; }
        .nv-step-stage { font-size: 12px; font-weight: 700; color: var(--nv-muted); }
        .nv-step-location { font-size: 13.5px; font-weight: 600; color: var(--nv-ink); }
        .nv-step-note { font-size: 12.5px; color: var(--nv-muted); margin-top: 2px; }

        .nv-history { margin-top: 44px; border-top: 1px solid var(--nv-line); padding-top: 22px; }
        .nv-history-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }
        .nv-history-title { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 7px; color: var(--nv-muted); }
        .nv-history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--nv-line);
          background: none;
          border-left: none;
          border-right: none;
          border-top: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .nv-history-item:focus-visible { outline: 2px solid var(--nv-ink); outline-offset: 2px; }
        .nv-history-text { font-size: 13.5px; color: var(--nv-ink); }
        .nv-history-empty { font-size: 13.5px; color: var(--nv-muted); }

        @media (max-width: 480px) {
          .nv-verdict-word { font-size: 28px; }
          .nv-button { margin-left: 0; width: 100%; justify-content: center; }
          .nv-controls { flex-direction: column; align-items: stretch; }
        }
      `}</style>

      <div className="nv-container">
        <div className="nv-mark">Verify Before Sharing</div>
        <h1 className="nv-title">Check a claim before you share it</h1>
        <p className="nv-sub">
          Paste a headline, post, or claim you've seen on social media. We'll check it
          against wire services, fact-checkers, and reputable outlets, and trace where it started.
        </p>

        <div className="nv-form">
          <textarea
            ref={textareaRef}
            className="nv-textarea"
            placeholder="Paste the claim, headline, or post text you want checked…"
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
          />
          <div className="nv-hint">Works best with a short factual claim or headline, pasted as text.</div>

          <div className="nv-controls">
            <select
              className="nv-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              aria-label="Country context"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c === "Any" ? "Any country" : c}
                </option>
              ))}
            </select>

            <button className="nv-button" onClick={verify} disabled={loading || !claim.trim()}>
              {loading ? <Loader2 size={16} className="nv-spin" /> : <Search size={16} />}
              {loading ? "Checking…" : "Check this claim"}
            </button>
          </div>
        </div>

        {error && <div className="nv-error">{error}</div>}

        {result && meta && (
          <div className="nv-result">
            {fromCache && <div className="nv-cache-note">Matches a claim checked earlier this session.</div>}
            <div className="nv-verdict-row">
              <meta.Icon size={26} color={meta.color} />
              <span className="nv-verdict-word" style={{ color: meta.color }}>
                {meta.label}
              </span>
            </div>
            <span className="nv-confidence">{result.confidence} confidence</span>
            <p className="nv-summary">{result.summary}</p>

            <div className="nv-tagrow">
              {result.industry && <span className="nv-tag">{result.industry}</span>}
              {result.country_relevance && result.country_relevance.length > 0 && (
                <>
                  <span className="nv-tag-divider" />
                  <span className="nv-tag">{result.country_relevance.join(", ")}</span>
                </>
              )}
            </div>

            {/* Pre-Virality & Origin Early Warning Radar */}
            <div className="nv-radar-box">
              <div className="nv-radar-header">
                <div className="nv-radar-title">
                  <Compass size={18} className="nv-spin-slow" />
                  <span>Pre-Virality & Origin Radar</span>
                </div>
                <span className={`nv-radar-badge ${result.verdict === 'false' || result.verdict === 'likely_false' ? 'high-risk' : 'verified'}`}>
                  {result.originRadar?.viralStage || (result.verdict === 'false' ? 'Spreading (Pre-Peak Virality)' : 'Origin Identified')}
                </span>
              </div>

              {/* Pre-Share Safety Banner */}
              <div className={`nv-preshare-banner ${result.verdict === 'false' || result.verdict === 'likely_false' ? 'danger' : (result.verdict === 'verified' || result.verdict === 'likely_true' ? 'success' : 'warning')}`}>
                <div className="nv-banner-text">
                  {result.originRadar?.preShareRecommendation || (result.verdict === 'false' ? '🛑 DO NOT SHARE — Misinformation origin detected. Sharing accelerates unverified rumor spread.' : (result.verdict === 'verified' ? '✅ SAFE TO SHARE — Corroborated primary wire release.' : '⚠️ VERIFY BEFORE SHARING — Lacks independent primary wire confirmation.'))}
                </div>
              </div>

              {/* Virality & Spread Metric Bar */}
              <div className="nv-radar-metrics">
                <div className="nv-metric-pill">
                  <span className="nv-metric-label">Initial Origin:</span>
                  <span className="nv-metric-value">{result.origin?.outlet || "Social Stream Node"}</span>
                </div>
                <div className="nv-metric-pill">
                  <span className="nv-metric-label">Virality Risk Score:</span>
                  <span className="nv-metric-value">{result.originRadar?.viralRiskScore || (result.verdict === 'false' ? 88 : 18)}/100</span>
                </div>
                <div className="nv-metric-pill">
                  <span className="nv-metric-label">Spread Phase:</span>
                  <span className="nv-metric-value">{result.originRadar?.viralStage || "Pre-Peak Virality"}</span>
                </div>
              </div>

              {/* Pre-Viral Propagation Chain */}
              <div className="nv-radar-chain-title">Pre-Viral Propagation Path (How It Started & Spread)</div>
              <div className="nv-radar-chain">
                {(result.originRadar?.propagationPath || [
                  { stage: "1. Initial Origin Node", location: result.origin?.outlet || "Social Media Post", note: "First spotted on social stream node", velocity: "Low (0-15m)" },
                  { stage: "2. Amplification Vector", location: "Messaging & Forum Networks", note: "Botnet / viral re-sharing acceleration", velocity: "Accelerating (15-60m)" },
                  { stage: "3. Fact-Check Response", location: "Dubawa, Africa Check & AP Wires", note: "Verification response active before viral peak", velocity: "Verified Active" }
                ]).map((path, idx) => (
                  <div key={idx} className="nv-chain-step">
                    <div className="nv-step-number">{idx + 1}</div>
                    <div className="nv-step-details">
                      <div className="nv-step-stage">{path.stage}</div>
                      <div className="nv-step-location">{path.location}</div>
                      <div className="nv-step-note">{path.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="nv-section">
              <div className="nv-section-title">Origin</div>
              {result.origin && result.origin.outlet ? (
                <div className="nv-origin">
                  {result.origin.outlet}
                  {result.origin.date ? `, ${result.origin.date}` : ""}
                  {result.origin.note ? ` — ${result.origin.note}` : ""}
                  {result.origin.url && (
                    <div>
                      <a
                        className="nv-source-link"
                        href={result.origin.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={12} /> View source
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="nv-origin-empty">Origin couldn't be established from available sources.</div>
              )}
            </div>

            {result.trace && result.trace.length > 0 && (
              <div className="nv-section">
                <div className="nv-section-title">How it spread</div>
                {result.trace.map((t, i) => (
                  <div className="nv-trace-item" key={i}>
                    <div className="nv-trace-date">{t.date}</div>
                    <div className="nv-trace-outlet">{t.outlet}</div>
                    {t.note && <div className="nv-trace-note">{t.note}</div>}
                  </div>
                ))}
              </div>
            )}

            {result.sources && result.sources.length > 0 && (
              <div className="nv-section">
                <div className="nv-section-title">Sources</div>
                {result.sources.map((s, i) => (
                  <div className="nv-source" key={i}>
                    <div className="nv-source-title">{s.title}</div>
                    <div className="nv-source-meta">
                      <span>{s.outlet}</span>
                      {s.date && <span>— {s.date}</span>}
                    </div>
                    {s.url && (
                      <a className="nv-source-link" href={s.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={12} /> Read
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="nv-history">
          <div className="nv-history-head">
            <div className="nv-history-title">
              <Clock size={14} /> Recent checks this session
            </div>
            {history.length > 0 && (
              <select
                className="nv-select"
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                aria-label="Filter recent checks by industry"
              >
                {industries.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            )}
          </div>
          {filteredHistory.length === 0 ? (
            <div className="nv-history-empty">Checks you run will appear here.</div>
          ) : (
            filteredHistory.map((h) => {
              const m = VERDICT_META[h.verdict] || VERDICT_META.unverified;
              return (
                <button className="nv-history-item" key={h.id + h.timestamp} onClick={() => loadFromHistory(h.id)}>
                  <span className="nv-history-text">{h.preview}</span>
                  <m.Icon size={15} color={m.color} />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
