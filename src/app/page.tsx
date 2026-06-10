import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInButton } from "@/components/auth-buttons";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/trips");

  return (
    <main className="bg-brand-sky flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <Image
          src="/brand/icon.png"
          alt="StayRank"
          width={128}
          height={128}
          priority
          className="mx-auto mb-6 h-32 w-32 rounded-[28px] shadow-xl shadow-brand-blue/20 ring-1 ring-white/60"
        />
        <h1 className="text-4xl font-extrabold tracking-tight">
          <span className="text-gradient-brand">StayRank</span>
        </h1>
        <p className="mt-3 text-base text-slate-600">
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
