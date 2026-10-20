import React, { useState, useEffect, useRef, useCallback } from "react";
import { message } from "antd";
import { Plus } from "lucide-react";
import dayjs from "dayjs";
import axiosClient from "@/api/axiosClient";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  AmountField,
  ChoiceField,
  DateField,
  Dialog,
  FormActions,
  LabelAction,
  SelectField,
  TextAreaField,
  TextField,
} from "@/Components/FormKit";
import { PageHero } from "@/Components/PageKit";
import AddVendor from "./vendors/AddVendor";
import "./AddRequirements.css";

const slugify = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, "-");
// Keep spaces inside the event name (for display), only lowercase.
const formatEventName = (s) => String(s || "").trim().toLowerCase();

const statusKeyOf = (ev) => {
  const statusRaw = ev.eventConfirmation || ev.status || ev.client?.eventConfirmation || "";
  return statusRaw === "Confirmed Event"
    ? "confirmed"
    : statusRaw === "Almost Booked"
      ? "almostbooked"
      : statusRaw === "InProgress"
        ? "inprogress"
        : statusRaw === "Cancelled" || statusRaw === "Canceled"
          ? "cancelled"
          : slugify(statusRaw) || "unknown";
};

const eventLabel = (ev) => {
  const eventName =
    typeof ev.eventName === "string" ? ev.eventName : ev.eventName?.name || ev.name || ev.title || "Untitled";
  const clientName = ev.client?.clientName || ev.clientName || "";
  return `${statusKeyOf(ev)}-${formatEventName(eventName)}-${slugify(clientName)}`;
};

const EMPTY = {
  purpose: "",
  remarks: "",
  groupBy: "",
  vendor: "",
  event_reference: "",
  amount: "",
  required_date: "",
  expecting_transaction_in: "",
  priority: "",
};

