import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { getCityForUser } from "@/lib/data";
import {
  addAccommodation,
  deleteAccommodation,
  setMyNotes,
} from "@/lib/actions";
import { setCityImage } from "@/lib/actions";
import { NoteEditor } from "@/components/note-editor";
import { NotesPanel } from "@/components/notes-panel";
import {
  RankingProvider,
  RankingStatus,
  RankButtons,
} from "@/components/ranking-controls";
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

/** "Ana", "Ana & Bob", "Ana, Bob & Carol", "Ana, Bob & 2 others". */
function formatAuthors(names: string[]): string {
  if (names.length === 0) return "someone";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  const rest = names.length - 2;
  return `${names[0]}, ${names[1]} & ${rest} other${rest === 1 ? "" : "s"}`;
}

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

      {/* Secondary CTA → the leaderboard screen (ranking now happens inline) */}
      <Link
        href={`/trips/${id}/cities/${cityId}/rank`}
        className="btn-brand flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold shadow-md ring-1 ring-brand-blue/20 transition hover:shadow-lg"
      >
        <Trophy aria-hidden className="h-4 w-4" />
        See the leaderboard
      </Link>

      {/* Default view: accommodation cards with inline ranking + everyone's notes */}
      <section className="space-y-3">
        {city.accommodations.length === 0 ? (
          <p className="text-sm text-slate-500">
            No accommodations yet — add the first one below.
          </p>
        ) : (
          <RankingProvider
            cityId={cityId}
            initial={city.myRankings.map((r) => ({
              rank: r.rank,
              accommodationId: r.accommodationId,
            }))}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted">
                Tap a medal to set your top 3 — it saves automatically.
              </p>
              <RankingStatus />
            </div>
            {city.accommodations.map((a) => {
            const del = deleteAccommodation.bind(null, a.id);
            const saveNotes = setMyNotes.bind(null, a.id);
            const mine = a.contributors.find((c) => c.userId === userId);
            const myPros = mine?.pros ?? "";
            const myCons = mine?.cons ?? "";
            const notes = a.contributors.filter((c) => c.pros || c.cons);
            // Everyone who suggested this place (one card may be co-suggested
            // when two people add the same listing). Fall back to the original
            // author for older rows with no flagged contributors.
            const authors = a.contributors
              .filter((c) => c.isAuthor)
              .map((c) => c.user);
            const authorPeople = authors.length > 0 ? authors : [a.addedBy];
            const price = priceBreakdown(a.totalPrice, partySize, currency);
            const source = listingSource(a.url);

            return (
              <article key={a.id} className="card overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <CoverImage
                    src={a.previewImageUrl}
                    alt={a.previewTitle ?? a.name}
                    sizes="(max-width: 640px) 100vw, 224px"
                    className="aspect-[4/3] w-full shrink-0 sm:aspect-auto sm:w-56"
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
                            people={authorPeople.map((u) => ({
                              name: u.name,
                              image: u.image,
                            }))}
                            size={20}
                          />
                          Added by{" "}
                          {formatAuthors(
                            authorPeople.map((u) => u.name ?? "someone"),
                          )}
                        </div>
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

                    {/* Inline ranking — pick this place as your 1st/2nd/3rd */}
                    <RankButtons accommodationId={a.id} />

                    {/* Everyone's pros & cons — collapsed by default so every
                        card keeps the same height; expands + scrolls in place */}
                    <NotesPanel
                      notes={notes.map((c) => ({
                        id: c.id,
                        authorName: c.user.name,
                        authorImage: c.user.image,
                        pros: c.pros,
                        cons: c.cons,
                      }))}
                    />

                    {/* Your own pros & cons — collapses + clears on save */}
                    <NoteEditor
                      action={saveNotes}
                      initialPros={myPros}
                      initialCons={myCons}
                    />
                  </div>
                </div>
              </article>
            );
            })}
          </RankingProvider>
        )}
      </section>

      {/* Add accommodation */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900">
          Add an accommodation
        </h2>
        <form
          action={addAccWithCity}
          className="card mt-3 space-y-2 p-4"
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              name="pros"
              rows={2}
              placeholder="Pros — what's great about it? (optional)"
              className="flex-1 resize-y rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
            <textarea
              name="cons"
              rows={2}
              placeholder="Cons — any downsides? (optional)"
              className="flex-1 resize-y rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
          </div>
          <SubmitButton
            pendingText="Adding…"
            className="btn-brand rounded-lg px-5 py-2.5 text-sm font-medium transition"
          >
            Add accommodation
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
