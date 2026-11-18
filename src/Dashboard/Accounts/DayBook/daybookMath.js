// Daybook money rules. The server enforces the same rules and is the source of truth;
// these functions only drive the live "Net received" / "Actual paid" read-outs and form checks.
// See docs/api/daybook/DAYBOOK_V2_BACKEND.md section 1.

export const round2 = (x) => Math.round((Number(x) + Number.EPSILON) * 100) / 100;

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

/** Net received = amount - GST - TDS (GST/TDS only apply to account receipts). */
export const netReceived = ({ receivedIn, amountReceived, gstAmount, tdsAmount }) => {
  if (receivedIn === "CASH") return round2(n(amountReceived));
  return round2(n(amountReceived) - n(gstAmount) - n(tdsAmount));
};

/** Actual amount paid = amount paid - TDS + GST (GST is added on top, TDS is deducted). */
export const actualPaid = ({ amountPaid, tdsAmount, gstAmount }) =>
  round2(n(amountPaid) - n(tdsAmount) + n(gstAmount));

/** Returns { field: message } (empty object when valid). Values may be strings from inputs. */
export const validateInflow = (v) => {
  const e = {};
  if (!String(v.clientName || "").trim()) e.clientName = "Enter the client name";
  if (!v.eventDate) e.eventDate = "Select the event date";
  if (!v.receivedDate) e.receivedDate = "Select the date received";
  if (!(n(v.amountReceived) > 0)) e.amountReceived = "Enter an amount greater than 0";
  if (v.receivedIn === "ACCOUNT") {
    if (!v.accountName) e.accountName = "Select the account";
    if (n(v.gstAmount) < 0) e.gstAmount = "Cannot be negative";
    if (n(v.tdsAmount) < 0) e.tdsAmount = "Cannot be negative";
    if (!e.amountReceived && n(v.gstAmount) + n(v.tdsAmount) > n(v.amountReceived)) {
      e.tdsAmount = "GST + TDS cannot be more than the amount received";
    }
  }
  return e;
};

export const validateOutflow = (v) => {
  const e = {};
  if (!v.vendorId) e.vendorId = "Select a vendor";
  if (!v.paidDate) e.paidDate = "Select the date paid";
  if (!(n(v.amountPaid) > 0)) e.amountPaid = "Enter an amount greater than 0";
  if (v.paidFrom === "ACCOUNT" && !v.accountName) e.accountName = "Select the account";
  if (n(v.tdsAmount) < 0) e.tdsAmount = "Cannot be negative";
  if (n(v.gstAmount) < 0) e.gstAmount = "Cannot be negative";
  if (!e.amountPaid && n(v.tdsAmount) > n(v.amountPaid)) {
    e.tdsAmount = "TDS cannot be more than the amount paid";
  }
  return e;
};
