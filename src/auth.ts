import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { passwordMatches } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize(credentials) {
        const email = String(credentials.email ?? "").trim().toLowerCase();
        const password = String(credentials.password ?? "");
        const expectedEmail = process.env.DASHBOARD_EMAIL?.trim().toLowerCase() ?? "";
        const expectedPassword = process.env.DASHBOARD_PASSWORD ?? "";
        if (!email.endsWith("@taxgpt.com") || email !== expectedEmail) return null;
        if (!passwordMatches(password, expectedPassword)) return null;
        return { id: email, email, name: email };
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
});
