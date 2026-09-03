// SourceTraceModal.jsx - Comprehensive Source Trace & Verification Report Drawer
import React, { useState } from 'react';
import { X, ShieldCheck, AlertTriangle, ShieldAlert, Sparkles, ExternalLink, Download, FileText, CheckCircle, Flame } from 'lucide-react';
import TrustScoreGauge from './TrustScoreGauge';
import TimelineTrace from './TimelineTrace';

export default function SourceTraceModal({ post, onClose }) {
  const [activeTab, setActiveTab] = useState('trace'); // 'trace' | 'sources' | 'signals'

  if (!post) return null;

  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case 'VERIFIED':
        return { label: 'VERIFIED REAL NEWS', icon: <ShieldCheck size={20} />, className: 'verdict-verified' };
      case 'FAKE':
        return { label: 'FLAGGED AS FAKE NEWS', icon: <ShieldAlert size={20} />, className: 'verdict-fake' };
      case 'MISLEADING':
        return { label: 'MISLEADING / CONTEXT NEEDED', icon: <AlertTriangle size={20} />, className: 'verdict-misleading' };
      case 'SATIRE':
        return { label: 'SATIRE / PARODY', icon: <Sparkles size={20} />, className: 'verdict-satire' };
      default:
        return { label: 'UNVERIFIED CLAIM', icon: <AlertTriangle size={20} />, className: 'verdict-unverified' };
    }
  };

  const verdictMeta = getVerdictStyle(post.verdict);

  const handleExportReport = () => {
    const reportData = JSON.stringify(post, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verifinews-report-${post.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className={`verdict-banner ${verdictMeta.className}`}>
              {verdictMeta.icon} {verdictMeta.label}
            </span>
            <span className="post-topic-tag">{post.topic || 'Social Claim'}</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Post Excerpt Box */}
          <div className="post-excerpt-card">
            <div className="author-row">
              <img src={post.author.avatar} alt={post.author.name} className="author-avatar-sm" />
              <div>
                <span className="author-name-sm">{post.author.name}</span>
                <span className="author-handle-sm">{post.author.handle}</span>
              </div>
              <span className="post-timestamp-sm">{post.timestamp}</span>
            </div>
            <p className="excerpt-text">"{post.content}"</p>
          </div>

          {/* Pre-Share Safety & Origin Early Warning Banner */}
          <div className={`nv-preshare-banner ${post.verdict === 'FAKE' ? 'danger' : (post.verdict === 'VERIFIED' ? 'success' : 'warning')}`} style={{ marginBottom: '1.25rem' }}>
            <div className="nv-banner-text">
              {post.originRadar?.preShareRecommendation || (post.verdict === 'FAKE' ? '🛑 DO NOT SHARE — Misinformation origin detected. Sharing accelerates unverified rumor spread.' : (post.verdict === 'VERIFIED' ? '✅ SAFE TO SHARE — Corroborated primary wire release.' : '⚠️ VERIFY BEFORE SHARING — Lacks independent primary wire confirmation.'))}
            </div>
          </div>

          {/* AI Executive Verdict & Score Grid */}
          <div className="score-summary-grid">
            <div className="summary-card">
              <TrustScoreGauge score={post.trustScore} verdict={post.verdict} />
            </div>

            <div className="verdict-summary-card">
              <h4 className="summary-heading">
                <Sparkles size={16} /> AI Executive Fact Check Summary
              </h4>
              <p className="summary-text">{post.summary}</p>

              <div className="signals-row">
                <div className="signal-pill">
                  <span className="pill-label">Domain Authority:</span>
                  <span className="pill-value">{post.signals?.domainAuthority || 75}/100</span>
                </div>
                <div className="signal-pill">
                  <span className="pill-label">Consensus:</span>
                  <span className="pill-value">{post.signals?.crossConsensus || "High"}</span>
                </div>
                <div className="signal-pill">
                  <span className="pill-label">Deepfake / Media Risk:</span>
                  <span className={`pill-value ${post.signals?.manipulatedMedia ? 'text-danger' : 'text-success'}`}>
                    {post.signals?.manipulatedMedia ? 'Detected' : 'Clean'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Report Tab Switcher */}
          <div className="report-tabs">
            <button 
              className={`report-tab ${activeTab === 'trace' ? 'active' : ''}`}
              onClick={() => setActiveTab('trace')}
            >
              Origin & Propagation Trace
            </button>
            <button 
              className={`report-tab ${activeTab === 'sources' ? 'active' : ''}`}
              onClick={() => setActiveTab('sources')}
            >
              Corroborating Sources ({post.corroboratingSources?.length || 0})
            </button>
          </div>

          {/* Tab 1: Origin & Propagation Trace */}
          {activeTab === 'trace' && (
            <div className="tab-pane">
              <TimelineTrace trace={post.originTrace} />
            </div>
          )}

          {/* Tab 2: Corroborating Reputable Outlets */}
          {activeTab === 'sources' && (
            <div className="tab-pane">
              <h4 className="section-subtitle">Verified & Peer-Reviewed References</h4>
              <div className="sources-list">
                {post.corroboratingSources && post.corroboratingSources.length > 0 ? (
                  post.corroboratingSources.map((src, i) => (
                    <div key={i} className="source-card">
                      <div className="source-main">
                        <div className="source-title-row">
                          <h5 className="source-name">{src.name}</h5>
                          <span className={`source-status-tag ${src.status === 'REFUTED' || src.status === 'DANGEROUS MISINFORMATION' ? 'refuted' : 'verified'}`}>
                            {src.status || 'CORROBORATED'}
                          </span>
                        </div>
                        <span className="source-type">{src.type}</span>
                      </div>
                      <div className="source-action">
                        <span className="credibility-badge">Score: {src.credibility}%</span>
                        <a 
                          href={src.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="source-link"
                        >
                          Verify Source <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-sources">No corroborating mainstream outlets found for this social post.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="export-btn" onClick={handleExportReport}>
            <Download size={16} /> Export Verification Digest (JSON)
          </button>
          <button className="close-secondary-btn" onClick={onClose}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
