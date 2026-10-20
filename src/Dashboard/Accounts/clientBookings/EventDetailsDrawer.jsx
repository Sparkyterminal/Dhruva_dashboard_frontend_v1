import React from "react";
import { Drawer, DatePicker, Input, InputNumber, Select } from "antd";
import {
  CalendarDays,
  Check,
  MapPin,
  Pencil,
  Phone,
  User,
  Users,
  X,
} from "lucide-react";
import dayjs from "dayjs";
import {
  formatAmount,
  formatDate,
  getBookingReceivedAmount,
  getEventName,
  getTotalAgreedAmount,
  getTotalPayable,
  isCompletePaymentWedding,
} from "./clientBookingsUtils";
import "@/Components/PageKit/PageKit.css";
import "./Bookings.css";
import "./EventDetailsDrawer.css";

const CONFIRMATION_TONE = {
  "Confirmed Event": "",
  InProgress: "is-gold",
  "In Progress": "is-gold",
  "Almost Booked": "is-blue",
  Cancelled: "is-red",
};

const personName = (value) =>
  typeof value === "string" ? value : value?.name || "N/A";

const typeName = (eventType, fallback = "Main Event") => {
  if (!eventType?.eventType) return fallback;
  return typeof eventType.eventType === "string"
    ? eventType.eventType
    : eventType.eventType?.name || "N/A";
};

const refName = (value) => value?.name || value || "-";

const Tile = ({ icon, label, value }) => (
  <div className="ed-tile">
    <span className="ed-tile-icon">{icon}</span>
    <div>
      <span className="ed-label">{label}</span>
      <strong>{value}</strong>
    </div>
  </div>
);

const Money = ({ label, value, tone = "" }) => (
  <div className={`ed-money${tone ? ` is-${tone}` : ""}`}>
    <span className="ed-label">{label}</span>
    <strong>{formatAmount(value || 0)}</strong>
  </div>
);

const Section = ({ title, aside, children }) => (
  <section className="ed-section">
    <header>
      <h3>{title}</h3>
      {aside ? <span>{aside}</span> : null}
    </header>
    {children}
  </section>
);

/** Venue / dates / coordinator tiles for one event type. */
const EventTypeTiles = ({ eventType }) => (
  <div className="ed-tiles">
    <Tile icon={<CalendarDays size={16} />} label="Start date" value={formatDate(eventType.startDate)} />
    <Tile icon={<CalendarDays size={16} />} label="End date" value={formatDate(eventType.endDate)} />
    <Tile icon={<MapPin size={16} />} label="Venue" value={refName(eventType.venueLocation)} />
    {eventType.subVenueLocation && (
      <Tile icon={<MapPin size={16} />} label="Sub venue" value={refName(eventType.subVenueLocation)} />
    )}
    {eventType.coordinator && (
      <Tile icon={<User size={16} />} label="Event coordinator" value={refName(eventType.coordinator)} />
    )}
  </div>
);

/** The six money figures kept for every package / event type. */
const AmountGrid = ({ eventType }) => (
  <div className="ed-money-grid">
    <Money label="Agreed amount" value={eventType.agreedAmount} />
    <Money label="Account amount" value={eventType.accountAmount} />
    <Money label="GST (18%)" value={eventType.accountGst} />
    <Money label="Account + GST" value={eventType.accountAmountWithGst} />
    <Money label="Cash amount" value={eventType.cashAmount} tone="gold" />
    <Money label="Total payable" value={eventType.totalPayable} tone="strong" />
  </div>
);

const Field = ({ label, children, wide }) => (
  <div className={`ed-field${wide ? " is-wide" : ""}`}>
    <span className="ed-label">{label}</span>
    <div>{children}</div>
  </div>
);

/**
 * One advance payment. Read-only unless `editing` is passed; then Edit turns the received
 * fields into inputs for that advance (same fields and save call as before).
 */
