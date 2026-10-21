import "server-only";
import oracledb from "oracledb";

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

const globalForOracle = globalThis as unknown as {
  oraPool?: Promise<oracledb.Pool>;
  oraThick?: boolean;
};

if (process.env.ORACLE_CLIENT_LIB_DIR && !globalForOracle.oraThick) {
  oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_LIB_DIR });
  globalForOracle.oraThick = true;
}

function getPool() {
  if (!globalForOracle.oraPool) {
    const cfg = {
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING,
    };

    globalForOracle.oraPool = oracledb
      .createPool({
        ...cfg,
        poolMin: 1,
        poolMax: 4,
        poolIncrement: 1,
        poolTimeout: 60,
      })
      .catch((e) => {
        globalForOracle.oraPool = undefined;
        throw e;
      });
  }
  return globalForOracle.oraPool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  binds: oracledb.BindParameters = {},
  options: oracledb.ExecuteOptions = {},
): Promise<T[]> {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    const result = await conn.execute<T>(sql, binds, options);
    return (result.rows ?? []) as T[];
  } finally {
    await conn.close();
  }
}

export async function execute(
  sql: string,
  binds: oracledb.BindParameters = {},
) {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    const result = await conn.execute(sql, binds, { autoCommit: true });
    return result.rowsAffected ?? 0;
  } finally {
    await conn.close();
  }
}

// Server component
// import { query } from "@/lib/oracle";

// type Item = { ITEM_CODE: string; QTY: number };

// export default async function Page() {
//   const rows = await query<Item>(
//     "SELECT item_code, qty FROM stock WHERE site = :site FETCH FIRST 20 ROWS ONLY",
//     { site: "KM38" }
//   );

//   return <pre>{JSON.stringify(rows, null, 2)}</pre>;
// }

// Server Action
// "use server";
// import { execute } from "@/lib/oracle";

// export async function addItem(code: string, qty: number) {
//   await execute(
//     "INSERT INTO stock (item_code, qty) VALUES (:code, :qty)",
//     { code, qty }
//   );
// }

// Hal penting
//// Selalu pakai bind variable (:site, :code), jangan menyambung string SQL. Ini mencegah SQL injection.
//// Nama kolom huruf besar. Oracle mengembalikan ITEM_CODE, bukan item_code. Kalau mau lowercase, tulis alias dengan tanda kutip: SELECT item_code AS "itemCode".
//// FETCH FIRST n ROWS ONLY butuh Oracle 12c ke atas. Untuk 11g pakai WHERE ROWNUM <= n.
//// Pakai import "server-only" supaya lib ini tidak ikut ter-import ke client component. Install dulu dengan npm i server-only.
//// Jangan pakai di Edge runtime. Kalau perlu, tulis export const runtime = "nodejs" di route handler.
//// Error DPI-1047 artinya Oracle Client tidak ketemu. Ini hanya terjadi di mode Thick, jadi cek ORACLE_CLIENT_LIB_DIR.
//// Error NJS-138 artinya versi database terlalu lama untuk mode Thin. Isi ORACLE_CLIENT_LIB_DIR untuk pindah ke mode Thick.
