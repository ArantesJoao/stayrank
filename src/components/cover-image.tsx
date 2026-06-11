import Image from "next/image";
import { ImageIcon, Loader2 } from "lucide-react";

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
  loading = false,
  children,
}: {
  src?: string | null;
  alt: string;
  credit?: string | null;
  creditUrl?: string | null;
  sizes?: string;
  className?: string;
  /** When there's no image yet but one is being fetched, show a spinner. */
  loading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-blue/15 via-white to-brand-orange/15">
          {loading ? (
            <Loader2
              aria-label="Finding a photo…"
              className="h-8 w-8 animate-spin text-slate-400/60"
              strokeWidth={1.5}
            />
          ) : (
            <ImageIcon
              aria-hidden
              className="h-10 w-10 text-slate-400/60"
              strokeWidth={1.5}
            />
          )}
        </div>
      )}

      {children}

      {src && credit && (
        <a
          href={creditUrl ? withUtm(creditUrl) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-1 right-1 z-20 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white/90 backdrop-blur-sm hover:text-white"
        >
          Photo: {credit}
        </a>
      )}
    </div>
  );
}
