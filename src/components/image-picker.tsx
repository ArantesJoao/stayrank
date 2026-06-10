"use client";

import { useEffect, useRef, useState, useTransition } from "react";

export type PickedPhoto = {
  url: string;
  credit?: string;
  creditUrl?: string;
  downloadLocation?: string;
};

type UnsplashResult = {
  id: string;
  thumbUrl: string;
  regularUrl: string;
  authorName: string;
  authorProfileUrl: string;
  downloadLocation: string;
};

export function ImagePicker({
  onSelect,
  onRemove,
  hasImage,
  defaultQuery = "",
  label,
}: {
  onSelect: (photo: PickedPhoto) => Promise<void>;
  onRemove: () => Promise<void>;
  hasImage: boolean;
  defaultQuery?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<UnsplashResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  async function runSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/unsplash?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { results?: UnsplashResult[] };
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function choose(p: UnsplashResult) {
    startTransition(async () => {
      await onSelect({
        url: p.regularUrl,
        credit: p.authorName,
        creditUrl: p.authorProfileUrl,
        downloadLocation: p.downloadLocation,
      });
      setOpen(false);
    });
  }

  function remove() {
    startTransition(async () => {
      await onRemove();
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
      >
        <span aria-hidden>🖼️</span>
        {label ?? (hasImage ? "Change cover" : "Add cover")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-slate-100 p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch(query);
                }}
                className="flex flex-1 gap-2"
              >
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search photos…"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
                >
                  Search
                </button>
              </form>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2 text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="min-h-40 flex-1 overflow-y-auto p-3">
              {loading ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  Searching…
                </p>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={pending}
                      onClick={() => choose(p)}
                      className="group relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-black/5 transition hover:ring-2 hover:ring-brand-blue disabled:opacity-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.thumbUrl}
                        alt={`Photo by ${p.authorName}`}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                        {p.authorName}
                      </span>
                    </button>
                  ))}
                </div>
              ) : searched ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  No photos found. Try a different search — or image search may be
                  unavailable.
                </p>
              ) : (
                <p className="py-10 text-center text-sm text-slate-400">
                  Search Unsplash for a cover photo.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 p-3">
              <a
                href="https://unsplash.com/?utm_source=StayRank&utm_medium=referral"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Powered by Unsplash
              </a>
              {hasImage && (
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending}
                  className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Remove cover
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
