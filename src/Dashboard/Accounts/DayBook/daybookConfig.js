/** Where money sits. Must match the fixed list in docs/api/daybook/DAYBOOK_V2_BACKEND.md. */
export const CASH_SOURCE = "Cash";

export const ACCOUNT_NAMES = [
  "Dhruva Kumar H P-HDFC bank-5540",
  "Skyblue -HDFC-5540",
  "Skyblue -ICICI-1458",
  "Monica",
];

export const SOURCES = [CASH_SOURCE, ...ACCOUNT_NAMES];

export const RECEIVED_IN_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "ACCOUNT", label: "Account" },
];
