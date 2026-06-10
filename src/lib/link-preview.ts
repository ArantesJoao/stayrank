// Link preview via Microlink — fetches a share image + title for a URL.
// Free tier (50/day) needs no key; MICROLINK_API_KEY raises limits if set.

export type LinkPreview = { imageUrl?: string; title?: string };

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  if (!/^https?:\/\//i.test(url)) return {};
  try {
    const api = new URL("https://api.microlink.io");
    api.searchParams.set("url", url);

    const headers: Record<string, string> = {};
    if (process.env.MICROLINK_API_KEY) {
      headers["x-api-key"] = process.env.MICROLINK_API_KEY;
    }

    const res = await fetch(api, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return {};
    const json = (await res.json()) as {
      status?: string;
      data?: { image?: { url?: string }; logo?: { url?: string }; title?: string };
    };
    if (json.status !== "success" || !json.data) return {};
    return {
      imageUrl: json.data.image?.url ?? json.data.logo?.url,
      title: json.data.title,
    };
  } catch {
    return {};
  }
}
