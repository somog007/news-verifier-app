// ConnectionBanner.jsx - Asks the user to connect to the internet for accurate results
import { WifiOff, Wifi } from "lucide-react";

export default function ConnectionBanner({ online, justReconnected }) {
  if (online && !justReconnected) return null;

  return (
    <div className={`connection-banner ${online ? "online" : "offline"}`} role="status" aria-live="polite">
      {online ? <Wifi size={16} /> : <WifiOff size={16} />}
      <span>
        {online
          ? "You're back online. Checks now use live fact-checkers, news and reference sources."
          : "You're offline. Please connect to the internet to get correct, up-to-date information. Offline checks only look for warning patterns."}
      </span>
    </div>
  );
}
