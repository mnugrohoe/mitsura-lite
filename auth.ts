import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { loginSchema } from "@/lib/definitions";
import {
  getUserByUsername,
  recordFailedLogin,
  resetFailedLogin,
} from "./features/user/queries";
import { verifyPassword } from "./lib/password";
import { UserRecord } from "./features/user/definitions";

// TEMP for learning. Replace with a DB query later.
// Make a hash once with: await bcrypt.hash("secret123", 10)
// const users: User[] = [
//   {
//     id: "1",
//     username: "admin",
//     password: "f572daf95bf1df4fad551bb858ad29228df957b0",
//   },
// ];

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;
        const user: UserRecord | null = await getUserByUsername(username);
        if (!user) return null;
        if (user.locked) return null;

        if (!verifyPassword(password, user.passwordHash)) {
          await recordFailedLogin(user.id);
          return null;
        }

        if (user.failedAttempts > 0) await resetFailedLogin(user.id);

        return {
          id: user.id,
          username: user.username,
          fullname: user.fullName,
          email: user.email,
          role: user.roleName?.trim() ?? "CUSTOM",
        };
      },
    }),
  ],
});
