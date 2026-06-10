import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";

export default async function TripsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
