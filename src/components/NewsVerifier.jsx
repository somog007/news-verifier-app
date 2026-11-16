// NewsVerifier.jsx - Fact-Check Studio: claim input, result and recent checks
import { useState } from "react";
import {
  Search, Loader2, ExternalLink, Clock, Compass, AlertCircle, CheckCircle2, Link as LinkIcon, RefreshCw, FileText, Info,
  WifiOff, MessageCircle, Smile, Tag, Newspaper,
} from "lucide-react";
import { COUNTRIES, getVerdictMeta } from "../constants/verdicts";
import { getContentTypeMeta } from "../constants/contentTypes";
import { isAiEnabled } from "../services/verificationService";
import { formatRelative } from "../lib/time";
import { truncate } from "../lib/text";
import "../styles/verifier.css";

const SAMPLE_CLAIMS = [
  { label: "Viral rumour", Icon: AlertCircle, className: "fake-chip", text: "URGENT: Central Bank secretly preparing to ban physical cash next Monday" },
  { label: "Science claim", Icon: CheckCircle2, className: "verified-chip", text: "NASA confirms James Webb space telescope detected water vapour on exoplanet K2-18b" },
  { label: "Satire", Icon: Smile, className: "satire-chip", text: "The Onion: Nation's politicians agree to stop talking for one full day" },
  { label: "Rhetoric", Icon: MessageCircle, className: "link-chip", text: "Why should we trust these clueless leaders? Enough is enough!" },
  { label: "Suspicious link", Icon: LinkIcon, className: "fake-chip", text: "http://reuters-breaking-news.xyz/cbn-cash-ban" },
];

const MAX_CLAIM_LENGTH = 2000;

