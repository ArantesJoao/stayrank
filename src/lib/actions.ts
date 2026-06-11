"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { searchPhotos, triggerDownload } from "@/lib/unsplash";
import {
  isScrapableListingUrl,
  schedulePreviewBackfills,
} from "@/lib/accommodation-preview";
import { listingKey } from "@/lib/listing";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  return session.user.id;
}

function clampPartySize(raw: FormDataEntryValue | null) {
  const n = Math.round(Number(String(raw ?? "").trim()));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 100);
}

const ALLOWED_CURRENCIES = new Set([
  "USD", "EUR", "GBP", "BRL", "JPY", "CAD", "AUD", "CHF", "MXN", "INR",
]);

function normalizeCurrency(raw: FormDataEntryValue | null) {
  const code = String(raw ?? "").trim().toUpperCase();
  return ALLOWED_CURRENCIES.has(code) ? code : "USD";
}

async function assertMember(tripId: string, userId: string) {
  const member = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId } },
  });
  if (!member) redirect("/trips");
  return member;
}

export async function createTrip(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const partySize = clampPartySize(formData.get("partySize"));
  const currency = normalizeCurrency(formData.get("currency"));
  if (!name) return;

  const trip = await prisma.trip.create({
    data: {
      name,
      description: description || null,
      partySize,
      currency,
      inviteCode: nanoid(8),
      createdById: userId,
      members: { create: { userId, role: "ADMIN" } },
    },
  });
  redirect(`/trips/${trip.id}`);
}

export async function joinTrip(inviteCode: string) {
  const userId = await requireUserId();
  const trip = await prisma.trip.findUnique({ where: { inviteCode } });
  if (!trip) redirect("/trips");

  await prisma.tripMember.upsert({
    where: { tripId_userId: { tripId: trip.id, userId } },
    create: { tripId: trip.id, userId, role: "MEMBER" },
    update: {},
  });
  redirect(`/trips/${trip.id}`);
}

export async function updateTripSettings(tripId: string, formData: FormData) {
  const userId = await requireUserId();
  await assertMember(tripId, userId);
  const partySize = clampPartySize(formData.get("partySize"));
  const currency = normalizeCurrency(formData.get("currency"));
  await prisma.trip.update({
    where: { id: tripId },
    data: { partySize, currency },
  });
  revalidatePath(`/trips/${tripId}`, "layout");
}

export async function addCity(tripId: string, formData: FormData) {
  const userId = await requireUserId();
  await assertMember(tripId, userId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const count = await prisma.city.count({ where: { tripId } });
  const city = await prisma.city.create({
    data: { tripId, name, order: count },
  });

  // Auto cover from Unsplash by city name (best-effort).
  const [photo] = await searchPhotos(name, 1);
  if (photo) {
    await triggerDownload(photo.downloadLocation);
    await prisma.city.update({
      where: { id: city.id },
      data: {
        imageUrl: photo.regularUrl,
        imageCredit: photo.authorName,
        imageCreditUrl: photo.authorProfileUrl,
      },
    });
  }

  revalidatePath(`/trips/${tripId}`);
}

type SelectedPhoto = {
  url: string;
  credit?: string;
  creditUrl?: string;
  downloadLocation?: string;
};

export async function setTripImage(
  tripId: string,
  photo: SelectedPhoto | null,
) {
  const userId = await requireUserId();
  await assertMember(tripId, userId);
  if (photo?.downloadLocation) await triggerDownload(photo.downloadLocation);
  await prisma.trip.update({
    where: { id: tripId },
    data: {
      imageUrl: photo?.url ?? null,
      imageCredit: photo?.credit ?? null,
      imageCreditUrl: photo?.creditUrl ?? null,
    },
  });
  revalidatePath(`/trips/${tripId}`, "layout");
}

export async function setCityImage(
  cityId: string,
  photo: SelectedPhoto | null,
) {
  const userId = await requireUserId();
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) return;
  await assertMember(city.tripId, userId);
  if (photo?.downloadLocation) await triggerDownload(photo.downloadLocation);
  await prisma.city.update({
    where: { id: cityId },
    data: {
      imageUrl: photo?.url ?? null,
      imageCredit: photo?.credit ?? null,
      imageCreditUrl: photo?.creditUrl ?? null,
    },
  });
  revalidatePath(`/trips/${city.tripId}/cities/${cityId}`);
  revalidatePath(`/trips/${city.tripId}`);
}

