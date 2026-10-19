import { makeSheetName } from "./formats";

// Converts a stored Univer workbook snapshot (the budget-report spreadsheets)
// into ExcelJS worksheets, keeping values, formulas, fonts, fills, borders,
// merges, column widths and row heights.

const PX_PER_CHAR = 7;
const pxToWidth = (px) => Math.max(2, Math.round((px / PX_PER_CHAR) * 100) / 100);
const pxToPoints = (px) => Math.round(px * 0.75 * 100) / 100;

const H_ALIGN = { 1: "left", 2: "center", 3: "right", 4: "justify" };
const V_ALIGN = { 1: "top", 2: "middle", 3: "bottom" };
const BORDER_STYLE = {
  1: "thin",
  2: "hair",
  3: "dotted",
  4: "dashed",
  5: "dashDot",
  6: "dashDotDot",
  7: "double",
  8: "medium",
  9: "mediumDashed",
  10: "mediumDashDot",
  11: "mediumDashDotDot",
  12: "slantDashDot",
  13: "thick",
};

const hex2 = (n) => Math.max(0, Math.min(255, Math.round(Number(n)))).toString(16).padStart(2, "0");

// "rgb(1,2,3)" | "#abc" | "#b0c6b5" | "windowtext" -> "FFRRGGBB"
const toArgb = (color) => {
  const raw = color?.rgb ?? color;
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  if (s === "windowtext") return "FF000000";
  const rgb = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) return `FF${hex2(rgb[1])}${hex2(rgb[2])}${hex2(rgb[3])}`.toUpperCase();
  const h = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (h) {
    const v = h[1].length === 3 ? [...h[1]].map((c) => c + c).join("") : h[1];
    return `FF${v}`.toUpperCase();
  }
  return undefined;
};

const convertBorder = (side) => {
  const style = BORDER_STYLE[side?.s];
  if (!style) return undefined;
  return { style, color: { argb: toArgb(side.cl) || "FF000000" } };
};

const convertStyle = (s) => {
  const out = {};
  const font = {
    name: String(s.ff || "Calibri").split(",")[0].replace(/["']/g, "").trim() || "Calibri",
    size: s.fs || 11,
    bold: s.bl === 1,
    italic: s.it === 1,
    underline: s.ul?.s === 1,
    strike: s.st?.s === 1,
  };
  const fontColor = toArgb(s.cl);
  if (fontColor) font.color = { argb: fontColor };
  out.font = font;

  const fill = toArgb(s.bg);
  if (fill) out.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };

  const alignment = {};
  if (H_ALIGN[s.ht]) alignment.horizontal = H_ALIGN[s.ht];
  if (V_ALIGN[s.vt]) alignment.vertical = V_ALIGN[s.vt];
  if (s.tb === 3) alignment.wrapText = true;
  if (Object.keys(alignment).length) out.alignment = alignment;

  if (s.bd) {
    const border = {};
    [
      ["top", "t"],
      ["right", "r"],
      ["bottom", "b"],
      ["left", "l"],
    ].forEach(([name, key]) => {
      const b = convertBorder(s.bd[key]);
      if (b) border[name] = b;
    });
    if (Object.keys(border).length) out.border = border;
  }
  if (s.n?.pattern) out.numFmt = s.n.pattern;
  return out;
};

// Rich-text cells keep their text in a document stream; paragraphs end in \r.
const richText = (p) => {
  const stream = p?.body?.dataStream;
  if (typeof stream !== "string") return null;
  const text = stream.replace(/\r\n$/, "").replace(/\r/g, "\n");
  // Other control characters mark embedded objects in the document stream.
  return [...text]
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 || code === 9 || code === 10;
    })
    .join("");
};

