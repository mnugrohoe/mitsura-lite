import "server-only";
import { query } from "@/lib/oracle";
import type { UserRecord } from "./definitions";

export const MAX_LOGIN_ATTEMPTS = 3;

type LoginRaw = {
  USR_ID: number | string;
  USR_NAME: string;
  USR_DESCRIPTION: string | null;
  USR_LOCKED: number | null;
  USR_MD5_PASSWORD: string | null;
  USR_ROL_ID: number | string | null;
  ROL_NAME: string | null;
  ROL_OFFSET: number | string | null;
};

export async function getUserByUsername(
  username: string,
): Promise<UserRecord | null> {
  const rows = await query<LoginRaw>(
    `SELECT u.usr_id, TRIM(u.usr_name) AS usr_name, u.usr_description,
            u.usr_locked, u.usr_md5_password, u.usr_rol_id,
            r.rol_name, r.rol_offset
       FROM users u
       LEFT JOIN role r ON u.usr_rol_id = r.rol_id
      WHERE TRIM(u.usr_name) = :username
        AND ROWNUM <= 1`,
    { username },
  );

  const r = rows[0];
  if (!r) return null;

  const failedAttempts = Number(r.USR_LOCKED ?? 0);

  return {
    id: String(r.USR_ID),
    username: r.USR_NAME,
    fullName: r.USR_DESCRIPTION?.trim() ?? null,
    passwordHash: r.USR_MD5_PASSWORD,
    failedAttempts,
    locked: failedAttempts >= MAX_LOGIN_ATTEMPTS,
    roleId: r.USR_ROL_ID == null ? null : String(r.USR_ROL_ID),
    roleName: r.ROL_NAME,
    rolOffset: r.ROL_OFFSET == null ? null : String(r.ROL_OFFSET),
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
