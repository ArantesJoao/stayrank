import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { joinTrip } from "@/lib/actions";
import { SignInButton } from "@/components/auth-buttons";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await auth();
  const trip = await prisma.trip.findUnique({ where: { inviteCode: code } });

  // Signed in → join immediately and go to the trip.
  if (trip && session?.user) {
    await joinTrip(code);
    redirect(`/trips/${trip.id}`);
  }

  return (
    <main className="flex-1">
      {/* Top bar — matches the landing page */}
      <header className="mx-auto flex w-full max-w-5xl items-center px-4 py-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/logo-horizontal.png"
            alt="StayRank"
            width={139}
            height={40}
            priority
            className="h-8 w-auto"
          />
        </Link>
      </header>

      {/* Hero — same brand blobs + gradient language as the landing page */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-10%] h-96 w-96 rounded-full bg-brand-blue/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-96 w-96 rounded-full bg-brand-orange/10 blur-3xl"
        />

        <div className="relative mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-16 text-center">
          <Image
            src="/brand/icon.png"
            alt="StayRank"
            width={120}
            height={120}
            priority
            className="mb-10 h-24 w-24"
          />

          {trip ? (
            <>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
                <Users aria-hidden className="h-3.5 w-3.5 text-brand-blue" />
                You&apos;re invited
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Join <span className="text-gradient-brand">{trip.name}</span>
              </h1>
              <p className="mt-3 text-muted">
                Sign in to join and start ranking places to stay with the group.
              </p>
              <div className="mt-8">
                <SignInButton redirectTo={`/invite/${code}`} />
              </div>
              <p className="mt-3 text-xs text-slate-400">
                It&apos;s free, and you can sign in with Google in a couple of
                seconds.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Invite not found
              </h1>
              <p className="mt-3 text-muted">
                This invite link is invalid or has expired.
              </p>
              <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-slate-400"
              >
                Go to StayRank
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
