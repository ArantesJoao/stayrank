# StayRank — System Overview

## What it is

A collaborative trip-planning web app for groups. A trip has cities; each city
collects candidate **accommodations** (Airbnb / Booking links, etc.); every
traveler privately ranks their **top 3** per city, and the app aggregates votes
into a **leaderboard** so the group can settle on where to stay. Costs can be
split across the party (per-person pricing).

## Stack

- **Next.js** (App Router, React server components) + **TypeScript**.
- **Tailwind CSS v4** — CSS-first `@theme`, no `tailwind.config`.
- **Prisma** ORM over **Postgres** (`@prisma/adapter-pg`).
- **NextAuth** with **Google** as the only provider, Prisma adapter,
  **database** session strategy.
- **lucide-react** for all icons (the standardized icon system — no emojis).
- **Server Actions** in `src/lib/actions.ts` drive all mutations.
- External integrations:
  - **Unsplash** — cover photos; access key stays server-side, images are
    hotlinked and attributed per their API guidelines.
  - **Microlink** — link previews for accommodation URLs, cached in a DB table.
- PWA bits: `manifest.ts`, a service worker, OpenGraph / Twitter image routes.

## Data model (Prisma)

```
User ── TripMember (role ADMIN | MEMBER) ── Trip ── City ── Accommodation
                                                              ├── AccommodationContributor (per-user notes)
                                                              └── Ranking (per-user, per-city, rank 1–3)
```

- **Trip** — `partySize`, `currency`, unique `inviteCode`, cover image fields.
- **City** — ordered within a trip, own image fields.
- **Accommodation** — `url`, `totalPrice`, link-preview fields, `dedupeKey`.
- Plus NextAuth tables (`Account`, `Session`, `VerificationToken`) and a
  `LinkPreviewCache`.

## Pages

### Landing — `/` (`app/page.tsx`)

Public entry point. If the visitor is already signed in, it redirects straight
to `/trips`. Otherwise it shows the brand icon, the gradient **StayRank**
wordmark, the value-prop tagline ("Everyone ranks their top 3 places to stay,
adds a note on why…"), a **Sign in with Google** button, and the line
"No spreadsheets. No group-chat chaos."

### Trips list — `/trips` (`app/trips/page.tsx`)

The signed-in home. **"Your trips"** renders as a responsive grid of cards —
each card shows the trip's cover photo (or the gradient + icon placeholder),
name, a `N travelers · M cities` count, and the optional description; the whole
card links into the trip. Empty state when you have no trips yet. Below the
grid, a **New trip** form creates a trip with name, optional description,
**Currency**, and **Party size**.

### Trip page — `/trips/[id]` (`app/trips/[id]/page.tsx`)

The hub for one trip:

- **Cover hero** with the Unsplash **ImagePicker** (add / change / remove the
  cover), plus an "All trips" back link.
- **Travelers** — a list of member pills; the trip owner carries an `ADMIN`
  badge.
- **Settings** — inline form to update **Currency** and **Party size**.
- **Invite link** — a copyable share link (the `InviteLink` component) that
  routes friends to `/invite/[code]`.
- **Cities** — list of the trip's cities with an add-city control; adding a city
  best-effort auto-fetches an Unsplash cover from the city name.

### City page — `/trips/[id]/cities/[cityId]` (`…/cities/[cityId]/page.tsx`)

Where the actual decision happens:

- **City cover + picker** and a stat line (number of options, how many
  travelers have ranked).
- **Accommodation cards** — each shows the link-preview image, name (linking out
  to the Airbnb/Booking URL), per-person price, an avatar stack of contributors,
  a remove action, **everyone's notes**, and an inline field to add/edit
  **your own note**.
- **Add an accommodation** — form for name, link, total price, and an optional
  note. Submitting fetches a cached link preview and de-dupes against existing
  entries (same link or name) so one place = one card.
- **Rank your top 3 & see results** — a collapsible section containing:
  - **RankingEditor** — three slots (1st/2nd/3rd, gold/silver/bronze medals),
    each a dropdown of accommodations; prevents picking the same place twice;
    saves your private ranking.
  - **Leaderboard** — accommodations sorted by aggregate points, with medals,
    vote counts, and totals.

### Invite — `/invite/[code]` (`app/invite/[code]/page.tsx`)

Resolves a trip by its invite code. Invalid/expired code → "Invite not found".
Signed in → joins the trip immediately and redirects to it. Not signed in →
shows an invite card ("You're invited to …") with **Continue with Google**,
returning to the same invite URL after auth so the join completes automatically.

### Shell

- **Root layout** (`app/layout.tsx`) — loads the **Poppins** font, sets
  SEO/OpenGraph/PWA metadata and theme color, and mounts the service worker.
- **Trips layout** (`app/trips/layout.tsx`) — auth gate (redirects to `/` if
  signed out) wrapping a centered `max-w-3xl` main column.
- **SiteHeader** — sticky, blurred header with the logo and, when signed in, the
  user's avatar, name, and a sign-out button.

## Feature summary

- **Auth & membership** — Google sign-in, database-backed sessions; users join
  trips via invite-code links, with `ADMIN` / `MEMBER` roles.
- **Hierarchy** — Trips → Cities → Accommodations, each with their own cover or
  preview imagery.
- **Ranked-choice voting** — private per-user top-3 ranking; points are
  `1st = 3, 2nd = 2, 3rd = 1`, summed per accommodation into a per-city
  leaderboard (ties broken by points, vote count = distinct voters).
- **Collaborative notes** — every traveler can attach a note to an
  accommodation; contributors render as an avatar stack.
- **Cost splitting** — per-person pricing derived from `totalPrice ÷ partySize`,
  formatted in the trip's chosen currency.
- **Imagery** — Unsplash cover search/picker with required attribution and
  hotlinking; Microlink link previews for accommodation URLs, cached in the DB.
- **De-duplication** — accommodations collapse by link (or name) within a city.
- **PWA** — installable manifest, service worker, and generated OpenGraph /
  Twitter share images.

## Colors & design system

Defined as CSS variables in `src/app/globals.css`. Light theme, Airbnb-ish and
clean — a solid brand color for actions, with the gradient reserved for the
wordmark only. Font is **Poppins**.

### Neutrals

| Token        | Hex       | Use                          |
| ------------ | --------- | ---------------------------- |
| `background` | `#ffffff` | page background              |
| `surface`    | `#f7f8fa` | subtle fills (chips, pills)  |
| `foreground` | `#222222` | primary text                 |
| `muted`      | `#6a6a6a` | secondary text               |
| `hairline`   | `#e6e6e6` | borders / card outlines      |

### Brand

| Token             | Hex       | Use                                  |
| ----------------- | --------- | ------------------------------------ |
| `brand-blue`      | `#00b0fc` | primary buttons, focus rings, accent |
| `brand-blue-dark` | `#0094d6` | button hover, gradient mid-stop      |
| `brand-orange`    | `#fd7642` | secondary accent, gradient end-stop  |

### Patterns

- `.btn-brand` — solid brand blue, darkens to `brand-blue-dark` on hover.
- `.text-gradient-brand` — `blue → blue-dark → orange` linear gradient, used
  only on the wordmark.
- `.card` — white, `1px` hairline border, `12px` radius; optional `.card-hover`
  lift on hover.
- **Cover placeholder** — `brand-blue/15 → white → brand-orange/15` gradient
  with a muted Lucide `ImageIcon`.
- **Leaderboard medals** — gold / silver / bronze tints (`yellow-500`,
  `slate-400`, `amber-700`).
