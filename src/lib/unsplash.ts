// Unsplash integration — follows the API guidelines:
// hotlink urls, trigger download on selection, attribute with UTM, key server-side.
// https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UTM = "utm_source=StayRank&utm_medium=referral";

export type UnsplashPhoto = {
  id: string;
  thumbUrl: string;
  regularUrl: string;
  authorName: string;
  authorProfileUrl: string;
  downloadLocation: string;
};

export function unsplashEnabled() {
  return Boolean(ACCESS_KEY);
}

/** Append the required UTM params to a photographer/Unsplash link. */
export function withUtm(url: string) {
  return url.includes("?") ? `${url}&${UTM}` : `${url}?${UTM}`;
}

export async function searchPhotos(
  query: string,
  perPage = 24,
): Promise<UnsplashPhoto[]> {
  if (!ACCESS_KEY || !query.trim()) return [];
  try {
    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("content_filter", "high");
    url.searchParams.set("orientation", "landscape");

    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: unknown[] };
    return (data.results ?? []).map(mapPhoto).filter(Boolean) as UnsplashPhoto[];
  } catch {
    return [];
  }
}

/** Required by guidelines: ping the download endpoint when a photo is selected. */
export async function triggerDownload(downloadLocation: string): Promise<void> {
  if (!ACCESS_KEY || !downloadLocation) return;
  try {
    await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* non-fatal */
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapPhoto(p: any): UnsplashPhoto | null {
  if (!p?.id || !p?.urls?.regular) return null;
  return {
    id: p.id,
    thumbUrl: p.urls.thumb,
    regularUrl: p.urls.regular,
    authorName: p.user?.name ?? "Unknown",
    authorProfileUrl: p.user?.links?.html ?? "https://unsplash.com",
    downloadLocation: p.links?.download_location ?? "",
  };
}
