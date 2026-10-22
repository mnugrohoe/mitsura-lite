import { auth } from "@/auth";
import { buildInventoryReport } from "@/features/inventory/report";
// import { toCsv } from "@/lib/export/csv";
import { toXlsx } from "@/lib/export/xlsx";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ format: string }> },
) {
  // WAJIB: proxy.ts kita mengecualikan /api, jadi cek session di sini
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { format } = await params;
  const report = await buildInventoryReport();

  // if (format === "csv") {
  //   return new Response(toCsv(report.columns, report.data), {
  //     headers: {
  //       "Content-Type": "text/csv; charset=utf-8",
  //       "Content-Disposition": 'attachment; filename="inventory.csv"',
  //     },
  //   });
  // }

  if (format === "xlsx") {
    const buf = await toXlsx(report.title, report.columns, report.data);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="inventory.xlsx"',
      },
    });
  }

  return new Response("Format tidak didukung", { status: 400 });
}
