import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() ?? "";
  if (!email.endsWith("@taxgpt.com")) redirect("/sign-in");
  return { email };
}
