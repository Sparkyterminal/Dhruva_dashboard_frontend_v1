/**
 * Helpers for Budget Report Excel (event mapping + display labels).
 */

export const CONFIRMED_EVENT_STATUS = "Confirmed Event";
/** Canonical in-progress status from GET /events (status=inprogress). */
export const INPROGRESS_EVENT_STATUS = "InProgress";

/** Statuses allowed to create / list / edit budget report Excel workbooks. */
export const BUDGET_REPORT_ELIGIBLE_STATUSES = [
  CONFIRMED_EVENT_STATUS,
  INPROGRESS_EVENT_STATUS,
];

export const getEventId = (event) => {
  if (!event) return null;
  if (typeof event === "string") return event;
  return event._id ?? event.id ?? null;
};

export const getEventName = (eventName) => {
  if (typeof eventName === "string") return eventName;
  return eventName?.name || "N/A";
};

export const getEventDisplayLabel = (event) => {
  if (!event) return "—";
  const name = getEventName(event.eventName);
  const client = event.clientName || event.client?.name || "N/A";
  return `${name} - ${client}`;
};

export const isConfirmedEvent = (event) =>
  event?.eventConfirmation === CONFIRMED_EVENT_STATUS;

export const isInProgressEvent = (event) =>
  event?.eventConfirmation === INPROGRESS_EVENT_STATUS;

/** Confirmed Event or InProgress — eligible for budget report Excel. */
export const isBudgetReportEligibleEvent = (event) =>
  BUDGET_REPORT_ELIGIBLE_STATUSES.includes(event?.eventConfirmation);

/**
 * Normalize events list from GET /events payload shapes.
 */
export const parseEventsPayload = (res) => {
  const raw = res?.data?.events ?? res?.data?.data ?? res?.data;
  return Array.isArray(raw) ? raw : [];
};

/**
 * Build a stable list row for the budget-report excel table.
 */
export const buildBudgetReportListRow = ({
  eventId,
  eventName = "",
  clientName = "",
  updatedAt = null,
  version = 0,
  sheetCount = 0,
  workbookId = null,
  hasWorkbook = false,
  event = null,
}) => ({
  key: String(eventId),
  eventId: String(eventId),
  eventName,
  clientName,
  updatedAt,
  version,
  sheetCount,
  workbookId,
  hasWorkbook: Boolean(hasWorkbook),
  event,
});
