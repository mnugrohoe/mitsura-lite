import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 60 },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      if (isOnLogin) {
        // logged in but opens /login → send to root
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      // every other page: no session → false → auto redirect to /login
      return isLoggedIn;
    },
    // runs at login (user exists) and on later requests (only token exists)
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    // shapes what auth() / useSession() return
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
