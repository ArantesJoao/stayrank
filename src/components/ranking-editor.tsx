"use client";

import { useState, useTransition } from "react";
import { saveRankings } from "@/lib/actions";

type Option = { id: string; name: string };
type InitialRanking = { rank: number; accommodationId: string };

const SLOTS = [
  { rank: 1, label: "🥇 1st choice", points: 3 },
  { rank: 2, label: "🥈 2nd choice", points: 2 },
  { rank: 3, label: "🥉 3rd choice", points: 1 },
];

export function RankingEditor({
  cityId,
  options,
  initial,
}: {
  cityId: string;
  options: Option[];
  initial: InitialRanking[];
}) {
  // picks[i] = accommodation id chosen for slot i+1 (or "")
  const [picks, setPicks] = useState<string[]>(() =>
    SLOTS.map((s) => initial.find((r) => r.rank === s.rank)?.accommodationId ?? ""),
  );
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function setPick(slotIndex: number, value: string) {
    setPicks((prev) => {
      const next = [...prev];
      // Prevent picking the same accommodation in two slots.
      next.forEach((v, i) => {
        if (i !== slotIndex && v === value && value !== "") next[i] = "";
      });
      next[slotIndex] = value;
      return next;
    });
    setSaved(false);
  }

  function onSave() {
    startTransition(async () => {
      await saveRankings(
        cityId,
        picks.map((p) => p || null),
      );
      setSaved(true);
    });
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Add some accommodations first, then you can rank them.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {SLOTS.map((slot, i) => {
        const chosen = picks[i];
        return (
          <div
            key={slot.rank}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">
                {slot.label}
              </span>
              <span className="text-xs text-slate-400">{slot.points} pts</span>
            </div>
            <select
              value={chosen}
              onChange={(e) => setPick(i, e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
            >
              <option value="">— No pick —</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={pending}
          className="btn-brand rounded-lg px-5 py-2.5 text-sm font-medium transition disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save my ranking"}
        </button>
        {saved && !pending && (
          <span className="text-sm text-green-600">Saved ✓</span>
        )}
      </div>
    </div>
  );
}
