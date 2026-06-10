"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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
  await prisma.city.create({ data: { tripId, name, order: count } });
  revalidatePath(`/trips/${tripId}`);
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

  // Dedupe within the city: same link (preferred) or same name => one card.
  const dedupeKey = (url || name).toLowerCase();

  const existing = await prisma.accommodation.findUnique({
    where: { cityId_dedupeKey: { cityId, dedupeKey } },
  });

  if (existing) {
    // Already suggested — record this traveler as a contributor (with their
    // note) and backfill any missing url/price.
    await prisma.$transaction([
      prisma.accommodationContributor.upsert({
        where: {
          accommodationId_userId: { accommodationId: existing.id, userId },
        },
        create: { accommodationId: existing.id, userId, note },
        update: note ? { note } : {},
      }),
      prisma.accommodation.update({
        where: { id: existing.id },
        data: {
          url: existing.url ?? (url || null),
          totalPrice: existing.totalPrice ?? totalPrice,
        },
      }),
    ]);
  } else {
    await prisma.accommodation.create({
      data: {
        cityId,
        name,
        url: url || null,
        totalPrice,
        dedupeKey,
        addedById: userId,
        contributors: { create: { userId, note } },
      },
    });
  }

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
  await assertMember(acc.city.tripId, userId);
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
