import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Medal } from "lucide-react";
import { auth } from "@/auth";
import { getCityForUser } from "@/lib/data";

// Gold / silver / bronze tints for the top-3 leaderboard medals.
const MEDAL_CLASSES = ["text-yellow-500", "text-slate-400", "text-amber-700"];

export default async function RankCityPage({
  params,
}: {
  params: Promise<{ id: string; cityId: string }>;
}) {
  const { id, cityId } = await params;
  const session = await auth();
  const userId = session!.user.id;
  const city = await getCityForUser(cityId, userId);
  if (!city) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/trips/${id}/cities/${cityId}`}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          Back to {city.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted">
          {city.name} — 1st = 3 pts, 2nd = 2, 3rd = 1. Set your own picks back on
          the city page.
        </p>
      </div>

      {/* Leaderboard */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900">
          Current standings
        </h2>
        {city.leaderboard.every((e) => e.points === 0) ? (
          <p className="mt-2 text-sm text-slate-500">
            No votes yet — be the first to rank above.
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {city.leaderboard.map((entry, i) => (
              <li
                key={entry.accommodation.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {i < 3 ? (
                    <Medal
                      aria-hidden
                      className={`h-5 w-5 shrink-0 ${MEDAL_CLASSES[i]}`}
                    />
                  ) : (
                    <span className="w-5 shrink-0 text-center text-sm font-medium text-slate-400">
                      {i + 1}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {entry.accommodation.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {entry.voteCount} vote
                      {entry.voteCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {entry.points} pts
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
