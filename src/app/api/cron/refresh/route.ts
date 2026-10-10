import { refreshAds } from "@/lib/refresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await refreshAds();
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refresh failed";
    return Response.json(
      { error: message.replace(/access_token=[^&\s"']+/gi, "access_token=redacted") },
      { status: 500 },
    );
  }
}

export const GET = run;
export const POST = run;
