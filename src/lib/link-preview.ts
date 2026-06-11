// Link preview via Microlink — fetches a share image + title for a URL.
// Free tier (50/day) needs no key; MICROLINK_API_KEY raises limits if set.

export type LinkPreview = {
  imageUrl?: string;
  title?: string;
  description?: string;
};

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  if (!/^https?:\/\//i.test(url)) return {};
  try {
    const key = process.env.MICROLINK_API_KEY;
    // Authenticated requests must use the pro endpoint; free uses the public one.
    const api = new URL(
      key ? "https://pro.microlink.io" : "https://api.microlink.io",
    );
    api.searchParams.set("url", url);

    const headers: Record<string, string> = {};
    if (key) headers["x-api-key"] = key;

    const res = await fetch(api, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return {};
    const json = (await res.json()) as {
      status?: string;
      data?: {
        image?: { url?: string };
        logo?: { url?: string };
        title?: string;
        description?: string;
      };
    };
    if (json.status !== "success" || !json.data) return {};
    return {
      imageUrl: json.data.image?.url ?? json.data.logo?.url,
      title: json.data.title,
      description: json.data.description,
    };
  } catch {
    return {};
  }
}

/**
 * Returns a link preview for `url`, reading from the local cache first and
 * only calling Microlink (and caching the result) on a miss. Successful
 * fetches are cached forever; misses are not cached, so they can retry later.
 */
export async function getCachedLinkPreview(url: string): Promise<LinkPreview> {
  // Imported lazily to keep this module usable without a DB in tests.
  const { prisma } = await import("@/lib/prisma");

  const cached = await prisma.linkPreviewCache.findUnique({ where: { url } });
  if (cached) {
    return {
      imageUrl: cached.imageUrl ?? undefined,
      title: cached.title ?? undefined,
      description: cached.description ?? undefined,
    };
  }

  const preview = await fetchLinkPreview(url);
  if (preview.imageUrl || preview.title) {
    await prisma.linkPreviewCache.upsert({
      where: { url },
      create: {
        url,
        imageUrl: preview.imageUrl ?? null,
        title: preview.title ?? null,
        description: preview.description ?? null,
      },
      update: {},
    });
  }
  return preview;
}