const AddRequirements = () => {
  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const searchTimeout = useRef(null);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [groupByOptions, setGroupByOptions] = useState([]);
  const [groupByLoading, setGroupByLoading] = useState(false);
  const [groupByModalOpen, setGroupByModalOpen] = useState(false);
  const [newGroupByName, setNewGroupByName] = useState("");
  const [groupError, setGroupError] = useState("");
  const [creatingGroupBy, setCreatingGroupBy] = useState(false);

  const deptId = user?.departments?.length ? user.departments[0].id : null;

  const config = {
    headers: {
      Authorization: user?.access_token,
    },
  };

  const set = (key) => (v) => {
    setValues((p) => ({ ...p, [key]: v }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
  };

  const fetchGroupByOptions = useCallback(async () => {
    const token = user?.access_token;
    if (!token) return;
    const auth = { headers: { Authorization: token } };
    setGroupByLoading(true);
    try {
      const res = await axiosClient.get(`request/group-by`, auth);
      const raw = res?.data?.items ?? res?.data?.data ?? res?.data ?? [];
      setGroupByOptions(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error(err);
      message.error("Failed to load group-by options");
      setGroupByOptions([]);
    } finally {
      setGroupByLoading(false);
    }
  }, [user?.access_token]);

  // Fetch vendors scoped by department
  const fetchVendors = async () => {
    if (!deptId) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(`vendor/all`, config);
      setVendors(res.data.vendors.reverse() || []);
    } catch {
      message.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  // Fetch events list — supports optional server-side search query
  const fetchEvents = async (query = "") => {
    setEventsLoading(true);
    try {
      const res = await axiosClient.get(`events/minimal`, {
        ...config,
        params: query ? { search: query } : {},
      });
      // Expected response: { totalEvents, events: [...] }
      setEvents(res.data.events || res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch events", err);
      message.error("Failed to fetch events");
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    // load initial events list (empty query)
    fetchEvents("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptId]);

  useEffect(() => {
    fetchGroupByOptions();
  }, [fetchGroupByOptions]);

  // Debounced search handler for the event picker
  const handleEventSearch = (value) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchEvents(value.trim());
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const createGroup = async (e) => {
    e?.preventDefault?.();
    const name = String(newGroupByName || "").trim();
    if (!name) {
      setGroupError("Please enter a group name");
      return;
    }
    if (name.length > 200) {
      setGroupError("Name must be at most 200 characters");
      return;
    }
    setCreatingGroupBy(true);
    try {
      const res = await axiosClient.post(`request/group-by`, { name }, config);
      const item = res?.data?.item;
      message.success(res?.data?.message || "Group created");
      await fetchGroupByOptions();
      const newId = item?._id || item?.id;
      if (newId) setValues((p) => ({ ...p, groupBy: newId }));
      setNewGroupByName("");
      setGroupError("");
      setGroupByModalOpen(false);
    } catch (err) {
      if (err?.response?.status === 409) {
        setGroupError("A group with this name already exists");
      } else {
        message.error("Could not create group");
      }
      console.error(err);
    } finally {
      setCreatingGroupBy(false);
    }
  };

  const validate = () => {
    const next = {};
    if (!values.purpose.trim()) next.purpose = "Please enter the purpose";
    if (values.amount === "" || Number(values.amount) < 0) next.amount = "Please enter the amount";
    if (!values.expecting_transaction_in) next.expecting_transaction_in = "Please select account type";
    if (!values.priority) next.priority = "Please select priority";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      purpose: values.purpose.trim(),
      remarks: values.remarks ? String(values.remarks).trim() : "",
      vendor: values.vendor || null,
      event_reference: values.event_reference || null,
      amount: Number(values.amount) || 0,
      required_date: values.required_date ? dayjs(values.required_date).toISOString() : null,
      transation_in: values.expecting_transaction_in?.toUpperCase(),
      priority: values.priority,
    };
    if (values.groupBy) payload.groupBy = values.groupBy;

    setSubmitting(true);
    try {
      await axiosClient.post(`request`, payload, config);
      message.success("Requirement submitted successfully!");
      navigate(-1);
    } catch (error) {
      message.error("Failed to submit requirement");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const vendorOptions = vendors.map((vendor) => ({
    value: vendor.id || vendor._id,
    label: `${
      vendor.vendor_code || vendor.vendor_code === 0 ? vendor.vendor_code.toUpperCase() : ""
    } — ${vendor.name.toUpperCase()}`,
  }));

  const eventOptions = events.map((ev) => ({ value: ev._id || ev.id, label: eventLabel(ev) }));
  const groupOptions = groupByOptions.map((g) => ({ value: g._id || g.id, label: g.name || "—" }));

  return (
    <div className="pk-page">
      <div className="pk-wrap" style={{ maxWidth: 860 }}>
        <PageHero
          eyebrow="Requests"
          title="New requirement"
          subtitle="Tell accounts what you need, how much, and by when."
          onBack={() => navigate(-1)}
          backLabel="Back"
        />

        <form className="rq-form" onSubmit={onSubmit} noValidate>
          <section className="rq-section">
            <header>
              <span className="rq-step">1</span>
              <div>
                <h2>What do you need?</h2>
                <p>A short purpose is enough. Add remarks if there is anything to know.</p>
              </div>
            </header>
            <TextField
              label="Purpose"
              required
              autoFocus
              value={values.purpose}
              onChange={set("purpose")}
              placeholder="e.g. Office supplies, Equipment upgrade"
              error={errors.purpose}
            />
            <TextAreaField
              label="Remarks"
              value={values.remarks}
              onChange={set("remarks")}
              placeholder="Add remarks (optional)"
              rows={3}
            />
            <SelectField
              label="Group by"
              value={values.groupBy}
              onChange={set("groupBy")}
              options={groupOptions}
              placeholder={groupByLoading ? "Loading groups…" : "Select a group (optional)"}
              loading={groupByLoading}
              allowClear
              emptyText="No groups yet — use Add to create one"
              hint="Optional. Tag this requirement under a category (e.g. Catering)."
              labelAction={
                <LabelAction
                  onClick={() => {
                    setNewGroupByName("");
                    setGroupError("");
                    setGroupByModalOpen(true);
                  }}
                >
                  <Plus size={13} aria-hidden="true" /> Add
                </LabelAction>
              }
            />
          </section>

          <section className="rq-section">
            <header>
              <span className="rq-step">2</span>
              <div>
                <h2>Who is it for?</h2>
                <p>Pick the vendor and the event this is linked to, if any.</p>
              </div>
            </header>
            <SelectField
              label="Vendor"
              value={values.vendor}
              onChange={set("vendor")}
              options={vendorOptions}
              placeholder={loading ? "Loading vendors…" : "Search vendor by code or name"}
              loading={loading}
              allowClear
              emptyText="No vendors found"
              labelAction={
                <LabelAction onClick={() => setVendorModalOpen(true)}>
                  <Plus size={13} aria-hidden="true" /> Add vendor
                </LabelAction>
              }
            />
            <SelectField
              label="Event reference"
              value={values.event_reference}
              onChange={set("event_reference")}
              options={eventOptions}
              placeholder={eventsLoading ? "Loading events…" : "Search event or client"}
              loading={eventsLoading}
              onSearch={handleEventSearch}
              onOpen={() => fetchEvents("")}
              allowClear
              emptyText="No events found"
            />
          </section>

          <section className="rq-section">
            <header>
              <span className="rq-step">3</span>
              <div>
                <h2>Amount and timing</h2>
                <p>How much, how it will be paid, and how urgent it is.</p>
              </div>
            </header>
            <div className="rq-grid">
              <AmountField
                label="Amount"
                required
                value={values.amount}
                onChange={set("amount")}
                placeholder="Enter amount"
                error={errors.amount}
              />
              <DateField label="Required date" value={values.required_date} onChange={set("required_date")} />
            </div>
            <ChoiceField
              label="Expecting transaction in"
              required
              value={values.expecting_transaction_in}
              onChange={set("expecting_transaction_in")}
              options={[
                { value: "cash", label: "Cash" },
                { value: "account", label: "Account" },
              ]}
              error={errors.expecting_transaction_in}
            />
            <ChoiceField
              label="Priority"
              required
              value={values.priority}
              onChange={set("priority")}
              options={[
                { value: "HIGH", label: "High", tone: "red" },
                { value: "MEDIUM", label: "Medium", tone: "gold" },
                { value: "LOW", label: "Low", tone: "green" },
              ]}
              error={errors.priority}
            />
          </section>

          <div className="rq-submit">
            <FormActions
              onCancel={() => navigate(-1)}
              submitLabel="Submit requirement"
              busy={submitting}
              busyLabel="Submitting…"
            />
          </div>
        </form>
      </div>

      <Dialog
        open={groupByModalOpen}
        onClose={() => {
          setGroupByModalOpen(false);
          setNewGroupByName("");
        }}
        title="New group"
        width={440}
      >
        <form onSubmit={createGroup} noValidate>
          <p className="rq-note">
            Group names must be unique. This will appear in the Group by list after saving.
          </p>
          <TextField
            label="Group name"
            required
            autoFocus
            value={newGroupByName}
            onChange={(v) => {
              setNewGroupByName(v);
              if (groupError) setGroupError("");
            }}
            placeholder="e.g. Catering, Venue, AV"
            maxLength={200}
            error={groupError}
          />
          <FormActions
            onCancel={() => {
              setGroupByModalOpen(false);
              setNewGroupByName("");
            }}
            submitLabel="Create group"
            busy={creatingGroupBy}
          />
        </form>
      </Dialog>

      <Dialog open={vendorModalOpen} onClose={() => setVendorModalOpen(false)} title="Add vendor" width={900}>
        <AddVendor
          inModal
          defaultDepId={deptId}
          onCancel={() => setVendorModalOpen(false)}
          onSuccess={async (created) => {
            await fetchVendors();
            const createdId =
              created?.id || created?._id || created?.vendor?.id || created?.vendor?._id;
            if (createdId) setValues((p) => ({ ...p, vendor: createdId }));
            setVendorModalOpen(false);
          }}
        />
      </Dialog>
    </div>
  );
};

export default AddRequirements;
