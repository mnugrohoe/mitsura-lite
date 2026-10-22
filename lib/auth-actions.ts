// lib/auth-actions.ts
"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { loginSchema } from "@/lib/definitions";
import { getUserByUsername } from "@/features/user/queries";

export type LoginState = { error?: string } | undefined;

/**
 * Menentukan tujuan redirect setelah login.
 * - Path relatif ("/inventory") → diterima
 * - URL absolut dengan host yang sama ("http://localhost:3000/inventory") → diubah jadi path
 * - Selain itu (situs lain, nilai aneh) → fallback "/"
 */
async function safeRedirectPath(target: string): Promise<string> {
  let path = "/";

  if (target.startsWith("/") && !target.startsWith("//")) {
    path = target;
  } else {
    try {
      const url = new URL(target);
      const h = await headers();
      const host = h.get("x-forwarded-host") ?? h.get("host");
      if (url.host === host) {
        path = url.pathname + url.search;
      }
    } catch {
      // bukan URL valid, pakai fallback "/"
    }
  }

  // hindari loop kembali ke halaman login
  return path.startsWith("/login") ? "/" : path;
}

export async function authenticate(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await getUserByUsername(parsed.data.username);
  if (existing?.locked) {
    return {
      error:
        "Account locked after 3 failed attempts. Please contact your administrator.",
    };
  }

  const redirectTo = await safeRedirectPath(
    String(formData.get("redirectTo") ?? "/"),
  );

  try {
    await signIn("credentials", { ...parsed.data, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.type === "CredentialsSignin"
        ? { error: "Invalid username or password." }
        : { error: "Something went wrong." };
    }
    // Redirect yang berhasil dilempar sebagai error oleh Next.js, jadi harus di-throw lagi
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
