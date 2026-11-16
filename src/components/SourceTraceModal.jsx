// SourceTraceModal.jsx - Full verification report dialog
import { useEffect, useRef, useState } from "react";
import { X, Sparkles, ExternalLink, Download, User } from "lucide-react";
import TrustScoreGauge from "./TrustScoreGauge";
import TimelineTrace from "./TimelineTrace";
import { getShareAdvice, getVerdictMeta } from "../constants/verdicts";
import { formatRelative } from "../lib/time";

export default function SourceTraceModal({ post, onClose }) {
  const [activeTab, setActiveTab] = useState("trace"); // 'trace' | 'sources'
  const closeRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const meta = getVerdictMeta(post.verdict);
  const sources = post.corroboratingSources || [];
  const signals = post.signals || {};

  const handleExportReport = () => {
    const blob = new Blob([JSON.stringify(post, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verifinews-report-${post.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span id="report-title" className={`verdict-banner verdict-${meta.key}`}>
              <meta.Icon size={20} /> {meta.banner}
            </span>
            <span className="post-topic-tag">{post.topic || "Social Claim"}</span>
          </div>
          <button ref={closeRef} type="button" className="close-btn" onClick={onClose} aria-label="Close report">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="post-excerpt-card">
            <div className="author-row">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt="" className="author-avatar-sm" />
              ) : (
                <span className="author-avatar-sm author-avatar-placeholder" aria-hidden="true"><User size={14} /></span>
              )}
              <div>
                <span className="author-name-sm">{post.author.name}</span>
                <span className="author-handle-sm">{post.author.handle}</span>
              </div>
              <span className="post-timestamp-sm">{formatRelative(post.rawTimestamp)}</span>
            </div>
            <p className="excerpt-text">"{post.content}"</p>
          </div>

          <div className={`nv-preshare-banner ${meta.tone}`} style={{ marginBottom: "1.25rem" }}>
            {post.originRadar?.preShareRecommendation || getShareAdvice(post.verdict)}
          </div>

          <div className="score-summary-grid">
            <div className="summary-card">
              <TrustScoreGauge score={post.trustScore} />
            </div>

            <div className="verdict-summary-card">
              <h4 className="summary-heading">
                <Sparkles size={16} />
                {post.method === "ai" ? "AI research summary" : post.method === "heuristic" ? "Screening summary" : "Fact-check summary"}
              </h4>
              <p className="summary-text">{post.summary}</p>

              <div className="signals-row">
                {signals.domainAuthority != null && (
                  <div className="signal-pill">
                    <span className="pill-label">Domain authority:</span>
                    <span className="pill-value">{signals.domainAuthority}/100</span>
                  </div>
                )}
                {signals.crossConsensus && (
                  <div className="signal-pill">
                    <span className="pill-label">Consensus:</span>
                    <span className="pill-value">{signals.crossConsensus}</span>
                  </div>
                )}
                {typeof signals.manipulatedMedia === "boolean" && (
                  <div className="signal-pill">
                    <span className="pill-label">Manipulated media:</span>
                    <span className={`pill-value ${signals.manipulatedMedia ? "text-danger" : "text-success"}`}>
                      {signals.manipulatedMedia ? "Reported" : "None reported"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="report-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "trace"}
              className={`report-tab ${activeTab === "trace" ? "active" : ""}`}
              onClick={() => setActiveTab("trace")}
            >
              Origin & propagation trace
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "sources"}
              className={`report-tab ${activeTab === "sources" ? "active" : ""}`}
              onClick={() => setActiveTab("sources")}
            >
              Sources ({sources.length})
            </button>
          </div>

          {activeTab === "trace" && (
            <div className="tab-pane">
              <TimelineTrace trace={post.originTrace} />
            </div>
          )}

          {activeTab === "sources" && (
            <div className="tab-pane">
              <h4 className="section-subtitle">References to confirm this claim</h4>
              <div className="sources-list">
                {sources.length > 0 ? (
                  sources.map((src) => (
                    <div key={src.url} className="source-card">
                      <div className="source-main">
                        <div className="source-title-row">
                          <h5 className="source-name">{src.name}</h5>
                          {src.status && (
                            <span className={`source-status-tag ${src.status === "DEBUNKED" || src.status === "REFUTED" ? "refuted" : "verified"}`}>
                              {src.status}
                            </span>
                          )}
                        </div>
                        <span className="source-type">{src.type}</span>
                      </div>
                      <div className="source-action">
                        {src.credibility != null && <span className="credibility-badge">Score: {src.credibility}%</span>}
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className="source-link">
                          Open source <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-sources">No sources were found for this claim.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="export-btn" onClick={handleExportReport}>
            <Download size={16} /> Export report (JSON)
          </button>
          <button type="button" className="close-secondary-btn" onClick={onClose}>
            Close report
          </button>
        </div>
      </div>
    </div>
  );
}
