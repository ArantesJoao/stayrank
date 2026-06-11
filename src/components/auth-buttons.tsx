import { signIn, signOut } from "@/auth";

export function SignInButton({
  className,
  redirectTo = "/trips",
}: {
  className?: string;
  redirectTo?: string;
}) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo });
      }}
    >
      <button
        type="submit"
        className={
          className ??
          "btn-brand inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition"
        }
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white">
          <GoogleGlyph />
        </span>
        Continue with Google
      </button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="text-sm text-slate-500 transition hover:text-slate-900"
      >
        Sign out
      </button>
    </form>
  );
}

function GoogleGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.3 0-11.5-5.1-11.5-11.5S17.7 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.7 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5.2 0 9.9-2 13.5-5.2l-6.2-5.3c-2 1.5-4.6 2.5-7.3 2.5-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.3C41.4 36.1 43.5 30.6 43.5 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
