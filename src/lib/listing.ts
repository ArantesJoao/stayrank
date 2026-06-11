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
