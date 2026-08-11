const ENTITY_OPTIONS = [
  "Blue Pulse Ventures Pvt Lmtd.",
  "Sky Blue Event Management India Pvt Lmtd.",
  "Sky blue ICICI",
  "Sky blue HDFC",
  "Dhrua Kumar H P",
  "MM account",
  "Cash Payment",
];

const PAYMENT_MODE_OPTIONS = ["CASH", "ACCOUNT", "UPI", "CHEQUE", "OTHER"];

let rowCounter = 0;

export const getEventId = (event) =>
  event?.id || event?._id || event?.eventId || "";

export const getEventDisplayLabel = (event) => {
  if (!event) return "";
  const eventTypeName =
    typeof event.eventName === "string"
      ? event.eventName
      : event.eventName?.name || event.eventName?.eventName || "";
  const client = event.clientName || event.client_name || "";
  if (eventTypeName && client) return `${eventTypeName} — ${client}`;
  return (
    client ||
    eventTypeName ||
    event.name ||
    String(getEventId(event) || "")
  );
};

export const createEmptyExpenseRow = (overrides = {}) => {
  rowCounter += 1;
  return {
    id: overrides.id || `exp-${Date.now()}-${rowCounter}`,
    slNo: overrides.slNo ?? 1,
    eventReferenceId: overrides.eventReferenceId ?? "",
    eventReferenceLabel: overrides.eventReferenceLabel ?? "",
    particulars: overrides.particulars ?? "",
    category: overrides.category ?? "",
    inAmount: overrides.inAmount ?? 0,
    outAmount: overrides.outAmount ?? 0,
    paidTo: overrides.paidTo ?? "",
    paymentMode: overrides.paymentMode ?? "CASH",
    entityAccount: overrides.entityAccount ?? "",
    remarks: overrides.remarks ?? "",
    ...overrides,
  };
};

export const createDefaultRows = (count = 15) =>
  Array.from({ length: count }, (_, i) => createEmptyExpenseRow({ slNo: i + 1 }));

const parseAmountField = (value, legacyAmount) => {
  if (value != null && value !== "") return Number(value) || 0;
  if (legacyAmount != null) return Number(legacyAmount) || 0;
  return 0;
};

export const normalizeExpenseRows = (rows) => {
  const list = Array.isArray(rows) ? rows : [];
  return list.map((row, index) => {
    const legacyAmount = Number(row.amount) || 0;
    const inAmount = parseAmountField(
      row.inAmount ?? row.in_amount,
      row.amountIn ?? row.amount_in,
    );
    const outAmount = parseAmountField(
      row.outAmount ?? row.out_amount,
      row.amountOut ?? row.amount_out ?? legacyAmount,
    );

    return createEmptyExpenseRow({
      id: row._id || row.id || `exp-${index}`,
      slNo: row.slNo ?? index + 1,
      eventReferenceId:
        row.eventReferenceId ??
        row.event_reference_id ??
        row.eventReference ??
        row.eventId ??
        "",
      eventReferenceLabel:
        row.eventReferenceLabel ??
        row.event_reference_label ??
        row.eventReferenceName ??
        "",
      particulars: row.particulars ?? row.description ?? "",
      category: row.category ?? "",
      inAmount,
      outAmount,
      paidTo: row.paidTo ?? row.amountPaidTo ?? "",
      paymentMode: String(row.paymentMode || row.transation_in || "CASH").toUpperCase(),
      entityAccount: row.entityAccount ?? row.entity_account ?? "",
      remarks: row.remarks ?? row.note ?? "",
    });
  });
};

export const renumberRows = (rows) =>
  rows.map((row, index) => ({ ...row, slNo: index + 1 }));

export const computeExpenseInTotal = (rows) =>
  rows.reduce((sum, row) => sum + (Number(row.inAmount) || 0), 0);

export const computeExpenseOutTotal = (rows) =>
  rows.reduce((sum, row) => sum + (Number(row.outAmount) || 0), 0);

export const computeExpenseNetTotal = (rows) =>
  computeExpenseInTotal(rows) - computeExpenseOutTotal(rows);

/** @deprecated use computeExpenseOutTotal — kept for quick imports */
export const computeExpenseTotal = computeExpenseOutTotal;

export const buildPinnedTotalRow = (rows) => [
  {
    id: "expenses-total",
    slNo: "",
    eventReferenceId: "",
    eventReferenceLabel: "",
    particulars: "TOTAL",
    category: "",
    inAmount: computeExpenseInTotal(rows),
    outAmount: computeExpenseOutTotal(rows),
    paidTo: "",
    paymentMode: "",
    entityAccount: "",
    remarks: "",
    isTotalRow: true,
  },
];

export const prepareRowsForApi = (rows) =>
  rows.map((row, index) => ({
    slNo: index + 1,
    eventReferenceId: String(row.eventReferenceId || "").trim(),
    eventReferenceLabel: String(row.eventReferenceLabel || "").trim(),
    particulars: String(row.particulars || "").trim(),
    category: String(row.category || "").trim(),
    inAmount: Number(row.inAmount) || 0,
    outAmount: Number(row.outAmount) || 0,
    paidTo: String(row.paidTo || "").trim(),
    paymentMode: String(row.paymentMode || "CASH").toUpperCase(),
    entityAccount: String(row.entityAccount || "").trim(),
    remarks: String(row.remarks || "").trim(),
  }));

export const hasMeaningfulRow = (row) =>
  Boolean(
    String(row.eventReferenceId || "").trim() ||
      String(row.particulars || "").trim() ||
      String(row.category || "").trim() ||
      String(row.paidTo || "").trim() ||
      String(row.remarks || "").trim() ||
      Number(row.inAmount) > 0 ||
      Number(row.outAmount) > 0,
  );

export { ENTITY_OPTIONS, PAYMENT_MODE_OPTIONS };
