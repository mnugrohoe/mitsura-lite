import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type UserRecord = {
  id: string;
  username: string;
  fullName: string | null;
  password_hash: string | null;
  email: string | null;
  failed_attempts: number;
  locked: boolean;
  role_id: string | null;
  role_name: string | null;
  rol_offset: string | null;
};
