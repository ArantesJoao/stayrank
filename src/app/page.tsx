import Image from "next/image";
import { redirect } from "next/navigation";
import {
  Check,
  Link2,
  Medal,
  MessageSquare,
  Trophy,
  Wallet,
} from "lucide-react";
import { auth } from "@/auth";
import { SignInButton } from "@/components/auth-buttons";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/trips");

  return (
    <main className="flex-1">
      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Image
          src="/brand/logo-horizontal.png"
          alt="StayRank"
          width={139}
          height={40}
          priority
          className="h-8 w-auto"
        />
        <SignInButton className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-slate-400 hover:shadow" />
      </header>

      {/* Hero: copy left, product preview right */}
      <section className="relative overflow-hidden">
        {/* Soft brand blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-10%] h-96 w-96 rounded-full bg-brand-blue/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-96 w-96 rounded-full bg-brand-orange/10 blur-3xl"
        />

        <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 py-12 sm:py-16 lg:grid-cols-2 lg:py-20">
          {/* Copy */}
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
              <Trophy aria-hidden className="h-3.5 w-3.5 text-amber-500" />
              Made for group trips
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Find the stay{" "}
              <span className="text-gradient-brand">everyone agrees on.</span>
            </h1>
            <p className="mt-4 text-lg text-muted">
              Drop in the Airbnb and Booking places you&apos;re thinking about,
              let everyone rank their favorites, and you&apos;ll see which one
              the group actually wants to book.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3">
              <SignInButton />
              <p className="text-xs text-slate-400">
                It&apos;s free, and you can sign in with Google in a couple of
                seconds.
              </p>
            </div>
          </div>

          {/* Product preview (mock leaderboard) */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="card rotate-1 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted">
                    Amsterdam · Leaderboard
                  </p>
                  <p className="text-lg font-bold tracking-tight">
                    Where you&apos;re staying
                  </p>
                </div>
                <Trophy aria-hidden className="h-5 w-5 text-amber-500" />
              </div>

              <ol className="mt-4 space-y-2">
                {[
                  {
                    name: "Cosy Canal Apartment",
                    pts: "8 pts",
                    votes: "3 votes",
                    medal: "text-yellow-500",
                    win: true,
                  },
                  {
                    name: "easyHotel Centre",
                    pts: "5 pts",
                    votes: "2 votes",
                    medal: "text-slate-400",
                  },
                  {
                    name: "Loft by the Park",
                    pts: "3 pts",
                    votes: "2 votes",
                    medal: "text-amber-700",
                  },
                ].map((e) => (
                  <li
                    key={e.name}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                      e.win
                        ? "border-brand-blue/40 bg-brand-blue/5"
                        : "border-hairline"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Medal
                        aria-hidden
                        className={`h-5 w-5 shrink-0 ${e.medal}`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {e.name}
                        </p>
                        <p className="text-xs text-slate-400">{e.votes}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-slate-900">
                      {e.pts}
                    </span>
                  </li>
                ))}
              </ol>

              {/* Voters */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[
                    ["E", "bg-brand-blue"],
                    ["L", "bg-brand-orange"],
                    ["S", "bg-slate-700"],
                  ].map(([initial, bg]) => (
                    <span
                      key={initial}
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${bg} text-[10px] font-semibold text-white ring-2 ring-white`}
                    >
                      {initial}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400">3 of 3 ranked</p>
              </div>
            </div>

            {/* Floating note chip */}
            <div className="card absolute -bottom-6 -left-2 max-w-[240px] -rotate-2 p-3 shadow-lg sm:-left-8">
              <p className="text-xs">
                <span className="font-semibold text-slate-900">Lucas:</span>{" "}
                <span className="text-slate-600">
                  Love the kitchen and the canal view.
                </span>
              </p>
            </div>

            {/* Floating ranked toast */}
            <div className="card absolute -top-5 right-0 flex rotate-2 items-center gap-1.5 p-2.5 shadow-lg sm:-right-4">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                <Check aria-hidden className="h-3 w-3 text-white" />
              </span>
              <p className="text-xs font-medium text-slate-700">
                Emma ranked her top 3
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          How it works
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Link2,
              step: "1",
              title: "Add the places",
              body: "Paste in Airbnb or Booking links and the photos and prices come along with them.",
            },
            {
              icon: Medal,
              step: "2",
              title: "Everyone ranks their favorites",
              body: "Each person picks their top three and writes a quick note on why. First place is worth three points, second is two, and third is one.",
            },
            {
              icon: Trophy,
              step: "3",
              title: "See what the group wants",
              body: "The points add up so the favorite sits right at the top, and you can stop going in circles in the chat.",
            },
          ].map((s) => (
            <div key={s.step} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue/10">
                  <s.icon aria-hidden className="h-5 w-5 text-brand-blue" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Step {s.step}
                </span>
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature trio */}
      <section className="border-t border-hairline bg-surface">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-12 sm:grid-cols-3 sm:py-16">
          {[
            {
              icon: MessageSquare,
              title: "Notes from everyone",
              body: "People can leave a note on why they like a place, so you get the reasoning behind the votes.",
            },
            {
              icon: Wallet,
              title: "Costs split for you",
              body: "Set how many people are going once, and every price shows what each person pays in your currency.",
            },
            {
              icon: Trophy,
              title: "A score that feels fair",
              body: "The points are simple and out in the open, so nobody thinks the result was fixed.",
            },
          ].map((f) => (
            <div key={f.title}>
              <f.icon aria-hidden className="h-5 w-5 text-brand-blue" />
              <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:py-20">
        <div className="card relative overflow-hidden p-8 text-center sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-blue/10 via-transparent to-brand-orange/10"
          />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Sort out your next trip
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted">
              Create a trip, send your friends the link, and get everyone&apos;s
              picks in one place.
            </p>
            <div className="mt-6 flex justify-center">
              <SignInButton />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-hairline">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
          <Image
            src="/brand/title-only.png"
            alt="StayRank"
            width={84}
            height={20}
            className="h-5 w-auto"
          />
          <p className="text-xs text-slate-400">
            Made for friends who can never pick a place.
          </p>
        </div>
      </footer>
    </main>
  );
}
