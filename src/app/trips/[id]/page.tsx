import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Trash2, Trophy, Users, Wallet } from "lucide-react";
import { auth } from "@/auth";
import { getTripForUser } from "@/lib/data";
import {
  addCity,
  deleteCity,
  deleteTrip,
  updateTripSettings,
  setTripImage,
  setCityImage,
} from "@/lib/actions";
import { InviteLink } from "@/components/invite-link";
import { CURRENCIES } from "@/lib/format";
import { AvatarStack } from "@/components/avatar-stack";
import { ConfirmForm } from "@/components/confirm-form";
import { CoverImage } from "@/components/cover-image";
import { ImagePicker } from "@/components/image-picker";
import { SubmitButton } from "@/components/submit-button";

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const trip = await getTripForUser(id, session!.user.id);
  if (!trip) notFound();

  const addCityWithTrip = addCity.bind(null, trip.id);
  const updateSettingsWithTrip = updateTripSettings.bind(null, trip.id);

  const travelerCount = trip.members.length;
  const cityCount = trip.cities.length;
  const isAdmin = trip.members.some(
    (m) => m.userId === session!.user.id && m.role === "ADMIN",
  );

  return (
    <div className="space-y-6">
      <Link
        href="/trips"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
        All trips
      </Link>

      {/* Cover hero */}
      <div className="card overflow-hidden">
        <CoverImage
          src={trip.imageUrl}
          alt={trip.name}
          credit={trip.imageCredit}
          creditUrl={trip.imageCreditUrl}
          className="aspect-[21/9] w-full"
        >
          <div className="absolute right-2 top-2">
            <ImagePicker
              onSelect={setTripImage.bind(null, trip.id)}
              onRemove={setTripImage.bind(null, trip.id, null)}
              hasImage={Boolean(trip.imageUrl)}
              defaultQuery={trip.name}
            />
          </div>
        </CoverImage>
        <div className="p-4">
          <h1 className="text-2xl font-bold tracking-tight">{trip.name}</h1>
          {trip.description && (
            <p className="mt-1 text-muted">{trip.description}</p>
          )}
        </div>
      </div>

      {/* Breakdown, right below the cover */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Users aria-hidden className="h-4 w-4" />
          <span className="font-semibold text-foreground">{travelerCount}</span>
          traveler{travelerCount === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin aria-hidden className="h-4 w-4" />
          <span className="font-semibold text-foreground">{cityCount}</span>
          cit{cityCount === 1 ? "y" : "ies"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Wallet aria-hidden className="h-4 w-4" />
          <span className="font-semibold text-foreground">{trip.currency}</span>
          currency
        </span>
      </div>

      {/* Cities (main) + sidebar (travelers, invite, settings) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="min-w-0 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Cities</h2>
          </div>

          {cityCount === 0 ? (
            <p className="text-sm text-muted">
              No cities yet — add the first one below.
            </p>
          ) : (
            <ul className="grid gap-4">
              {trip.cities.map((city) => (
                <li key={city.id} className="card card-hover overflow-hidden">
                  <div className="relative">
                    <Link href={`/trips/${trip.id}/cities/${city.id}`}>
                      <CoverImage
                        src={city.imageUrl}
                        alt={city.name}
                        credit={city.imageCredit}
                        creditUrl={city.imageCreditUrl}
                        sizes="(max-width: 1024px) 100vw, 512px"
                        className="aspect-[16/9] w-full"
                      />
                    </Link>
                    <div className="absolute right-2 top-2 flex items-center gap-1.5">
                      <ImagePicker
                        onSelect={setCityImage.bind(null, city.id)}
                        onRemove={setCityImage.bind(null, city.id, null)}
                        hasImage={Boolean(city.imageUrl)}
                        defaultQuery={city.name}
                      />
                      {isAdmin && (
                        <ConfirmForm
                          action={deleteCity.bind(null, city.id)}
                          message={`Delete ${city.name}? All of its accommodations and rankings are removed for everyone.`}
                        >
                          <SubmitButton
                            pendingText=""
                            aria-label={`Delete ${city.name}`}
                            className="rounded-md bg-white/90 p-1.5 text-slate-600 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white hover:text-red-600"
                          >
                            <Trash2 aria-hidden className="h-3.5 w-3.5" />
                          </SubmitButton>
                        </ConfirmForm>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/trips/${trip.id}/cities/${city.id}`}
                    className="flex items-center justify-between gap-2 px-4 pb-3 pt-4"
                  >
                    <span className="min-w-0 truncate font-semibold">
                      {city.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {city._count.accommodations} option
                      {city._count.accommodations === 1 ? "" : "s"}
                    </span>
                  </Link>
                  <div className="px-4 pb-4">
                    <Link
                      href={`/trips/${trip.id}/cities/${city.id}/rank`}
                      className="btn-brand flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold shadow-sm ring-1 ring-brand-blue/20 transition hover:shadow-md"
                    >
                      <Trophy aria-hidden className="h-3.5 w-3.5" />
                      Rank your top 3
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form action={addCityWithTrip} className="flex gap-2">
            <input
              name="name"
              required
              placeholder="Add a city (e.g. Lisbon)"
              className="flex-1 rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
            <SubmitButton
              pendingText="Adding…"
              className="btn-brand rounded-lg px-5 py-2.5 text-sm font-medium transition"
            >
              Add
            </SubmitButton>
          </form>
        </section>

        <aside className="min-w-0 space-y-6">
          {/* Travelers */}
          <section className="card p-5">
            <h2 className="text-sm font-semibold">
              Travelers ({travelerCount})
            </h2>
            <ul className="mt-3 space-y-3">
              {trip.members.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5">
                  <AvatarStack
                    people={[{ name: m.user.name, image: m.user.image }]}
                    size={28}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {m.user.name ?? m.user.email}
                  </span>
                  {m.role === "ADMIN" && (
                    <span className="text-[10px] uppercase leading-none tracking-wide text-muted">
                      admin
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-hairline pt-4">
              <p className="mb-1.5 text-xs font-medium text-muted">
                Invite friends
              </p>
              <InviteLink code={trip.inviteCode} />
            </div>
          </section>

          {/* Settings */}
          <section className="card p-5">
            <h2 className="text-sm font-semibold">Settings</h2>
            <form
              action={updateSettingsWithTrip}
              className="mt-3 flex flex-wrap items-end gap-3"
            >
              <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                Currency
                <select
                  name="currency"
                  defaultValue={trip.currency}
                  className="rounded-lg border border-hairline px-3 py-1.5 text-sm outline-none focus:border-brand-blue"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                Party size
                <input
                  name="partySize"
                  type="number"
                  min="1"
                  max="100"
                  defaultValue={trip.partySize}
                  className="w-20 rounded-lg border border-hairline px-3 py-1.5 text-sm outline-none focus:border-brand-blue"
                />
              </label>
              <SubmitButton
                pendingText="Updating…"
                className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-slate-400"
              >
                Update
              </SubmitButton>
            </form>

            {isAdmin && (
              <div className="mt-4 border-t border-hairline pt-4">
                <ConfirmForm
                  action={deleteTrip.bind(null, trip.id)}
                  message={`Delete "${trip.name}"? This permanently removes the trip — all cities, accommodations, notes and rankings — for every traveler.`}
                >
                  <SubmitButton
                    pendingText="Deleting…"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50"
                  >
                    <Trash2 aria-hidden className="h-3.5 w-3.5" />
                    Delete trip
                  </SubmitButton>
                </ConfirmForm>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
