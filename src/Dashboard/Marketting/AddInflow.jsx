/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  Button,
  InputNumber,
  message,
  Select,
  Space,
  Tag,
  Radio,
  Table,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { API_BASE_URL } from "../../../config";
import axios from "axios";
import { useSelector } from "react-redux";

const { Option } = Select;

// Minimal styles for a clean, compact UI
const customStyles = `
  .glass-card { background: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 6px 18px rgba(3, 16, 33, 0.06); }
  .glass-advance-card { background: #ffffff; border: 1px solid #e6f6ff; border-radius: 8px; padding: 12px; }
  .glass-event-type-card { background: #ffffff; border: 1px solid #cfeefb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .event-type-tag { background: #e6f7ff; color: #0369a1; border-radius: 6px; padding: 4px 8px; font-weight: 600; }
  .gradient-text { color: #0369a1; font-weight: 700; }
  .ant-form-item-label > label { font-weight: 600 !important; color: #0369a1 !important; }
`;

const AddInflow = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [eventName, setEventName] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventTypes, setEventTypes] = useState([]);
  const [eventTypesLoading, setEventTypesLoading] = useState(false);
  const [selectedEventTypes, setSelectedEventTypes] = useState([]);
  const [advanceMode, setAdvanceMode] = useState("separate"); // 'separate' (per-event) or 'complete' (single package)
  const [gstOptions] = useState([
    { label: "No GST", value: 0 },
    { label: "18% GST", value: 0.18 },
    { label: "22% GST", value: 0.22 },
  ]);
  const [coordinators, setCoordinators] = useState([]);
  const [coordinatorsLoading, setCoordinatorsLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [subVenues, setSubVenues] = useState([]);
  const [subVenuesLoading, setSubVenuesLoading] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [eventTypeSubVenues, setEventTypeSubVenues] = useState({}); // { eventTypeId: subVenues[] }
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const axiosConfig = { headers: { Authorization: user?.access_token } };

  // Indian number formatter (groups as per Indian numbering system)
  const formatINR = (val) => {
    if (val === undefined || val === null || val === "") return "";
    const parts = val.toString().split(".");
    let integer = parts[0].replace(/[^0-9]/g, "");
    const fraction = parts[1] ? "." + parts[1] : "";
    if (integer.length <= 3) return integer + fraction;
    const last3 = integer.slice(-3);
    let rest = integer.slice(0, -3);
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return rest + "," + last3 + fraction;
  };

  const indianFormatter = (value) => {
    if (value === undefined || value === null || value === "") return "";
    return `₹${formatINR(value)}`;
  };

  const indianParser = (value) => {
    if (!value && value !== 0) return "";
    return String(value).replace(/[^0-9.-]/g, "");
  };

  const normalizeAmount = (value) => {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = indianParser(value);
    if (parsed === undefined || parsed === null || parsed === "")
      return undefined;
    const numeric = Number(parsed);
    return Number.isNaN(numeric) ? undefined : numeric;
  };

  const calculateGstTotal = (amount, rate) => {
    const amt = normalizeAmount(amount);
    if (amt == null) return 0;
    const r = rate || 0;
    return amt + amt * r;
  };

  const timeFormat = "DD MMM YYYY, hh:mm A";
  const isWeddingLike =
    eventName && eventName.toLowerCase().includes("wedding");

  const handleEventNameChange = async (eventId) => {
    const evt =
      events.find((e) => e.id === eventId || e._id === eventId) || null;
    setSelectedEvent(evt);
    setEventName(evt?.name || "");

    // reset fields related to event types and dates/meta
    setSelectedEventTypes([]);
    setAdvanceMode("separate");
    form.setFieldsValue({
      eventTypes: [],
      eventTypeAdvances: {},
      eventTypeDates: {},
      eventTypeMeta: {},
      advances: [{ expectedAmount: undefined, advanceDate: undefined }],
    });

    // fetch event types for this event
    if (!eventId) {
      setEventTypes([]);
      return;
    }

    setEventTypesLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}event-types/event/${eventId}`,
        axiosConfig
      );
      const data = res.data?.eventTypes || res.data || [];
      setEventTypes(data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load event types");
      setEventTypes([]);
    } finally {
      setEventTypesLoading(false);
    }
  };

  const handleEventTypesChange = (values) => {
    setSelectedEventTypes(values);

    // Initialize advances for new event types (only if in 'separate' mode)
    if (advanceMode === "separate") {
      const currentAdvances = form.getFieldValue("eventTypeAdvances") || {};
      const newAdvances = { ...currentAdvances };

      values.forEach((eventType) => {
        if (!newAdvances[eventType]) {
          newAdvances[eventType] = [
            { expectedAmount: undefined, advanceDate: undefined },
          ];
        }
      });

      // Remove advances for deselected event types
      Object.keys(newAdvances).forEach((key) => {
        if (!values.includes(key)) {
          delete newAdvances[key];
        }
      });

      form.setFieldsValue({ eventTypeAdvances: newAdvances });
    }

    // Initialize per-event-type meta (venue + amounts) AND dates for BOTH modes
    const currentMeta = form.getFieldValue("eventTypeMeta") || {};
    const newMeta = { ...currentMeta };
    values.forEach((eventType) => {
      if (!Object.prototype.hasOwnProperty.call(newMeta, eventType)) {
        newMeta[eventType] = {
          venueLocation: undefined,
          subVenueLocation: undefined,
          totalAgreedAmount: undefined,
          accountAmount: undefined,
          cashAmount: undefined,
        };
      }
    });
    Object.keys(newMeta).forEach((key) => {
      if (!values.includes(key)) {
        delete newMeta[key];
      }
    });
    form.setFieldsValue({ eventTypeMeta: newMeta });

    // Initialize eventTypeDates for all selected event types (both modes)
    const currentDates = form.getFieldValue("eventTypeDates") || {};
    const newDates = { ...currentDates };
    values.forEach((eventType) => {
      if (!Object.prototype.hasOwnProperty.call(newDates, eventType)) {
        newDates[eventType] = { startDate: undefined, endDate: undefined };
      }
    });
    Object.keys(newDates).forEach((key) => {
      if (!values.includes(key)) {
        delete newDates[key];
      }
    });
    form.setFieldsValue({ eventTypeDates: newDates });
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const buildAdvancesPayload = (advanceList = []) =>
        (advanceList || [])
          .map((advance, index) => {
            if (!advance) return null;
            const expectedAmount = normalizeAmount(advance.expectedAmount);
            const advanceDate = advance.advanceDate
              ? advance.advanceDate.toISOString()
              : null;

            if (expectedAmount == null || !advanceDate) {
              return null;
            }

            return {
              advanceNumber: advance.advanceNumber ?? index + 1,
              expectedAmount,
              advanceDate,
              receivedAmount: advance.receivedAmount || null,
              receivedDate: advance.receivedDate || null,
              givenBy: advance.givenBy || null,
              collectedBy: advance.collectedBy || null,
              modeOfPayment: advance.modeOfPayment || null,
              remarks: advance.remarks || "",
              updatedBy: advance.updatedBy || null,
              updatedAt: advance.updatedAt || null,
            };
          })
          .filter(Boolean);

      const hasEventTypes =
        (eventTypes || []).length > 0 && (values.eventTypes || []).length > 0;

      // 🔥 FIX: For complete mode, manually ensure amounts are synced to eventTypeMeta
      if (hasEventTypes && advanceMode === "complete") {
        const agreedAmt = normalizeAmount(values.agreedAmountTotal);
        const accountAmt = normalizeAmount(values.agreedAmountAccount);

        // Ensure eventTypeMeta has the shared amounts
        if (values.eventTypeMeta) {
          (values.eventTypes || []).forEach((typeId) => {
            if (values.eventTypeMeta[typeId]) {
              values.eventTypeMeta[typeId].totalAgreedAmount = agreedAmt;
              values.eventTypeMeta[typeId].accountAmount = accountAmt;
            }
          });
        }
      }

      // SHARED PACKAGE AMOUNTS (no event types case)
      const totalAgreedShared = normalizeAmount(values.agreedAmountTotal);
      const accountAmtShared = normalizeAmount(values.agreedAmountAccount);
      const gstRateShared = 0.18;
      const accountGstShared =
        accountAmtShared != null ? accountAmtShared * gstRateShared : 0;
      const accountTotalShared =
        accountAmtShared != null ? accountAmtShared + accountGstShared : 0;
      const cashAmtShared =
        totalAgreedShared != null && accountAmtShared != null
          ? Math.max(0, totalAgreedShared - accountAmtShared)
          : 0;
      const totalPayableShared = accountTotalShared + cashAmtShared;
      const sharedAdvances = values.advances
        ? buildAdvancesPayload(values.advances)
        : [];

      const perTypePayload = hasEventTypes
        ? (values.eventTypes || []).map((typeId) => {
            const typeMeta = (eventTypes || []).find(
              (t) => t.id === typeId || t._id === typeId
            );
            const typeKey = typeId;
            const startDate = values.eventTypeDates?.[typeKey]?.startDate
              ? values.eventTypeDates[typeKey].startDate.toISOString()
              : null;
            const endDate = values.eventTypeDates?.[typeKey]?.endDate
              ? values.eventTypeDates[typeKey].endDate.toISOString()
              : null;

            const venueLocation =
              values.eventTypeMeta?.[typeKey]?.venueLocation ?? null;
            const subVenueLocation =
              values.eventTypeMeta?.[typeKey]?.subVenueLocation ?? null;
            const coordinator =
              values.eventTypeMeta?.[typeKey]?.coordinator ?? null;

            // ✅ EXACT Backend expected fields
            const totalAgreedPer = normalizeAmount(
              values.eventTypeMeta?.[typeKey]?.totalAgreedAmount
            );
            const accountAmtPer = normalizeAmount(
              values.eventTypeMeta?.[typeKey]?.accountAmount
            );
            const gstRatePer = 0.18;
            const accountGstPer =
              accountAmtPer != null ? accountAmtPer * gstRatePer : 0;
            const accountTotalPer =
              accountAmtPer != null ? accountAmtPer + accountGstPer : 0;
            const cashAmtPer =
              totalAgreedPer != null && accountAmtPer != null
                ? Math.max(0, totalAgreedPer - accountAmtPer)
                : 0;
            const totalPayablePer = accountTotalPer + cashAmtPer;

            const perEventAdvances =
              advanceMode === "separate"
                ? buildAdvancesPayload(
                    values.eventTypeAdvances?.[typeKey] || []
                  )
                : [];

            return {
              // ✅ Backend expects eventTypeId (string), NOT eventType object
              eventTypeId: typeId, // This matches your backend validation
              startDate,
              endDate,
              venueLocation,
              subVenueLocation,
              coordinator,
              // ✅ Backend EXPECTS agreedAmount field (line 192 in your backend)
              agreedAmount: totalAgreedPer,
              accountAmount: accountAmtPer ?? 0,
              accountGst: accountGstPer,
              accountAmountWithGst: accountTotalPer,
              cashAmount: cashAmtPer,
              totalPayable: totalPayablePer,
              advances: perEventAdvances,
            };
          })
        : [];

      const eventTypesPayload =
        hasEventTypes && advanceMode === "separate"
          ? perTypePayload
          : hasEventTypes && advanceMode === "complete"
          ? perTypePayload.map((et) => ({ ...et, advances: sharedAdvances }))
          : [
              {
                // No event types - generic booking
                eventTypeId: null,
                startDate: values.startDate
                  ? values.startDate.toISOString()
                  : null,
                endDate: values.endDate ? values.endDate.toISOString() : null,
                venueLocation: values.venueLocation ?? null,
                subVenueLocation: values.subVenueLocation ?? null,
                agreedAmount: totalAgreedShared,
                accountAmount: accountAmtShared ?? 0,
                accountGst: accountGstShared,
                accountAmountWithGst: accountTotalShared,
                cashAmount: cashAmtShared,
                totalPayable: totalPayableShared,
                advances: sharedAdvances,
              },
            ];

      const payload = {
        eventId: selectedEvent?.id || selectedEvent?._id,
        eventTypes: eventTypesPayload,
        clientName: values.clientName,
        brideName: values.brideName,
        groomName: values.groomName,
        contactNumber: values.contactNumber,
        altContactNumber: values.altContactNumber || undefined,
        altContactName: values.altContactName || undefined,
        lead1: values.lead1 || null,
        lead2: values.lead2 || null,
        note: values.note || undefined,
        eventConfirmation: values.eventConfirmation,
        ...(isWeddingLike && { advancePaymentType: advanceMode }),
      };

      console.log("🔥 FORM VALUES:", JSON.stringify(values, null, 2));
      console.log(
        "🔥 EVENT TYPE META:",
        JSON.stringify(values.eventTypeMeta, null, 2)
      );
      console.log("🔥 FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

      // Validation: Ensure amounts are present
      if (hasEventTypes) {
        // In complete mode, check if shared amounts were entered
        if (advanceMode === "complete") {
          const sharedAgreed = normalizeAmount(values.agreedAmountTotal);
          const sharedAccount = normalizeAmount(values.agreedAmountAccount);
          if (
            sharedAgreed == null ||
            sharedAgreed === 0 ||
            sharedAccount == null ||
            sharedAccount === 0
          ) {
            message.warning(
              "⚠️ Please fill in Agreed Amount and Account Amount for Complete Package"
            );
            setLoading(false);
            return;
          }
        } else {
          // In separate mode, check each event type
          const invalidTypes = payload.eventTypes.filter(
            (et) =>
              (et.agreedAmount == null || et.agreedAmount === 0) &&
              (et.accountAmount == null || et.accountAmount === 0)
          );
          if (invalidTypes.length > 0) {
            message.warning(
              "⚠️ Please fill in Agreed Amount and Account Amount for all event types"
            );
            setLoading(false);
            return;
          }
        }
      }

      const response = await axios.post(
        `${API_BASE_URL}events`,
        payload,
        axiosConfig
      );

      if (response.status === 200 || response.status === 201) {
        message.success("Event booking created successfully!");
        form.resetFields();
        setEventName("");
        setSelectedEventTypes([]);
        navigate("/user/viewclient");
      }
    } catch (error) {
      console.error("❌ Error:", error.response?.data || error.message);
      const errorMsg =
        error.response?.data?.message || "Failed to create booking";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Coordinators
  const fetchCoordinators = async () => {
    setCoordinatorsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}coordinators`, axiosConfig);
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.coordinators)
        ? raw.coordinators
        : Array.isArray(raw.items)
        ? raw.items
        : Array.isArray(raw.data)
        ? raw.data
        : [];
      setCoordinators(list);
    } catch (err) {
      console.error("fetchCoordinators error:", err);
      message.error("Failed to load coordinators");
    } finally {
      setCoordinatorsLoading(false);
    }
  };

  // Fetch Venues
  const fetchVenues = async () => {
    setVenuesLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}venue`, axiosConfig);
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.venues)
        ? raw.venues
        : Array.isArray(raw.items)
        ? raw.items
        : Array.isArray(raw.data)
        ? raw.data
        : [];
      setVenues(list);
    } catch (err) {
      console.error("fetchVenues error:", err);
      message.error("Failed to load venues");
    } finally {
      setVenuesLoading(false);
    }
  };

  // Fetch Sub Venues for a specific venue
  const fetchSubVenues = async (venueId) => {
    if (!venueId) {
      setSubVenues([]);
      return;
    }
    setSubVenuesLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}sub-venue-location`,
        axiosConfig
      );
      const raw = res.data;
      const allSubVenues = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.subVenueLocations)
        ? raw.subVenueLocations
        : Array.isArray(raw.items)
        ? raw.items
        : Array.isArray(raw.data)
        ? raw.data
        : [];
      // Filter sub venues by venue ID
      const filtered = allSubVenues.filter(
        (sv) =>
          sv.venue?.id === venueId ||
          sv.venue === venueId ||
          sv.venueId === venueId
      );
      setSubVenues(filtered);
    } catch (err) {
      console.error("fetchSubVenues error:", err);
      message.error("Failed to load sub venues");
      setSubVenues([]);
    } finally {
      setSubVenuesLoading(false);
    }
  };

  // Fetch Sub Venues for event type venue
  const fetchEventTypeSubVenues = async (venueId, eventTypeId) => {
    if (!venueId) {
      setEventTypeSubVenues((prev) => ({ ...prev, [eventTypeId]: [] }));
      return;
    }
    try {
      const res = await axios.get(
        `${API_BASE_URL}sub-venue-location`,
        axiosConfig
      );
      const raw = res.data;
      const allSubVenues = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.subVenueLocations)
        ? raw.subVenueLocations
        : Array.isArray(raw.items)
        ? raw.items
        : Array.isArray(raw.data)
        ? raw.data
        : [];
      const filtered = allSubVenues.filter(
        (sv) =>
          sv.venue?.id === venueId ||
          sv.venue === venueId ||
          sv.venueId === venueId
      );
      setEventTypeSubVenues((prev) => ({ ...prev, [eventTypeId]: filtered }));
    } catch (err) {
      console.error("fetchEventTypeSubVenues error:", err);
      setEventTypeSubVenues((prev) => ({ ...prev, [eventTypeId]: [] }));
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setEventsLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}event-names`, axiosConfig);
        const data = res.data?.events || res.data || [];
        setEvents(data);
      } catch (err) {
        console.error(err);
        message.error("Failed to load events");
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
    fetchCoordinators();
    fetchVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasEventTypes = (eventTypes || []).length > 0;

  return (
    <div
      className="font-[cormoreg]"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 50%, #ede9fe 100%)",
        padding: "24px",
        position: "relative",
      }}
    >
      <style>{customStyles}</style>

      {/* Animated Background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.4,
          backgroundImage:
            `radial-gradient(circle at 15% 85%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),` +
            `radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),` +
            `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: "24px" }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              size="large"
              style={{
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(124, 58, 237, 0.1))",
                border: "1px solid rgba(79, 70, 229, 0.3)",
                color: "#4f46e5",
                fontWeight: 600,
                height: 48,
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingLeft: 20,
                paddingRight: 24,
              }}
            >
              Back
            </Button>
          </motion.div>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="glass-card slide-in-top" style={{ padding: "40px" }}>
            {/* Header Section */}
            <div style={{ marginBottom: "32px", textAlign: "center" }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    margin: "0 auto 20px",
                    borderRadius: "20px",
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "40px",
                    boxShadow: "0 8px 24px rgba(79, 70, 229, 0.3)",
                  }}
                  className="form-glow"
                >
                  🎉
                </div>
              </motion.div>

              <h1
                className="gradient-text"
                style={{
                  fontSize: "clamp(28px, 5vw, 40px)",
                  fontWeight: 700,
                  margin: "0 0 12px 0",
                }}
              >
                New Event Booking
              </h1>
              <p style={{ color: "#64748b", fontSize: "16px", margin: 0 }}>
                Fill in the details to create a new event booking
              </p>
            </div>

            {/* Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                advances: [
                  { expectedAmount: undefined, advanceDate: undefined },
                ],
                eventConfirmation: "InProgress",
              }}
            >
              {/* Event Confirmation */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Form.Item
                  label="Event Confirmation"
                  name="eventConfirmation"
                  rules={[
                    {
                      required: true,
                      message: "Please select event confirmation status",
                    },
                  ]}
                >
                  <Select
                    size="large"
                    placeholder="Select event confirmation status"
                  >
                    <Option value="InProgress">InProgress</Option>
                    <Option value="Confirmed Event">Confirmed Event</Option>
                  </Select>
                </Form.Item>
              </motion.div>

              {/* Event Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Form.Item
                  label="Event Name"
                  name="eventName"
                  rules={[
                    { required: true, message: "Please select event name" },
                  ]}
                >
                  <Select
                    size="large"
                    placeholder="Select event name"
                    onChange={handleEventNameChange}
                    loading={eventsLoading}
                    suffixIcon={<span style={{ fontSize: "18px" }}>🎪</span>}
                  >
                    {events.map((evt) => (
                      <Option key={evt.id || evt._id} value={evt.id || evt._id}>
                        {evt.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </motion.div>

              {/* Event Types from API (Multiple Selection, only when available) */}
              {eventName && hasEventTypes && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Form.Item
                    label="Event Types"
                    name="eventTypes"
                    rules={[
                      {
                        required: true,
                        message: "Please select at least one event type",
                      },
                    ]}
                  >
                    <Select
                      mode="multiple"
                      size="large"
                      placeholder="Select event types (multiple allowed)"
                      onChange={handleEventTypesChange}
                      maxTagCount="responsive"
                      value={selectedEventTypes}
                      loading={eventTypesLoading}
                    >
                      {eventTypes.map((type) => (
                        <Option
                          key={type.id || type._id}
                          value={type.id || type._id}
                        >
                          {type.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </motion.div>
              )}

              {/* Common Start Date / End Date when there are no event types */}
              {eventName && !hasEventTypes && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <Form.Item
                      label="Start Date"
                      name="startDate"
                      rules={[
                        { required: true, message: "Please select start date" },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        style={{ width: "100%" }}
                        format={timeFormat}
                        showTime={{ use12Hours: true, format: "hh:mm A" }}
                      />
                    </Form.Item>
                    <Form.Item
                      label="End Date"
                      name="endDate"
                      rules={[
                        { required: true, message: "Please select end date" },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        style={{ width: "100%" }}
                        format={timeFormat}
                        showTime={{ use12Hours: true, format: "hh:mm A" }}
                      />
                    </Form.Item>
                  </div>
                </motion.div>
              )}

              {/* Common Leads always shown when an event is selected */}
              {eventName && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.48 }}
                  style={{ marginTop: 12 }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <Form.Item
                      label="Project Coordinator 1"
                      name="lead1"
                      rules={[
                        {
                          required: true,
                          message: "Please select Project Coordinator 1",
                        },
                      ]}
                    >
                      <Select
                        size="large"
                        placeholder="Select Project Coordinator 1"
                        loading={coordinatorsLoading}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.children ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                      >
                        {coordinators.map((coord) => (
                          <Option key={coord.id} value={coord.id}>
                            {coord.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item label="Project Coordinator 2" name="lead2">
                      <Select
                        size="large"
                        placeholder="Select Project Coordinator 2 (optional)"
                        loading={coordinatorsLoading}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.children ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        allowClear
                      >
                        {coordinators.map((coord) => (
                          <Option key={coord.id} value={coord.id}>
                            {coord.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>
                </motion.div>
              )}

              {/* Client Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Form.Item
                  label="Client Name"
                  name="clientName"
                  rules={[
                    { required: true, message: "Please enter client name" },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="Enter client name"
                    prefix={
                      <span
                        style={{ color: "#4f46e5", marginRight: 4, padding: 8 }}
                      >
                        👤
                      </span>
                    }
                  />
                </Form.Item>
              </motion.div>

              {/* Contact Number */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Form.Item
                  label="Contact Number"
                  name="contactNumber"
                  rules={[
                    { required: true, message: "Please enter contact number" },
                    {
                      pattern: /^\d{10}$/,
                      message: "Enter a valid 10-digit number",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="Enter contact number"
                    prefix={
                      <span
                        style={{ color: "#4f46e5", marginRight: 4, padding: 8 }}
                      >
                        📞
                      </span>
                    }
                    maxLength={10}
                  />
                </Form.Item>
              </motion.div>

              {/* Alternative Contact Number */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.42 }}
              >
                <Form.Item
                  label="Alternative Contact Number"
                  name="altContactNumber"
                  rules={[
                    {
                      pattern: /^\d{10}$/,
                      message: "Enter a valid 10-digit number",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="Enter alternative contact number (optional)"
                    prefix={
                      <span
                        style={{ color: "#4f46e5", marginRight: 4, padding: 8 }}
                      >
                        📞
                      </span>
                    }
                    maxLength={10}
                  />
                </Form.Item>
              </motion.div>

              {/* Name of Alternative Contact */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.44 }}
              >
                <Form.Item
                  label="Name of Alternative Contact"
                  name="altContactName"
                >
                  <Input
                    size="large"
                    placeholder="Enter name of person for alternative number"
                  />
                </Form.Item>
              </motion.div>

              {/* Bride & Groom Details - only when event looks like Wedding */}
              {isWeddingLike && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.46 }}
                  >
                    <Form.Item
                      label="Bride Name"
                      name="brideName"
                      rules={[
                        { required: true, message: "Please enter bride name" },
                      ]}
                    >
                      <Input size="large" placeholder="Enter bride name" />
                    </Form.Item>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.48 }}
                  >
                    <Form.Item
                      label="Groom Name"
                      name="groomName"
                      rules={[
                        { required: true, message: "Please enter groom name" },
                      ]}
                    >
                      <Input size="large" placeholder="Enter groom name" />
                    </Form.Item>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Form.Item label="Note" name="note">
                      <Input.TextArea
                        rows={4}
                        placeholder="Any special instructions, preferences, or notes for this wedding (optional)"
                      />
                    </Form.Item>
                  </motion.div>
                </>
              )}

              {/* Venue Location - Only when there are no event types */}
              {eventName && !hasEventTypes && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Form.Item
                    label="Venue Location"
                    name="venueLocation"
                    rules={[
                      {
                        required: true,
                        message: "Please select venue location",
                      },
                    ]}
                  >
                    <Select
                      size="large"
                      placeholder="Select venue"
                      loading={venuesLoading}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.children ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      onChange={(value) => {
                        setSelectedVenueId(value);
                        fetchSubVenues(value);
                        form.setFieldsValue({ subVenueLocation: undefined });
                      }}
                    >
                      {venues.map((venue) => (
                        <Option key={venue.id} value={venue.id}>
                          {venue.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  {selectedVenueId && subVenues.length > 0 && (
                    <Form.Item
                      label="Sub Venue Location"
                      name="subVenueLocation"
                    >
                      <Select
                        size="large"
                        placeholder="Select sub venue (optional)"
                        loading={subVenuesLoading}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.children ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        allowClear
                      >
                        {subVenues.map((subVenue) => (
                          <Option key={subVenue.id} value={subVenue.id}>
                            {subVenue.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  )}
                </motion.div>
              )}

              {/* Agreed Amount with GST - Only when there are no event types */}
              {eventName && !hasEventTypes && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <div
                    className="glass-advance-card"
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#0369a1" }}>
                        Agreed Amount (Package)
                      </div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <Form.Item
                        label="Agreed Amount"
                        name="agreedAmountTotal"
                        rules={[
                          {
                            required: true,
                            message: "Please enter agreed amount",
                          },
                        ]}
                      >
                        <InputNumber
                          size="large"
                          style={{ width: "100%" }}
                          placeholder="Enter agreed amount"
                          formatter={indianFormatter}
                          parser={indianParser}
                          min={0}
                        />
                      </Form.Item>
                      <Form.Item
                        label="Account Amount"
                        name="agreedAmountAccount"
                      >
                        <InputNumber
                          size="large"
                          style={{ width: "100%" }}
                          placeholder="Enter account amount"
                          formatter={indianFormatter}
                          parser={indianParser}
                          min={0}
                        />
                      </Form.Item>
                    </div>
                    <Form.Item
                      shouldUpdate={(prev, cur) =>
                        prev.agreedAmountTotal !== cur.agreedAmountTotal ||
                        prev.agreedAmountAccount !== cur.agreedAmountAccount
                      }
                      noStyle
                    >
                      {({ getFieldValue, setFieldsValue }) => {
                        const agreedAmount = normalizeAmount(
                          getFieldValue("agreedAmountTotal")
                        );
                        const accountAmount = normalizeAmount(
                          getFieldValue("agreedAmountAccount")
                        );
                        const gstRate = 0.18; // Fixed 18% GST
                        const accountWithGst =
                          accountAmount != null
                            ? accountAmount + accountAmount * gstRate
                            : 0;
                        const cashAmount =
                          agreedAmount != null && accountAmount != null
                            ? Math.max(0, agreedAmount - accountAmount)
                            : 0;
                        const clientPayable = cashAmount + accountWithGst;

                        // Auto-update cash amount when account amount changes
                        if (agreedAmount != null && accountAmount != null) {
                          const calculatedCash = Math.max(
                            0,
                            agreedAmount - accountAmount
                          );
                          const currentCash = normalizeAmount(
                            getFieldValue("agreedAmountCash")
                          );
                          if (currentCash !== calculatedCash) {
                            setTimeout(() => {
                              setFieldsValue({
                                agreedAmountCash: calculatedCash,
                              });
                            }, 0);
                          }
                        }

                        return (
                          <>
                            <div
                              style={{
                                marginTop: 12,
                                padding: 12,
                                background: "#f9fafb",
                                borderRadius: 8,
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: 12,
                                  marginBottom: 8,
                                }}
                              >
                                <div>
                                  <span
                                    style={{ fontSize: 13, color: "#6b7280" }}
                                  >
                                    Account Amount:
                                  </span>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: "#111827",
                                    }}
                                  >
                                    ₹{formatINR(accountAmount || 0)}
                                  </div>
                                </div>
                                <div>
                                  <span
                                    style={{ fontSize: 13, color: "#6b7280" }}
                                  >
                                    Account Amount (incl. 18% GST):
                                  </span>
                                  <div
                                    style={{
                                      fontWeight: 700,
                                      color: "#0369a1",
                                    }}
                                  >
                                    ₹{formatINR(accountWithGst || 0)}
                                  </div>
                                </div>
                              </div>
                              <div
                                style={{
                                  marginTop: 8,
                                  paddingTop: 8,
                                  borderTop: "1px dashed #e5e7eb",
                                }}
                              >
                                <div style={{ marginBottom: 8 }}>
                                  <span
                                    style={{ fontSize: 13, color: "#6b7280" }}
                                  >
                                    Cash Amount (Auto-calculated):
                                  </span>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: "#111827",
                                    }}
                                  >
                                    ₹{formatINR(cashAmount || 0)}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    padding: 12,
                                    background: "#e6f7ff",
                                    borderRadius: 6,
                                    border: "1px solid #91d5ff",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 14,
                                      color: "#0369a1",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Total Client Payable:
                                  </span>
                                  <div
                                    style={{
                                      fontSize: 18,
                                      fontWeight: 700,
                                      color: "#0369a1",
                                      marginTop: 4,
                                    }}
                                  >
                                    ₹{formatINR(clientPayable || 0)}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: "#6b7280",
                                      marginTop: 4,
                                    }}
                                  >
                                    (Cash Amount + Account Amount with GST)
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      }}
                    </Form.Item>
                    <Form.Item name="agreedAmountCash" hidden>
                      <InputNumber />
                    </Form.Item>
                  </div>
                </motion.div>
              )}

              {/* Advances + Agreed Amount Section - When event has event types */}
              {eventName && hasEventTypes && selectedEventTypes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  style={{ marginTop: "40px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#0369a1" }}>
                      Advance Payments
                    </div>
                    <Form.Item
                      name="advanceMode"
                      style={{ marginBottom: 0 }}
                      initialValue={advanceMode}
                    >
                      <Radio.Group
                        onChange={(e) => {
                          const val = e.target.value;
                          setAdvanceMode(val);
                          if (val === "complete") {
                            // clear per-type advances but keep per-type dates and meta
                            form.setFieldsValue({ eventTypeAdvances: {} });
                            if (!form.getFieldValue("advances"))
                              form.setFieldsValue({
                                advances: [
                                  {
                                    expectedAmount: undefined,
                                    advanceDate: undefined,
                                  },
                                ],
                              });
                          } else {
                            // clear global advances and initialize per-type advances
                            form.setFieldsValue({ advances: undefined });
                            const curr =
                              form.getFieldValue("eventTypeAdvances") || {};
                            const newAdv = { ...curr };
                            selectedEventTypes.forEach((t) => {
                              if (!newAdv[t])
                                newAdv[t] = [
                                  {
                                    expectedAmount: undefined,
                                    advanceDate: undefined,
                                  },
                                ];
                            });
                            form.setFieldsValue({ eventTypeAdvances: newAdv });
                          }
                        }}
                      >
                        <Radio value="complete">Complete Package</Radio>
                        <Radio value="separate" style={{ marginLeft: 12 }}>
                          Separate / Event Specific
                        </Radio>
                      </Radio.Group>
                    </Form.Item>
                  </div>

                  {advanceMode === "separate" ? (
                    <>
                      {selectedEventTypes.map((eventTypeId) => {
                        const typeMeta = (eventTypes || []).find(
                          (t) => t.id === eventTypeId || t._id === eventTypeId
                        );
                        const label =
                          typeMeta?.name || typeMeta?.label || "Event Type";
                        const key = eventTypeId;
                        return (
                          <div
                            key={key}
                            className="glass-event-type-card"
                            style={{ padding: "24px" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                marginBottom: "20px",
                              }}
                            >
                              <Tag className="event-type-tag">{label}</Tag>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: 12,
                                  marginBottom: 12,
                                }}
                              >
                                <Form.Item
                                  label={`${label} Start`}
                                  name={["eventTypeDates", key, "startDate"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: `Please select start date for ${label}`,
                                    },
                                  ]}
                                >
                                  <DatePicker
                                    size="large"
                                    style={{ width: "100%" }}
                                    format={timeFormat}
                                    showTime={{
                                      use12Hours: true,
                                      format: "hh:mm A",
                                    }}
                                  />
                                </Form.Item>
                                <Form.Item
                                  label={`${label} End`}
                                  name={["eventTypeDates", key, "endDate"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: `Please select end date for ${label}`,
                                    },
                                  ]}
                                >
                                  <DatePicker
                                    size="large"
                                    style={{ width: "100%" }}
                                    format={timeFormat}
                                    showTime={{
                                      use12Hours: true,
                                      format: "hh:mm A",
                                    }}
                                  />
                                </Form.Item>
                              </div>
                              {/* Coordinator dropdown for event-specific packages */}
                              {isWeddingLike && (
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 12,
                                    marginBottom: 12,
                                  }}
                                >
                                  <Form.Item
                                    label={`${label} Coordinator`}
                                    name={["eventTypeMeta", key, "coordinator"]}
                                  >
                                    <Select
                                      size="large"
                                      placeholder={`Select coordinator for ${label}`}
                                      loading={coordinatorsLoading}
                                      showSearch
                                      optionFilterProp="children"
                                      filterOption={(input, option) =>
                                        (option?.children ?? "")
                                          .toLowerCase()
                                          .includes(input.toLowerCase())
                                      }
                                      allowClear
                                    >
                                      {coordinators.map((coord) => (
                                        <Option key={coord.id} value={coord.id}>
                                          {coord.name}
                                        </Option>
                                      ))}
                                    </Select>
                                  </Form.Item>
                                </div>
                              )}
                              <Form.Item
                                label={`${label} Venue`}
                                name={["eventTypeMeta", key, "venueLocation"]}
                                rules={[
                                  {
                                    required: true,
                                    message: `Please select venue for ${label}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={`Select venue for ${label}`}
                                  loading={venuesLoading}
                                  showSearch
                                  optionFilterProp="children"
                                  filterOption={(input, option) =>
                                    (option?.children ?? "")
                                      .toLowerCase()
                                      .includes(input.toLowerCase())
                                  }
                                  onChange={(value) => {
                                    fetchEventTypeSubVenues(value, key);
                                    form.setFieldsValue({
                                      [`eventTypeMeta.${key}.subVenueLocation`]:
                                        undefined,
                                    });
                                  }}
                                >
                                  {venues.map((venue) => (
                                    <Option key={venue.id} value={venue.id}>
                                      {venue.name}
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>
                              {eventTypeSubVenues[key] &&
                                eventTypeSubVenues[key].length > 0 && (
                                  <Form.Item
                                    label={`${label} Sub Venue`}
                                    name={[
                                      "eventTypeMeta",
                                      key,
                                      "subVenueLocation",
                                    ]}
                                  >
                                    <Select
                                      size="large"
                                      placeholder={`Select sub venue for ${label} (optional)`}
                                      showSearch
                                      optionFilterProp="children"
                                      filterOption={(input, option) =>
                                        (option?.children ?? "")
                                          .toLowerCase()
                                          .includes(input.toLowerCase())
                                      }
                                      allowClear
                                    >
                                      {eventTypeSubVenues[key].map(
                                        (subVenue) => (
                                          <Option
                                            key={subVenue.id}
                                            value={subVenue.id}
                                          >
                                            {subVenue.name}
                                          </Option>
                                        )
                                      )}
                                    </Select>
                                  </Form.Item>
                                )}
                              <div
                                className="glass-advance-card"
                                style={{
                                  padding: 12,
                                  borderRadius: 8,
                                  marginTop: 8,
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: 600,
                                    color: "#0369a1",
                                    marginBottom: 8,
                                    fontSize: 14,
                                  }}
                                >
                                  {label} Agreed Amount
                                </div>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                      "repeat(auto-fit, minmax(200px, 1fr))",
                                    gap: 8,
                                  }}
                                >
                                  <Form.Item
                                    label="Agreed Amount"
                                    name={[
                                      "eventTypeMeta",
                                      key,
                                      "totalAgreedAmount",
                                    ]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Please enter agreed amount",
                                      },
                                    ]}
                                  >
                                    <InputNumber
                                      size="large"
                                      style={{ width: "100%" }}
                                      placeholder="Enter agreed amount"
                                      formatter={indianFormatter}
                                      parser={indianParser}
                                      min={0}
                                    />
                                  </Form.Item>
                                  <Form.Item
                                    label="Account Amount"
                                    name={[
                                      "eventTypeMeta",
                                      key,
                                      "accountAmount",
                                    ]}
                                  >
                                    <InputNumber
                                      size="large"
                                      style={{ width: "100%" }}
                                      placeholder="Enter account amount"
                                      formatter={indianFormatter}
                                      parser={indianParser}
                                      min={0}
                                    />
                                  </Form.Item>
                                </div>
                                <Form.Item
                                  shouldUpdate={(prev, cur) =>
                                    prev.eventTypeMeta?.[key]
                                      ?.totalAgreedAmount !==
                                      cur.eventTypeMeta?.[key]
                                        ?.totalAgreedAmount ||
                                    prev.eventTypeMeta?.[key]?.accountAmount !==
                                      cur.eventTypeMeta?.[key]?.accountAmount
                                  }
                                  noStyle
                                >
                                  {({ getFieldValue, setFieldsValue }) => {
                                    const agreedAmount = normalizeAmount(
                                      getFieldValue([
                                        "eventTypeMeta",
                                        key,
                                        "totalAgreedAmount",
                                      ])
                                    );
                                    const accountAmount = normalizeAmount(
                                      getFieldValue([
                                        "eventTypeMeta",
                                        key,
                                        "accountAmount",
                                      ])
                                    );
                                    const gstRate = 0.18; // Fixed 18% GST
                                    const accountWithGst =
                                      accountAmount != null
                                        ? accountAmount +
                                          accountAmount * gstRate
                                        : 0;
                                    const cashAmount =
                                      agreedAmount != null &&
                                      accountAmount != null
                                        ? Math.max(
                                            0,
                                            agreedAmount - accountAmount
                                          )
                                        : 0;
                                    const clientPayable =
                                      cashAmount + accountWithGst;

                                    // Auto-update cash amount
                                    if (
                                      agreedAmount != null &&
                                      accountAmount != null
                                    ) {
                                      const calculatedCash = Math.max(
                                        0,
                                        agreedAmount - accountAmount
                                      );
                                      const currentCash = normalizeAmount(
                                        getFieldValue([
                                          "eventTypeMeta",
                                          key,
                                          "cashAmount",
                                        ])
                                      );
                                      if (currentCash !== calculatedCash) {
                                        setTimeout(() => {
                                          setFieldsValue({
                                            [`eventTypeMeta.${key}.cashAmount`]:
                                              calculatedCash,
                                          });
                                        }, 0);
                                      }
                                    }

                                    return (
                                      <div
                                        style={{
                                          marginTop: 12,
                                          padding: 12,
                                          background: "#f9fafb",
                                          borderRadius: 8,
                                          border: "1px solid #e5e7eb",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: 12,
                                            marginBottom: 8,
                                          }}
                                        >
                                          <div>
                                            <span
                                              style={{
                                                fontSize: 13,
                                                color: "#6b7280",
                                              }}
                                            >
                                              Account Amount:
                                            </span>
                                            <div
                                              style={{
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              ₹{formatINR(accountAmount || 0)}
                                            </div>
                                          </div>
                                          <div>
                                            <span
                                              style={{
                                                fontSize: 13,
                                                color: "#6b7280",
                                              }}
                                            >
                                              Account Amount (incl. 18% GST):
                                            </span>
                                            <div
                                              style={{
                                                fontWeight: 700,
                                                color: "#0369a1",
                                              }}
                                            >
                                              ₹{formatINR(accountWithGst || 0)}
                                            </div>
                                          </div>
                                        </div>
                                        <div
                                          style={{
                                            marginTop: 8,
                                            paddingTop: 8,
                                            borderTop: "1px dashed #e5e7eb",
                                          }}
                                        >
                                          <div style={{ marginBottom: 8 }}>
                                            <span
                                              style={{
                                                fontSize: 13,
                                                color: "#6b7280",
                                              }}
                                            >
                                              Cash Amount (Auto-calculated):
                                            </span>
                                            <div
                                              style={{
                                                fontWeight: 600,
                                                color: "#111827",
                                              }}
                                            >
                                              ₹{formatINR(cashAmount || 0)}
                                            </div>
                                          </div>
                                          <div
                                            style={{
                                              padding: 12,
                                              background: "#e6f7ff",
                                              borderRadius: 6,
                                              border: "1px solid #91d5ff",
                                            }}
                                          >
                                            <span
                                              style={{
                                                fontSize: 14,
                                                color: "#0369a1",
                                                fontWeight: 600,
                                              }}
                                            >
                                              Total Client Payable:
                                            </span>
                                            <div
                                              style={{
                                                fontSize: 18,
                                                fontWeight: 700,
                                                color: "#0369a1",
                                                marginTop: 4,
                                              }}
                                            >
                                              ₹{formatINR(clientPayable || 0)}
                                            </div>
                                            <div
                                              style={{
                                                fontSize: 12,
                                                color: "#6b7280",
                                                marginTop: 4,
                                              }}
                                            >
                                              (Cash Amount + Account Amount with
                                              GST)
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }}
                                </Form.Item>
                                <Form.Item
                                  name={["eventTypeMeta", key, "cashAmount"]}
                                  hidden
                                >
                                  <InputNumber />
                                </Form.Item>
                              </div>
                            </div>
                            <Form.List name={["eventTypeAdvances", key]}>
                              {(fields, { add, remove }) => (
                                <>
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "80px 1fr 1fr 60px",
                                      gap: 8,
                                      padding: "8px 12px",
                                      background: "#f9fafb",
                                      borderRadius: 8,
                                      marginBottom: 8,
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: "#6b7280",
                                    }}
                                  >
                                    <span>No.</span>
                                    <span>Amount</span>
                                    <span>Date</span>
                                    <span>Action</span>
                                  </div>
                                  {fields.map((field, idx) => (
                                    <div
                                      key={field.key}
                                      className="glass-advance-card"
                                      style={{
                                        marginBottom: 8,
                                        padding: "8px 12px",
                                        borderRadius: 8,
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "grid",
                                          gridTemplateColumns:
                                            "80px 1fr 1fr 60px",
                                          gap: 8,
                                          alignItems: "center",
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontWeight: 600,
                                            fontSize: 13,
                                          }}
                                        >
                                          #{idx + 1}
                                        </div>
                                        <Form.Item
                                          key={`expectedAmount-${field.key}`}
                                          name={[field.name, "expectedAmount"]}
                                          isListField={field.isListField}
                                          rules={[
                                            {
                                              required: true,
                                              message: "Enter amount",
                                            },
                                          ]}
                                          style={{ marginBottom: 0 }}
                                        >
                                          <InputNumber
                                            size="large"
                                            style={{ width: "100%" }}
                                            min={0}
                                            formatter={indianFormatter}
                                            parser={indianParser}
                                            placeholder="Enter amount"
                                          />
                                        </Form.Item>
                                        <Form.Item
                                          key={`advanceDate-${field.key}`}
                                          name={[field.name, "advanceDate"]}
                                          isListField={field.isListField}
                                          rules={[
                                            {
                                              required: true,
                                              message: "Select date",
                                            },
                                          ]}
                                          style={{ marginBottom: 0 }}
                                        >
                                          <DatePicker
                                            size="large"
                                            style={{ width: "100%" }}
                                            format={timeFormat}
                                            showTime={{
                                              use12Hours: true,
                                              format: "hh:mm A",
                                            }}
                                          />
                                        </Form.Item>
                                        <div style={{ textAlign: "center" }}>
                                          {fields.length > 1 && (
                                            <Button
                                              type="text"
                                              danger
                                              icon={<DeleteOutlined />}
                                              onClick={() => remove(field.name)}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <Form.Item shouldUpdate noStyle>
                                    {({ getFieldValue }) => {
                                      const agreedAmount = normalizeAmount(
                                        getFieldValue([
                                          "eventTypeMeta",
                                          key,
                                          "totalAgreedAmount",
                                        ])
                                      );
                                      const accountAmount = normalizeAmount(
                                        getFieldValue([
                                          "eventTypeMeta",
                                          key,
                                          "accountAmount",
                                        ])
                                      );
                                      const gstRate = 0.18;
                                      const accountWithGst =
                                        accountAmount != null
                                          ? accountAmount +
                                            accountAmount * gstRate
                                          : 0;
                                      const cashAmount =
                                        agreedAmount != null &&
                                        accountAmount != null
                                          ? Math.max(
                                              0,
                                              agreedAmount - accountAmount
                                            )
                                          : 0;
                                      const clientPayable =
                                        cashAmount + accountWithGst;

                                      const advs =
                                        getFieldValue([
                                          "eventTypeAdvances",
                                          key,
                                        ]) || [];
                                      const paid = advs.reduce((sum, a) => {
                                        const amt = normalizeAmount(
                                          a?.expectedAmount
                                        );
                                        return sum + (amt || 0);
                                      }, 0);
                                      const balance = clientPayable - paid;
                                      const exceeded =
                                        balance < 0 ? Math.abs(balance) : 0;

                                      return (
                                        <div
                                          style={{
                                            marginTop: 8,
                                            paddingTop: 8,
                                            borderTop: "1px dashed #e5e7eb",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 4,
                                            fontSize: 13,
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                            }}
                                          >
                                            <span style={{ color: "#374151" }}>
                                              Balance after advances:
                                            </span>
                                            <span
                                              style={{
                                                fontWeight: 600,
                                                color:
                                                  balance >= 0
                                                    ? "#374151"
                                                    : "#ef4444",
                                              }}
                                            >
                                              {balance >= 0
                                                ? `₹${formatINR(balance || 0)}`
                                                : `-₹${formatINR(
                                                    exceeded || 0
                                                  )}`}
                                            </span>
                                          </div>
                                          {exceeded > 0 && (
                                            <div
                                              style={{
                                                color: "#ef4444",
                                                fontSize: 12,
                                                fontWeight: 600,
                                              }}
                                            >
                                              ⚠️ Amount exceeded by ₹
                                              {formatINR(exceeded)}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }}
                                  </Form.Item>
                                  <div>
                                    <Button
                                      type="dashed"
                                      onClick={() => add()}
                                      block
                                      icon={<PlusOutlined />}
                                    >
                                      Add Advance for {label}
                                    </Button>
                                  </div>
                                </>
                              )}
                            </Form.List>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      {selectedEventTypes.map((eventTypeId) => {
                        const typeMeta = (eventTypes || []).find(
                          (t) => t.id === eventTypeId || t._id === eventTypeId
                        );
                        const label =
                          typeMeta?.name || typeMeta?.label || "Event Type";
                        const key = eventTypeId;
                        return (
                          <div
                            key={key}
                            className="glass-event-type-card"
                            style={{ padding: "24px", marginBottom: 16 }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                marginBottom: "20px",
                              }}
                            >
                              <Tag className="event-type-tag">{label}</Tag>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: 12,
                                  marginBottom: 12,
                                }}
                              >
                                <Form.Item
                                  label={`${label} Start`}
                                  name={["eventTypeDates", key, "startDate"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: `Please select start date for ${label}`,
                                    },
                                  ]}
                                >
                                  <DatePicker
                                    size="large"
                                    style={{ width: "100%" }}
                                    format={timeFormat}
                                    showTime={{
                                      use12Hours: true,
                                      format: "hh:mm A",
                                    }}
                                  />
                                </Form.Item>
                                <Form.Item
                                  label={`${label} End`}
                                  name={["eventTypeDates", key, "endDate"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: `Please select end date for ${label}`,
                                    },
                                  ]}
                                >
                                  <DatePicker
                                    size="large"
                                    style={{ width: "100%" }}
                                    format={timeFormat}
                                    showTime={{
                                      use12Hours: true,
                                      format: "hh:mm A",
                                    }}
                                  />
                                </Form.Item>
                              </div>
                              {/* Coordinator dropdown for event-specific packages */}
                              {isWeddingLike && (
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 12,
                                    marginBottom: 12,
                                  }}
                                >
                                  <Form.Item
                                    label={`${label} Coordinator`}
                                    name={["eventTypeMeta", key, "coordinator"]}
                                  >
                                    <Select
                                      size="large"
                                      placeholder={`Select coordinator for ${label}`}
                                      loading={coordinatorsLoading}
                                      showSearch
                                      optionFilterProp="children"
                                      filterOption={(input, option) =>
                                        (option?.children ?? "")
                                          .toLowerCase()
                                          .includes(input.toLowerCase())
                                      }
                                      allowClear
                                    >
                                      {coordinators.map((coord) => (
                                        <Option key={coord.id} value={coord.id}>
                                          {coord.name}
                                        </Option>
                                      ))}
                                    </Select>
                                  </Form.Item>
                                </div>
                              )}
                              <Form.Item
                                label={`${label} Venue`}
                                name={["eventTypeMeta", key, "venueLocation"]}
                                rules={[
                                  {
                                    required: true,
                                    message: `Please select venue for ${label}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={`Select venue for ${label}`}
                                  loading={venuesLoading}
                                  showSearch
                                  optionFilterProp="children"
                                  filterOption={(input, option) =>
                                    (option?.children ?? "")
                                      .toLowerCase()
                                      .includes(input.toLowerCase())
                                  }
                                  onChange={(value) => {
                                    fetchEventTypeSubVenues(value, key);
                                    form.setFieldsValue({
                                      [`eventTypeMeta.${key}.subVenueLocation`]:
                                        undefined,
                                    });
                                  }}
                                >
                                  {venues.map((venue) => (
                                    <Option key={venue.id} value={venue.id}>
                                      {venue.name}
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>
                              {eventTypeSubVenues[key] &&
                                eventTypeSubVenues[key].length > 0 && (
                                  <Form.Item
                                    label={`${label} Sub Venue`}
                                    name={[
                                      "eventTypeMeta",
                                      key,
                                      "subVenueLocation",
                                    ]}
                                  >
                                    <Select
                                      size="large"
                                      placeholder={`Select sub venue for ${label} (optional)`}
                                      showSearch
                                      optionFilterProp="children"
                                      filterOption={(input, option) =>
                                        (option?.children ?? "")
                                          .toLowerCase()
                                          .includes(input.toLowerCase())
                                      }
                                      allowClear
                                    >
                                      {eventTypeSubVenues[key].map(
                                        (subVenue) => (
                                          <Option
                                            key={subVenue.id}
                                            value={subVenue.id}
                                          >
                                            {subVenue.name}
                                          </Option>
                                        )
                                      )}
                                    </Select>
                                  </Form.Item>
                                )}
                            </div>
                          </div>
                        );
                      })}
                      {/* Agreed Amount (Complete Package) just above common advances */}
                      <div
                        className="glass-advance-card"
                        style={{
                          padding: 16,
                          borderRadius: 8,
                          marginTop: 8,
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 12,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#0369a1",
                              fontSize: 16,
                            }}
                          >
                            Agreed Amount (Complete Package)
                          </div>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 12,
                          }}
                        >
                          <Form.Item
                            label="Agreed Amount"
                            name="agreedAmountTotal"
                            rules={[
                              {
                                required: true,
                                message: "Please enter agreed amount",
                              },
                            ]}
                          >
                            <InputNumber
                              size="large"
                              style={{ width: "100%" }}
                              placeholder="Enter agreed amount"
                              formatter={indianFormatter}
                              parser={indianParser}
                              min={0}
                            />
                          </Form.Item>
                          <Form.Item
                            label="Account Amount"
                            name="agreedAmountAccount"
                            rules={[
                              {
                                required: true,
                                message: "Please enter account amount",
                              },
                            ]}
                          >
                            <InputNumber
                              size="large"
                              style={{ width: "100%" }}
                              placeholder="Enter account amount"
                              formatter={indianFormatter}
                              parser={indianParser}
                              min={0}
                            />
                          </Form.Item>
                        </div>
                        <Form.Item
                          shouldUpdate={(prev, cur) =>
                            prev.agreedAmountTotal !== cur.agreedAmountTotal ||
                            prev.agreedAmountAccount !== cur.agreedAmountAccount
                          }
                          noStyle
                        >
                          {({ getFieldValue, setFieldsValue }) => {
                            const agreedAmount = normalizeAmount(
                              getFieldValue("agreedAmountTotal")
                            );
                            const accountAmount = normalizeAmount(
                              getFieldValue("agreedAmountAccount")
                            );
                            const gstRate = 0.18; // Fixed 18% GST
                            const accountWithGst =
                              accountAmount != null
                                ? accountAmount + accountAmount * gstRate
                                : 0;
                            const cashAmount =
                              agreedAmount != null && accountAmount != null
                                ? Math.max(0, agreedAmount - accountAmount)
                                : 0;
                            const clientPayable = cashAmount + accountWithGst;

                            // Auto-update cash amount when account amount changes
                            if (agreedAmount != null && accountAmount != null) {
                              const calculatedCash = Math.max(
                                0,
                                agreedAmount - accountAmount
                              );
                              const currentCash = normalizeAmount(
                                getFieldValue("agreedAmountCash")
                              );
                              if (currentCash !== calculatedCash) {
                                setTimeout(() => {
                                  setFieldsValue({
                                    agreedAmountCash: calculatedCash,
                                  });
                                }, 0);
                              }
                            }

                            // 🔥 SYNC shared amounts to all event types in eventTypeMeta for "complete" mode
                            if (agreedAmount != null || accountAmount != null) {
                              const currentMeta =
                                getFieldValue("eventTypeMeta") || {};
                              const updatedMeta = { ...currentMeta };
                              selectedEventTypes.forEach((typeId) => {
                                if (updatedMeta[typeId]) {
                                  updatedMeta[typeId].totalAgreedAmount =
                                    agreedAmount;
                                  updatedMeta[typeId].accountAmount =
                                    accountAmount;
                                }
                              });
                              setTimeout(() => {
                                setFieldsValue({ eventTypeMeta: updatedMeta });
                              }, 0);
                            }

                            return (
                              <div
                                style={{
                                  marginTop: 12,
                                  padding: 12,
                                  background: "#f9fafb",
                                  borderRadius: 8,
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 12,
                                    marginBottom: 8,
                                  }}
                                >
                                  <div>
                                    <span
                                      style={{ fontSize: 13, color: "#6b7280" }}
                                    >
                                      Account Amount:
                                    </span>
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        color: "#111827",
                                      }}
                                    >
                                      ₹{formatINR(accountAmount || 0)}
                                    </div>
                                  </div>
                                  <div>
                                    <span
                                      style={{ fontSize: 13, color: "#6b7280" }}
                                    >
                                      Account Amount (incl. 18% GST):
                                    </span>
                                    <div
                                      style={{
                                        fontWeight: 700,
                                        color: "#0369a1",
                                      }}
                                    >
                                      ₹{formatINR(accountWithGst || 0)}
                                    </div>
                                  </div>
                                </div>
                                <div
                                  style={{
                                    marginTop: 8,
                                    paddingTop: 8,
                                    borderTop: "1px dashed #e5e7eb",
                                  }}
                                >
                                  <div style={{ marginBottom: 8 }}>
                                    <span
                                      style={{ fontSize: 13, color: "#6b7280" }}
                                    >
                                      Cash Amount (Auto-calculated):
                                    </span>
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        color: "#111827",
                                      }}
                                    >
                                      ₹{formatINR(cashAmount || 0)}
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      padding: 12,
                                      background: "#e6f7ff",
                                      borderRadius: 6,
                                      border: "1px solid #91d5ff",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 14,
                                        color: "#0369a1",
                                        fontWeight: 600,
                                      }}
                                    >
                                      Total Client Payable:
                                    </span>
                                    <div
                                      style={{
                                        fontSize: 18,
                                        fontWeight: 700,
                                        color: "#0369a1",
                                        marginTop: 4,
                                      }}
                                    >
                                      ₹{formatINR(clientPayable || 0)}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: "#6b7280",
                                        marginTop: 4,
                                      }}
                                    >
                                      (Cash Amount + Account Amount with GST)
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        </Form.Item>
                        <Form.Item name="agreedAmountCash" hidden>
                          <InputNumber />
                        </Form.Item>
                      </div>
                      {/* Common advances for all event types */}
                      <div style={{ marginTop: 16 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#0369a1",
                            marginBottom: 12,
                            fontSize: 16,
                          }}
                        >
                          📦 Advances (Common for All Events)
                        </div>
                        <Form.List name="advances">
                          {(fields, { add, remove }) => (
                            <>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "80px 1fr 1fr 60px",
                                  gap: 8,
                                  padding: "8px 12px",
                                  background: "#f9fafb",
                                  borderRadius: 8,
                                  marginBottom: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "#6b7280",
                                }}
                              >
                                <span>No.</span>
                                <span>Amount</span>
                                <span>Date</span>
                                <span>Action</span>
                              </div>
                              {fields.map((field, idx) => (
                                <div
                                  key={field.key}
                                  className="glass-advance-card"
                                  style={{
                                    marginBottom: 8,
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "80px 1fr 1fr 60px",
                                      gap: 8,
                                      alignItems: "center",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        fontSize: 13,
                                      }}
                                    >
                                      #{idx + 1}
                                    </div>
                                    <Form.Item
                                      key={`expectedAmount-${field.key}`}
                                      name={[field.name, "expectedAmount"]}
                                      isListField={field.isListField}
                                      rules={[
                                        {
                                          required: true,
                                          message: "Enter amount",
                                        },
                                      ]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <InputNumber
                                        size="large"
                                        style={{ width: "100%" }}
                                        min={0}
                                        formatter={indianFormatter}
                                        parser={indianParser}
                                        placeholder="Enter amount"
                                      />
                                    </Form.Item>
                                    <Form.Item
                                      key={`advanceDate-${field.key}`}
                                      name={[field.name, "advanceDate"]}
                                      isListField={field.isListField}
                                      rules={[
                                        {
                                          required: true,
                                          message: "Select date",
                                        },
                                      ]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <DatePicker
                                        size="large"
                                        style={{ width: "100%" }}
                                        format={timeFormat}
                                        showTime={{
                                          use12Hours: true,
                                          format: "hh:mm A",
                                        }}
                                      />
                                    </Form.Item>
                                    <div style={{ textAlign: "center" }}>
                                      {fields.length > 1 && (
                                        <Button
                                          type="text"
                                          danger
                                          icon={<DeleteOutlined />}
                                          onClick={() => remove(field.name)}
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <Form.Item shouldUpdate noStyle>
                                {({ getFieldValue }) => {
                                  const agreedAmount = normalizeAmount(
                                    getFieldValue("agreedAmountTotal")
                                  );
                                  const accountAmount = normalizeAmount(
                                    getFieldValue("agreedAmountAccount")
                                  );
                                  const gstRate = 0.18;
                                  const accountWithGst =
                                    accountAmount != null
                                      ? accountAmount + accountAmount * gstRate
                                      : 0;
                                  const cashAmount =
                                    agreedAmount != null &&
                                    accountAmount != null
                                      ? Math.max(
                                          0,
                                          agreedAmount - accountAmount
                                        )
                                      : 0;
                                  const clientPayable =
                                    cashAmount + accountWithGst;

                                  const advs = getFieldValue("advances") || [];
                                  const paid = advs.reduce((sum, a) => {
                                    const amt = normalizeAmount(
                                      a?.expectedAmount
                                    );
                                    return sum + (amt || 0);
                                  }, 0);
                                  const balance = clientPayable - paid;
                                  const exceeded =
                                    balance < 0 ? Math.abs(balance) : 0;

                                  return (
                                    <div
                                      style={{
                                        marginTop: 8,
                                        paddingTop: 8,
                                        borderTop: "1px dashed #e5e7eb",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 4,
                                        fontSize: 13,
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                        }}
                                      >
                                        <span style={{ color: "#374151" }}>
                                          Balance after advances:
                                        </span>
                                        <span
                                          style={{
                                            fontWeight: 600,
                                            color:
                                              balance >= 0
                                                ? "#374151"
                                                : "#ef4444",
                                          }}
                                        >
                                          {balance >= 0
                                            ? `₹${formatINR(balance || 0)}`
                                            : `-₹${formatINR(exceeded || 0)}`}
                                        </span>
                                      </div>
                                      {exceeded > 0 && (
                                        <div
                                          style={{
                                            color: "#ef4444",
                                            fontSize: 12,
                                            fontWeight: 600,
                                          }}
                                        >
                                          ⚠️ Amount exceeded by ₹
                                          {formatINR(exceeded)}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }}
                              </Form.Item>
                              <div>
                                <Button
                                  type="dashed"
                                  onClick={() => add()}
                                  block
                                  icon={<PlusOutlined />}
                                >
                                  Add Advance Payment
                                </Button>
                              </div>
                            </>
                          )}
                        </Form.List>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Advances Section - For Non-Wedding Events */}
              {eventName && !hasEventTypes && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  style={{ marginTop: "40px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background:
                          "linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(124, 58, 237, 0.1))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                      }}
                    >
                      💰
                    </div>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "18px",
                        color: "#4f46e5",
                      }}
                    >
                      Advance Payments
                    </span>
                  </div>

                  <Form.List name="advances">
                    {(fields, { add, remove }) => (
                      <>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "80px 1fr 1fr 60px",
                            gap: 8,
                            padding: "8px 12px",
                            background: "#f9fafb",
                            borderRadius: 8,
                            marginBottom: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#6b7280",
                          }}
                        >
                          <span>No.</span>
                          <span>Amount</span>
                          <span>Date</span>
                          <span>Action</span>
                        </div>
                        {fields.map((field, idx) => (
                          <div
                            key={field.key}
                            className="glass-advance-card"
                            style={{
                              marginBottom: 8,
                              padding: "8px 12px",
                              borderRadius: 8,
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "80px 1fr 1fr 60px",
                                gap: 8,
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: 13,
                                }}
                              >
                                #{idx + 1}
                              </div>
                              <Form.Item
                                key={`expectedAmount-${field.key}`}
                                name={[field.name, "expectedAmount"]}
                                isListField={field.isListField}
                                rules={[
                                  {
                                    required: true,
                                    message: "Enter amount",
                                  },
                                ]}
                                style={{ marginBottom: 0 }}
                              >
                                <InputNumber
                                  size="large"
                                  style={{ width: "100%" }}
                                  min={0}
                                  formatter={indianFormatter}
                                  parser={indianParser}
                                  placeholder="Enter amount"
                                />
                              </Form.Item>
                              <Form.Item
                                key={`advanceDate-${field.key}`}
                                name={[field.name, "advanceDate"]}
                                isListField={field.isListField}
                                rules={[
                                  {
                                    required: true,
                                    message: "Select date",
                                  },
                                ]}
                                style={{ marginBottom: 0 }}
                              >
                                <DatePicker
                                  size="large"
                                  style={{ width: "100%" }}
                                  format={timeFormat}
                                  showTime={{
                                    use12Hours: true,
                                    format: "hh:mm A",
                                  }}
                                />
                              </Form.Item>
                              <div style={{ textAlign: "center" }}>
                                {fields.length > 1 && (
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => remove(field.name)}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <Form.Item shouldUpdate noStyle>
                          {({ getFieldValue }) => {
                            const agreedAmount = normalizeAmount(
                              getFieldValue("agreedAmountTotal")
                            );
                            const accountAmount = normalizeAmount(
                              getFieldValue("agreedAmountAccount")
                            );
                            const gstRate = 0.18;
                            const accountWithGst =
                              accountAmount != null
                                ? accountAmount + accountAmount * gstRate
                                : 0;
                            const cashAmount =
                              agreedAmount != null && accountAmount != null
                                ? Math.max(0, agreedAmount - accountAmount)
                                : 0;
                            const clientPayable = cashAmount + accountWithGst;

                            const advs = getFieldValue("advances") || [];
                            const paid = advs.reduce((sum, a) => {
                              const amt = normalizeAmount(a?.expectedAmount);
                              return sum + (amt || 0);
                            }, 0);
                            const balance = clientPayable - paid;
                            const exceeded =
                              balance < 0 ? Math.abs(balance) : 0;

                            return (
                              <div
                                style={{
                                  marginTop: 8,
                                  paddingTop: 8,
                                  borderTop: "1px dashed #e5e7eb",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 4,
                                  fontSize: 13,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <span style={{ color: "#374151" }}>
                                    Balance after advances:
                                  </span>
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      color:
                                        balance >= 0 ? "#374151" : "#ef4444",
                                    }}
                                  >
                                    {balance >= 0
                                      ? `₹${formatINR(balance || 0)}`
                                      : `-₹${formatINR(exceeded || 0)}`}
                                  </span>
                                </div>
                                {exceeded > 0 && (
                                  <div
                                    style={{
                                      color: "#ef4444",
                                      fontSize: 12,
                                      fontWeight: 600,
                                    }}
                                  >
                                    ⚠️ Amount exceeded by ₹{formatINR(exceeded)}
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        </Form.Item>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            type="dashed"
                            onClick={() => add()}
                            block
                            icon={<PlusOutlined />}
                            size="large"
                            style={{
                              height: "56px",
                              fontSize: "15px",
                            }}
                          >
                            Add Advance Payment
                          </Button>
                        </motion.div>
                      </>
                    )}
                  </Form.List>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Form.Item style={{ marginTop: "40px", marginBottom: 0 }}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={loading}
                      block
                      style={{
                        height: "56px",
                        borderRadius: "12px",
                        fontSize: "17px",
                        fontWeight: 600,
                        background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                        border: "none",
                        boxShadow: "0 8px 24px rgba(79, 70, 229, 0.3)",
                      }}
                    >
                      ✨ Create Booking
                    </Button>
                  </motion.div>
                </Form.Item>
              </motion.div>
            </Form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AddInflow;
