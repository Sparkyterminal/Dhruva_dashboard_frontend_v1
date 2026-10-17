// Heavy libraries are loaded on click so they stay out of the main bundle.
// jsPDF's built-in fonts have no "₹" glyph, so amounts are prefixed "Rs.".
export const exportBookingsPdf = async (report) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(11, 61, 11);
  doc.text(report.title, margin, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  let y = 20;
  report.filterLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 4.5;
  });
  doc.text(`Generated on ${report.generatedAt}`, margin, y);
  y += 3;

  autoTable(doc, {
    startY: y + 2,
    body: [report.summary.map(([label, value]) => `${label}: ${
      label === "Total bookings" ? value : `Rs. ${value}`
    }`)],
    theme: "plain",
    styles: { fontSize: 10, fontStyle: "bold", textColor: [11, 61, 11] },
    margin: { left: margin, right: margin },
  });

  const amountCols = Object.fromEntries(
    report.amountColumns.map((i) => [i, { halign: "right" }]),
  );

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 2,
    head: [report.columns],
    body: report.rows,
    theme: "grid",
    margin: { left: margin, right: margin, bottom: 14 },
    styles: { fontSize: 7.5, cellPadding: 1.8, valign: "middle", overflow: "linebreak" },
    headStyles: { fillColor: [11, 61, 11], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [246, 248, 246] },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      11: { halign: "center", cellWidth: 16 },
      ...amountCols,
    },
    showHead: "everyPage",
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Page ${i} of ${pages}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 6,
      { align: "right" },
    );
  }

  doc.save(`${report.fileBase}.pdf`);
};
