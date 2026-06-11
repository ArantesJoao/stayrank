/** Instant skeleton for a trip page: cover hero, stat row, cities + sidebar. */
export default function TripLoading() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-3 w-20" />

      {/* Cover hero */}
      <div className="card overflow-hidden">
        <div className="skeleton aspect-[21/9] w-full rounded-none" />
        <div className="p-4">
          <div className="skeleton h-7 w-48" />
          <div className="skeleton mt-2 h-4 w-64" />
        </div>
      </div>

      {/* Stat row */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-4 w-28" />
      </div>

      {/* Cities + sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="skeleton h-6 w-24" />
          <ul className="grid gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <li key={i} className="card overflow-hidden">
                <div className="skeleton aspect-[16/9] w-full rounded-none" />
                <div className="flex items-center justify-between px-4 pb-3 pt-4">
                  <div className="skeleton h-4 w-28" />
                  <div className="skeleton h-3 w-16" />
                </div>
                <div className="px-4 pb-4">
                  <div className="skeleton h-10 w-full" />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <aside className="space-y-6">
          <div className="card space-y-3 p-5">
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
          <div className="card space-y-3 p-5">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-9 w-full" />
          </div>
        </aside>
      </div>
    </div>
  );
}
