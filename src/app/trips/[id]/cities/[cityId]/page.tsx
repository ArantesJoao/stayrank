import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Medal,
  Trash2,
  Trophy,
} from "lucide-react";
import { auth } from "@/auth";
import { getCityForUser } from "@/lib/data";
import {
  addAccommodation,
  deleteAccommodation,
  setMyNote,
} from "@/lib/actions";
import { setCityImage } from "@/lib/actions";
import { RankingEditor } from "@/components/ranking-editor";
import { AvatarStack } from "@/components/avatar-stack";
import { CoverImage } from "@/components/cover-image";
import { ImagePicker } from "@/components/image-picker";
import { SubmitButton } from "@/components/submit-button";
import { CurrencyInput } from "@/components/currency-input";
import {
  isScrapableListingUrl,
  schedulePreviewBackfills,
} from "@/lib/accommodation-preview";
import { priceBreakdown } from "@/lib/format";
import { faviconUrl, listingSource } from "@/lib/listing";

// Booking previews are scraped with JS rendering in after(), which can take
// ~60s; give the function room to finish. Raise on Vercel Pro (up to 300) for
// the most reliable Booking previews — Hobby caps this at 60.
export const maxDuration = 60;

// Gold / silver / bronze tints for the top-3 leaderboard medals.
const MEDAL_CLASSES = ["text-yellow-500", "text-slate-400", "text-amber-700"];

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

  // Re-attempt any still-missing preview images on view (self-heals scrapes
  // lost to a server restart). Runs in the background via after().
  schedulePreviewBackfills(city.accommodations);

  const addAccWithCity = addAccommodation.bind(null, cityId);
  const partySize = city.trip.partySize;
  const currency = city.trip.currency;
  const isAdmin = city.isAdmin;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/trips/${id}`}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          Back to trip
        </Link>
        <div className="card mt-2 overflow-hidden">
          <CoverImage
            src={city.imageUrl}
            alt={city.name}
            credit={city.imageCredit}
            creditUrl={city.imageCreditUrl}
            className="aspect-[21/9] w-full"
          >
            <div className="absolute right-2 top-2">
              <ImagePicker
                onSelect={setCityImage.bind(null, cityId)}
                onRemove={setCityImage.bind(null, cityId, null)}
                hasImage={Boolean(city.imageUrl)}
                defaultQuery={city.name}
              />
            </div>
          </CoverImage>
          <div className="p-4">
            <h1 className="text-2xl font-bold tracking-tight">{city.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {city.accommodations.length} option
              {city.accommodations.length === 1 ? "" : "s"} ·{" "}
              {city.votersWhoRanked} of {city.memberCount} traveler
              {city.memberCount === 1 ? "" : "s"} ranked
            </p>
          </div>
        </div>
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
            const price = priceBreakdown(a.totalPrice, partySize, currency);
            const source = listingSource(a.url);

            return (
              <article key={a.id} className="card overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <CoverImage
                    src={a.previewImageUrl}
                    alt={a.previewTitle ?? a.name}
                    sizes="(max-width: 640px) 100vw, 224px"
                    className="aspect-[4/3] w-full shrink-0 sm:w-56 sm:self-start"
                    loading={
                      isScrapableListingUrl(a.url) &&
                      !a.previewImageUrl &&
                      a.previewStatus !== "FAILED"
                    }
                  />
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="min-w-0 truncate font-semibold text-slate-900">
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
                          {source && a.url && (
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`View on ${source.label}`}
                              aria-label={`View on ${source.label}`}
                              className="shrink-0 rounded ring-offset-2 transition hover:opacity-70"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={faviconUrl(source.host)}
                                alt={source.label}
                                width={18}
                                height={18}
                                className="h-[18px] w-[18px] rounded-sm"
                              />
                            </a>
                          )}
                        </div>
                        {price && (
                          <p className="mt-0.5 text-sm">
                            {price.perPerson && (
                              <>
                                <span className="font-semibold text-slate-900">
                                  {price.perPerson}
                                </span>
                                <span className="text-slate-500">/person</span>
                                <span className="text-slate-300"> · </span>
                              </>
                            )}
                            <span className="text-slate-500">
                              {price.total} total
                            </span>
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          <AvatarStack
                            people={[
                              { name: a.addedBy.name, image: a.addedBy.image },
                            ]}
                            size={20}
                          />
                          Added by {a.addedBy.name ?? "someone"}
                        </div>
                        {a.url && (
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400"
                          >
                            <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                            {source && source.key !== "other"
                              ? `View on ${source.label}`
                              : "View listing"}
                          </a>
                        )}
                      </div>

                      {/* Only trip admins can delete an accommodation. */}
                      {isAdmin && (
                        <form action={del}>
                          <SubmitButton
                            pendingText=""
                            aria-label="Delete accommodation"
                            title="Delete"
                            className="rounded-md p-1.5 text-slate-300 transition hover:bg-slate-50 hover:text-red-600"
                          >
                            <Trash2 aria-hidden className="h-4 w-4" />
                          </SubmitButton>
                        </form>
                      )}
                    </div>

                    {/* Everyone's notes */}
                    {notes.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {notes.map((c) => (
                          <li
                            key={c.id}
                            className="rounded-lg bg-slate-50 px-3 py-2 text-sm"
                          >
                            <span className="font-semibold text-slate-900">
                              {c.user.name ?? "Someone"}
                            </span>
                            <span className="text-slate-400"> — </span>
                            <span className="text-slate-600">{c.note}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Your own note — collapsed behind an "Edit your note" toggle */}
                    <details className="mt-3">
                      <summary className="inline-flex cursor-pointer list-none items-center text-xs font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900">
                        {myNote ? "Edit your note" : "Add a note"}
                      </summary>
                      <form
                        action={saveNote}
                        className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end"
                      >
                        <textarea
                          name="note"
                          rows={2}
                          defaultValue={myNote}
                          placeholder="Add your note about this place…"
                          className="flex-1 resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue"
                        />
                        <SubmitButton
                          pendingText="Saving…"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400"
                        >
                          {myNote ? "Update note" : "Add note"}
                        </SubmitButton>
                      </form>
                    </details>
                  </div>
                </div>
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
          className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-white p-4"
        >
          <input
            name="name"
            required
            placeholder="Place name (e.g. Airbnb in Alfama)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              name="url"
              type="url"
              placeholder="Link (Airbnb / Booking…)"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
            <div className="sm:w-44">
              <CurrencyInput
                name="totalPrice"
                currency={currency}
                placeholder="Total price"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
              />
            </div>
          </div>
          <textarea
            name="note"
            rows={2}
            placeholder="Why this one? (optional note for the group)"
            className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-blue"
          />
          <SubmitButton
            pendingText="Adding…"
            className="btn-brand rounded-lg px-5 py-2.5 text-sm font-medium transition"
          >
            Add accommodation
          </SubmitButton>
        </form>
      </section>

      {/* Ranking + results — hidden by default */}
      <details className="group rounded-2xl border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold text-slate-900">
          <span className="flex items-center gap-1.5">
            <Trophy aria-hidden className="h-4 w-4 text-amber-500" />
            Rank your top 3 &amp; see results
          </span>
          <ChevronDown
            aria-hidden
            className="h-4 w-4 text-slate-400 transition group-open:rotate-180"
          />
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
          </div>
        </div>
      </details>
    </div>
  );
}
