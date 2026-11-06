// AnalyticsDashboard.jsx - Verdict distribution and trends across tracked threads
import { TrendingUp, Globe, Users, Activity, Tag } from "lucide-react";
import TrustedWiresGrid from "./TrustedWiresGrid";
import { VERDICT_ORDER, getVerdictMeta } from "../constants/verdicts";

// Editorial guidance, not measured from user data.
const PLATFORM_GUIDANCE = [
  { name: "WhatsApp & Telegram broadcasts", level: "critical", label: "HIGHEST RISK — hard to trace origin" },
  { name: "X / Facebook viral threads", level: "high", label: "HIGH — fast amplification" },
  { name: "Forums & comment sections", level: "medium", label: "MODERATE — sensational framing" },
  { name: "Official wire services (AP, Reuters, NAN, GNA)", level: "low", label: "LOW — editorially verified" },
];

function alertLevel(riskyShare, total) {
  if (total === 0) return { label: "NO DATA YET", className: "risk-badge-moderate" };
  if (riskyShare >= 0.5) return { label: `HIGH — ${Math.round(riskyShare * 100)}% of checks flagged`, className: "risk-badge-high" };
  if (riskyShare >= 0.25) return { label: `MODERATE — ${Math.round(riskyShare * 100)}% of checks flagged`, className: "risk-badge-moderate" };
  return { label: `LOW — ${Math.round(riskyShare * 100)}% of checks flagged`, className: "risk-badge-low" };
}

export default function AnalyticsDashboard({ posts }) {
  const total = posts.length;
  const counts = Object.fromEntries(VERDICT_ORDER.map((v) => [v, posts.filter((p) => p.verdict === v).length]));
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const risky = counts.FAKE + counts.MISLEADING;
  const level = alertLevel(total ? risky / total : 0, total);

  const topicCounts = posts.reduce((acc, p) => {
    acc[p.topic] = (acc[p.topic] || 0) + 1;
    return acc;
  }, {});
  const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const statCards = [
    { label: "Claims tracked", value: total, sub: "Your checks plus curated examples", Icon: Activity, tone: "blue" },
    { label: "Verified", value: `${counts.VERIFIED} (${pct(counts.VERIFIED)}%)`, sub: "Consistent with reputable sources", Icon: getVerdictMeta("VERIFIED").Icon, tone: "green" },
    { label: "Flagged false", value: `${counts.FAKE} (${pct(counts.FAKE)}%)`, sub: "Matches misinformation patterns", Icon: getVerdictMeta("FAKE").Icon, tone: "red" },
    { label: "Misleading / unverified", value: `${counts.MISLEADING + counts.UNVERIFIED} (${pct(counts.MISLEADING + counts.UNVERIFIED)}%)`, sub: "Needs more context", Icon: getVerdictMeta("MISLEADING").Icon, tone: "amber" },
  ];

  return (
    <div className="analytics-container">
      <div className="stats-row">
        {statCards.map(({ label, value, sub, Icon, tone }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon-wrapper ${tone}`}>
              <Icon size={22} />
            </div>
            <div>
              <span className="stat-label">{label}</span>
              <h3 className="stat-number">{value}</h3>
              <span className="stat-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="analytics-grid">
        <div className="panel-card">
          <h4 className="panel-title">
            <TrendingUp size={18} /> Verdict distribution
          </h4>
          <div className="distribution-bar-wrapper">
            <div className="dist-bar" role="img" aria-label="Verdict distribution">
              {VERDICT_ORDER.map((v) => (
                <div
                  key={v}
                  className="dist-segment"
                  style={{ width: `${pct(counts[v])}%`, background: getVerdictMeta(v).color, opacity: v === "UNVERIFIED" ? 0.5 : 1 }}
                />
              ))}
            </div>
            <div className="dist-legend">
              {VERDICT_ORDER.map((v) => {
                const meta = getVerdictMeta(v);
                return (
                  <span key={v}>
                    <span className="legend-dot" style={{ background: meta.color }} /> {meta.label} ({pct(counts[v])}%)
                  </span>
                );
              })}
            </div>
          </div>

          <div className="risk-level-box">
            <span className="risk-title">Misinformation level in your tracked threads:</span>
            <span className={level.className}>{level.label}</span>
          </div>

          {topTopics.length > 0 && (
            <div style={{ marginTop: "1.25rem" }}>
              <h5 className="panel-title" style={{ fontSize: "0.9rem" }}>
                <Tag size={14} /> Top topics
              </h5>
              <div className="platform-risk-list">
                {topTopics.map(([topic, n]) => (
                  <div key={topic} className="platform-risk-item">
                    <span className="platform-name">{topic}</span>
                    <span className="score-mini-pill">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="panel-card">
          <h4 className="panel-title">
            <Users size={18} /> Platform risk guide
          </h4>
          <p className="section-desc" style={{ marginBottom: "0.75rem" }}>
            General editorial guidance on where misinformation tends to originate.
          </p>
          <div className="platform-risk-list">
            {PLATFORM_GUIDANCE.map((p) => (
              <div key={p.name} className="platform-risk-item">
                <span className="platform-name">{p.name}</span>
                <span className={`risk-level ${p.level}`}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-card full-width">
        <h4 className="panel-title">
          <Globe size={18} /> Reference wires & fact-check outlets
        </h4>
        <TrustedWiresGrid />
      </div>
    </div>
  );
}
