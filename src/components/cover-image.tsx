import Image from "next/image";

const UTM = "utm_source=StayRank&utm_medium=referral";
function withUtm(url: string) {
  return url.includes("?") ? `${url}&${UTM}` : `${url}?${UTM}`;
}

/**
 * Cover photo with a branded gradient fallback. When `creditUrl` is set (Unsplash),
 * shows the required "Photo by X" attribution overlay.
 */
export function CoverImage({
  src,
  alt,
  credit,
  creditUrl,
  sizes = "(max-width: 768px) 100vw, 768px",
  className = "",
  children,
}: {
  src?: string | null;
  alt: string;
  credit?: string | null;
  creditUrl?: string | null;
  sizes?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-blue/15 via-white to-brand-orange/15">
          <span className="text-3xl opacity-50" aria-hidden>
            🏞️
          </span>
        </div>
      )}

      {children}

      {src && credit && (
        <a
          href={creditUrl ? withUtm(creditUrl) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-1 right-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white/90 backdrop-blur-sm hover:text-white"
        >
          Photo: {credit}
        </a>
      )}
    </div>
  );
}
