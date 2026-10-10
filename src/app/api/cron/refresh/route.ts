import { auth } from "@/auth";
import { refreshAds } from "@/lib/refresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function safeMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Refresh failed";
  return message.replace(/access_token=[^&\s"']+/gi, "access_token=redacted").slice(0, 180);
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  const cron = Boolean(secret && header === `Bearer ${secret}`);
  let user = false;
  if (!cron && request.method === "POST") {
    const session = await auth();
    const email = session?.user?.email?.toLowerCase() ?? "";
    user = email.endsWith("@taxgpt.com");
  }
  if (!cron && !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await refreshAds();
    if (user) return Response.redirect(new URL("/", request.url), 303);
    return Response.json(result);
  } catch (error) {
    const message = safeMessage(error);
    if (user) {
      const url = new URL("/", request.url);
      url.searchParams.set("error", message);
      return Response.redirect(url, 303);
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
