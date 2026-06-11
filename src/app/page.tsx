import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInButton } from "@/components/auth-buttons";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/trips");

  return (
    <main className="flex flex-1 items-center justify-center bg-surface px-4 py-16">
      <div className="w-full max-w-md text-center">
        <Image
          src="/brand/icon.png"
          alt="StayRank"
          width={120}
          height={120}
          priority
          className="mx-auto mb-6 h-28 w-28 rounded-3xl shadow-lg ring-1 ring-black/5"
        />
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-gradient-brand">StayRank</span>
        </h1>
        <p className="mt-3 text-base text-muted">
          Plan a trip with friends. Everyone ranks their top 3 places to stay,
          adds a note on why, and StayRank surfaces the one you all agree on.
        </p>
        <div className="mt-8 flex justify-center">
          <SignInButton />
        </div>
        <p className="mt-4 text-xs text-slate-400">
          No spreadsheets. No group-chat chaos.
        </p>
      </div>
    </main>
  );
}
