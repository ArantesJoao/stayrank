import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Scrapes an accommodation link's og:image via ScraperAPI (which proxies
// bot-protected hosts like Booking/Airbnb that Microlink's free tier can't
// reach), stores it, and never fetches again once DONE.

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY;

/**
 * Only scrape hosts we know carry a useful og:image — Booking and Airbnb
 * (across their country TLDs, e.g. booking.com, airbnb.com.br). Anything else
 * is skipped so we never spend a ScraperAPI credit on an unsupported link.
 */
export function isScrapableListingUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const host = new URL(raw).hostname.toLowerCase();
    return (
      /(^|\.)booking\.[a-z.]+$/.test(host) ||
      /(^|\.)airbnb\.[a-z.]+$/.test(host)
    );
  } catch {
    return false;
  }
}

// While not DONE, a preview is re-attempted on view — but at most once per
// window, so a listing with no og:image (or a lost attempt) doesn't burn a
// ScraperAPI credit on every page load.
const RETRY_COOLDOWN_MS = 2 * 60 * 1000;

type PreviewCandidate = {
  id: string;
  url: string | null;
  previewImageUrl: string | null;
  previewStatus: string;
  previewAttemptedAt: Date | null;
};

/** True when this accommodation still needs an image and isn't in cooldown. */
function needsPreview(a: PreviewCandidate, now: number): boolean {
  if (a.previewImageUrl || a.previewStatus === "DONE") return false;
  if (!isScrapableListingUrl(a.url)) return false;
  if (!a.previewAttemptedAt) return true;
  return now - a.previewAttemptedAt.getTime() > RETRY_COOLDOWN_MS;
}

/**
 * Schedule background preview scrapes for any eligible accommodations. The work
 * runs via `after()` — i.e. after the response is flushed — so on Vercel the
 * function is kept alive (waitUntil) to finish even if the user closes the tab.
 * Call this from any server render that lists accommodations, not just on
 * creation; a scrape lost to a restart simply gets picked up on the next view.
 */
export function schedulePreviewBackfills(items: PreviewCandidate[]): void {
  if (!SCRAPERAPI_KEY) return;
  const now = Date.now();
  const ids = items.filter((a) => needsPreview(a, now)).map((a) => a.id);
  if (ids.length === 0) return;
  after(async () => {
    for (const id of ids) await backfillPreview(id);
  });
}

/**
 * Claim, scrape, and persist one accommodation's preview image. Safe to call
 * concurrently: an atomic conditional update claims the row so only one worker
 * proceeds per cooldown window.
 */
export async function backfillPreview(id: string): Promise<void> {
  if (!SCRAPERAPI_KEY) return;

  const cutoff = new Date(Date.now() - RETRY_COOLDOWN_MS);
  const claim = await prisma.accommodation.updateMany({
    where: {
      id,
      url: { not: null },
      previewImageUrl: null,
      previewStatus: { not: "DONE" },
      OR: [{ previewAttemptedAt: null }, { previewAttemptedAt: { lt: cutoff } }],
    },
    data: { previewAttemptedAt: new Date() },
  });
  if (claim.count === 0) return; // already claimed elsewhere, or no longer needed

  const acc = await prisma.accommodation.findUnique({
    where: { id },
    include: { city: { select: { tripId: true } } },
  });
  if (!acc?.url) return;
  if (!isScrapableListingUrl(acc.url)) {
    // Unsupported host — stop here so it's never re-attempted.
    await prisma.accommodation.update({
      where: { id },
      data: { previewStatus: "DONE" },
    });
    return;
  }

  const scraped = await scrapeOpenGraph(acc.url);

  // Transient failure (ScraperAPI 500, timeout, rate-limit, blocked variant):
  // leave the row PENDING so it's retried on the next view, rather than marking
  // it FAILED — the listing itself is fine, the proxy just hiccuped.
  if (!scraped.ok) return;

  await prisma.accommodation.update({
    where: { id },
    data: scraped.imageUrl
      ? {
          previewImageUrl: scraped.imageUrl,
          previewTitle: acc.previewTitle ?? scraped.title ?? null,
          previewDescription: acc.previewDescription ?? scraped.description ?? null,
          previewFetchedAt: new Date(),
          previewStatus: "DONE",
        }
      : // The page loaded but genuinely has no image — stop retrying.
        { previewStatus: "FAILED" },
  });

  if (scraped.imageUrl) {
    // Surface the freshly-stored image on the next render.
    revalidatePath(`/trips/${acc.city.tripId}/cities/${acc.cityId}`);
    revalidatePath(`/trips/${acc.city.tripId}`);
  }
}

