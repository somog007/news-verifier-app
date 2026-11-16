// PostCard.jsx - Tracked thread card with verdict indicators
import { Share2, Heart, MessageSquare, ArrowRight, User } from "lucide-react";
import { getVerdictMeta } from "../constants/verdicts";
import { formatRelative } from "../lib/time";

export default function PostCard({ post, onSelectPost }) {
  const meta = getVerdictMeta(post.verdict);

  return (
    <div className={`post-card badge-${meta.key}-border`}>
      <div className="card-top-bar">
        <div className="author-info">
          {post.author.avatar ? (
            <img src={post.author.avatar} alt="" className="author-avatar" />
          ) : (
            <span className="author-avatar author-avatar-placeholder" aria-hidden="true">
              <User size={18} />
            </span>
          )}
          <div className="author-meta">
            <div className="author-name-row">
              <span className="author-name">{post.author.name}</span>
              {post.author.verified && <span className="blue-check" title="Trusted source">✓</span>}
            </div>
            <span className="author-handle">
              {post.author.handle} • {formatRelative(post.rawTimestamp)}
              {post.curated && " • Curated example"}
            </span>
          </div>
        </div>

        <div className="verdict-container">
          <span className={`verdict-badge badge-${meta.key}`}>
            <meta.Icon size={14} /> {meta.badge}
          </span>
          <span className="score-mini-pill">Trust: {post.trustScore}%</span>
        </div>
      </div>

      <p className="post-text">{post.content}</p>

      {post.originTrace?.originalPublisher && (
        <div className="origin-preview-box">
          <span className="origin-preview-label">Origin:</span>
          <span className="origin-preview-value">{post.originTrace.originalPublisher}</span>
        </div>
      )}

      <div className="card-footer">
        {post.metrics ? (
          <div className="social-metrics">
            <span><Share2 size={13} /> {post.metrics.shares}</span>
            <span><Heart size={13} /> {post.metrics.likes}</span>
            <span><MessageSquare size={13} /> {post.metrics.comments}</span>
          </div>
        ) : (
          <div className="social-metrics">
            <span>{post.topic}</span>
          </div>
        )}

        <button type="button" className="inspect-trace-btn" onClick={() => onSelectPost(post)}>
          Inspect source trace & evidence <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
