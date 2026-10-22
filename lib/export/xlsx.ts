import ExcelJS from "exceljs";

export async function toXlsx(
  title: string,
  columns: string[],
  data: unknown[][],
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(title.slice(0, 31)); // batas nama sheet Excel
  ws.addRow(columns).font = { bold: true };
  data.forEach((row) => ws.addRow(row));
  return Buffer.from(await wb.xlsx.writeBuffer());
}
