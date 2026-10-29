import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    username: string;
    fullname: string | null;
    role: string;
  }
  interface Session {
    user: {
      id: string;
      username: string;
      fullname: string | null;
      email: string | null;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    user: { username: string; fullname: string | null; role: string };
  }
}
