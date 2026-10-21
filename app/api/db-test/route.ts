import oracledb from "oracledb";
import { query } from "@/lib/oracle";

export async function GET() {
  const rows = await query("SELECT banner FROM v$version WHERE ROWNUM = 1");
  return Response.json({
    db: rows,
    thin: oracledb.thin, // harus false
    client: oracledb.oracleClientVersionString, // harus 19.x
  });
}
