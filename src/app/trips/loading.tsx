/** Instant skeleton for the trips list while the server component (auth +
 *  trip query) streams in. Mirrors the real layout: heading + a grid of cards. */
export default function TripsLoading() {
  return (
    <div className="space-y-8">
      <section>
        <div className="skeleton h-8 w-44" />
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="card relative overflow-hidden">
              <div className="skeleton aspect-[16/9] w-full rounded-none" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-3 w-20" />
                </div>
                <div className="skeleton mt-2 h-3 w-40" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
