/** Instant skeleton for the leaderboard/rank page while it streams in. */
export default function RankLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="skeleton h-3 w-24" />
        <div className="skeleton mt-2 h-7 w-48" />
      </div>
      <ol className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="card flex items-center gap-4 p-4">
            <div className="skeleton h-8 w-8 shrink-0 rounded-full" />
            <div className="skeleton h-16 w-16 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-3 w-1/4" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
