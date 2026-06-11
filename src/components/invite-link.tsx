"use client";

import { useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * The page's origin, read without a setState-in-effect cascade. On the server
 * (and the first client paint) the snapshot is "", so we render the relative
 * path; once hydrated, it resolves to the absolute, shareable URL.
 */
function useOrigin() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
}

export function InviteLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const origin = useOrigin();
  const url = origin ? `${origin}/invite/${code}` : `/invite/${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can still select the text */
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
        {url}
      </code>
      <button
        onClick={copy}
        className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