const cellValue = (cell) => {
  if (typeof cell.f === "string" && cell.f.trim()) {
    return { formula: cell.f.replace(/^=/, ""), result: cell.v ?? undefined };
  }
  if (cell.p) {
    const text = richText(cell.p);
    if (text != null && text !== "") return text;
  }
  if (cell.v == null || cell.v === "") return null;
  if (cell.t === 3) return cell.v === true || cell.v === 1 || cell.v === "1";
  if (cell.t === 2 || typeof cell.v === "number") {
    const n = Number(cell.v);
    return Number.isFinite(n) ? n : String(cell.v);
  }
  return String(cell.v);
};

/**
 * Adds every sheet of `workbookData` to `excelWorkbook`.
 * @param {object} excelWorkbook ExcelJS.Workbook
 * @param {object} workbookData Univer snapshot ({ sheetOrder, sheets, styles })
 * @param {{ usedNames: Set<string>, labelFor?: (sheet: object) => string }} opts
 * @returns {string[]} names of the Excel sheets that were added
 */
export const addUniverWorkbookSheets = (excelWorkbook, workbookData, { usedNames, labelFor }) => {
  const sheets = workbookData?.sheets || {};
  const order = workbookData?.sheetOrder?.length
    ? workbookData.sheetOrder
    : Object.keys(sheets);
  const styleTable = workbookData?.styles || {};
  const styleCache = new Map();

  const styleFor = (ref) => {
    if (!ref) return null;
    const key = typeof ref === "string" ? ref : JSON.stringify(ref);
    if (styleCache.has(key)) return styleCache.get(key);
    const raw = typeof ref === "string" ? styleTable[ref] : ref;
    const converted = raw ? convertStyle(raw) : null;
    styleCache.set(key, converted);
    return converted;
  };

  const addedNames = [];
  order.forEach((id) => {
    const s = sheets[id];
    if (!s) return;
    const label = labelFor ? labelFor(s) : s.name;
    const ws = excelWorkbook.addWorksheet(makeSheetName(label, usedNames), {
      properties: {
        defaultColWidth: pxToWidth(s.defaultColumnWidth || 88),
        defaultRowHeight: pxToPoints(s.defaultRowHeight || 24),
        tabColor: toArgb(s.tabColor) ? { argb: toArgb(s.tabColor) } : undefined,
      },
      state: s.hidden === 1 ? "hidden" : "visible",
    });

    const view = { showGridLines: s.showGridlines !== 0 };
    const xSplit = Number(s.freeze?.xSplit) || 0;
    const ySplit = Number(s.freeze?.ySplit) || 0;
    if (xSplit > 0 || ySplit > 0) Object.assign(view, { state: "frozen", xSplit, ySplit });
    ws.views = [view];

    Object.entries(s.columnData || {}).forEach(([i, col]) => {
      const column = ws.getColumn(Number(i) + 1);
      if (col?.w) column.width = pxToWidth(col.w);
      if (col?.hd === 1) column.hidden = true;
    });

    Object.entries(s.rowData || {}).forEach(([i, row]) => {
      const height = row?.h || row?.ah;
      const target = ws.getRow(Number(i) + 1);
      if (height) target.height = pxToPoints(height);
      if (row?.hd === 1) target.hidden = true;
    });

    Object.entries(s.cellData || {}).forEach(([rowKey, cols]) => {
      Object.entries(cols || {}).forEach(([colKey, cell]) => {
        if (!cell) return;
        const target = ws.getCell(Number(rowKey) + 1, Number(colKey) + 1);
        const value = cellValue(cell);
        if (value != null) target.value = value;
        const style = styleFor(cell.s);
        if (style) {
          if (style.font) target.font = style.font;
          if (style.fill) target.fill = style.fill;
          if (style.alignment) target.alignment = style.alignment;
          if (style.border) target.border = style.border;
          if (style.numFmt) target.numFmt = style.numFmt;
        }
      });
    });

    (s.mergeData || []).forEach((m) => {
      try {
        ws.mergeCells(m.startRow + 1, m.startColumn + 1, m.endRow + 1, m.endColumn + 1);
      } catch {
        // Overlapping merges in a stored snapshot are skipped, not fatal.
      }
    });
    addedNames.push(ws.name);
  });
  return addedNames;
};
