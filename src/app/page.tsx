import { Dashboard } from "@/components/dashboard";
import { loadDashboard } from "@/lib/dashboard";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  const data = await loadDashboard();
  return <Dashboard data={data} email={user.email} />;
}
