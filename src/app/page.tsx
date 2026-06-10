import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInButton } from "@/components/auth-buttons";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/trips");

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <Image
          src="/brand/icon.png"
          alt="StayRank"
          width={112}
          height={112}
          priority
          className="mx-auto mb-5 h-28 w-28 rounded-2xl shadow-sm"
        />
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          StayRank
        </h1>
        <p className="mt-3 text-slate-600">
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