export async function addAccommodation(cityId: string, formData: FormData) {
  const userId = await requireUserId();
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) return;
  await assertMember(city.tripId, userId);

  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  const priceRaw = String(formData.get("totalPrice") ?? "").trim();
  if (!name) return;
  const price = priceRaw ? Number(priceRaw) : null;
  const totalPrice =
    price != null && !Number.isNaN(price) && price >= 0 ? price : null;

  // Dedupe within the city: the same listing (matched on the normalized URL
  // identity, so different links to one place collapse) or the same name => one
  // card. We scan the city rather than rely solely on the stored key so older
  // rows (saved before URL-normalization) still match.
  const key = listingKey(url) ?? name.toLowerCase();
  const cityAccommodations = await prisma.accommodation.findMany({
    where: { cityId },
    select: {
      id: true,
      url: true,
      dedupeKey: true,
      totalPrice: true,
      previewImageUrl: true,
      previewStatus: true,
      previewAttemptedAt: true,
    },
  });
  const dedupeKey = key;
  const existing = cityAccommodations.find(
    (a) => (a.url && listingKey(a.url) === key) || a.dedupeKey === key,
  );

  // The accommodation that ends up needing a background image scrape (if any).
  let toBackfill: {
    id: string;
    url: string | null;
    previewImageUrl: string | null;
    previewStatus: string;
    previewAttemptedAt: Date | null;
  } | null = null;

  if (existing) {
    // Already suggested — record this traveler as a contributor (with their
    // note), and (re)open the preview scrape if it's still missing an image.
    const resolvedUrl = existing.url ?? (url || null);
    const reopenPreview =
      isScrapableListingUrl(resolvedUrl) && !existing.previewImageUrl;

    const [, updated] = await prisma.$transaction([
      prisma.accommodationContributor.upsert({
        where: {
          accommodationId_userId: { accommodationId: existing.id, userId },
        },
        create: { accommodationId: existing.id, userId, note, isAuthor: true },
        // Re-adding promotes a note-only contributor to a co-author.
        update: { isAuthor: true, ...(note ? { note } : {}) },
      }),
      prisma.accommodation.update({
        where: { id: existing.id },
        data: {
          url: resolvedUrl,
          totalPrice: existing.totalPrice ?? totalPrice,
          // Reset to PENDING so the scrape runs again for a newly-added link.
          ...(reopenPreview
            ? { previewStatus: "PENDING", previewAttemptedAt: null }
            : {}),
        },
      }),
    ]);
    if (reopenPreview) toBackfill = updated;
  } else {
    // New accommodation — the image is scraped in the background (see below).
    toBackfill = await prisma.accommodation.create({
      data: {
        cityId,
        name,
        url: url || null,
        totalPrice,
        // Only Booking/Airbnb links are scraped; anything else is left DONE
        // so the background job never picks it up.
        previewStatus: isScrapableListingUrl(url) ? "PENDING" : "DONE",
        dedupeKey,
        addedById: userId,
        contributors: { create: { userId, note, isAuthor: true } },
      },
    });
  }

  // Kick off the scrape now (runs after the response via after()); if it's lost
  // to a restart, the city page re-triggers it on the next view.
  if (toBackfill) schedulePreviewBackfills([toBackfill]);

  revalidatePath(`/trips/${city.tripId}/cities/${cityId}`);
}

/** Add or edit the current user's note on an accommodation (makes them a contributor). */
export async function setMyNote(accommodationId: string, formData: FormData) {
  const userId = await requireUserId();
  const acc = await prisma.accommodation.findUnique({
    where: { id: accommodationId },
    include: { city: true },
  });
  if (!acc) return;
  await assertMember(acc.city.tripId, userId);

  const note = String(formData.get("note") ?? "").trim() || null;
  await prisma.accommodationContributor.upsert({
    where: { accommodationId_userId: { accommodationId, userId } },
    create: { accommodationId, userId, note },
    update: { note },
  });
  revalidatePath(`/trips/${acc.city.tripId}/cities/${acc.cityId}`);
}

export async function deleteAccommodation(accommodationId: string) {
  const userId = await requireUserId();
  const acc = await prisma.accommodation.findUnique({
    where: { id: accommodationId },
    include: { city: true },
  });
  if (!acc) return;
  const member = await assertMember(acc.city.tripId, userId);
  // Only trip admins may delete an accommodation.
  if (member.role !== "ADMIN") return;
  await prisma.accommodation.delete({ where: { id: accommodationId } });
  revalidatePath(`/trips/${acc.city.tripId}/cities/${acc.cityId}`);
}

/**
 * Save the current user's top-3 for a city. `picks` is an ordered list of
 * accommodation ids (slot 1, 2, 3); empty slots are allowed.
 */
export async function saveRankings(cityId: string, picks: (string | null)[]) {
  const userId = await requireUserId();
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) return;
  await assertMember(city.tripId, userId);

  await prisma.$transaction(async (tx) => {
    await tx.ranking.deleteMany({ where: { cityId, userId } });
    const rows = picks
      .map((accId, i) => ({ accId, rank: i + 1 }))
      .filter((p): p is { accId: string; rank: number } => Boolean(p.accId));

    for (const { accId, rank } of rows) {
      await tx.ranking.create({
        data: { cityId, userId, accommodationId: accId, rank },
      });
    }
  });

  revalidatePath(`/trips/${city.tripId}/cities/${cityId}`);
}
