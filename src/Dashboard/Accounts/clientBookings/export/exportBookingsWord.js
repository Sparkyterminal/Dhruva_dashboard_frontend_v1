const BRAND_GREEN = "0B3D0B";
// A4 landscape (16838 twips) minus 0.5in margins on both sides.
const TABLE_WIDTH = 15398;
const COLUMN_WIDTHS = [500, 1500, 2098, 1400, 1100, 1700, 1100, 1400, 1300, 1300, 1300, 700];

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

  const money = (value) => `₹${value}`;

  const cell = (text, i, { head = false, fill, bold = false } = {}) =>
    new TableCell({
      width: { size: COLUMN_WIDTHS[i], type: WidthType.DXA },
      shading: head
        ? { type: ShadingType.CLEAR, fill: BRAND_GREEN, color: "auto" }
        : fill
          ? { type: ShadingType.CLEAR, fill, color: "auto" }
          : undefined,
      margins: { top: 50, bottom: 50, left: 80, right: 80 },
      children: [
        new Paragraph({
          alignment: report.amountColumns.includes(i)
            ? AlignmentType.RIGHT
            : i === 0 || i === 11
              ? AlignmentType.CENTER
              : AlignmentType.LEFT,
          children: [
            new TextRun({
              text: report.amountColumns.includes(i) && !head ? money(text) : text,
              bold: head || bold,
              color: head ? "FFFFFF" : undefined,
              size: 16,
            }),
          ],
        }),
      ],
    });

  const table = new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: COLUMN_WIDTHS,
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: report.columns.map((c, i) => cell(c, i, { head: true })),
      }),
      ...report.rows.map(
        (row, r) =>
          new TableRow({
            cantSplit: true,
            children: row.map((v, i) =>
              cell(v, i, { fill: r % 2 ? "F6F8F6" : undefined }),
            ),
          }),
      ),
    ],
  });

  const summaryLine = new Paragraph({
    spacing: { before: 120, after: 200 },
    children: report.summary.flatMap(([label, value], i) => [
      new TextRun({
        text: `${label}: `,
        bold: true,
        color: BRAND_GREEN,
        size: 22,
      }),
      new TextRun({
        text: label === "Total bookings" ? value : money(value),
        bold: true,
        size: 22,
        break: 0,
      }),
      new TextRun({
        text: i < report.summary.length - 1 ? "     |     " : "",
        size: 22,
        color: "9CA3AF",
      }),
    ]),
  });

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
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: "6B7280",
                  }),
                  new TextRun({ text: " of ", size: 16, color: "6B7280" }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: "6B7280",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: report.title,
                bold: true,
                size: 36,
                color: BRAND_GREEN,
              }),
            ],
          }),
          ...report.filterLines.map(
            (line) =>
              new Paragraph({
                children: [new TextRun({ text: line, size: 18, color: "4B5563" })],
              }),
          ),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on ${report.generatedAt}`,
                size: 18,
                color: "4B5563",
              }),
            ],
          }),
          summaryLine,
          table,
        ],
      },
    ],
  });

  saveAs(await Packer.toBlob(doc), `${report.fileBase}.docx`);
};
