import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getTripForUser } from "@/lib/data";
import { addCity } from "@/lib/actions";
import { InviteLink } from "@/components/invite-link";

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

  return (
    <div className="space-y-8">
      <div>
        <Link href="/trips" className="text-xs text-slate-400 hover:text-slate-600">
          ← All trips
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{trip.name}</h1>
        {trip.description && (
          <p className="mt-1 text-slate-500">{trip.description}</p>
        )}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Travelers ({trip.members.length})
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {trip.members.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
            >
              {m.user.name ?? m.user.email}
              {m.role === "ADMIN" && (
                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                  admin
                </span>
              )}
            </span>
          ))}
        </div>
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium text-slate-500">
            Invite friends with this link
          </p>
          <InviteLink code={trip.inviteCode} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Cities</h2>
        <p className="text-xs text-slate-500">
          A city groups the accommodations you&apos;re choosing between.
        </p>
        {trip.cities.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No cities yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {trip.cities.map((city) => (
              <li key={city.id}>
                <Link
                  href={`/trips/${trip.id}/cities/${city.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <span className="font-medium text-slate-900">{city.name}</span>
                  <span className="text-xs text-slate-400">
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
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Add
          </button>
        </form>
      </section>
    </div>
  );
}
