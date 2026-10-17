// Heavy libraries are loaded on click so they stay out of the main bundle.
// jsPDF's built-in fonts have no "₹" glyph, so amounts are prefixed "Rs.".
const GREEN = [11, 61, 11];
const MARGIN = 10;

const withCurrency = (rows, amountCols) =>
  rows.map((row) =>
    row.map((v, i) => (amountCols.includes(i) && v !== "-" ? `Rs. ${v}` : v)),
  );

const rightAlign = (cols) =>
  Object.fromEntries(cols.map((i) => [i, { halign: "right" }]));

export const exportBookingsPdf = async (report) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ---- Title + summary ----------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...GREEN);
  doc.text(report.title, MARGIN, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  let y = 20;
  report.filterLines.forEach((line) => {
    doc.text(line, MARGIN, y);
    y += 4.5;
  });
  doc.text(`Generated on ${report.generatedAt}`, MARGIN, y);

  autoTable(doc, {
    startY: y + 5,
    body: [
      report.summary.map(
        ([label, value]) =>
          `${label}: ${label === "Total bookings" ? value : `Rs. ${value}`}`,
      ),
    ],
    theme: "plain",
    styles: { fontSize: 10, fontStyle: "bold", textColor: GREEN },
    margin: { left: MARGIN, right: MARGIN },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 2,
    head: [report.columns],
    body: withCurrency(report.rows, report.amountColumns),
    theme: "grid",
    margin: { left: MARGIN, right: MARGIN, bottom: 14 },
    styles: { fontSize: 7.5, cellPadding: 1.8, valign: "middle", overflow: "linebreak" },
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [246, 248, 246] },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      11: { halign: "center", cellWidth: 16 },
      ...rightAlign(report.amountColumns),
    },
    showHead: "everyPage",
  });

  // ---- Per-booking details ------------------------------------------------
  report.details.forEach((detail, index) => {
    doc.addPage();
    y = 14;

    if (index === 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...GREEN);
      doc.text("Booking Details", MARGIN, y);
      y += 8;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...GREEN);
    doc.text(detail.heading, MARGIN, y);

    // Booking info as label/value pairs, two pairs per row.
    const pairs = [];
    for (let i = 0; i < detail.info.length; i += 2) {
      const [k1, v1] = detail.info[i];
      const [k2, v2] = detail.info[i + 1] || ["", ""];
      const money = (k, v) =>
        ["Booked", "Received", "Balance"].includes(k) && v !== "-" ? `Rs. ${v}` : v;
      pairs.push([k1, money(k1, v1), k2, money(k2, v2)]);
    }
    autoTable(doc, {
      startY: y + 2,
      body: pairs,
      theme: "grid",
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 8.5, cellPadding: 1.8 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [241, 245, 241], cellWidth: 38 },
        1: { cellWidth: 100 },
        2: { fontStyle: "bold", fillColor: [241, 245, 241], cellWidth: 38 },
      },
    });
    y = doc.lastAutoTable.finalY + 6;

    detail.tables.forEach((table) => {
      if (y + 25 > pageHeight - 14) {
        doc.addPage();
        y = 14;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...GREEN);
      doc.text(table.title, MARGIN, y);

      autoTable(doc, {
        startY: y + 2,
        head: [table.columns],
        body: withCurrency(table.rows, table.amountCols),
        theme: "grid",
        margin: { left: MARGIN, right: MARGIN, bottom: 14 },
        styles: { fontSize: 8, cellPadding: 1.6, overflow: "linebreak", valign: "middle" },
        headStyles: { fillColor: GREEN, textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [246, 248, 246] },
        columnStyles: rightAlign(table.amountCols),
        didParseCell: (data) => {
          if (table.boldLastRow && data.section === "body" && data.row.index === table.rows.length - 1) {
            data.cell.styles.fontStyle = "bold";
          }
        },
        showHead: "everyPage",
      });
      y = doc.lastAutoTable.finalY + 6;
    });
  });

  // ---- Page numbers -------------------------------------------------------
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Page ${i} of ${pages}`, pageWidth - MARGIN, pageHeight - 6, {
      align: "right",
    });
  }

  doc.save(`${report.fileBase}.pdf`);
};
