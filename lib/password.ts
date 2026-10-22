import "server-only";
import { createHash, timingSafeEqual } from "crypto";

// Sama dengan hex_sha1(password) di JavaScript Rails
export function legacyHash(plain: string) {
  return createHash("sha1").update(plain, "utf8").digest("hex");
}

export function verifyPassword(plain: string, storedHash: string | null) {
  if (!storedHash) return false;

  const a = Buffer.from(legacyHash(plain));
  const b = Buffer.from(storedHash.trim().toLowerCase());

  // timingSafeEqual wajib panjang sama, jadi cek dulu
  return a.length === b.length && timingSafeEqual(a, b);
}
