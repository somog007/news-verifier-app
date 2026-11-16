// NewsFeedPanel.jsx - Latest headlines beside the studio (below it on small screens).
// Headlines are saved on the device so claims can be checked against them offline.
import { useMemo, useState } from "react";
import { Newspaper, RefreshCw, Loader2, ExternalLink, ShieldCheck, WifiOff, Search } from "lucide-react";
import { formatRelative } from "../lib/time";

const PAGE_SIZE = 30;

export default function NewsFeedPanel({ items, fetchedAt, savedCount, loading, error, online, country, onRefresh, onCheck, isChecking }) {
  const [section, setSection] = useState("All");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const sections = useMemo(() => ["All", ...new Set(items.map((i) => i.section).filter(Boolean))], [items]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) => (section === "All" || i.section === section) && (!q || i.title.toLowerCase().includes(q) || (i.source || "").toLowerCase().includes(q)),
    );
  }, [items, section, query]);

  return (
    <aside className="feed-panel" aria-labelledby="feed-title">
      <div className="feed-head">
        <h2 id="feed-title" className="feed-title">
          <Newspaper size={16} /> Latest headlines
        </h2>
        <button
          type="button"
          className="feed-icon-button"
          onClick={onRefresh}
          disabled={!online || loading}
          aria-label="Refresh headlines"
          title={online ? "Refresh headlines" : "Connect to the internet to refresh"}
        >
          {loading ? <Loader2 size={14} className="nv-spin" /> : <RefreshCw size={14} />}
        </button>
      </div>

      <p className="feed-meta">
        {country === "Any" ? "International" : country}
        {fetchedAt ? ` · updated ${formatRelative(fetchedAt)}` : ""}
        {savedCount > 0 && ` · ${savedCount} saved for offline checks`}
      </p>

      {!online && (
        <div className="feed-offline">
          <WifiOff size={13} />
          <span>
            {savedCount > 0
              ? "You're offline. Showing saved headlines; claims you check are compared against them."
              : "You're offline and no headlines are saved yet. Connect once to save the newsfeed for offline checks."}
          </span>
        </div>
      )}
      {online && error && <div className="feed-error" role="status">{error}</div>}

      {items.length > 0 && (
        <div className="feed-tools">
          <label className="feed-search">
            <Search size={13} />
            <span className="nv-visually-hidden">Filter headlines</span>
            <input type="search" placeholder="Filter headlines" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          {sections.length > 2 && (
            <div className="feed-sections" role="group" aria-label="Section">
              {sections.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`feed-section${section === s ? " active" : ""}`}
                  aria-pressed={section === s}
                  onClick={() => {
                    setSection(s);
                    setVisible(PAGE_SIZE);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <ul className="feed-list">
        {filtered.slice(0, visible).map((item) => (
          <li key={item.url || item.title} className="feed-item">
            <a className="feed-link" href={item.url} target="_blank" rel="noopener noreferrer">
              {item.title}
              <ExternalLink size={11} aria-hidden="true" />
            </a>
            <div className="feed-item-meta">
              {item.trusted && (
                <span className="feed-trusted" title="On the trusted outlets list">
                  <ShieldCheck size={11} /> Trusted
                </span>
              )}
              <span>{item.source || item.domain}</span>
              {item.publishedAt && <span>· {formatRelative(item.publishedAt)}</span>}
              <button type="button" className="feed-check" onClick={() => onCheck(item.title)} disabled={isChecking}>
                Check
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && !loading && (
          <li className="feed-empty">{online ? "No headlines loaded yet." : "Nothing saved yet."}</li>
        )}
        {items.length > 0 && filtered.length === 0 && <li className="feed-empty">No headlines match your filter.</li>}
      </ul>

      {filtered.length > visible && (
        <button type="button" className="feed-more" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
          Show more headlines
        </button>
      )}
    </aside>
  );
}
