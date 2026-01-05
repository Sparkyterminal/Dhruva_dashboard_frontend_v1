/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
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
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
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
  .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 20px; }
  @keyframes slide-in-top {
    0% {
      transform: translateY(-50px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
  .slide-in-top {
    animation: slide-in-top 0.6s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
  }
  @keyframes glow-pulse { 0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); } 50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.5); } }
  .form-glow { animation: glow-pulse 3s ease-in-out infinite; }
`;

const EditInflow = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventTypes, setEventTypes] = useState([]);
  const [eventTypesLoading, setEventTypesLoading] = useState(false);
  const [selectedEventTypes, setSelectedEventTypes] = useState([]);
  const [advanceMode, setAdvanceMode] = useState("separate");
  const [gstOptions] = useState([
    { label: "No GST", value: 0 },
    { label: "18% GST", value: 0.18 },
    { label: "22% GST", value: 0.22 },
  ]);
  const navigate = useNavigate();
  const { id } = useParams();
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
    selectedEvent?.name && selectedEvent.name.toLowerCase().includes("wedding");

  // Fetch events list
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
  }, []);

  const fetchEventData = async () => {
    setInitialLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}events/${id}`);
      const event = res.data.event;
      console.log("Fetched event:", event);

      // Find the event in the events list
      const eventObj =
        events.find(
          (e) =>
            e.name === event.eventName ||
            e.id === event.eventId ||
            e._id === event.eventId
        ) || null;
      setSelectedEvent(eventObj);

      // Fetch event types if event has event types
      if (eventObj) {
        setEventTypesLoading(true);
        try {
          const eventTypesRes = await axios.get(
            `${API_BASE_URL}event-types/event/${eventObj.id || eventObj._id}`,
            axiosConfig
          );
          const eventTypesData =
            eventTypesRes.data?.eventTypes || eventTypesRes.data || [];
          setEventTypes(eventTypesData);
        } catch (err) {
          console.error(err);
          setEventTypes([]);
        } finally {
          setEventTypesLoading(false);
        }
      }

      const hasEventTypes =
        eventTypes.length > 0 && event.eventTypes?.length > 0;
      const eventTypesFromEvent = event.eventTypes || [];

      if (hasEventTypes) {
        // Map event types from event to IDs
        const selectedTypeIds = eventTypesFromEvent
          .map((et) => {
            const typeId =
              et.eventTypeId || et.eventType?.id || et.eventType?._id;
            if (typeId) return typeId;
            // Fallback: find by name
            const found = eventTypes.find(
              (t) => t.name === et.eventType || t.name === et.eventType?.name
            );
            return found?.id || found?._id;
          })
          .filter(Boolean);
        setSelectedEventTypes(selectedTypeIds);

        // Check if it's complete package or separate mode
        const hasTopLevelAgreedAmount =
          event.agreedAmount !== undefined && event.agreedAmount !== null;
        const hasTopLevelAdvances = event.advances && event.advances.length > 0;
        const mode =
          hasTopLevelAgreedAmount || hasTopLevelAdvances
            ? "complete"
            : "separate";
        setAdvanceMode(mode);

        // Prepare form values
        const formValues = {
          eventName: eventObj?.id || eventObj?._id || null,
          clientName: event.clientName,
          brideName: event.brideName,
          groomName: event.groomName,
          contactNumber: event.contactNumber,
          altContactNumber: event.altContactNumber,
          altContactName: event.altContactName,
          lead1: event.lead1,
          lead2: event.lead2,
          note: event.note,
          eventTypes: selectedTypeIds,
        };

        // Initialize dates and meta for each event type
        const eventTypeDates = {};
        const eventTypeMeta = {};
        const eventTypeAdvances = {};

        eventTypesFromEvent.forEach((et, idx) => {
          const typeId =
            selectedTypeIds[idx] ||
            et.eventTypeId ||
            et.eventType?.id ||
            et.eventType?._id;
          if (!typeId) return;

          eventTypeDates[typeId] = {
            startDate: et.startDate ? dayjs(et.startDate) : undefined,
            endDate: et.endDate ? dayjs(et.endDate) : undefined,
          };

          const breakup = et.agreedAmountBreakup || {};
          eventTypeMeta[typeId] = {
            venueLocation: et.venueLocation,
            totalAgreedAmount: et.agreedAmount,
            accountAmount: breakup.accountAmount,
            cashAmount: breakup.cashAmount,
            gstRate: breakup.accountGstRate || 0,
          };

          if (mode === "separate" && et.advances) {
            eventTypeAdvances[typeId] = et.advances.map((adv) => ({
              expectedAmount: adv.expectedAmount,
              advanceDate: adv.advanceDate ? dayjs(adv.advanceDate) : undefined,
              advanceNumber: adv.advanceNumber,
              receivedAmount: adv.receivedAmount,
              receivedDate: adv.receivedDate
                ? dayjs(adv.receivedDate)
                : undefined,
              remarks: adv.remarks,
              updatedBy: adv.updatedBy,
              updatedAt: adv.updatedAt,
            }));
          }
        });

        formValues.eventTypeDates = eventTypeDates;
        formValues.eventTypeMeta = eventTypeMeta;

        if (mode === "separate") {
          formValues.eventTypeAdvances = eventTypeAdvances;
        } else {
          // Complete package mode
          const breakup = event.agreedAmountBreakup || {};
          formValues.agreedAmountTotal = event.agreedAmount;
          formValues.agreedAmountAccount = breakup.accountAmount;
          formValues.agreedAmountCash = breakup.cashAmount;
          formValues.agreedAmountAccountGstRate = breakup.accountGstRate || 0;
          formValues.advances = (event.advances || []).map((adv) => ({
            expectedAmount: adv.expectedAmount,
            advanceDate: adv.advanceDate ? dayjs(adv.advanceDate) : undefined,
            advanceNumber: adv.advanceNumber,
            receivedAmount: adv.receivedAmount,
            receivedDate: adv.receivedDate
              ? dayjs(adv.receivedDate)
              : undefined,
            remarks: adv.remarks,
            updatedBy: adv.updatedBy,
            updatedAt: adv.updatedAt,
          }));
        }

        form.setFieldsValue(formValues);
      } else {
        // Non-wedding event or event without event types
        const eventType = eventTypesFromEvent[0] || {};
        const breakup =
          eventType.agreedAmountBreakup || event.agreedAmountBreakup || {};
        form.setFieldsValue({
          eventName: eventObj?.id || eventObj?._id || null,
          customEventName:
            event.eventName === "Other" ? eventType.eventType : undefined,
          clientName: event.clientName,
          contactNumber: event.contactNumber,
          altContactNumber: event.altContactNumber,
          altContactName: event.altContactName,
          lead1: event.lead1,
          lead2: event.lead2,
          startDate: eventType.startDate
            ? dayjs(eventType.startDate)
            : undefined,
          endDate: eventType.endDate ? dayjs(eventType.endDate) : undefined,
          venueLocation: eventType.venueLocation,
          agreedAmountTotal: eventType.agreedAmount || event.agreedAmount,
          agreedAmountAccount: breakup.accountAmount,
          agreedAmountCash: breakup.cashAmount,
          agreedAmountAccountGstRate: breakup.accountGstRate || 0,
          advances: (eventType.advances || event.advances || []).map((adv) => ({
            expectedAmount: adv.expectedAmount,
            advanceDate: adv.advanceDate ? dayjs(adv.advanceDate) : undefined,
            advanceNumber: adv.advanceNumber,
            receivedAmount: adv.receivedAmount,
            receivedDate: adv.receivedDate
              ? dayjs(adv.receivedDate)
              : undefined,
            remarks: adv.remarks,
            updatedBy: adv.updatedBy,
            updatedAt: adv.updatedAt,
          })),
        });
      }
    } catch (err) {
      console.error("Error fetching event:", err);
      message.error("Failed to fetch event data");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (events.length > 0) {
      fetchEventData();
    }
  }, [id, events.length]);

  const handleEventNameChange = async (eventId) => {
    const evt =
      events.find((e) => e.id === eventId || e._id === eventId) || null;
    setSelectedEvent(evt);

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

    // Initialize per-event-type meta (venue + agreedAmount) AND dates for BOTH modes
    const currentMeta = form.getFieldValue("eventTypeMeta") || {};
    const newMeta = { ...currentMeta };
    values.forEach((eventType) => {
      if (!Object.prototype.hasOwnProperty.call(newMeta, eventType)) {
        newMeta[eventType] = {
          venueLocation: undefined,
          totalAgreedAmount: undefined,
          accountAmount: undefined,
          cashAmount: undefined,
          gstRate: 0,
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
              receivedAmount: advance.receivedAmount,
              receivedDate: advance.receivedDate,
              remarks: advance.remarks,
              updatedBy: advance.updatedBy,
              updatedAt: advance.updatedAt,
            };
          })
          .filter(Boolean);

      const hasEventTypes =
        (eventTypes || []).length > 0 && (values.eventTypes || []).length > 0;
      const selectedTypes = (values.eventTypes || []).map((id) =>
        (eventTypes || []).find((t) => t.id === id || t._id === id)
      );

      // shared (no event types or complete package mode)
      const totalAgreedShared = normalizeAmount(values.agreedAmountTotal);
      const accountAmtShared = normalizeAmount(values.agreedAmountAccount);
      const cashAmtShared = normalizeAmount(values.agreedAmountCash);
      const gstRateShared = values.agreedAmountAccountGstRate || 0;
      const accountTotalShared =
        accountAmtShared != null
          ? accountAmtShared + accountAmtShared * gstRateShared
          : 0;
      const sharedAgreedAmount =
        totalAgreedShared != null
          ? totalAgreedShared
          : accountAmtShared != null || cashAmtShared != null
          ? (accountTotalShared || 0) + (cashAmtShared || 0)
          : undefined;
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

            const totalAgreedPer = normalizeAmount(
              values.eventTypeMeta?.[typeKey]?.totalAgreedAmount
            );
            const accountAmtPer = normalizeAmount(
              values.eventTypeMeta?.[typeKey]?.accountAmount
            );
            const cashAmtPer = normalizeAmount(
              values.eventTypeMeta?.[typeKey]?.cashAmount
            );
            const gstRatePer =
              values.eventTypeMeta?.[typeKey]?.gstRate != null
                ? values.eventTypeMeta[typeKey].gstRate
                : 0;
            const accountTotalPer =
              accountAmtPer != null
                ? accountAmtPer + accountAmtPer * gstRatePer
                : 0;
            const perEventAgreedAmount =
              totalAgreedPer != null
                ? totalAgreedPer
                : accountAmtPer != null || cashAmtPer != null
                ? (accountTotalPer || 0) + (cashAmtPer || 0)
                : 0;

            const perEventAdvances =
              advanceMode === "separate"
                ? buildAdvancesPayload(
                    values.eventTypeAdvances?.[typeKey] || []
                  )
                : [];

            return {
              eventTypeId: typeMeta?.id || typeMeta?._id || typeKey,
              eventType: typeMeta?.name || typeMeta?.label || String(typeKey),
              startDate,
              endDate,
              venueLocation,
              agreedAmount: perEventAgreedAmount,
              agreedAmountBreakup: {
                accountAmount: accountAmtPer ?? 0,
                cashAmount: cashAmtPer ?? 0,
                accountGstRate: gstRatePer,
                accountGstAmount:
                  accountAmtPer != null ? accountTotalPer - accountAmtPer : 0,
                accountTotalWithGst: accountTotalPer || 0,
              },
              advances: perEventAdvances,
            };
          })
        : [];

      const eventTypesPayload =
        hasEventTypes && advanceMode === "separate"
          ? perTypePayload
          : hasEventTypes && advanceMode === "complete"
          ? perTypePayload.map((et) => ({
              ...et,
              // use common (shared) advances when in complete package mode
              advances: sharedAdvances,
            }))
          : [
              {
                eventTypeId: null,
                eventType: null,
                startDate: values.startDate
                  ? values.startDate.toISOString()
                  : null,
                endDate: values.endDate ? values.endDate.toISOString() : null,
                venueLocation: values.venueLocation ?? null,
                ...(sharedAgreedAmount != null && {
                  agreedAmount: sharedAgreedAmount,
                  agreedAmountBreakup: {
                    accountAmount: accountAmtShared ?? null,
                    cashAmount: cashAmtShared ?? null,
                    accountGstRate: gstRateShared,
                    accountGstAmount:
                      accountAmtShared != null
                        ? accountTotalShared - accountAmtShared
                        : null,
                    accountTotalWithGst: accountTotalShared || null,
                  },
                }),
                advances: sharedAdvances,
              },
            ];

      const payload = {
        eventId: selectedEvent?.id || selectedEvent?._id || null,
        eventName:
          selectedEvent?.name ||
          (values.eventName === "Other"
            ? values.customEventName
            : selectedEvent?.name),
        eventTypes: eventTypesPayload,
        clientName: values.clientName,
        contactNumber: values.contactNumber,
        lead1: values.lead1 ?? "",
        lead2: values.lead2 ?? "",
        ...(isWeddingLike && {
          brideName: values.brideName,
          groomName: values.groomName,
          note: values.note,
        }),
        ...(values.altContactNumber && {
          altContactNumber: values.altContactNumber,
        }),
        ...(values.altContactName && { altContactName: values.altContactName }),
      };

      // Log payload for debugging
      console.log("Updating payload:", JSON.stringify(payload, null, 2));

      const response = await axios.put(
        `${API_BASE_URL}events/${id}/edit`,
        payload
      );

      if (response.status === 200 || response.status === 201) {
        message.success("Event booking updated successfully!");
        navigate("/user/viewclient");
      }
    } catch (error) {
      console.error("Error:", error);

      if (error.response) {
        const status = error.response.status;
        const errorMsg =
          error.response.data?.message || error.response.data?.error;

        if (status === 400) {
          message.error(
            errorMsg || "Invalid booking data. Please check your inputs."
          );
        } else if (status === 401) {
          message.error("Unauthorized. Please login again.");
        } else if (status === 403) {
          message.error("You don't have permission to update bookings.");
        } else if (status === 409) {
          message.error(
            errorMsg || "Booking conflict. Please check the details."
          );
        } else if (status >= 500) {
          message.error("Server error. Please try again later.");
        } else {
          message.error(
            errorMsg || "Failed to update booking. Please try again."
          );
        }
      } else if (error.request) {
        message.error(
          "Network error. Please check your connection and try again."
        );
      } else {
        message.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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
          className="loading-container"
          style={{ position: "relative", zIndex: 10 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
                boxShadow: "0 8px 24px rgba(79, 70, 229, 0.4)",
              }}
              className="form-glow"
            >
              📋
            </div>
          </motion.div>
          <h2
            className="gradient-text"
            style={{ fontSize: "24px", fontWeight: 700 }}
          >
            Loading booking data...
          </h2>
        </div>
      </div>
    );
  }

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

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="glass-card slide-in-top" style={{ padding: "40px" }}>
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
                  ✏️
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
                Edit Event Booking
              </h1>
              <p style={{ color: "#64748b", fontSize: "16px", margin: 0 }}>
                Modify the details and save your changes
              </p>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                advances: [
                  { expectedAmount: undefined, advanceDate: undefined },
                ],
              }}
            >
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
              {selectedEvent && hasEventTypes && (
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
              {selectedEvent && !hasEventTypes && (
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
              {selectedEvent && (
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
                          message: "Please enter Project Coordinator 1",
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="Enter Project Coordinator 1"
                      />
                    </Form.Item>
                    <Form.Item label="Project Coordinator 2" name="lead2">
                      <Input
                        size="large"
                        placeholder="Enter Project Coordinator 2 (optional)"
                      />
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

              {/* Venue Location - Only when there are no event types */}
              {selectedEvent && !hasEventTypes && (
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
                        message: "Please enter venue location",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Enter venue location"
                      prefix={
                        <span
                          style={{
                            color: "#4f46e5",
                            marginRight: 4,
                            padding: 8,
                          }}
                        >
                          📍
                        </span>
                      }
                    />
                  </Form.Item>
                </motion.div>
              )}

              {/* Agreed Amount with GST - Only when there are no event types */}
              {selectedEvent && !hasEventTypes && (
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
                        label="Total Agreed Amount (incl. GST)"
                        name="agreedAmountTotal"
                      >
                        <InputNumber
                          size="large"
                          style={{ width: "100%" }}
                          placeholder="Enter total agreed amount (incl. GST)"
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
                            required: false,
                          },
                        ]}
                      >
                        <InputNumber
                          size="large"
                          style={{ width: "100%" }}
                          placeholder="Enter amount through account"
                          formatter={indianFormatter}
                          parser={indianParser}
                          min={0}
                        />
                      </Form.Item>
                      <Form.Item
                        label="GST on Account"
                        name="agreedAmountAccountGstRate"
                        initialValue={0}
                      >
                        <Select size="large">
                          {gstOptions.map((g) => (
                            <Option key={g.value} value={g.value}>
                              {g.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item label="Cash Amount" name="agreedAmountCash">
                        <InputNumber
                          size="large"
                          style={{ width: "100%" }}
                          placeholder="Enter amount through cash"
                          formatter={indianFormatter}
                          parser={indianParser}
                          min={0}
                        />
                      </Form.Item>
                    </div>
                    <Form.Item
                      shouldUpdate={(prev, cur) =>
                        prev.agreedAmountAccount !== cur.agreedAmountAccount ||
                        prev.agreedAmountAccountGstRate !==
                          cur.agreedAmountAccountGstRate
                      }
                      noStyle
                    >
                      {({ getFieldValue }) => {
                        const acc = getFieldValue("agreedAmountAccount");
                        const rate =
                          getFieldValue("agreedAmountAccountGstRate") || 0;
                        const total = calculateGstTotal(acc, rate);
                        return (
                          <div
                            style={{
                              marginTop: 8,
                              paddingTop: 8,
                              borderTop: "1px dashed #e5e7eb",
                              display: "flex",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: 8,
                            }}
                          >
                            <span style={{ fontSize: 13, color: "#6b7280" }}>
                              Account total (incl. GST):
                            </span>
                            <span style={{ fontWeight: 700, color: "#111827" }}>
                              ₹{formatINR(total || 0)}
                            </span>
                          </div>
                        );
                      }}
                    </Form.Item>
                  </div>
                </motion.div>
              )}

              {/* Advances + Agreed Amount Section - When event has event types */}
              {selectedEvent &&
                hasEventTypes &&
                selectedEventTypes.length > 0 && (
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
                              form.setFieldsValue({
                                eventTypeAdvances: newAdv,
                              });
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
                                <Form.Item
                                  label={`${label} Venue`}
                                  name={["eventTypeMeta", key, "venueLocation"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: `Please enter venue for ${label}`,
                                    },
                                  ]}
                                >
                                  <Input
                                    size="large"
                                    placeholder={`Venue for ${label}`}
                                  />
                                </Form.Item>
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
                                      label="Total Agreed Amount (incl. GST)"
                                      name={[
                                        "eventTypeMeta",
                                        key,
                                        "totalAgreedAmount",
                                      ]}
                                      rules={[
                                        {
                                          required: true,
                                          message:
                                            "Please enter total agreed amount",
                                        },
                                      ]}
                                    >
                                      <InputNumber
                                        size="large"
                                        style={{ width: "100%" }}
                                        placeholder="Total agreed amount for this event (incl. GST)"
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
                                        placeholder="Amount through account"
                                        formatter={indianFormatter}
                                        parser={indianParser}
                                        min={0}
                                      />
                                    </Form.Item>
                                    <Form.Item
                                      label="GST on Account"
                                      name={["eventTypeMeta", key, "gstRate"]}
                                      initialValue={0}
                                    >
                                      <Select size="large">
                                        {gstOptions.map((g) => (
                                          <Option key={g.value} value={g.value}>
                                            {g.label}
                                          </Option>
                                        ))}
                                      </Select>
                                    </Form.Item>
                                    <Form.Item
                                      label="Cash Amount"
                                      name={[
                                        "eventTypeMeta",
                                        key,
                                        "cashAmount",
                                      ]}
                                    >
                                      <InputNumber
                                        size="large"
                                        style={{ width: "100%" }}
                                        placeholder="Amount through cash"
                                        formatter={indianFormatter}
                                        parser={indianParser}
                                        min={0}
                                      />
                                    </Form.Item>
                                  </div>
                                  <Form.Item
                                    shouldUpdate={(prev, cur) =>
                                      prev.eventTypeMeta?.[key]
                                        ?.accountAmount !==
                                        cur.eventTypeMeta?.[key]
                                          ?.accountAmount ||
                                      prev.eventTypeMeta?.[key]?.gstRate !==
                                        cur.eventTypeMeta?.[key]?.gstRate
                                    }
                                    noStyle
                                  >
                                    {({ getFieldValue }) => {
                                      const acc = getFieldValue([
                                        "eventTypeMeta",
                                        key,
                                        "accountAmount",
                                      ]);
                                      const rate =
                                        getFieldValue([
                                          "eventTypeMeta",
                                          key,
                                          "gstRate",
                                        ]) || 0;
                                      const total = calculateGstTotal(
                                        acc,
                                        rate
                                      );
                                      return (
                                        <div
                                          style={{
                                            marginTop: 6,
                                            paddingTop: 6,
                                            borderTop: "1px dashed #e5e7eb",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 8,
                                            flexWrap: "wrap",
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: 12,
                                              color: "#6b7280",
                                            }}
                                          >
                                            Account total (incl. GST):
                                          </span>
                                          <span
                                            style={{
                                              fontWeight: 600,
                                              color: "#111827",
                                            }}
                                          >
                                            ₹{formatINR(total || 0)}
                                          </span>
                                        </div>
                                      );
                                    }}
                                  </Form.Item>
                                </div>
                              </div>
                              <Form.List name={["eventTypeAdvances", key]}>
                                {(fields, { add, remove }) => (
                                  <>
                                    <div
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                          "80px 1fr 1fr 60px",
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
                                            name={[
                                              field.name,
                                              "expectedAmount",
                                            ]}
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
                                                onClick={() =>
                                                  remove(field.name)
                                                }
                                              />
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    <Form.Item shouldUpdate noStyle>
                                      {({ getFieldValue }) => {
                                        const totalAgreed =
                                          normalizeAmount(
                                            getFieldValue([
                                              "eventTypeMeta",
                                              key,
                                              "totalAgreedAmount",
                                            ])
                                          ) ?? 0;
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
                                        const balance = totalAgreed - paid;
                                        return (
                                          <div
                                            style={{
                                              marginTop: 8,
                                              paddingTop: 8,
                                              borderTop: "1px dashed #e5e7eb",
                                              display: "flex",
                                              justifyContent: "space-between",
                                              fontSize: 13,
                                              color: "#374151",
                                            }}
                                          >
                                            <span>Balance after advances:</span>
                                            <span style={{ fontWeight: 600 }}>
                                              ₹{formatINR(balance || 0)}
                                            </span>
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
                                <Form.Item
                                  label={`${label} Venue`}
                                  name={["eventTypeMeta", key, "venueLocation"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: `Please enter venue for ${label}`,
                                    },
                                  ]}
                                >
                                  <Input
                                    size="large"
                                    placeholder={`Venue for ${label}`}
                                  />
                                </Form.Item>
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
                              label="Total Agreed Amount (incl. GST)"
                              name="agreedAmountTotal"
                            >
                              <InputNumber
                                size="large"
                                style={{ width: "100%" }}
                                placeholder="Enter total agreed amount (incl. GST)"
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
                                placeholder="Amount through account"
                                formatter={indianFormatter}
                                parser={indianParser}
                                min={0}
                              />
                            </Form.Item>
                            <Form.Item
                              label="GST on Account"
                              name="agreedAmountAccountGstRate"
                              initialValue={0}
                            >
                              <Select size="large">
                                {gstOptions.map((g) => (
                                  <Option key={g.value} value={g.value}>
                                    {g.label}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                            <Form.Item
                              label="Cash Amount"
                              name="agreedAmountCash"
                            >
                              <InputNumber
                                size="large"
                                style={{ width: "100%" }}
                                placeholder="Amount through cash"
                                formatter={indianFormatter}
                                parser={indianParser}
                                min={0}
                              />
                            </Form.Item>
                          </div>
                          <Form.Item
                            shouldUpdate={(prev, cur) =>
                              prev.agreedAmountAccount !==
                                cur.agreedAmountAccount ||
                              prev.agreedAmountAccountGstRate !==
                                cur.agreedAmountAccountGstRate
                            }
                            noStyle
                          >
                            {({ getFieldValue }) => {
                              const acc = getFieldValue("agreedAmountAccount");
                              const rate =
                                getFieldValue("agreedAmountAccountGstRate") ||
                                0;
                              const total = calculateGstTotal(acc, rate);
                              return (
                                <div
                                  style={{
                                    marginTop: 8,
                                    paddingTop: 8,
                                    borderTop: "1px dashed #e5e7eb",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 8,
                                  }}
                                >
                                  <span
                                    style={{ fontSize: 13, color: "#6b7280" }}
                                  >
                                    Account total (incl. GST):
                                  </span>
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      color: "#111827",
                                    }}
                                  >
                                    ₹{formatINR(total || 0)}
                                  </span>
                                </div>
                              );
                            }}
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
                                    const totalAgreed =
                                      normalizeAmount(
                                        getFieldValue("agreedAmountTotal")
                                      ) ?? 0;
                                    const advs =
                                      getFieldValue("advances") || [];
                                    const paid = advs.reduce((sum, a) => {
                                      const amt = normalizeAmount(
                                        a?.expectedAmount
                                      );
                                      return sum + (amt || 0);
                                    }, 0);
                                    const balance = totalAgreed - paid;
                                    return (
                                      <div
                                        style={{
                                          marginTop: 8,
                                          paddingTop: 8,
                                          borderTop: "1px dashed #e5e7eb",
                                          display: "flex",
                                          justifyContent: "space-between",
                                          fontSize: 13,
                                          color: "#374151",
                                        }}
                                      >
                                        <span>Balance after advances:</span>
                                        <span style={{ fontWeight: 600 }}>
                                          ₹{formatINR(balance || 0)}
                                        </span>
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
              {selectedEvent && !hasEventTypes && (
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
                        {fields.map((field, index) => (
                          <motion.div
                            key={field.key}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div
                              className="glass-advance-card"
                              style={{
                                padding: "20px",
                                marginBottom: "16px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: "16px",
                                  alignItems: "flex-start",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div style={{ flex: "1", minWidth: "250px" }}>
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      color: "#7c3aed",
                                      marginBottom: "12px",
                                      fontWeight: 600,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: "24px",
                                        height: "24px",
                                        borderRadius: "6px",
                                        background:
                                          "linear-gradient(135deg, #4f46e5, #7c3aed)",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                      }}
                                    >
                                      {index + 1}
                                    </span>
                                    Advance #{index + 1}
                                  </div>
                                  <Form.Item
                                    {...field}
                                    name={[field.name, "expectedAmount"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "Enter amount",
                                      },
                                    ]}
                                    style={{ marginBottom: 12 }}
                                  >
                                    <InputNumber
                                      size="large"
                                      style={{ width: "100%" }}
                                      placeholder="Enter advance amount"
                                      formatter={indianFormatter}
                                      parser={indianParser}
                                      min={0}
                                    />
                                  </Form.Item>
                                  <Form.Item
                                    {...field}
                                    label="Advance Date"
                                    name={[field.name, "advanceDate"]}
                                    rules={[
                                      {
                                        required: true,
                                        message:
                                          "Please select the advance date",
                                      },
                                    ]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <DatePicker
                                      size="large"
                                      style={{ width: "100%" }}
                                      placeholder="Select advance date"
                                      format={timeFormat}
                                      showTime={{
                                        use12Hours: true,
                                        format: "hh:mm A",
                                      }}
                                    />
                                  </Form.Item>
                                </div>
                                {fields.length > 1 && (
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Button
                                      type="text"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() => remove(field.name)}
                                      style={{
                                        marginTop: "32px",
                                        borderRadius: "8px",
                                        width: "40px",
                                        height: "40px",
                                      }}
                                    />
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        <Form.Item shouldUpdate noStyle>
                          {({ getFieldValue }) => {
                            const totalAgreed =
                              normalizeAmount(
                                getFieldValue("agreedAmountTotal")
                              ) ?? 0;
                            const advs = getFieldValue("advances") || [];
                            const paid = advs.reduce((sum, a) => {
                              const amt = normalizeAmount(a?.expectedAmount);
                              return sum + (amt || 0);
                            }, 0);
                            const balance = totalAgreed - paid;
                            return (
                              <div
                                style={{
                                  marginTop: 8,
                                  paddingTop: 8,
                                  borderTop: "1px dashed #e5e7eb",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: 13,
                                  color: "#374151",
                                }}
                              >
                                <span>Balance after advances:</span>
                                <span style={{ fontWeight: 600 }}>
                                  ₹{formatINR(balance || 0)}
                                </span>
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
                      💾 Update Booking
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

export default EditInflow;
