# 🏆 StayRank

Plan a trip with friends and agree on where to stay. Everyone ranks their **top 3**
accommodations per city, adds a note explaining why, and StayRank tallies the votes
into a leaderboard so you can see the option you all agree on the most.

## Features

- **Trips** — create a trip, invite friends with a shareable link
- **Cities** — group accommodations by city (e.g. Lisbon, Porto)
- **Accommodations** — add a name, link (Airbnb/Booking…) and price per night
- **Top-3 ranking** — each traveler picks 1st / 2nd / 3rd (3 / 2 / 1 pts) with a note
- **Leaderboard** — aggregate scores + everyone's notes, plus a "X of Y voted" status

## Tech

Next.js 16 (App Router) · Prisma 7 + Postgres (Neon) · Auth.js v5 (Google) · Tailwind v4

## Local setup

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL + AUTH_SECRET + Google creds
npx prisma migrate dev --name init   # create the schema in your Neon database
npm run dev                 # runs on http://localhost:3737
```

The dev server runs on a fixed non-default port (**3737**) so it won't clash with
other projects that use 3000.

### Database (Neon Postgres)

1. Create a project at https://neon.tech
2. **Connect → turn Connection pooling OFF** (direct connection, needed for migrations)
3. Copy the connection string into `.env` as `DATABASE_URL`

### Google OAuth

1. Create an OAuth client (Web) at https://console.cloud.google.com/apis/credentials
2. Add redirect URI `http://localhost:3737/api/auth/callback/google` (and your prod URL later)
3. On the OAuth consent screen, add yourself + friends as **Test users**
4. Put the client id/secret into `.env` as `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
5. Generate `AUTH_SECRET` with `npx auth secret`

## Deploying to Vercel

1. Push to GitHub, import the repo in Vercel
2. Set env vars (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`)
3. Add the production redirect URI in GCP: `https://YOUR_DOMAIN/api/auth/callback/google`
4. `prisma generate` runs automatically on install; run `prisma migrate deploy` for schema

## Roadmap ideas

- Fetch link previews (image/title) from accommodation URLs
- "Lock voting" toggle once everyone has ranked
- Per-accommodation comment threads
- Per-city budget summary
