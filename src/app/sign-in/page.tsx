import { signIn } from "@/auth";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const googleReady = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET && process.env.AUTH_SECRET,
  );
  const denied = params.error === "AccessDenied";

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-[#6f6a62]">TaxGPT</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Ads</h1>
      <p className="mt-4 text-[#6f6a62]">
        Internal marketing numbers. Sign in with your TaxGPT Google account.
      </p>
      {denied ? (
        <p className="mt-4 text-sm text-[#9f2d2d]">Use an @taxgpt.com Google account.</p>
      ) : null}
      {googleReady ? (
        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            className="h-11 bg-[#1b1915] px-5 text-sm text-[#f7f4ee]"
            type="submit"
          >
            Sign in with Google
          </button>
        </form>
      ) : (
        <p className="mt-8 text-sm text-[#6f6a62]">
          Google sign-in is not configured yet. Add AUTH_SECRET, AUTH_GOOGLE_ID, and AUTH_GOOGLE_SECRET.
        </p>
      )}
    </main>
  );
}
