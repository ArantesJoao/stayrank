// Diagnose why Airbnb returns a generic og:image.
//   node scripts/test-airbnb.mjs
import { readFileSync } from "node:fs";
try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}
const KEY = process.env.SCRAPERAPI_KEY;

const URL_ROOM =
  "https://www.airbnb.com.br/rooms/37576592?adults=4&check_in=2026-10-13&check_out=2026-10-18&photo_id=984521158";

function metaAll(html, key) {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${esc}["']`,
    "gi",
  );
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[1] ?? m[2]);
  return out;
}
function tag(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}
function ldImages(html) {
  const out = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const j = JSON.parse(m[1].trim());
      const walk = (o) => {
        if (!o) return;
        if (typeof o === "string") return;
        if (Array.isArray(o)) return o.forEach(walk);
        if (o.image) out.push(typeof o.image === "string" ? o.image : JSON.stringify(o.image).slice(0, 90));
        for (const v of Object.values(o)) if (typeof v === "object") walk(v);
      };
      walk(j);
    } catch {}
  }
  return out;
}
// Airbnb hero photos look like .../im/pictures/... or /miso/Hosting-<id>/...
function firstListingPhoto(html) {
  const m = html.match(/https:\/\/a0\.muscache\.com\/im\/(?:pictures|miso)\/[^\s"'\\]+\.(?:jpg|jpeg|webp)/i);
  return m ? m[0] : null;
}

async function get(url, { render } = {}) {
  const ep = new URL("https://api.scraperapi.com/");
  ep.searchParams.set("api_key", KEY);
  ep.searchParams.set("url", url);
  if (render) ep.searchParams.set("render", "true");
  const res = await fetch(ep, { signal: AbortSignal.timeout(90000) });
  const html = await res.text();
  return { status: res.status, bytes: html.length, html };
}

for (const render of [false, true]) {
  console.log(`\n========== render=${render} ==========`);
  try {
    const { status, bytes, html } = await get(URL_ROOM, { render });
    console.log("HTTP", status, `${bytes}B`);
    console.log("<title>      :", tag(html, /<title[^>]*>([^<]*)<\/title>/i));
    console.log("og:title     :", metaAll(html, "og:title")[0] ?? "(none)");
    console.log("og:image (all):", metaAll(html, "og:image"));
    console.log("twitter:image:", metaAll(html, "twitter:image"));
    console.log("ld+json image:", ldImages(html).slice(0, 3));
    console.log("1st muscache :", firstListingPhoto(html));
  } catch (e) {
    console.log("ERROR", e.message);
  }
}
