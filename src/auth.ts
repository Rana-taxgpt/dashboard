import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      authorization: {
        params: {
          hd: "taxgpt.com",
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    signIn({ profile }) {
      const email = typeof profile?.email === "string" ? profile.email.toLowerCase() : "";
      return profile?.email_verified === true && email.endsWith("@taxgpt.com");
    },
  },
});
