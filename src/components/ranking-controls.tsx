"use client";

import {
  createContext,
  useContext,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Check, Loader2, Medal } from "lucide-react";
import { saveRankings } from "@/lib/actions";

/**
 * Inline ranking: travellers pick their top 3 directly from the accommodation
 * listing instead of a separate screen with name-only dropdowns. State for all
 * three slots lives in one provider so the cards stay in sync (a place can only
 * hold one rank, and a rank can only point at one place), and every change
 * auto-saves.
 */

type InitialRanking = { rank: number; accommodationId: string };

type RankingCtx = {
  /** The rank (1–3) this accommodation currently holds, or null. */
  rankOf: (accommodationId: string) => number | null;
  /** Toggle this accommodation into/out of the given rank slot. */
  setRank: (accommodationId: string, rank: number) => void;
  pending: boolean;
  saved: boolean;
};

const RankingContext = createContext<RankingCtx | null>(null);

const SLOTS = [
  {
    rank: 1,
    label: "1st",
    medalClass: "text-yellow-500",
    activeClass: "border-yellow-400 bg-yellow-50 text-yellow-900",
  },
  {
    rank: 2,
    label: "2nd",
    medalClass: "text-slate-400",
    activeClass: "border-slate-400 bg-slate-100 text-slate-900",
  },
  {
    rank: 3,
    label: "3rd",
    medalClass: "text-amber-700",
    activeClass: "border-amber-600 bg-amber-50 text-amber-900",
  },
];

export function RankingProvider({
  cityId,
  initial,
  children,
}: {
  cityId: string;
  initial: InitialRanking[];
  children: ReactNode;
}) {
  // picks[i] = accommodation id chosen for slot rank i+1 (or "")
  const [picks, setPicks] = useState<string[]>(() =>
    SLOTS.map(
      (s) => initial.find((r) => r.rank === s.rank)?.accommodationId ?? "",
    ),
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function commit(next: string[]) {
    setPicks(next);
    setSaved(false);
    startTransition(async () => {
      await saveRankings(
        cityId,
        next.map((p) => p || null),
      );
      setSaved(true);
    });
  }

  function rankOf(accommodationId: string) {
    const i = picks.indexOf(accommodationId);
    return i === -1 ? null : i + 1;
  }

  function setRank(accommodationId: string, rank: number) {
    const slot = rank - 1;
    const alreadyHere = picks[slot] === accommodationId;
    const next = picks.map((p) => (p === accommodationId ? "" : p));
    if (!alreadyHere) next[slot] = accommodationId;
    commit(next);
  }

  return (
    <RankingContext.Provider value={{ rankOf, setRank, pending, saved }}>
      {children}
    </RankingContext.Provider>
  );
}

/** Small live "Saving… / Saved" indicator, shown near the section heading. */
export function RankingStatus() {
  const ctx = useContext(RankingContext);
  if (!ctx) return null;
  if (ctx.pending) {
    return (
      <span className="flex items-center gap-1 text-xs text-slate-400">
        <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    );
  }
  if (ctx.saved) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <Check aria-hidden className="h-3.5 w-3.5" />
        Saved
      </span>
    );
  }
  return null;
}

/** The 1st / 2nd / 3rd pick buttons for a single accommodation card. */
export function RankButtons({
  accommodationId,
}: {
  accommodationId: string;
}) {
  const ctx = useContext(RankingContext);
  if (!ctx) return null;
  const current = ctx.rankOf(accommodationId);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-slate-500">Your pick:</span>
      {SLOTS.map((slot) => {
        const active = current === slot.rank;
        return (
          <button
            key={slot.rank}
            type="button"
            onClick={() => ctx.setRank(accommodationId, slot.rank)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition ${
              active
                ? slot.activeClass
                : "border-hairline text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <Medal
              aria-hidden
              className={`h-4 w-4 ${active ? slot.medalClass : "text-slate-300"}`}
            />
            {slot.label}
          </button>
        );
      })}
    </div>
  );
}
