// TimelineTrace.jsx - Visual propagation timeline path tracking original source to social media spread
import React from 'react';
import { GitCommit, AlertOctagon, CheckCircle2, ShieldAlert, Share2, Globe, Bot } from 'lucide-react';

export default function TimelineTrace({ trace }) {
  if (!trace || !trace.timeline) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'primary':
        return <Globe className="timeline-node-icon primary" size={18} />;
      case 'wire':
        return <CheckCircle2 className="timeline-node-icon wire" size={18} />;
      case 'fake_origin':
        return <ShieldAlert className="timeline-node-icon fake-origin" size={18} />;
      case 'bot':
        return <Bot className="timeline-node-icon bot" size={18} />;
      case 'debunk':
        return <AlertOctagon className="timeline-node-icon debunk" size={18} />;
      default:
        return <Share2 className="timeline-node-icon social" size={18} />;
    }
  };

  return (
    <div className="timeline-trace-container">
      <div className="trace-header-card">
        <div className="origin-meta">
          <span className="meta-title">ZERO-POINT ORIGIN</span>
          <h4 className="meta-value">{trace.originalPublisher || "Unknown Social Seed"}</h4>
          <span className="meta-sub">First Detected: {trace.firstSeen}</span>
        </div>
        {trace.originalUrl && (
          <a 
            href={trace.originalUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="origin-link-btn"
          >
            Visit Original Artifact →
          </a>
        )}
      </div>

      <div className="propagation-path">
        <h4 className="section-subtitle">Real-Time Spread & Propagation Lineage</h4>
        <div className="timeline-line">
          {trace.timeline.map((item, index) => (
            <div key={index} className={`timeline-item type-${item.type}`}>
              <div className="timeline-marker">
                {getTypeIcon(item.type)}
              </div>
              <div className="timeline-content">
                <div className="item-header">
                  <span className="item-time">{item.time}</span>
                  <span className={`item-source-badge badge-${item.type}`}>{item.source}</span>
                </div>
                <p className="item-event">{item.event}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
