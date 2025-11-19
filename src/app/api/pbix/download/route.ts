// C:\Users\alecu\intelligent-dashboard\src\app\api\pbix\download\route.ts

import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function POST(req: NextRequest) {
  try {
    const { file } = await req.json();

    if (!file || !file.fileName || !file.sheets) {
      return NextResponse.json({ error: "Estrutura inválida" }, { status: 400 });
    }

    const workbook = new ExcelJS.Workbook();

    for (const sheet of file.sheets) {
      const ws = workbook.addWorksheet(sheet.sheetName);
      ws.addRow(sheet.columns);
      sheet.rows.forEach((row: any[]) => ws.addRow(row));
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${file.fileName}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar XLSX:", error);
    return NextResponse.json({ error: "Erro interno ao gerar XLSX" }, { status: 500 });
  }
}
