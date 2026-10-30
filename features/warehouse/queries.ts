import "server-only";
import { query } from "@/lib/oracle";
import type { UserRecord } from "./definitions";

export const MAX_LOGIN_ATTEMPTS = 3;

type LoginRaw = {
  usr_id: number | string;
  usr_name: string;
  usr_description: string | null;
  usr_email: string | null;
  usr_locked: number | null;
  usr_md5_password: string | null;
  usr_rol_id: number | string | null;
  rol_name: string | null;
  rol_offset: number | string | null;
};

export async function getUserByUsername(
  username: string,
): Promise<UserRecord | null> {
  const rows = await query<LoginRaw>(
    `SELECT u.usr_id, TRIM(u.usr_name) AS usr_name, u.usr_description,
            u.usr_locked, u.usr_md5_password, u.usr_rol_id, u.usr_email,
            r.rol_name, r.rol_offset
       FROM users u
       LEFT JOIN role r ON u.usr_rol_id = r.rol_id
      WHERE TRIM(u.usr_name) = :username
        AND ROWNUM <= 1`,
    { username },
  );

  const r = rows[0];
  if (!r) return null;

  const failed_attempts = Number(r.usr_locked ?? 0);

  return {
    id: String(r.usr_id),
    username: r.usr_name,
    fullName: r.usr_description?.trim() ?? null,
    email: r.usr_email,
    password_hash: r.usr_md5_password,
    failed_attempts,
    locked: failed_attempts >= MAX_LOGIN_ATTEMPTS,
    role_id: r.usr_rol_id == null ? null : String(r.usr_rol_id),
    role_name: r.rol_name,
    rol_offset: r.rol_offset == null ? null : String(r.rol_offset),
  };
}

// Naik 1 secara atomik di database (aman kalau ada dua percobaan bersamaan)
export async function recordFailedLogin(userId: string) {
  await query(
    `UPDATE users SET usr_locked = NVL(usr_locked, 0) + 1 WHERE usr_id = :id`,
    { id: Number(userId) },
  );
}

export async function resetFailedLogin(userId: string) {
  await query(`UPDATE users SET usr_locked = 0 WHERE usr_id = :id`, {
    id: Number(userId),
  });
}
