const BRAND_GREEN = "0B3D0B";
const STRIPE = "F6F8F6";
const LABEL_FILL = "F1F5F1";
// A4 landscape (16838 twips) minus 0.5in margins on both sides.
const TABLE_WIDTH = 15398;
const SUMMARY_WIDTHS = [500, 1500, 2098, 1400, 1100, 1700, 1100, 1400, 1300, 1300, 1300, 700];
const INFO_WIDTHS = [2000, 5699, 2000, 5699];
const MONEY_INFO_LABELS = ["Booked", "Received", "Balance"];

const equalWidths = (n) => {
  const w = Math.floor(TABLE_WIDTH / n);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? TABLE_WIDTH - w * (n - 1) : w));
};

// docx is loaded on click so it stays out of the main bundle.
export const exportBookingsWord = async (report) => {
  const [
    {
      Document,
      Packer,
      Paragraph,
      Table,
      TableRow,
      TableCell,
      TextRun,
      WidthType,
      PageOrientation,
      AlignmentType,
      ShadingType,
      Footer,
      PageNumber,
    },
    { saveAs },
  ] = await Promise.all([import("docx"), import("file-saver")]);

  const money = (value) => (value === "-" ? value : `₹${value}`);

  const cell = (text, width, { head = false, fill, bold = false, align } = {}) =>
    new TableCell({
      width: { size: width, type: WidthType.DXA },
      shading: head
        ? { type: ShadingType.CLEAR, fill: BRAND_GREEN, color: "auto" }
        : fill
          ? { type: ShadingType.CLEAR, fill, color: "auto" }
          : undefined,
      margins: { top: 50, bottom: 50, left: 80, right: 80 },
      children: [
        new Paragraph({
          alignment: align || AlignmentType.LEFT,
          children: [
            new TextRun({
              text: String(text),
              bold: head || bold,
              color: head ? "FFFFFF" : undefined,
              size: 16,
            }),
          ],
        }),
      ],
    });

  /**
   * @param {{ columns: string[], rows: string[][], widths: number[],
   *   amountCols?: number[], centerCols?: number[], boldLastRow?: boolean }} spec
   */
  const buildTable = ({ columns, rows, widths, amountCols = [], centerCols = [], boldLastRow = false }) => {
    const alignOf = (i) =>
      amountCols.includes(i)
        ? AlignmentType.RIGHT
        : centerCols.includes(i)
          ? AlignmentType.CENTER
          : AlignmentType.LEFT;
    return new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: widths,
      rows: [
        new TableRow({
          tableHeader: true,
          cantSplit: true,
          children: columns.map((c, i) => cell(c, widths[i], { head: true, align: alignOf(i) })),
        }),
        ...rows.map(
          (row, r) =>
            new TableRow({
              cantSplit: true,
              children: row.map((v, i) =>
                cell(amountCols.includes(i) ? money(v) : v, widths[i], {
                  fill: r % 2 ? STRIPE : undefined,
                  bold: boldLastRow && r === rows.length - 1,
                  align: alignOf(i),
                }),
              ),
            }),
        ),
      ],
    });
  };

  const buildInfoTable = (info) => {
    const rows = [];
    for (let i = 0; i < info.length; i += 2) {
      const [k1, v1] = info[i];
      const [k2, v2] = info[i + 1] || ["", ""];
      rows.push(
        new TableRow({
          cantSplit: true,
          children: [
            cell(k1, INFO_WIDTHS[0], { fill: LABEL_FILL, bold: true }),
            cell(MONEY_INFO_LABELS.includes(k1) ? money(v1) : v1, INFO_WIDTHS[1]),
            cell(k2, INFO_WIDTHS[2], { fill: k2 ? LABEL_FILL : undefined, bold: true }),
            cell(MONEY_INFO_LABELS.includes(k2) ? money(v2) : v2, INFO_WIDTHS[3]),
          ],
        }),
      );
    }
    return new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: INFO_WIDTHS,
      rows,
    });
  };

  const heading = (text, { size = 26, pageBreakBefore = false, before = 0, after = 100 } = {}) =>
    new Paragraph({
      pageBreakBefore,
      keepNext: true,
      spacing: { before, after },
      children: [new TextRun({ text, bold: true, size, color: BRAND_GREEN })],
    });

  const summaryLine = new Paragraph({
    spacing: { before: 120, after: 200 },
    children: report.summary.flatMap(([label, value], i) => [
      new TextRun({ text: `${label}: `, bold: true, color: BRAND_GREEN, size: 22 }),
      new TextRun({
        text: label === "Total bookings" ? value : money(value),
        bold: true,
        size: 22,
      }),
      new TextRun({
        text: i < report.summary.length - 1 ? "     |     " : "",
        size: 22,
        color: "9CA3AF",
      }),
    ]),
  });

  const grey = (text) =>
    new Paragraph({ children: [new TextRun({ text, size: 18, color: "4B5563" })] });

  const detailChildren = report.details.flatMap((detail, index) => [
    ...(index === 0
      ? [heading("Booking Details", { size: 30, pageBreakBefore: true, after: 160 })]
      : []),
    heading(detail.heading, { pageBreakBefore: index !== 0, after: 100 }),
    buildInfoTable(detail.info),
    ...detail.tables.flatMap((table) => [
      heading(table.title, { size: 20, before: 220, after: 80 }),
      buildTable({
        columns: table.columns,
        rows: table.rows,
        widths: equalWidths(table.columns.length),
        amountCols: table.amountCols,
        boldLastRow: table.boldLastRow,
      }),
    ]),
  ]);

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri" } } } },
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "Page ", size: 16, color: "6B7280" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "6B7280" }),
                  new TextRun({ text: " of ", size: 16, color: "6B7280" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "6B7280" }),
                ],
              }),
            ],
          }),
        },
        children: [
          heading(report.title, { size: 36, after: 80 }),
          ...report.filterLines.map(grey),
          grey(`Generated on ${report.generatedAt}`),
          summaryLine,
          buildTable({
            columns: report.columns,
            rows: report.rows,
            widths: SUMMARY_WIDTHS,
            amountCols: report.amountColumns,
            centerCols: [0, 11],
          }),
          ...detailChildren,
        ],
      },
    ],
  });

  saveAs(await Packer.toBlob(doc), `${report.fileBase}.docx`);
};
