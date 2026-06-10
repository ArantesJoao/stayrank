import { prisma } from "@/lib/prisma";

export const RANK_POINTS: Record<number, number> = { 1: 3, 2: 2, 3: 1 };

/** Trips the user belongs to, with a quick city/member count. */
export function getUserTrips(userId: string) {
  return prisma.trip.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { cities: true, members: true } },
    },
  });
}

/** A trip with its cities and members — only if the user is a member. */
export async function getTripForUser(tripId: string, userId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, members: { some: { userId } } },
    include: {
      cities: {
        orderBy: { order: "asc" },
        include: { _count: { select: { accommodations: true } } },
      },
      members: { include: { user: true } },
    },
  });
  return trip;
}

export type CityWithResults = NonNullable<
  Awaited<ReturnType<typeof getCityForUser>>
>;

/** Full city view: accommodations, this user's rankings, and the leaderboard. */
export async function getCityForUser(cityId: string, userId: string) {
  const city = await prisma.city.findFirst({
    where: { id: cityId, trip: { members: { some: { userId } } } },
    include: {
      trip: { include: { _count: { select: { members: true } } } },
      accommodations: {
        orderBy: { createdAt: "asc" },
        include: {
          addedBy: true,
          contributors: { include: { user: true } },
        },
      },
      rankings: { include: { user: true } },
    },
  });
  if (!city) return null;

  // Aggregate leaderboard: sum of points per accommodation.
  const scores = new Map<string, { points: number; voters: Set<string> }>();
  for (const r of city.rankings) {
    const entry = scores.get(r.accommodationId) ?? {
      points: 0,
      voters: new Set<string>(),
    };
    entry.points += RANK_POINTS[r.rank] ?? 0;
    entry.voters.add(r.userId);
    scores.set(r.accommodationId, entry);
  }

  const leaderboard = city.accommodations
    .map((a) => ({
      accommodation: a,
      points: scores.get(a.id)?.points ?? 0,
      voteCount: scores.get(a.id)?.voters.size ?? 0,
    }))
    .sort((x, y) => y.points - x.points);

  const myRankings = city.rankings
    .filter((r) => r.userId === userId)
    .sort((a, b) => a.rank - b.rank);

  const votersWhoRanked = new Set(city.rankings.map((r) => r.userId)).size;

  return {
    ...city,
    leaderboard,
    myRankings,
    memberCount: city.trip._count.members,
    votersWhoRanked,
  };
}
