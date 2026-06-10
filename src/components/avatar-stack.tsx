type Person = { name: string | null; image: string | null };

/** Overlapping avatars for the travelers who suggested an accommodation. */
export function AvatarStack({
  people,
  size = 24,
}: {
  people: Person[];
  size?: number;
}) {
  const shown = people.slice(0, 5);
  const extra = people.length - shown.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((p, i) => {
          const initial = (p.name ?? "?").charAt(0).toUpperCase();
          return p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={p.image}
              alt={p.name ?? ""}
              title={p.name ?? ""}
              width={size}
              height={size}
              className="rounded-full ring-2 ring-white"
              style={{ width: size, height: size }}
            />
          ) : (
            <span
              key={i}
              title={p.name ?? ""}
              className="flex items-center justify-center rounded-full bg-slate-300 text-[10px] font-medium text-slate-700 ring-2 ring-white"
              style={{ width: size, height: size }}
            >
              {initial}
            </span>
          );
        })}
      </div>
      {extra > 0 && (
        <span className="ml-1 text-xs text-slate-400">+{extra}</span>
      )}
    </div>
  );
}