export default function NewsVerifier({
  claim,
  setClaim,
  country,
  setCountry,
  savedHeadlineCount,
  onVerify,
  onRecheck,
  isChecking,
  online,
  report,
  notice,
  fromHistory,
  history,
  onOpenHistory,
  onClearHistory,
  onOpenFullReport,
}) {
  const [historyFilter, setHistoryFilter] = useState("All");
  const [pendingOffline, setPendingOffline] = useState(null);

  const submit = (text = claim, { allowOffline = false } = {}) => {
    const trimmed = text.trim();
    if (!trimmed || isChecking) return;
    if (!online && !allowOffline) {
      setPendingOffline(trimmed);
      return;
    }
    setPendingOffline(null);
    onVerify(trimmed, country);
  };

  const handleSample = (text) => {
    setClaim(text);
    submit(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  };

  const topics = ["All", ...new Set(history.map((h) => h.topic))];
  const filteredHistory = historyFilter === "All" ? history : history.filter((h) => h.topic === historyFilter);

  const meta = report ? getVerdictMeta(report.verdict) : null;
  const typeMeta = report ? getContentTypeMeta(report.contentType) : null;
  const aiMode = isAiEnabled();
  const methodLabel = {
    ai: "AI research with live web search",
    online: "live online sources + pattern checks",
    saved_feed: "offline: saved newsfeed + pattern checks",
    heuristic: report?.checkedOffline ? "offline pattern check only" : "pattern check",
  };

  return (
    <div className="nv-root">
      <div className="nv-container">
        <div className="nv-mark">Verify Before Sharing</div>
        <h1 className="nv-title">Check a claim before you share it</h1>
        <p className="nv-sub">
          Paste a headline, post or link you've seen on social media. We'll screen it, point you to the right
          wire services and fact-checkers, and show where it came from.
        </p>
        <button
          type="button"
          className="nv-feed-jump"
          onClick={() => document.getElementById("feed-title")?.scrollIntoView({ behavior: "smooth" })}
        >
          <Newspaper size={13} /> Latest headlines ↓
        </button>

        <form
          className="nv-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor="nv-claim" className="nv-visually-hidden">Claim, headline or link to check</label>
          <textarea
            id="nv-claim"
            className="nv-textarea"
            placeholder="Paste the claim, headline, post text or link you want checked…"
            value={claim}
            maxLength={MAX_CLAIM_LENGTH}
            onChange={(e) => setClaim(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="nv-hint">
            Works best with one short factual claim or a single link. Press Ctrl+Enter to check.
          </div>

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

            <button type="submit" className="nv-button" disabled={isChecking || !claim.trim()}>
              {isChecking ? <Loader2 size={16} className="nv-spin" /> : <Search size={16} />}
              {isChecking ? "Checking…" : "Check this claim"}
            </button>
          </div>

          <div className="sample-claims nv-samples">
            <span className="sample-label">Try an example:</span>
            {SAMPLE_CLAIMS.map(({ label, Icon, className, text }) => (
              <button
                key={label}
                type="button"
                className={`sample-chip ${className}`}
                onClick={() => handleSample(text)}
                disabled={isChecking}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </form>

        {pendingOffline && !online && (
          <div className="nv-offline-prompt" role="alertdialog" aria-labelledby="nv-offline-title">
            <div id="nv-offline-title" className="nv-offline-title">
              <WifiOff size={16} /> Please connect to the internet
            </div>
            <p>
              To get correct information we need to search live fact-checkers, news outlets and reference sources.
              {savedHeadlineCount > 0
                ? ` Without a connection we can only compare it with the ${savedHeadlineCount} headlines saved from the newsfeed and look for warning patterns, which can miss false claims.`
                : " Without a connection we can only look for warning patterns, which can miss false claims."}
            </p>
            <div className="nv-offline-actions">
              <button type="button" className="nv-secondary-button" onClick={() => submit(pendingOffline, { allowOffline: true })}>
                Check anyway (limited)
              </button>
              <button type="button" className="nv-link-button" onClick={() => setPendingOffline(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {online && (
          <div className="nv-mode-note">
            <Info size={14} />
            <span>
              {aiMode
                ? <>Checks use <strong>AI research with live web search</strong>, plus published fact-checks and news coverage.</>
                : <>Checks search <strong>live online sources</strong> (published fact-checks, news coverage, Wikipedia) and look for warning patterns. Always open the sources to confirm.</>}
            </span>
          </div>
        )}

        {notice && <div className="nv-error" role="status">{notice}</div>}

        <div aria-live="polite">
          {report && meta && (
            <div className="nv-result">
              {fromHistory && (
                <div className="nv-cache-note">
                  Showing your earlier check from {formatRelative(report.rawTimestamp)}.{" "}
                  <button type="button" className="nv-link-button" onClick={() => onRecheck(report)} disabled={isChecking}>
                    <RefreshCw size={12} /> Check again
                  </button>
                </div>
              )}

              <p className="nv-claim-echo">“{truncate(report.content, 220)}”</p>

              <div className="nv-verdict-row">
                <meta.Icon size={26} color={meta.color} />
                <span className="nv-verdict-word" style={{ color: meta.color }}>
                  {meta.label}
                </span>
              </div>
              <span className="nv-confidence">
                {report.confidence} confidence · {methodLabel[report.method] || report.method}
              </span>
              <p className="nv-summary">{report.summary}</p>

              {report.checkedOffline && (
                <div className="nv-offline-result">
                  <WifiOff size={14} />
                  <span>Checked without internet. This result may be wrong.</span>
                  {online && (
                    <button type="button" className="nv-link-button" onClick={() => onRecheck(report)} disabled={isChecking}>
                      <RefreshCw size={12} /> Re-check with live sources
                    </button>
                  )}
                </div>
              )}

              {typeMeta && report.contentType && (
                <div className="nv-type-box">
                  <div className="nv-type-head">
                    <Tag size={14} />
                    <span className="nv-type-label">What this is:</span>
                    <span className={`nv-type-chip type-${report.contentType}`}>{typeMeta.label}</span>
                    {report.linkAnalysis && (
                      <span className={`nv-type-chip link-${report.linkAnalysis.kind}`}>{report.linkAnalysis.label}</span>
                    )}
                  </div>
                  <p className="nv-type-desc">{report.contentTypeReason || typeMeta.description}</p>
                  {report.rhetoricSignals?.length > 0 && report.contentType !== "link" && (
                    <p className="nv-type-desc">
                      Rhetorical language detected: {report.rhetoricSignals.join(", ")}.
                      {report.contentType === "factual_claim" && " The factual part can still be checked."}
                    </p>
                  )}
                  {report.linkAnalysis?.reasons?.length > 0 && (
                    <ul className="nv-type-reasons">
                      {report.linkAnalysis.reasons.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  )}
                </div>
              )}

              <div className="nv-tagrow">
                {report.topic && <span className="nv-tag">{report.topic}</span>}
                {(report.countryRelevance?.length > 0 || report.country) && (
                  <>
                    <span className="nv-tag-divider" />
                    <span className="nv-tag">{report.countryRelevance?.join(", ") || report.country}</span>
                  </>
                )}
              </div>

              <div className="nv-radar-box">
                <div className="nv-radar-header">
                  <div className="nv-radar-title">
                    <Compass size={18} className="nv-spin-slow" />
                    <span>Before you share</span>
                  </div>
                  <span className={`nv-radar-badge ${meta.tone === "danger" ? "high-risk" : meta.tone === "success" ? "verified" : ""}`}>
                    {report.originRadar.viralStage}
                  </span>
                </div>

                <div className={`nv-preshare-banner ${meta.tone}`}>{report.originRadar.preShareRecommendation}</div>

                <div className="nv-radar-metrics">
                  <div className="nv-metric-pill">
                    <span className="nv-metric-label">Origin:</span>
                    <span className="nv-metric-value">{report.originTrace.originalPublisher}</span>
                  </div>
                  <div className="nv-metric-pill">
                    <span className="nv-metric-label">Spread risk:</span>
                    <span className="nv-metric-value">{report.originRadar.viralRiskScore}/100</span>
                  </div>
                  <div className="nv-metric-pill">
                    <span className="nv-metric-label">Trust index:</span>
                    <span className="nv-metric-value">{report.trustScore}%</span>
                  </div>
                </div>

                <div className="nv-radar-chain">
                  {report.originRadar.propagationPath.map((step, idx) => (
                    <div key={step.stage} className="nv-chain-step">
                      <div className="nv-step-number">{idx + 1}</div>
                      <div className="nv-step-details">
                        <div className="nv-step-stage">{step.stage}</div>
                        <div className="nv-step-location">{step.location}</div>
                        <div className="nv-step-note">{step.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {report.originTrace.timeline?.length > 0 && (
                <div className="nv-section">
                  <div className="nv-section-title">{report.method === "ai" ? "How it spread" : "How this was checked"}</div>
                  {report.originTrace.timeline.map((t, i) => (
                    <div className="nv-trace-item" key={i}>
                      <div className="nv-trace-date">{t.time}</div>
                      <div className="nv-trace-outlet">{t.source}</div>
                      {t.event && <div className="nv-trace-note">{t.event}</div>}
                    </div>
                  ))}
                </div>
              )}

              {report.corroboratingSources?.length > 0 && (
                <div className="nv-section">
                  <div className="nv-section-title">
                    {report.method === "heuristic" ? "Where to confirm this" : "Sources found & where to confirm"}
                  </div>
                  {report.corroboratingSources.map((s) => (
                    <div className="nv-source" key={s.url}>
                      <div className="nv-source-title">{s.title || s.name}</div>
                      <div className="nv-source-meta">
                        <span>{s.type}</span>
                        {s.date && <span>— {s.date}</span>}
                        {s.type === "Published fact-check" && <span className="nv-rating">Rated: {s.status}</span>}
                      </div>
                      <a className="nv-source-link" href={s.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={12} /> {s.status === "SEARCH" ? "Search this claim" : "Open"}
                      </a>
                    </div>
                  ))}
                </div>
              )}

              <div className="nv-actions">
                <button type="button" className="nv-secondary-button" onClick={() => onOpenFullReport(report)}>
                  <FileText size={14} /> Open full report
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="nv-history">
          <div className="nv-history-head">
            <div className="nv-history-title">
              <Clock size={14} /> Your recent checks
            </div>
            {history.length > 0 && (
              <div className="nv-history-tools">
                <select
                  className="nv-select"
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  aria-label="Filter recent checks by topic"
                >
                  {topics.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button type="button" className="nv-link-button" onClick={onClearHistory}>
                  Clear
                </button>
              </div>
            )}
          </div>
          {filteredHistory.length === 0 ? (
            <div className="nv-history-empty">Checks you run will appear here and are saved on this device.</div>
          ) : (
            filteredHistory.slice(0, 10).map((h) => {
              const m = getVerdictMeta(h.verdict);
              return (
                <button type="button" className="nv-history-item" key={h.id} onClick={() => onOpenHistory(h)}>
                  <span className="nv-history-text">{truncate(h.content, 90)}</span>
                  <span className="nv-history-meta">
                    <span>{formatRelative(h.rawTimestamp)}</span>
                    <m.Icon size={15} color={m.color} aria-label={m.label} />
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
