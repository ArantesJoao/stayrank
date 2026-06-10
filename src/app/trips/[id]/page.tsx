import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getTripForUser } from "@/lib/data";
import {
  addCity,
  updateTripSettings,
  setTripImage,
  setCityImage,
} from "@/lib/actions";
import { InviteLink } from "@/components/invite-link";
import { CURRENCIES } from "@/lib/format";
import { CoverImage } from "@/components/cover-image";
import { ImagePicker } from "@/components/image-picker";

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

  return (
    <div className="space-y-8">
      {/* Cover hero */}
      <div>
        <Link href="/trips" className="text-xs text-muted hover:text-foreground">
          ← All trips
        </Link>
        <div className="card mt-2 overflow-hidden">
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
      </div>

      <section className="card p-5">
        <h2 className="text-sm font-semibold">Travelers ({trip.members.length})</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {trip.members.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-sm text-foreground"
            >
              {m.user.name ?? m.user.email}
              {m.role === "ADMIN" && (
                <span className="text-[10px] uppercase tracking-wide text-muted">
                  admin
                </span>
              )}
            </span>
          ))}
        </div>
        <form
          action={updateSettingsWithTrip}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            People splitting the cost
            <input
              name="partySize"
              type="number"
              min="1"
              max="100"
              defaultValue={trip.partySize}
              className="w-20 rounded-lg border border-hairline px-3 py-1.5 text-sm outline-none focus:border-brand-blue"
            />
          </label>
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
          <button
            type="submit"
            className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-slate-400"
          >
            Update
          </button>
        </form>

        <div className="mt-4 border-t border-hairline pt-4">
          <p className="mb-1.5 text-xs font-medium text-muted">
            Invite friends with this link
          </p>
          <InviteLink code={trip.inviteCode} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Cities</h2>
        <p className="text-xs text-muted">
          A city groups the accommodations you&apos;re choosing between.
        </p>
        {trip.cities.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No cities yet.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {trip.cities.map((city) => (
              <li key={city.id} className="card card-hover overflow-hidden">
                <div className="relative">
                  <Link href={`/trips/${trip.id}/cities/${city.id}`}>
                    <CoverImage
                      src={city.imageUrl}
                      alt={city.name}
                      credit={city.imageCredit}
                      creditUrl={city.imageCreditUrl}
                      sizes="(max-width: 640px) 100vw, 384px"
                      className="aspect-[16/9] w-full"
                    />
                  </Link>
                  <div className="absolute right-2 top-2">
                    <ImagePicker
                      onSelect={setCityImage.bind(null, city.id)}
                      onRemove={setCityImage.bind(null, city.id, null)}
                      hasImage={Boolean(city.imageUrl)}
                      defaultQuery={city.name}
                    />
                  </div>
                </div>
                <Link
                  href={`/trips/${trip.id}/cities/${city.id}`}
                  className="flex items-center justify-between p-4"
                >
                  <span className="font-semibold">{city.name}</span>
                  <span className="text-xs text-muted">
                    {city._count.accommodations} option
                    {city._count.accommodations === 1 ? "" : "s"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <form action={addCityWithTrip} className="mt-4 flex gap-2">
          <input
            name="name"
            required
            placeholder="Add a city (e.g. Lisbon)"
            className="flex-1 rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-brand-blue"
          />
          <button
            type="submit"
            className="btn-brand rounded-lg px-5 py-2.5 text-sm font-medium transition"
          >
            Add
          </button>
        </form>
      </section>
    </div>
  );
}
