import React, { useEffect, useRef, useState } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import {
  AmountField,
  ChoiceField,
  DateField,
  Dialog,
  FormActions,
  SelectField,
  TextAreaField,
  TextField,
} from "@/Components/FormKit";
import { createInflow, fetchEventsMinimal, updateInflow } from "./daybookApi";
import { ACCOUNT_NAMES, RECEIVED_IN_OPTIONS } from "./daybookConfig";
import { netReceived, validateInflow } from "./daybookMath";
import { formatEventReference, getEventReferenceId } from "./daybookUtils";
import { FieldRow, Readout } from "./DaybookDialogParts";

const accountOptions = ACCOUNT_NAMES.map((a) => ({ value: a, label: a }));

const blank = () => ({
  clientName: "",
  eventDate: "",
  eventReference: "",
  receivedDate: dayjs().format("YYYY-MM-DD"),
  receivedIn: "CASH",
  accountName: "",
  amountReceived: "",
  gstAmount: "",
  tdsAmount: "",
  note: "",
});

const fromRecord = (r) => ({
  clientName: r.clientName ?? "",
  eventDate: r.eventDate ? String(r.eventDate).slice(0, 10) : "",
  eventReference: getEventReferenceId(r.eventReference) ?? "",
  receivedDate: r.receivedDate ? String(r.receivedDate).slice(0, 10) : "",
  receivedIn: r.receivedIn ?? "CASH",
  accountName: r.accountName ?? "",
  amountReceived: r.amountReceived ?? "",
  gstAmount: r.gstAmount || "",
  tdsAmount: r.tdsAmount || "",
  note: r.note ?? "",
});

const eventClient = (ev) => ev?.client?.clientName || ev?.clientName || "";

const eventLabel = (ev) => {
  const name = typeof ev?.eventName === "string" ? ev.eventName : ev?.eventName?.name || ev?.name || "";
  return [eventClient(ev), name].filter(Boolean).join(" — ") || "Untitled event";
};

const DaybookInflowDialog = ({ open, mode, initialValues, authHeaders, onClose, onSaved }) => {
  const isEdit = mode === "edit";
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const searchTimer = useRef(null);

  const set = (key) => (value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const loadEvents = async (query = "") => {
    setEventsLoading(true);
    try {
      const data = await fetchEventsMinimal({ query, authHeaders });
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      message.error("Failed to fetch events");
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    setValues(isEdit && initialValues ? fromRecord(initialValues) : blank());
    setErrors({});
    loadEvents("");
    return () => clearTimeout(searchTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, initialValues]);

  const eventOptions = events.map((ev) => ({
    value: ev._id ?? ev.id,
    label: eventLabel(ev),
    client: eventClient(ev),
  }));
  const savedRef = getEventReferenceId(initialValues?.eventReference);
  if (savedRef && values.eventReference === savedRef && !eventOptions.some((o) => o.value === savedRef)) {
    eventOptions.unshift({
      value: savedRef,
      label: formatEventReference(initialValues.eventReference),
      client: "",
    });
  }

  const onPickEvent = (id) => {
    set("eventReference")(id);
    const picked = eventOptions.find((o) => o.value === id);
    if (picked?.client && !values.clientName.trim()) set("clientName")(picked.client);
  };

  const onSearch = (q) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadEvents(String(q || "").trim()), 300);
  };

  const isAccount = values.receivedIn === "ACCOUNT";
  const net = netReceived(values);

  const submit = async (e) => {
    e?.preventDefault();
    const found = validateInflow(values);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    const payload = {
      clientName: values.clientName.trim(),
      eventDate: values.eventDate,
      eventReference: values.eventReference || null,
      receivedDate: values.receivedDate,
      receivedIn: values.receivedIn,
      accountName: isAccount ? values.accountName : null,
      amountReceived: Number(values.amountReceived),
      gstAmount: isAccount ? Number(values.gstAmount) || 0 : 0,
      tdsAmount: isAccount ? Number(values.tdsAmount) || 0 : 0,
      note: values.note.trim(),
    };
    setSaving(true);
    try {
      if (isEdit) {
        await updateInflow({ id: initialValues?._id ?? initialValues?.id, payload, authHeaders });
      } else {
        await createInflow({ payload, authHeaders });
      }
      onSaved?.(mode);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save inflow");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Edit inflow" : "Add inflow"} width={560}>
      <form onSubmit={submit} noValidate>
        <TextField
          label="Client name"
          value={values.clientName}
          onChange={set("clientName")}
          error={errors.clientName}
          required
          autoFocus
        />
        <FieldRow>
          <DateField label="Event date" value={values.eventDate} onChange={set("eventDate")} error={errors.eventDate} required />
          <DateField label="Received on" value={values.receivedDate} onChange={set("receivedDate")} error={errors.receivedDate} required />
        </FieldRow>
        <SelectField
          label="Event reference (optional)"
          value={values.eventReference}
          onChange={onPickEvent}
          options={eventOptions}
          placeholder={eventsLoading ? "Loading events…" : "Search event or client"}
          loading={eventsLoading}
          onSearch={onSearch}
          allowClear
          emptyText="No events found"
        />
        <AmountField label="Amount received" value={values.amountReceived} onChange={set("amountReceived")} error={errors.amountReceived} required />
        <ChoiceField label="Received in" value={values.receivedIn} onChange={set("receivedIn")} options={RECEIVED_IN_OPTIONS} required />
        {isAccount ? (
          <>
            <SelectField label="Account" value={values.accountName} onChange={set("accountName")} options={accountOptions} placeholder="Select account" error={errors.accountName} required />
            <FieldRow>
              <AmountField label="GST deducted" value={values.gstAmount} onChange={set("gstAmount")} error={errors.gstAmount} />
              <AmountField label="TDS deducted" value={values.tdsAmount} onChange={set("tdsAmount")} error={errors.tdsAmount} />
            </FieldRow>
          </>
        ) : null}
        <Readout
          label="Net amount received"
          value={net}
          formula={isAccount ? "Amount − GST − TDS" : "Cash: no GST / TDS"}
          tone="in"
        />
        <TextAreaField label="Note (optional)" value={values.note} onChange={set("note")} rows={2} />
        <FormActions onCancel={onClose} submitLabel={isEdit ? "Update" : "Add inflow"} busy={saving} />
      </form>
    </Dialog>
  );
};

export default DaybookInflowDialog;
