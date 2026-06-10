import Link from "next/link";
import { auth } from "@/auth";
import { getUserTrips } from "@/lib/data";
import { createTrip } from "@/lib/actions";

export default async function TripsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const trips = await getUserTrips(userId);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-semibold text-slate-900">Your trips</h1>
        {trips.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No trips yet — create one below to get started.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Link
                  href={`/trips/${trip.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      {trip.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {trip._count.members} traveler
                      {trip._count.members === 1 ? "" : "s"} ·{" "}
                      {trip._count.cities} cit
                      {trip._count.cities === 1 ? "y" : "ies"}
                    </span>
                  </div>
                  {trip.description && (
                    <p className="mt-1 text-sm text-slate-500">
                      {trip.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">New trip</h2>
        <form action={createTrip} className="mt-3 space-y-3">
          <input
            name="name"
            required
            placeholder="Trip name (e.g. Portugal 2026)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
          <input
            name="description"
            placeholder="Optional description"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="shrink-0">People splitting the cost</span>
            <input
              name="partySize"
              type="number"
              min="1"
              max="100"
              defaultValue={2}
              className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Create trip
          </button>
        </form>
      </section>
    </div>
  );
}
