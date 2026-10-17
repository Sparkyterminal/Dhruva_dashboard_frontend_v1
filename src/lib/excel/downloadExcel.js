import { addStyledSheet } from "./buildSheet";

/**
 * Builds a styled .xlsx from sheet specs (see buildSheet.js) and downloads it.
 * exceljs and file-saver are loaded on click so they stay out of the main bundle.
 *
 * `extend(workbook, usedNames)` lets a caller add extra worksheets after the
 * spec'd ones (e.g. converted Univer budget workbooks).
 */
export const downloadExcel = async ({ fileName, sheets = [], extend }) => {
  const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
    import("exceljs"),
    import("file-saver"),
  ]);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dhruva Dashboard";
  workbook.created = new Date();
  const used = new Set();
  sheets.forEach((spec) => addStyledSheet(workbook, spec, used));
  if (extend) await extend(workbook, used);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`,
  );
};
