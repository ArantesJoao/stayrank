/** Instant skeleton for a city page: cover hero, leaderboard CTA, and a few
 *  accommodation cards while the server component streams in. */
export default function CityLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="skeleton h-3 w-24" />
        <div className="card mt-2 overflow-hidden">
          <div className="skeleton aspect-[21/9] w-full rounded-none" />
          <div className="p-4">
            <div className="skeleton h-7 w-40" />
            <div className="skeleton mt-2 h-4 w-56" />
          </div>
        </div>
      </div>

      <div className="skeleton h-12 w-full rounded-xl" />

      <section className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card space-y-3 p-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-16 w-16 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-3 w-1/3" />
              </div>
            </div>
            <div className="skeleton h-3 w-full" />
          </div>
        ))}
      </section>
    </div>
  );
}