const AdvanceCard = ({ record, remarks, editing, modeOptions }) => {
  const key = editing?.getKey(record);
  const globalIndex = editing
    ? editing.advances.findIndex((a) => editing.getKey(a) === key)
    : -1;
  const isEditing = Boolean(editing) && editing.editingKey === key;
  const isSaving = Boolean(editing) && editing.savingIndex === globalIndex;
  const received = Number(record.receivedAmount) > 0;
  const set = (field, value) => editing.onChange(globalIndex, field, value);

  const hasRemarks = remarks && (remarks.accounts || remarks.owner || remarks.approver);

  return (
    <article className={`ed-advance${received ? " is-received" : ""}${isEditing ? " is-editing" : ""}`}>
      <div className="ed-advance-top">
        <div className="pk-pills">
          <strong className="ed-advance-no">Advance #{record.advanceNumber}</strong>
          <span className={`pk-pill ${received ? "" : "is-gold"}`}>{received ? "Received" : "Pending"}</span>
        </div>

        {editing &&
          (isEditing ? (
            <div className="pk-actions">
              <button type="button" className="pk-btn" onClick={editing.onCancel} disabled={isSaving}>
                <X size={14} aria-hidden="true" /> Cancel
              </button>
              <button
                type="button"
                className="pk-btn is-solid"
                onClick={() => editing.onSave(globalIndex)}
                disabled={isSaving}
              >
                <Check size={14} aria-hidden="true" /> {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <button type="button" className="pk-btn" onClick={() => editing.onStart(record, globalIndex)}>
              <Pencil size={13} aria-hidden="true" /> Edit
            </button>
          ))}
      </div>

      <div className="ed-fields">
        <Field label="Expected amount">
          <b>{formatAmount(record.expectedAmount)}</b>
        </Field>
        <Field label="Expected date">{formatDate(record.advanceDate)}</Field>

        <Field label="Received amount">
          {isEditing ? (
            <InputNumber
              value={record.receivedAmount}
              onChange={(v) => set("receivedAmount", v)}
              size="middle"
              style={{ width: "100%" }}
              min={0}
              formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
              placeholder="Enter amount"
            />
          ) : (
            <b className={received ? "is-green" : "is-muted"}>{formatAmount(record.receivedAmount || 0)}</b>
          )}
        </Field>
        <Field label="Received date">
          {isEditing ? (
            <DatePicker
              value={record.receivedDate ? dayjs(record.receivedDate) : null}
              onChange={(date) => set("receivedDate", date)}
              format="DD-MM-YYYY"
              style={{ width: "100%" }}
              placeholder="Select date"
            />
          ) : record.receivedDate ? (
            formatDate(record.receivedDate)
          ) : (
            "-"
          )}
        </Field>

        <Field label="Given by">
          {isEditing ? (
            <Input
              value={record.givenBy}
              onChange={(e) => set("givenBy", e.target.value)}
              placeholder="Enter name"
            />
          ) : (
            record.givenBy || "-"
          )}
        </Field>
        <Field label="Collected by">
          {isEditing ? (
            <Input
              value={record.collectedBy}
              onChange={(e) => set("collectedBy", e.target.value)}
              placeholder="Enter name"
            />
          ) : (
            record.collectedBy || "-"
          )}
        </Field>
        <Field label="Mode of payment">
          {isEditing ? (
            <Select
              value={record.modeOfPayment}
              onChange={(v) => set("modeOfPayment", v)}
              style={{ width: "100%" }}
              placeholder="Select mode"
              options={modeOptions}
            />
          ) : (
            record.modeOfPayment || "-"
          )}
        </Field>
      </div>

      {hasRemarks && (
        <div className="ed-remarks">
          <span className="ed-label">Remarks</span>
          {remarks.accounts && (
            <p>
              <em>Accounts:</em> {remarks.accounts}
            </p>
          )}
          {remarks.owner && (
            <p>
              <em>Owner:</em> {remarks.owner}
            </p>
          )}
          {remarks.approver && (
            <p>
              <em>Approver:</em> {remarks.approver}
            </p>
          )}
        </div>
      )}
    </article>
  );
};

const advanceRemarks = (event, record) => {
  const et = event.eventTypes?.[record.eventTypeIndex ?? 0];
  const original = et?.advances?.find((a) => a.advanceNumber === record.advanceNumber);
  const r = original?.remarks;
  return r && typeof r === "object" ? r : null;
};

/** Read-only advances (no `editing`): same shape the editable list uses. */
const readOnlyAdvances = (eventType, eventTypeIndex) =>
  (eventType?.advances || []).map((adv) => ({
    advanceNumber: adv.advanceNumber,
    expectedAmount: adv.expectedAmount,
    advanceDate: adv.advanceDate,
    receivedAmount: adv.receivedAmount || "",
    receivedDate: adv.receivedDate || null,
    givenBy: adv.givenBy || "",
    collectedBy: adv.collectedBy || "",
    modeOfPayment: adv.modeOfPayment || "",
    eventTypeIndex,
  }));

/**
 * Booking details drawer, shared by the Accounts and Marketing bookings dashboards.
 *
 * @param {object}  props.event
 * @param {object=} props.editing  { advances, editingKey, savingIndex, getKey, onChange, onStart, onCancel, onSave }
 *                                 When omitted the drawer is read-only.
 * @param {"payable"|"agreed"=} props.balanceBasis  which total the Balance tile subtracts from
 * @param {"defined"|"always-or-positive"=} props.amountsRule  when an event type shows its amount breakdown
 */
const EventDetailsDrawer = ({
  open,
  onClose,
  event,
  editing,
  balanceBasis = "payable",
  amountsRule = "defined",
}) => {
  const complete = event ? isCompletePaymentWedding(event) : false;
  const single =
    event &&
    (complete || getEventName(event.eventName) !== "Wedding");

  const showAmounts = (eventType) => {
    if (eventType.agreedAmount === undefined) return false;
    if (amountsRule === "always-or-positive") {
      return single ? true : eventType.agreedAmount > 0;
    }
    return true;
  };

  const advancesFor = (eventType, index) =>
    editing ? editing.advances.filter((a) => a.eventTypeIndex === index) : readOnlyAdvances(eventType, index);

  const renderAdvances = (list, modeOptions) =>
    list.length === 0 ? (
      <p className="ed-none">No advances configured</p>
    ) : (
      <div className="ed-advances">
        {list.map((record) => (
          <AdvanceCard
            key={`${record.eventTypeIndex ?? "c"}-${record.advanceNumber}`}
            record={record}
            remarks={event ? advanceRemarks(event, record) : null}
            editing={editing}
            modeOptions={modeOptions}
          />
        ))}
      </div>
    );

  const headerName = event ? getEventName(event.eventName) : "";
  const booked = event ? getTotalPayable(event) : 0;
  const agreed = event ? getTotalAgreedAmount(event) : 0;
  const received = event ? getBookingReceivedAmount(event) : 0;
  const basis = balanceBasis === "agreed" ? agreed : booked;
  const balance = Math.max(basis - received, 0);
  const pct = basis > 0 ? Math.min(Math.round((received / basis) * 100), 100) : 0;

  return (
    <Drawer
      title={
        <div className="pk-who">
          <span className="pk-avatar" aria-hidden="true">
            {String(event?.clientName || headerName || "?").trim().charAt(0).toUpperCase()}
          </span>
          <div style={{ minWidth: 0 }}>
            <strong>{headerName}</strong>
            <span>{event?.clientName || "Event details"}</span>
          </div>
        </div>
      }
      extra={
        event?.eventConfirmation ? (
          <span className={`pk-pill ${CONFIRMATION_TONE[event.eventConfirmation] ?? "is-grey"}`}>
            {event.eventConfirmation}
          </span>
        ) : null
      }
      open={open}
      onClose={onClose}
      width="min(1040px, 94%)"
      placement="right"
      className="event-details-drawer"
      styles={{ body: { padding: 24 } }}
      destroyOnHidden
    >
      {event && (
        <div className="ed">
          {/* Money at a glance */}
          <div className="ed-summary">
            <Money label="Agreed amount" value={agreed} />
            {balanceBasis === "payable" && <Money label="Total payable" value={booked} />}
            <Money label="Received" value={received} tone="green" />
            <Money label="Balance" value={balance} tone="gold" />
            <div className="ed-summary-bar">
              <div className="bk-bar" aria-hidden="true">
                <i style={{ width: `${pct}%` }} />
              </div>
              <span>{pct}% collected</span>
            </div>
          </div>

          {/* Client */}
          <Section title="Client">
            <div className="ed-client">
              <Field label="Client name">
                <b>{event.clientName}</b>
              </Field>
              {event.brideName && event.groomName && (
                <>
                  <Field label="Bride">{event.brideName}</Field>
                  <Field label="Groom">{event.groomName}</Field>
                </>
              )}
              <Field label="Contact">
                <span className="ed-inline">
                  <Phone size={13} aria-hidden="true" /> {event.contactNumber}
                </span>
              </Field>
              {event.altContactNumber && (
                <Field label="Alt contact">
                  <span className="ed-inline">
                    <Phone size={13} aria-hidden="true" /> {event.altContactNumber}
                    {event.altContactName ? ` (${event.altContactName})` : ""}
                  </span>
                </Field>
              )}
              {event.lead1 && (
                <Field label="Project coordinator 1">
                  <span className="ed-inline">
                    <Users size={13} aria-hidden="true" /> {personName(event.lead1)}
                  </span>
                </Field>
              )}
              {event.lead2 && (
                <Field label="Project coordinator 2">
                  <span className="ed-inline">
                    <Users size={13} aria-hidden="true" /> {personName(event.lead2)}
                  </span>
                </Field>
              )}
              {event.note && (
                <Field label="Note" wide>
                  {event.note}
                </Field>
              )}
            </div>
          </Section>

          {complete ? (
            <>
              {/* Complete package: one set of amounts and one set of advances for the whole wedding */}
              {event.eventTypes?.[0] && (
                <Section title="Complete package" aside="Amounts for the whole wedding">
                  <AmountGrid eventType={event.eventTypes[0]} />
                </Section>
              )}

              <Section title="Ceremonies" aside={`${event.eventTypes?.length || 0} events`}>
                <div className="ed-stack">
                  {event.eventTypes?.map((eventType, index) => (
                    <article className="ed-type" key={index}>
                      <header>
                        <h4>{typeName(eventType)}</h4>
                        <span className="pk-pill is-blue">Event {index + 1}</span>
                      </header>
                      <EventTypeTiles eventType={eventType} />
                    </article>
                  ))}
                </div>
              </Section>

              <Section title="Advance payments" aside="Common to the whole package">
                {renderAdvances(
                  editing
                    ? editing.advances
                    : readOnlyAdvances(event.eventTypes?.[0], 0),
                  [
                    { label: "Cash", value: "Cash" },
                    { label: "Account", value: "Account" },
                    { label: "Both", value: "Both" },
                  ],
                )}
              </Section>
            </>
          ) : (
            event.eventTypes?.map((eventType, index) => (
              <Section
                key={index}
                title={
                  event.eventTypes.length > 1 || !single ? typeName(eventType, single ? "Main Event" : "Engagement") : "Event details"
                }
                aside={event.eventTypes.length > 1 || !single ? `Event ${index + 1}` : undefined}
              >
                <div className="ed-stack">
                  <EventTypeTiles eventType={eventType} />

                  {showAmounts(eventType) && (
                    <>
                      <h4 className="ed-sub">Amount breakdown</h4>
                      <AmountGrid eventType={eventType} />
                    </>
                  )}

                  <h4 className="ed-sub">Advance payments</h4>
                  {renderAdvances(advancesFor(eventType, index), [
                    { label: "Cash", value: "cash" },
                    { label: "Account", value: "account" },
                  ])}
                </div>
              </Section>
            ))
          )}
        </div>
      )}
    </Drawer>
  );
};

export default EventDetailsDrawer;
