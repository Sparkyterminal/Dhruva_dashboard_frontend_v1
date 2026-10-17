import { coerceCell, formatFor, makeSheetName } from "./formats";

const BRAND = "FF0B3D0B";
const BAND = "FFDDE9DD";
const BORDER = { style: "thin", color: { argb: "FFD0D7D0" } };
const ALL_BORDERS = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };
const SOLID = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

const displayLength = (value, type) => {
  if (value == null) return 0;
  if (value instanceof Date) return type === "datetime" ? 20 : 12;
  if (type === "money") return String(Math.round(value)).length + 4;
  return String(value)
    .split("\n")
    .reduce((m, l) => Math.max(m, l.length), 0);
};

/**
 * Adds one styled worksheet to an ExcelJS workbook.
 *
 * spec = {
 *   name, title?, subtitle?,
 *   columns: [{ header, type?: "text"|"number"|"money"|"percent"|"date"|"datetime",
 *               width?, wrap?, align? }],
 *   groups?: [{ label, from, to }],   // band row above the header (0-based, inclusive)
 *   rows: any[][],                    // raw values, coerced per column type
 *   totals?: any[],                   // optional bold last row (same width as columns)
 *   freezeColumns?: number
 * }
 */
export const addStyledSheet = (workbook, spec, usedNames) => {
  const { columns, rows, groups = [], totals, freezeColumns = 0 } = spec;
  const ws = workbook.addWorksheet(makeSheetName(spec.name, usedNames));
  const colCount = columns.length;
  let r = 1;

  if (spec.title) {
    ws.mergeCells(r, 1, r, Math.max(colCount, 2));
    const c = ws.getCell(r, 1);
    c.value = spec.title;
    c.font = { name: "Calibri", size: 15, bold: true, color: { argb: BRAND } };
    c.alignment = { vertical: "middle" };
    ws.getRow(r).height = 26;
    r += 1;
  }
  if (spec.subtitle) {
    ws.mergeCells(r, 1, r, Math.max(colCount, 2));
    const c = ws.getCell(r, 1);
    c.value = spec.subtitle;
    c.font = { name: "Calibri", size: 10, color: { argb: "FF4B5563" } };
    c.alignment = { vertical: "middle", wrapText: true };
    r += 1;
  }
  if (spec.title || spec.subtitle) r += 1;

  if (groups.length) {
    groups.forEach(({ label, from, to }) => {
      if (to > from) ws.mergeCells(r, from + 1, r, to + 1);
      for (let c = from; c <= to; c += 1) {
        const cell = ws.getCell(r, c + 1);
        cell.fill = SOLID(BAND);
        cell.border = ALL_BORDERS;
      }
      const cell = ws.getCell(r, from + 1);
      cell.value = label;
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: BRAND } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    ws.getRow(r).height = 20;
    r += 1;
  }

  const headerRow = r;
  columns.forEach((col, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = col.header;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = SOLID(BRAND);
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = ALL_BORDERS;
  });
  ws.getRow(headerRow).height = 32;
  r += 1;

  const widths = columns.map((col) =>
    Math.max(8, Math.min(col.header.length * 0.9 + 3, 26)),
  );

  const writeRow = (values, bold = false) => {
    values.forEach((raw, i) => {
      const col = columns[i];
      // A text label (e.g. "Total") in a totals row must survive a number/date column.
      const isLabel = bold && typeof raw === "string";
      const value = isLabel ? raw : coerceCell(raw, col.type);
      const cell = ws.getCell(r, i + 1);
      if (value != null) cell.value = value;
      const fmt = isLabel ? null : formatFor(col.type);
      if (fmt) cell.numFmt = fmt;
      cell.font = { name: "Calibri", size: 10, bold };
      cell.border = ALL_BORDERS;
      cell.alignment = {
        vertical: col.wrap ? "top" : "middle",
        wrapText: Boolean(col.wrap),
        horizontal: isLabel
          ? "left"
          : col.align ||
            (["money", "number", "percent"].includes(col.type) ? "right" : "left"),
      };
      if (bold) cell.fill = SOLID("FFF1F5F1");
      widths[i] = Math.max(widths[i], displayLength(value, col.type) + 2);
    });
    r += 1;
  };

  rows.forEach((row) => writeRow(row));
  const lastDataRow = r - 1;
  if (totals) writeRow(totals, true);

  columns.forEach((col, i) => {
    ws.getColumn(i + 1).width =
      col.width || Math.min(widths[i], col.wrap ? 40 : 48);
  });

  if (rows.length > 0) {
    ws.autoFilter = {
      from: { row: headerRow, column: 1 },
      to: { row: lastDataRow, column: colCount },
    };
  }
  ws.views = [
    { state: "frozen", xSplit: freezeColumns, ySplit: headerRow, showGridLines: false },
  ];
  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  return ws;
};
