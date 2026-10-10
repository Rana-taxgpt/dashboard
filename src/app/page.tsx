import { Dashboard } from "@/components/dashboard";
import { loadDashboard } from "@/lib/dashboard";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const data = await loadDashboard();
  return <Dashboard data={data} email={user.email} error={params.error} />;
}
