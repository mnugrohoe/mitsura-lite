"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { loginSchema } from "@/lib/definitions";

export type LoginState = { error?: string } | undefined;

export async function authenticate(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.type === "CredentialsSignin"
        ? { error: "Invalid username or password." }
        : { error: "Something went wrong." };
    }
    throw error; // IMPORTANT: a successful redirect is thrown as an "error", so re-throw it
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
