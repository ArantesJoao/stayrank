import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getCityForUser } from "@/lib/data";
import {
  addAccommodation,
  deleteAccommodation,
  setMyNote,
} from "@/lib/actions";
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
  const currency = city.trip.currency;

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
          {city.accommodations.length} option
          {city.accommodations.length === 1 ? "" : "s"} ·{" "}
          {city.votersWhoRanked} of {city.memberCount} traveler
          {city.memberCount === 1 ? "" : "s"} ranked
        </p>
      </div>

      {/* Default view: accommodation cards with everyone's notes */}
      <section className="space-y-3">
        {city.accommodations.length === 0 ? (
          <p className="text-sm text-slate-500">
            No accommodations yet — add the first one below.
          </p>
        ) : (
          city.accommodations.map((a) => {
            const del = deleteAccommodation.bind(null, a.id);
            const saveNote = setMyNote.bind(null, a.id);
            const myNote =
              a.contributors.find((c) => c.userId === userId)?.note ?? "";
            const notes = a.contributors.filter((c) => c.note);

            return (
              <article
                key={a.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">
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
                    </h3>
                    {formatPrice(a.totalPrice, partySize, currency) && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatPrice(a.totalPrice, partySize, currency)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <AvatarStack
                      people={a.contributors.map((c) => ({
                        name: c.user.name,
                        image: c.user.image,
                      }))}
                      size={24}
                    />
                    <form action={del}>
                      <button
                        type="submit"
                        className="text-xs text-slate-400 transition hover:text-red-600"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>

                {/* Everyone's notes */}
                {notes.length > 0 && (
                  <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    {notes.map((c) => (
                      <li key={c.id} className="flex gap-2 text-sm">
                        <span className="font-medium text-slate-800">
                          {c.user.name ?? "Someone"}:
                        </span>
                        <span className="text-slate-600">{c.note}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Your own note (add / edit) */}
                <form
                  action={saveNote}
                  className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
                >
                  <textarea
                    name="note"
                    rows={1}
                    defaultValue={myNote}
                    placeholder="Add your note about this place…"
                    className="flex-1 resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400"
                  >
                    {myNote ? "Update note" : "Add note"}
                  </button>
                </form>
              </article>
            );
          })
        )}
      </section>

      {/* Add accommodation */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900">
          Add an accommodation
        </h2>
        <form
          action={addAccWithCity}
          className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-4"
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
          <textarea
            name="note"
            rows={2}
            placeholder="Why this one? (optional note for the group)"
            className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Add accommodation
          </button>
        </form>
      </section>

      {/* Ranking + results — hidden by default */}
      <details className="group rounded-xl border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold text-slate-900">
          <span>🏆 Rank your top 3 &amp; see results</span>
          <span className="text-slate-400 transition group-open:rotate-180">
            ▾
          </span>
        </summary>

        <div className="space-y-8 border-t border-slate-100 p-4">
          {/* Your ranking */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Your top 3</h3>
            <p className="text-xs text-slate-500">
              Pick your favorites — 1st = 3 pts, 2nd = 2, 3rd = 1.
            </p>
            <div className="mt-3">
              <RankingEditor
                cityId={cityId}
                options={city.accommodations.map((a) => ({
                  id: a.id,
                  name: a.name,
                }))}
                initial={city.myRankings.map((r) => ({
                  rank: r.rank,
                  accommodationId: r.accommodationId,
                }))}
              />
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Leaderboard</h3>
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
                      <span className="text-lg">
                        {MEDALS[i] ?? `#${i + 1}`}
                      </span>
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
          </div>
        </div>
      </details>
    </div>
  );
}
