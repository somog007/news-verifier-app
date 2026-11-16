// register.js - Registers the service worker and tracks the install prompt.
// Listeners are attached at load because browsers can fire `beforeinstallprompt`
// before React has mounted.

const state = { installEvent: null, installed: false, updateWorker: null, offlineReady: false };
const listeners = new Set();
// A new snapshot object only when something changes (for useSyncExternalStore).
let snapshot = { ...state };
const emit = () => {
  snapshot = { ...state };
  listeners.forEach((fn) => fn());
};

export const getPwaState = () => snapshot;
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

if (typeof window !== "undefined") {
  state.installed = isStandalone();
  snapshot = { ...state };
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.installEvent = event;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    state.installEvent = null;
    state.installed = true;
    emit();
  });
}

/** Shows the browser's install dialog. Resolves true if the user accepted. */
export async function promptInstall() {
  const event = state.installEvent;
  if (!event) return false;
  event.prompt();
  const { outcome } = await event.userChoice;
  state.installEvent = null;
  emit();
  return outcome === "accepted";
}

/** Switches to the waiting (newer) version and reloads once it takes over. */
export function applyUpdate() {
  const worker = state.updateWorker;
  if (!worker) return;
  navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
  worker.postMessage({ type: "SKIP_WAITING" });
}

function watchForUpdate(registration) {
  const track = (worker) => {
    if (!worker) return;
    const onInstalled = () => {
      if (navigator.serviceWorker.controller) {
        state.updateWorker = worker; // a new deploy is ready
      } else {
        state.offlineReady = true; // first install: the app is now saved
      }
      emit();
    };
    if (worker.state === "installed") {
      onInstalled();
      return;
    }
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed") onInstalled();
      // First install with no waiting step goes straight on to activated.
      if (worker.state === "activated" && !state.updateWorker && !state.offlineReady) {
        state.offlineReady = true;
        emit();
      }
    });
  };

  if (registration.waiting && navigator.serviceWorker.controller) track(registration.waiting);
  // Installing can start before register() resolves, so catch an install already under way.
  track(registration.installing);
  registration.addEventListener("updatefound", () => track(registration.installing));
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      });
      watchForUpdate(registration);
      // Long-lived tabs and installed apps: look for a new deploy every hour.
      setInterval(() => registration.update().catch(() => {}), 60 * 60_000);
    } catch (err) {
      console.warn("Service worker registration failed; the app won't open offline.", err);
    }
  };
  // Register after the page has loaded so it doesn't compete with the first render.
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
