// useNewsFeed.js - Latest headlines for a country, refreshed while online and
// saved on the device for offline claim checks.
import { useCallback, useEffect, useMemo, useState } from "react";
import { FEED_REFRESH_MS, allSavedHeadlines, loadSavedFeeds, refreshHeadlines } from "../services/newsFeed";

const RETRY_MS = 60_000;

export function useNewsFeed(country, online) {
  const [feeds, setFeeds] = useState(loadSavedFeeds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const feed = await refreshHeadlines(country);
      setFeeds((prev) => ({ ...prev, [country]: feed }));
      return true;
    } catch (err) {
      console.warn("Newsfeed refresh failed:", err);
      setError("Couldn't load the latest headlines.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [country]);

  // Refresh when the country changes, when the connection returns, and every
  // FEED_REFRESH_MS while online (sooner after a failure). A recent feed is reused.
  useEffect(() => {
    if (!online) return undefined;
    let timer;
    let cancelled = false;
    const schedule = (delay) => {
      timer = setTimeout(async () => {
        const ok = await refresh();
        if (!cancelled) schedule(ok ? FEED_REFRESH_MS : RETRY_MS);
      }, delay);
    };
    const fetchedAt = Date.parse(loadSavedFeeds()[country]?.fetchedAt || "");
    const age = Number.isNaN(fetchedAt) ? Infinity : Date.now() - fetchedAt;
    schedule(Math.max(0, FEED_REFRESH_MS - age));
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [online, country, refresh]);

  const savedHeadlines = useMemo(() => allSavedHeadlines(feeds), [feeds]);
  const feed = feeds[country] || { fetchedAt: null, items: [] };
  return {
    items: feed.items,
    fetchedAt: feed.fetchedAt,
    savedHeadlines,
    loading,
    error,
    refresh,
  };
}
