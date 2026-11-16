// AppUpdateToast.jsx - Tells the user when the app is saved for offline use,
// and when a newer version is ready to load.
import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, X } from "lucide-react";

const OFFLINE_READY_MS = 8000;

export default function AppUpdateToast({ updateReady, onUpdate, offlineReady }) {
  const [readyDismissed, setReadyDismissed] = useState(false);
  const [dismissedUpdate, setDismissedUpdate] = useState(false);
  const showReady = offlineReady && !readyDismissed;

  useEffect(() => {
    if (!offlineReady) return undefined;
    const timer = setTimeout(() => setReadyDismissed(true), OFFLINE_READY_MS);
    return () => clearTimeout(timer);
  }, [offlineReady]);

  if (updateReady && !dismissedUpdate) {
    return (
      <div className="app-toast" role="status" aria-live="polite">
        <RefreshCw size={16} aria-hidden="true" />
        <span>A new version of VerifiNews is ready.</span>
        <button type="button" className="app-toast-action" onClick={onUpdate}>
          Reload
        </button>
        <button type="button" className="app-toast-close" onClick={() => setDismissedUpdate(true)} aria-label="Later">
          <X size={14} />
        </button>
      </div>
    );
  }
  if (showReady) {
    return (
      <div className="app-toast" role="status" aria-live="polite">
        <CheckCircle2 size={16} aria-hidden="true" />
        <span>VerifiNews is saved on this device and will open without internet.</span>
        <button type="button" className="app-toast-close" onClick={() => setReadyDismissed(true)} aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    );
  }
  return null;
}
