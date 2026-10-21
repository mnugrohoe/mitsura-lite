import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { authConfig } from "./auth.config";
import { loginSchema, User } from "@/lib/definitions";

// TEMP for learning. Replace with a DB query later.
// Make a hash once with: await bcrypt.hash("secret123", 10)
const users: User[] = [
  {
    id: "1",
    username: "admin",
    password: "$2b$10$LScNBEz4msrS5CFSM/ZzqunoC1bG00tc01WHz9KFg3TjI/NZZDl9e",
  },
];

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;
        const user = users.find((u) => u.username === username);
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password);
        return ok ? { id: user.id, name: user.username } : null;
      },
    }),
  ],
});
