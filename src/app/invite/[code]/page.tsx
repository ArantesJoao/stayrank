import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { joinTrip } from "@/lib/actions";
import { SiteHeader } from "@/components/site-header";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await auth();
  const trip = await prisma.trip.findUnique({ where: { inviteCode: code } });

  if (!trip) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-16 text-center">
          <h1 className="text-lg font-semibold text-slate-900">
            Invite not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This invite link is invalid or has expired.
          </p>
        </main>
      </>
    );
  }

  // Signed in → join immediately and go to the trip.
  if (session?.user) {
    await joinTrip(code);
    redirect(`/trips/${trip.id}`);
  }

  // Not signed in → ask them to sign in, then come back here to auto-join.
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-16 text-center">
        <div className="mb-4 text-4xl">🏆</div>
        <h1 className="text-xl font-semibold text-slate-900">
          You&apos;re invited to “{trip.name}”
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in to join and start ranking places to stay.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: `/invite/${code}` });
          }}
          className="mt-6 flex justify-center"
        >
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Continue with Google
          </button>
        </form>
      </main>
    </>
  );
}