// `ok: false` = transient error (retry later); `ok: true` = we got a real
// response, whose `imageUrl` may still be absent (genuinely no image).
type Scraped =
  | { ok: false }
  | { ok: true; imageUrl?: string; title?: string; description?: string };

/**
 * Booking's anti-bot only yields its og:image when JS is rendered, so we ask
 * ScraperAPI to render that host (slower, costs more credits). Airbnb returns
 * og:image in the raw HTML, so a plain request is enough.
 */
function needsRender(targetUrl: string): boolean {
  try {
    return /(^|\.)booking\.[a-z.]+$/.test(new URL(targetUrl).hostname);
  } catch {
    return false;
  }
}

function isAirbnb(targetUrl: string): boolean {
  try {
    return /(^|\.)airbnb\.[a-z.]+$/.test(new URL(targetUrl).hostname);
  } catch {
    return false;
  }
}

async function scrapeOpenGraph(targetUrl: string): Promise<Scraped> {
  if (!SCRAPERAPI_KEY) return { ok: false };
  try {
    const render = needsRender(targetUrl);
    const endpoint = new URL("https://api.scraperapi.com/");
    endpoint.searchParams.set("api_key", SCRAPERAPI_KEY);
    endpoint.searchParams.set("url", targetUrl);
    if (render) endpoint.searchParams.set("render", "true");

    const res = await fetch(endpoint, {
      // Rendered requests (Booking) can take ~60s; plain ones are far quicker.
      signal: AbortSignal.timeout(render ? 90_000 : 30_000),
    });
    if (!res.ok) return { ok: false }; // transient — retry later
    const html = await res.text();

    const ogImage = metaContent(html, "og:image") ?? metaContent(html, "twitter:image");
    const ogTitle = metaContent(html, "og:title");

    // Airbnb serves bots a generic og:image/title; the real listing photo and
    // name live in its JSON-LD. Prefer JSON-LD there, og: tags everywhere else.
    if (isAirbnb(targetUrl)) {
      const ld = parseJsonLdListing(html);
      return {
        ok: true,
        imageUrl: ld.image ?? ogImage,
        title: ld.name, // skip Airbnb's generic og:title (it's just alt text)
        description: metaContent(html, "og:description"),
      };
    }

    return {
      ok: true,
      imageUrl: ogImage,
      title: ogTitle,
      description: metaContent(html, "og:description"),
    };
  } catch {
    return { ok: false };
  }
}

/**
 * Pull the listing image + name from a page's JSON-LD. Returns the first
 * schema.org node that carries an `image`. Used for Airbnb, whose og: tags are
 * a generic fallback for non-JS clients.
 */
function parseJsonLdListing(html: string): { image?: string; name?: string } {
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    let data: unknown;
    try {
      data = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const node = findNodeWithImage(data);
    if (node) {
      return {
        image: firstImageUrl(node.image),
        name: typeof node.name === "string" ? node.name : undefined,
      };
    }
  }
  return {};
}

type LdNode = { image?: unknown; name?: unknown };

function findNodeWithImage(node: unknown): LdNode | undefined {
  if (!node || typeof node !== "object") return undefined;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findNodeWithImage(item);
      if (found) return found;
    }
    return undefined;
  }
  const obj = node as Record<string, unknown>;
  if (obj.image && firstImageUrl(obj.image)) return obj as LdNode;
  for (const v of Object.values(obj)) {
    const found = findNodeWithImage(v);
    if (found) return found;
  }
  return undefined;
}

function firstImageUrl(image: unknown): string | undefined {
  if (typeof image === "string") return image;
  if (Array.isArray(image)) {
    for (const item of image) {
      const url = firstImageUrl(item);
      if (url) return url;
    }
    return undefined;
  }
  if (image && typeof image === "object") {
    const url = (image as Record<string, unknown>).url;
    if (typeof url === "string") return url;
  }
  return undefined;
}

/** Pull a <meta property|name="..." content="..."> value (either attr order). */
function metaContent(html: string, key: string): string | undefined {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${esc}["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeEntities(m[1]);
  }
  return undefined;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
