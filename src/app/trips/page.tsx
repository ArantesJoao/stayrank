import Link from "next/link";
import { auth } from "@/auth";
import { getUserTrips } from "@/lib/data";
import { createTrip } from "@/lib/actions";
import { CURRENCIES } from "@/lib/format";
import { CoverImage } from "@/components/cover-image";
import { SubmitButton } from "@/components/submit-button";

export default async function TripsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const trips = await getUserTrips(userId);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Your trips</h1>
        {trips.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No trips yet — create one below to get started.
          </p>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Link
                  href={`/trips/${trip.id}`}
                  className="card card-hover block overflow-hidden"
                >
                  <CoverImage
                    src={trip.imageUrl}
                    alt={trip.name}
                    credit={trip.imageCredit}
                    creditUrl={trip.imageCreditUrl}
                    sizes="(max-width: 640px) 100vw, 384px"
                    className="aspect-[16/9] w-full"
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{trip.name}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {trip._count.members} traveler
                        {trip._count.members === 1 ? "" : "s"} ·{" "}
                        {trip._count.cities} cit
                        {trip._count.cities === 1 ? "y" : "ies"}
                      </span>
                    </div>
                    {trip.description && (
                      <p className="mt-1 text-sm text-muted">
                        {trip.description}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">New trip</h2>
        <form action={createTrip} className="mt-3 space-y-3">
          <input
            name="name"
            required
            placeholder="Trip name (e.g. Portugal 2026)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
          />
          <input
            name="description"
            placeholder="Optional description"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
          />
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="shrink-0">Currency</span>
              <select
                name="currency"
                defaultValue="EUR"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="shrink-0">Party size</span>
              <input
                name="partySize"
                type="number"
                min="1"
                max="100"
                defaultValue={2}
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
              />
            </label>
          </div>
          <SubmitButton
            pendingText="Creating…"
            className="btn-brand rounded-lg px-5 py-2.5 text-sm font-medium transition"
          >
            Create trip
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
