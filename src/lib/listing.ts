// Identify which booking site an accommodation URL points at, so we can show
// its brand mark next to the listing.

export type ListingSource = {
  key: "airbnb" | "booking" | "other";
  label: string;
  host: string;
};

export function listingSource(
  url: string | null | undefined,
): ListingSource | null {
  if (!url) return null;
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
  if (host.includes("airbnb.")) return { key: "airbnb", label: "Airbnb", host };
  if (host.endsWith("booking.com")) {
    return { key: "booking", label: "Booking.com", host };
  }
  return { key: "other", label: host, host };
}

/** The site's own favicon (its logo mark), via Google's favicon service. */
export function faviconUrl(host: string, size = 64): string {
  return `https://www.google.com/s2/favicons?sz=${size}&domain=${host}`;
}

/**
 * A stable identity for a listing URL, used to dedupe within a city. Two links
 * that point at the same place — even with different query params, tracking,
 * locale, or www — collapse to the same key:
 *   airbnb.com/rooms/12345?foo=bar      -> "airbnb:room:12345"
 *   booking.com/hotel/pt/foo.en.html?x  -> "booking:foo"
 * Anything else falls back to host + path (query/hash/trailing-slash stripped).
 * Returns null for a missing/unparseable URL so callers can fall back to name.
 */
export function listingKey(url: string | null | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const path = parsed.pathname.toLowerCase();

  if (host.includes("airbnb.")) {
    const m = path.match(/\/rooms\/(?:plus\/)?(\d+)/);
    if (m) return `airbnb:room:${m[1]}`;
  }
  if (host.endsWith("booking.com")) {
    const m = path.match(/\/hotel\/[a-z]{2}\/([^/.]+)/);
    if (m) return `booking:${m[1]}`;
  }

  const cleanPath = path.replace(/\/+$/, "");
  return `${host}${cleanPath}`;
}
