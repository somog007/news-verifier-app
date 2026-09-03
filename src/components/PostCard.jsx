// PostCard.jsx - Individual social media post card with verdict indicators
import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Sparkles, Share2, Heart, MessageSquare, ArrowRight, ExternalLink } from 'lucide-react';

export default function PostCard({ post, onSelectPost }) {
  const getBadgeMeta = (verdict) => {
    switch (verdict) {
      case 'VERIFIED':
        return { label: 'VERIFIED REAL', className: 'badge-verified', icon: <ShieldCheck size={14} /> };
      case 'FAKE':
        return { label: 'FLAGGED FAKE', className: 'badge-fake', icon: <ShieldAlert size={14} /> };
      case 'MISLEADING':
        return { label: 'MISLEADING', className: 'badge-misleading', icon: <AlertTriangle size={14} /> };
      case 'SATIRE':
        return { label: 'SATIRE', className: 'badge-satire', icon: <Sparkles size={14} /> };
      default:
        return { label: 'UNVERIFIED', className: 'badge-unverified', icon: <AlertTriangle size={14} /> };
    }
  };

  const badge = getBadgeMeta(post.verdict);

  return (
    <div className={`post-card ${badge.className}-border`}>
      {/* Top Meta Bar */}
      <div className="card-top-bar">
        <div className="author-info">
          <img src={post.author.avatar} alt={post.author.name} className="author-avatar" />
          <div className="author-meta">
            <div className="author-name-row">
              <span className="author-name">{post.author.name}</span>
              {post.author.verified && <span className="blue-check">✓</span>}
            </div>
            <span className="author-handle">{post.author.handle} • {post.timestamp}</span>
          </div>
        </div>

        <div className="verdict-container">
          <span className={`verdict-badge ${badge.className}`}>
            {badge.icon} {badge.label}
          </span>
          <span className="score-mini-pill">
            Trust: {post.trustScore}%
          </span>
        </div>
      </div>

      {/* Main Post Content */}
      <p className="post-text">{post.content}</p>

      {/* Origin Preview Snippet */}
      {post.originTrace?.originalPublisher && (
        <div className="origin-preview-box">
          <span className="origin-preview-label">Origin Seed:</span>
          <span className="origin-preview-value">{post.originTrace.originalPublisher}</span>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="card-footer">
        <div className="social-metrics">
          <span><Share2 size={13} /> {post.metrics?.shares || '1.2K'}</span>
          <span><Heart size={13} /> {post.metrics?.likes || '4.5K'}</span>
          <span><MessageSquare size={13} /> {post.metrics?.comments || '320'}</span>
        </div>

        <button className="inspect-trace-btn" onClick={() => onSelectPost(post)}>
          Inspect Source Trace & Evidence <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
