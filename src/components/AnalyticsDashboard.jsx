// AnalyticsDashboard.jsx - Metrics, trend analysis & intelligence panel
import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, Cpu, Globe, Users, Activity } from 'lucide-react';
import { TRUSTED_DOMAINS } from '../data/newsDatabase';

export default function AnalyticsDashboard({ posts }) {
  const total = posts.length || 1;
  const verifiedCount = posts.filter(p => p.verdict === 'VERIFIED').length;
  const fakeCount = posts.filter(p => p.verdict === 'FAKE').length;
  const misleadingCount = posts.filter(p => p.verdict === 'MISLEADING').length;
  const satireCount = posts.filter(p => p.verdict === 'SATIRE').length;

  const verifiedPercent = Math.round((verifiedCount / total) * 100);
  const fakePercent = Math.round((fakeCount / total) * 100);
  const misleadingPercent = Math.round((misleadingCount / total) * 100);

  return (
    <div className="analytics-container">
      {/* Top Stat Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <Activity size={22} />
          </div>
          <div>
            <span className="stat-label">Total Claims Analyzed</span>
            <h3 className="stat-number">{posts.length}</h3>
            <span className="stat-sub">Real-time social stream</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="stat-label">Verified Authentic</span>
            <h3 className="stat-number">{verifiedCount} ({verifiedPercent}%)</h3>
            <span className="stat-sub">Corroborated by primary wires</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper red">
            <ShieldAlert size={22} />
          </div>
          <div>
            <span className="stat-label">Flagged Misinformation</span>
            <h3 className="stat-number">{fakeCount} ({fakePercent}%)</h3>
            <span className="stat-sub">Refuted & debunked</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper amber">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="stat-label">Misleading / Out of Context</span>
            <h3 className="stat-number">{misleadingCount} ({misleadingPercent}%)</h3>
            <span className="stat-sub">Sensationalized framing</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Risk Distribution & Topic Trends */}
      <div className="analytics-grid">
        {/* Verification Breakdown Progress Bar */}
        <div className="panel-card">
          <h4 className="panel-title">
            <TrendingUp size={18} /> Global Misinformation Index & Verdict Distribution
          </h4>
          <div className="distribution-bar-wrapper">
            <div className="dist-bar">
              <div className="dist-segment verified" style={{ width: `${verifiedPercent}%` }}></div>
              <div className="dist-segment fake" style={{ width: `${fakePercent}%` }}></div>
              <div className="dist-segment misleading" style={{ width: `${misleadingPercent}%` }}></div>
            </div>
            <div className="dist-legend">
              <span><span className="legend-dot green"></span> Verified ({verifiedPercent}%)</span>
              <span><span className="legend-dot red"></span> Fake News ({fakePercent}%)</span>
              <span><span className="legend-dot amber"></span> Misleading ({misleadingPercent}%)</span>
            </div>
          </div>

          <div className="risk-level-box">
            <span className="risk-title">Network Misinformation Alert Level:</span>
            <span className="risk-badge-moderate">MODERATE RISK (Bot Network Activity Detected)</span>
          </div>
        </div>

        {/* Platform Origin Risk Ratings */}
        <div className="panel-card">
          <h4 className="panel-title">
            <Users size={18} /> Platform Vulnerability & Bot Risk Matrix
          </h4>
          <div className="platform-risk-list">
            <div className="platform-risk-item">
              <span className="platform-name">Twitter / X Viral Threads</span>
              <span className="risk-level high">HIGH BOT RISK</span>
            </div>
            <div className="platform-risk-item">
              <span className="platform-name">Telegram News Groups</span>
              <span className="risk-level critical">CRITICAL FAKE ORIGIN</span>
            </div>
            <div className="platform-risk-item">
              <span className="platform-name">Reddit & Forum Boards</span>
              <span className="risk-level medium">MODERATE SENSATIONALISM</span>
            </div>
            <div className="platform-risk-item">
              <span className="platform-name">Official Wire Services (AP/Reuters)</span>
              <span className="risk-level low">LOW / TRUSTED VERIFIED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trusted Reference Wires Registry */}
      <div className="panel-card full-width">
        <h4 className="panel-title">
          <Globe size={18} /> Verified Reference Wire & Fact-Check Outlets
        </h4>
        <div className="wire-grid">
          {TRUSTED_DOMAINS.map((domain, i) => (
            <div key={i} className="wire-card">
              <div className="wire-header">
                <span className="wire-name">{domain.name}</span>
                <span className="wire-score">{domain.score}% Trust</span>
              </div>
              <div className="wire-sub">
                <span>{domain.domain}</span> • <span className="wire-type">{domain.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
