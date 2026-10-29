import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type UserRecord = {
  id: string;
  username: string;
  fullName: string | null;
  passwordHash: string | null;
  email: string | null;
  failedAttempts: number;
  locked: boolean;
  roleId: string | null;
  roleName: string | null;
  rolOffset: string | null;
};
