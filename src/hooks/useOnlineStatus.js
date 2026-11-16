// useOnlineStatus.js - Tracks whether the browser has a network connection
import { useEffect, useState } from "react";

const RECONNECTED_NOTICE_MS = 6000;

export function useOnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    let timer;
    const goOnline = () => {
      setOnline(true);
      setJustReconnected(true);
      clearTimeout(timer);
      timer = setTimeout(() => setJustReconnected(false), RECONNECTED_NOTICE_MS);
    };
    const goOffline = () => {
      setOnline(false);
      setJustReconnected(false);
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return { online, justReconnected };
}
