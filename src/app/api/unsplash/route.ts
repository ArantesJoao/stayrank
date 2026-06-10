import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchPhotos } from "@/lib/unsplash";

// Proxies Unsplash search so the access key stays server-side. Auth-gated.
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ results: [] }, { status: 401 });
  }
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await searchPhotos(q);
  return NextResponse.json({ results });
}
