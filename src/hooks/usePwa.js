// usePwa.js - Install prompt, "saved for offline" and "update ready" state.
import { useSyncExternalStore } from "react";
import { applyUpdate, getPwaState, promptInstall, subscribe } from "../pwa/register";

export function usePwa() {
  const pwa = useSyncExternalStore(subscribe, getPwaState, getPwaState);
  return {
    canInstall: Boolean(pwa.installEvent) && !pwa.installed,
    install: promptInstall,
    updateReady: Boolean(pwa.updateWorker),
    applyUpdate,
    offlineReady: pwa.offlineReady,
  };
}
