import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth-buttons";

export async function SiteHeader() {
  const session = await auth();
  return (
    <header className="sticky top-0 z-10 border-b border-brand-blue/10 bg-white/80 shadow-[0_4px_16px_-8px_rgba(0,116,196,0.25)] backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3 sm:px-8">
        <Link href={session ? "/trips" : "/"} className="flex items-center">
          <Image
            src="/brand/logo-horizontal.png"
            alt="StayRank"
            width={139}
            height={40}
            priority
            className="h-8 w-auto"
          />
        </Link>
        {session?.user && (
          <div className="flex items-center gap-3">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="h-7 w-7 rounded-full"
              />
            )}
            <span className="hidden text-sm text-slate-600 sm:inline">
              {session.user.name}
            </span>
            <SignOutButton />
          </div>
        )}
      </div>
    </header>
  );
}
