"use client";

import { useEffect } from "react";

/** Registers the PWA service worker in production; in dev it tears down any
 *  worker left over from a previous `next start` run. A registered SW caches
 *  /_next/static chunks cache-first, so without this cleanup it keeps serving
 *  the stale production bundle under `next dev` — producing hydration
 *  mismatches between fresh server HTML and old client JS. */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      window.caches
        ?.keys()
        .then((keys) => keys.forEach((k) => caches.delete(k)))
        .catch(() => {});
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration failures are non-fatal */
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
