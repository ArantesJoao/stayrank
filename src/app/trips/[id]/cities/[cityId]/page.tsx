import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getCityForUser } from "@/lib/data";
import { addAccommodation, deleteAccommodation } from "@/lib/actions";
import { RankingEditor } from "@/components/ranking-editor";
import { AvatarStack } from "@/components/avatar-stack";
import { formatPrice } from "@/lib/format";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function CityPage({
  params,
}: {
  params: Promise<{ id: string; cityId: string }>;
}) {
  const { id, cityId } = await params;
  const session = await auth();
  const userId = session!.user.id;
  const city = await getCityForUser(cityId, userId);
  if (!city) notFound();

  const addAccWithCity = addAccommodation.bind(null, cityId);
  const partySize = city.trip.partySize;

  // Notes by accommodation for the discussion section.
  const notesByAcc = new Map<string, { name: string; note: string; rank: number }[]>();
  for (const r of city.rankings) {
    if (!r.note) continue;
    const list = notesByAcc.get(r.accommodationId) ?? [];
    list.push({ name: r.user.name ?? "Someone", note: r.note, rank: r.rank });
    notesByAcc.set(r.accommodationId, list);
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/trips/${id}`}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          ← Back to trip
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{city.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {city.votersWhoRanked} of {city.memberCount} traveler
          {city.memberCount === 1 ? "" : "s"} have ranked.
        </p>
      </div>

      {/* Leaderboard */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900">Leaderboard</h2>
        {city.leaderboard.every((e) => e.points === 0) ? (
          <p className="mt-2 text-sm text-slate-500">
            No votes yet — be the first to rank below.
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {city.leaderboard.map((entry, i) => (
              <li
                key={entry.accommodation.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{MEDALS[i] ?? `#${i + 1}`}</span>
                    <div>
                      <p className="font-medium text-slate-900">
                        {entry.accommodation.url ? (
                          <a
                            href={entry.accommodation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {entry.accommodation.name}
                          </a>
                        ) : (
                          entry.accommodation.name
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        {entry.voteCount} vote{entry.voteCount === 1 ? "" : "s"}
                        {formatPrice(
                          entry.accommodation.totalPrice,
                          partySize,
                        ) && ` · ${formatPrice(entry.accommodation.totalPrice, partySize)}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {entry.points} pts
                  </span>
                </div>
                {notesByAcc.get(entry.accommodation.id)?.length ? (
                  <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                    {notesByAcc.get(entry.accommodation.id)!.map((n, j) => (
                      <li key={j} className="text-sm text-slate-600">
                        <span className="font-medium text-slate-800">
                          {n.name}
                        </span>{" "}
                        <span className="text-xs text-slate-400">
                          ({MEDALS[n.rank - 1]})
                        </span>{" "}
                        — {n.note}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Your ranking */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900">Your top 3</h2>
        <p className="text-xs text-slate-500">
          Pick your favorites and add a note explaining why.
        </p>
        <div className="mt-3">
          <RankingEditor
            cityId={cityId}
            options={city.accommodations.map((a) => ({ id: a.id, name: a.name }))}
            initial={city.myRankings.map((r) => ({
              rank: r.rank,
              accommodationId: r.accommodationId,
              note: r.note,
            }))}
          />
        </div>
      </section>

      {/* Accommodations */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900">
          Accommodations ({city.accommodations.length})
        </h2>
        {city.accommodations.length > 0 && (
          <ul className="mt-3 space-y-2">
            {city.accommodations.map((a) => {
              const del = deleteAccommodation.bind(null, a.id);
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {a.url ? (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {a.name}
                        </a>
                      ) : (
                        a.name
                      )}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <AvatarStack
                        people={a.contributors.map((c) => ({
                          name: c.user.name,
                          image: c.user.image,
                        }))}
                        size={20}
                      />
                      <span className="text-xs text-slate-400">
                        {formatPrice(a.totalPrice, partySize)}
                      </span>
                    </div>
                  </div>
                  <form action={del}>
                    <button
                      type="submit"
                      className="shrink-0 text-xs text-slate-400 transition hover:text-red-600"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        <form
          action={addAccWithCity}
          className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-white p-4"
        >
          <input
            name="name"
            required
            placeholder="Place name (e.g. Airbnb in Alfama)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              name="url"
              type="url"
              placeholder="Link (Airbnb / Booking…)"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
            <input
              name="totalPrice"
              type="number"
              min="0"
              step="1"
              placeholder="Total $"
              title="Total price for the whole place/stay"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 sm:w-28"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Add accommodation
          </button>
        </form>
      </section>
    </div>
  );
}
