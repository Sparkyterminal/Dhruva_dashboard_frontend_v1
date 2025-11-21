/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Form, Input, DatePicker, Button, InputNumber, message, Select, Space, Tag, Radio } from "antd";
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

const EVENT_TYPES = [
  { value: "Wedding", label: "Wedding", emoji: "💒" },
  { value: "House Warming Ceremony", label: "House Warming Ceremony", emoji: "🏡" },
  { value: "Baby Shower", label: "Baby Shower", emoji: "👶" },
  { value: "Temple Decor", label: "Temple Decor", emoji: "🛕" },
  { value: "Birthday", label: "Birthday", emoji: "🎂" },
  { value: "Government Events", label: "Government Events", emoji: "🏛️" },
  { value: "Bhumi Pooje", label: "Bhumi Pooje", emoji: "🙏" },
  { value: "Half Saree Event", label: "Half Saree Event", emoji: "🧵" },
  { value: "Engagement Event", label: "Engagement Event", emoji: "💍" },
  { value: "Other", label: "Other", emoji: "✨" },
];

const WEDDING_SUB_TYPES = [
  { value: "Muhurtham", label: "Muhurtham", emoji: "💍" },
  { value: "Reception", label: "Reception", emoji: "🎊" },
  { value: "Beegara Uta", label: "Beegara Uta", emoji: "🍽️" },
  { value: "Bride Home Decor", label: "Bride Home Decor", emoji: "🏠" },
  { value: "Groom Home Decor", label: "Groom Home Decor", emoji: "🏘️" },
  { value: "Bride Chapra", label: "Bride Chapra", emoji: "👰" },
  { value: "Bride Bangle Ceremony", label: "Bride Bangle Ceremony", emoji: "🩵" },
  { value: "Bride Mehandi", label: "Bride Mehandi", emoji: "🤲" },
  { value: "Bride Nelugu", label: "Bride Nelugu", emoji: "🌼" },
  { value: "Bride Batte Shastra", label: "Bride Batte Shastra", emoji: "👗" },
  { value: "Groom Batte Shashtra", label: "Groom Batte Shashtra", emoji: "🤵" },
  { value: "Groom Chapra", label: "Groom Chapra", emoji: "🛖" },
  { value: "Groom Bangle Ceremony", label: "Groom Bangle Ceremony", emoji: "🟡" },
  { value: "Groom Mehandi", label: "Groom Mehandi", emoji: "✋" },
];

const EditInflow = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [eventName, setEventName] = useState("");
  const [selectedEventTypes, setSelectedEventTypes] = useState([]);
  const [advanceMode, setAdvanceMode] = useState('separate');
  const navigate = useNavigate();
  const { id } = useParams();

  // Indian number formatter
  const formatINR = (val) => {
    if (val === undefined || val === null || val === "") return "";
    const parts = val.toString().split('.');
    let integer = parts[0].replace(/[^0-9]/g, '');
    const fraction = parts[1] ? '.' + parts[1] : '';
    if (integer.length <= 3) return integer + fraction;
    const last3 = integer.slice(-3);
    let rest = integer.slice(0, -3);
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return rest + ',' + last3 + fraction;
  };

  const indianFormatter = (value) => {
    if (value === undefined || value === null || value === '') return '';
    return `₹${formatINR(value)}`;
  };

  const indianParser = (value) => {
    if (!value && value !== 0) return '';
    return String(value).replace(/[^0-9.-]/g, '');
  };

  const normalizeAmount = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = indianParser(value);
    if (parsed === undefined || parsed === null || parsed === '') return undefined;
    const numeric = Number(parsed);
    return Number.isNaN(numeric) ? undefined : numeric;
  };

  const fetchEventData = async () => {
    setInitialLoading(true);
    try {
      const axios = (await import("axios")).default;
      const res = await axios.get(`${API_BASE_URL}events/${id}`);
      const event = res.data.event;
      console.log("Fetched event:", event);

      // Determine event name and type
      const isWedding = event.eventName === "Wedding";
      const eventTypes = event.eventTypes || [];
      
      setEventName(event.eventName);
      
      if (isWedding && eventTypes.length > 0) {
        setSelectedEventTypes(eventTypes.map(et => et.eventType));
        
        // Check if it's complete package or separate mode
        const hasTopLevelAgreedAmount = event.agreedAmount !== undefined && event.agreedAmount !== null;
        const hasTopLevelAdvances = event.advances && event.advances.length > 0;
        const mode = hasTopLevelAgreedAmount || hasTopLevelAdvances ? 'complete' : 'separate';
        setAdvanceMode(mode);

        // Prepare form values
        const formValues = {
          eventName: event.eventName,
          clientName: event.clientName,
          brideName: event.brideName,
          groomName: event.groomName,
          contactNumber: event.contactNumber,
          altContactNumber: event.altContactNumber,
          lead1: event.lead1,
          lead2: event.lead2,
          eventTypes: eventTypes.map(et => et.eventType),
        };

        // Initialize dates and meta for each event type
        const eventTypeDates = {};
        const eventTypeMeta = {};
        const eventTypeAdvances = {};

        eventTypes.forEach(et => {
          eventTypeDates[et.eventType] = {
            startDate: et.startDate ? dayjs(et.startDate) : undefined,
            endDate: et.endDate ? dayjs(et.endDate) : undefined,
          };
          eventTypeMeta[et.eventType] = {
            venueLocation: et.venueLocation,
            agreedAmount: et.agreedAmount,
          };
          if (mode === 'separate' && et.advances) {
            eventTypeAdvances[et.eventType] = et.advances.map(adv => ({
              expectedAmount: adv.expectedAmount,
              advanceDate: adv.advanceDate ? dayjs(adv.advanceDate) : undefined,
              advanceNumber: adv.advanceNumber,
              receivedAmount: adv.receivedAmount,
              receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : undefined,
              remarks: adv.remarks,
              updatedBy: adv.updatedBy,
              updatedAt: adv.updatedAt,
            }));
          }
        });

        formValues.eventTypeDates = eventTypeDates;
        formValues.eventTypeMeta = eventTypeMeta;
        
        if (mode === 'separate') {
          formValues.eventTypeAdvances = eventTypeAdvances;
        } else {
          // Complete package mode
          formValues.agreedAmount = event.agreedAmount;
          formValues.advances = (event.advances || []).map(adv => ({
            expectedAmount: adv.expectedAmount,
            advanceDate: adv.advanceDate ? dayjs(adv.advanceDate) : undefined,
            advanceNumber: adv.advanceNumber,
            receivedAmount: adv.receivedAmount,
            receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : undefined,
            remarks: adv.remarks,
            updatedBy: adv.updatedBy,
            updatedAt: adv.updatedAt,
          }));
        }

        form.setFieldsValue(formValues);
      } else {
        // Non-wedding event
        const eventType = eventTypes[0] || {};
        form.setFieldsValue({
          eventName: event.eventName,
          customEventName: event.eventName === "Other" ? eventType.eventType : undefined,
          clientName: event.clientName,
          contactNumber: event.contactNumber,
          altContactNumber: event.altContactNumber,
          lead1: event.lead1,
          lead2: event.lead2,
          startDate: eventType.startDate ? dayjs(eventType.startDate) : undefined,
          endDate: eventType.endDate ? dayjs(eventType.endDate) : undefined,
          venueLocation: eventType.venueLocation,
          agreedAmount: eventType.agreedAmount || event.agreedAmount,
          advances: (eventType.advances || event.advances || []).map(adv => ({
            expectedAmount: adv.expectedAmount,
            advanceDate: adv.advanceDate ? dayjs(adv.advanceDate) : undefined,
            advanceNumber: adv.advanceNumber,
            receivedAmount: adv.receivedAmount,
            receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : undefined,
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
    fetchEventData();
  }, [id]);

  const handleEventNameChange = (value) => {
    setEventName(value);
    if (value !== "Wedding") {
      setSelectedEventTypes([]);
      form.setFieldsValue({ eventTypes: [], eventTypeAdvances: {}, eventTypeDates: {}, eventTypeMeta: {} });
    }
    if (value !== "Wedding") {
      form.setFieldsValue({ brideName: undefined, groomName: undefined });
    }
    if (value !== "Wedding") {
      setAdvanceMode('separate');
      form.setFieldsValue({ advances: [{ expectedAmount: undefined, advanceDate: undefined }], eventTypeAdvances: {}, eventTypeDates: {}, eventTypeMeta: {}, lead1: undefined, lead2: undefined });
    }
  };

  const handleEventTypesChange = (values) => {
    setSelectedEventTypes(values);
    
    if (advanceMode === 'separate') {
      const currentAdvances = form.getFieldValue("eventTypeAdvances") || {};
      const newAdvances = { ...currentAdvances };
      
      values.forEach(eventType => {
        if (!newAdvances[eventType]) {
          newAdvances[eventType] = [{ expectedAmount: undefined, advanceDate: undefined }];
        }
      });
      
      Object.keys(newAdvances).forEach(key => {
        if (!values.includes(key)) {
          delete newAdvances[key];
        }
      });
      
      form.setFieldsValue({ eventTypeAdvances: newAdvances });
    }

    const currentMeta = form.getFieldValue("eventTypeMeta") || {};
    const newMeta = { ...currentMeta };
    values.forEach(eventType => {
      if (!Object.prototype.hasOwnProperty.call(newMeta, eventType)) {
        newMeta[eventType] = { venueLocation: undefined, agreedAmount: undefined };
      }
    });
    Object.keys(newMeta).forEach(key => {
      if (!values.includes(key)) {
        delete newMeta[key];
      }
    });
    form.setFieldsValue({ eventTypeMeta: newMeta });

    const currentDates = form.getFieldValue("eventTypeDates") || {};
    const newDates = { ...currentDates };
    values.forEach(eventType => {
      if (!Object.prototype.hasOwnProperty.call(newDates, eventType)) {
        newDates[eventType] = { startDate: undefined, endDate: undefined };
      }
    });
    Object.keys(newDates).forEach(key => {
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
            const advanceDate = advance.advanceDate ? advance.advanceDate.toISOString() : null;

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

      const isWedding = eventName === "Wedding";
      const isWeddingSharedMode = isWedding && advanceMode === "complete";
      const isNonWedding = eventName && eventName !== "Wedding";

      const sharedAgreedAmount =
        (isWeddingSharedMode || isNonWedding) && values.agreedAmount !== undefined
          ? normalizeAmount(values.agreedAmount)
          : undefined;
      const sharedAdvances =
        (isWeddingSharedMode || isNonWedding) && values.advances
          ? buildAdvancesPayload(values.advances)
          : [];

      const eventTypes = isWedding
        ? (values.eventTypes || []).map((type) => {
            const startDate = values.eventTypeDates?.[type]?.startDate
              ? values.eventTypeDates[type].startDate.toISOString()
              : null;
            const endDate = values.eventTypeDates?.[type]?.endDate
              ? values.eventTypeDates[type].endDate.toISOString()
              : null;
            const venueLocation = values.eventTypeMeta?.[type]?.venueLocation ?? null;
            const perEventAgreedAmount =
              advanceMode === "separate"
                ? normalizeAmount(values.eventTypeMeta?.[type]?.agreedAmount)
                : undefined;
            const perEventAdvances =
              advanceMode === "separate"
                ? buildAdvancesPayload(values.eventTypeAdvances?.[type] || [])
                : [];

            return {
              eventType: type,
              startDate,
              endDate,
              venueLocation,
              ...(perEventAgreedAmount != null && { agreedAmount: perEventAgreedAmount }),
              advances: perEventAdvances,
            };
          })
        : [
            {
              eventType: eventName === "Other" ? values.customEventName : eventName,
              startDate: values.startDate ? values.startDate.toISOString() : null,
              endDate: values.endDate ? values.endDate.toISOString() : null,
              venueLocation: values.venueLocation ?? null,
              ...(sharedAgreedAmount != null && { agreedAmount: sharedAgreedAmount }),
              advances: sharedAdvances,
            },
          ];

      const payload = {
        eventName: eventName === "Other" ? values.customEventName : eventName,
        eventTypes,
        clientName: values.clientName,
        ...(isWedding && {
          brideName: values.brideName,
          groomName: values.groomName,
        }),
        contactNumber: values.contactNumber,
        lead1: values.lead1 ?? "",
        lead2: values.lead2 ?? "",
        ...(values.altContactNumber && { altContactNumber: values.altContactNumber }),
      };

      if ((isWeddingSharedMode || isNonWedding) && sharedAgreedAmount != null) {
        payload.agreedAmount = sharedAgreedAmount;
      }

      if ((isWeddingSharedMode || isNonWedding) && sharedAdvances.length > 0) {
        payload.advances = sharedAdvances;
      }

      console.log('Updating payload:', JSON.stringify(payload, null, 2));

      const axios = (await import("axios")).default;
      const response = await axios.put(`${API_BASE_URL}events/${id}/edit`, payload);

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

        <div className="loading-container" style={{ position: "relative", zIndex: 10 }}>
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
          <h2 className="gradient-text" style={{ fontSize: "24px", fontWeight: 700 }}>
            Loading booking data...
          </h2>
        </div>
      </div>
    );
  }

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
                    suffixIcon={<span style={{ fontSize: "18px" }}>🎪</span>}
                  >
                    {EVENT_TYPES.map(type => (
                      <Option key={type.value} value={type.value}>
                        <span style={{ marginRight: 8 }}>{type.emoji}</span>
                        {type.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </motion.div>

              {/* Custom Event Name */}
              {eventName === "Other" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Form.Item
                    label="Custom Event Name"
                    name="customEventName"
                    rules={[
                      { required: true, message: "Please enter event name" },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Enter custom event name"
                      prefix={
                        <span style={{ color: "#4f46e5", marginRight: 4, padding: 8 }}>
                          ✨
                        </span>
                      }
                    />
                  </Form.Item>
                </motion.div>
              )}

              {/* Wedding Event Types */}
              {eventName === "Wedding" && (
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
                      { required: true, message: "Please select at least one event type" },
                    ]}
                  >
                    <Select
                      mode="multiple"
                      size="large"
                      placeholder="Select event types (multiple allowed)"
                      onChange={handleEventTypesChange}
                      maxTagCount="responsive"
                      value={selectedEventTypes}
                    >
                      {WEDDING_SUB_TYPES.map(type => (
                        <Option key={type.value} value={type.value}>
                          <span style={{ marginRight: 8 }}>{type.emoji}</span>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </motion.div>
              )}

              {/* Common Start/End Date for non-wedding */}
              {eventName && eventName !== 'Wedding' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Form.Item
                      label="Start Date"
                      name="startDate"
                      rules={[{ required: true, message: 'Please select start date' }]}
                    >
                      <DatePicker size="large" style={{ width: '100%' }} format="DD MMM YYYY" />
                    </Form.Item>
                    <Form.Item
                      label="End Date"
                      name="endDate"
                      rules={[{ required: true, message: 'Please select end date' }]}
                    >
                      <DatePicker size="large" style={{ width: '100%' }} format="DD MMM YYYY" />
                    </Form.Item>
                  </div>
                </motion.div>
              )}

              {/* Common Leads */}
              {eventName && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.48 }}
                  style={{ marginTop: 12 }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Form.Item label="Lead 1" name="lead1" rules={[{ required: true, message: 'Please enter Lead 1' }]}>
                      <Input size="large" />
                    </Form.Item>
                    <Form.Item label="Lead 2" name="lead2">
                      <Input size="large" />
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

              {/* Bride and Groom Names */}
              {eventName === "Wedding" && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <Form.Item
                      label="Bride Name"
                      name="brideName"
                      rules={[
                        { required: true, message: "Please enter bride name" },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="Enter bride name"
                        prefix={
                          <span
                            style={{ color: "#4f46e5", marginRight: 4, padding: 8 }}
                          >
                            👰‍♀️
                          </span>
                        }
                      />
                    </Form.Item>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.37 }}
                  >
                    <Form.Item
                      label="Groom Name"
                      name="groomName"
                      rules={[
                        { required: true, message: "Please enter groom name" },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="Enter groom name"
                        prefix={
                          <span
                            style={{ color: "#4f46e5", marginRight: 4, padding: 8 }}
                          >
                            🤵‍♂️
                          </span>
                        }
                      />
                    </Form.Item>
                  </motion.div>
                </>
              )}

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

              {/* Venue Location - non-wedding */}
              {eventName && eventName !== "Wedding" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Form.Item
                    label="Venue Location"
                    name="venueLocation"
                    rules={[
                      { required: true, message: "Please enter venue location" },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Enter venue location"
                      prefix={
                        <span
                          style={{ color: "#4f46e5", marginRight: 4, padding: 8 }}
                        >
                          📍
                        </span>
                      }
                    />
                  </Form.Item>
                </motion.div>
              )}

              {/* Agreed Amount - non-wedding */}
              {eventName && eventName !== "Wedding" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <Form.Item
                    label="Agreed Amount"
                    name="agreedAmount"
                    rules={[
                      { required: true, message: "Please enter agreed amount" },
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
                </motion.div>
              )}

              {/* Wedding Advances Section */}
              {eventName === "Wedding" && selectedEventTypes.length > 0 && (
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
                    <div style={{ fontWeight: 600, color: '#0369a1' }}>Advance Payments</div>
                    <Form.Item name="advanceMode" style={{ marginBottom: 0 }} initialValue={advanceMode}>
                      <Radio.Group onChange={(e) => {
                        const val = e.target.value;
                        setAdvanceMode(val);
                        if (val === 'complete') {
                          form.setFieldsValue({ eventTypeAdvances: {} });
                          if (!form.getFieldValue('advances')) form.setFieldsValue({ advances: [{ expectedAmount: undefined, advanceDate: undefined }] });
                        } else {
                          form.setFieldsValue({ advances: undefined });
                          const curr = form.getFieldValue('eventTypeAdvances') || {};
                          const newAdv = { ...curr };
                          selectedEventTypes.forEach(t => { if (!newAdv[t]) newAdv[t] = [{ expectedAmount: undefined, advanceDate: undefined }]; });
                          form.setFieldsValue({ eventTypeAdvances: newAdv });
                        }
                      }}>
                        <Radio value="complete">Complete Package</Radio>
                        <Radio value="separate" style={{ marginLeft: 12 }}>Separate / Event Specific</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </div>

                  {advanceMode === 'separate' ? (
                    <>
                      {selectedEventTypes.map((eventType) => (
                        <div key={eventType} className="glass-event-type-card" style={{ padding: "24px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginBottom: "20px",
                            }}
                          >
                            <Tag className="event-type-tag">
                              {WEDDING_SUB_TYPES.find(t => t.value === eventType)?.emoji} {eventType}
                            </Tag>
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                              <Form.Item
                                label={`${eventType} Start`}
                                name={["eventTypeDates", eventType, "startDate"]}
                                rules={[{ required: true, message: `Please select start date for ${eventType}` }]}
                              >
                                <DatePicker size="large" style={{ width: '100%' }} format="DD MMM YYYY" />
                              </Form.Item>
                              <Form.Item
                                label={`${eventType} End`}
                                name={["eventTypeDates", eventType, "endDate"]}
                                rules={[{ required: true, message: `Please select end date for ${eventType}` }]}
                              >
                                <DatePicker size="large" style={{ width: '100%' }} format="DD MMM YYYY" />
                              </Form.Item>
                            </div>
                            <Form.Item
                              label={`${eventType} Venue`}
                              name={["eventTypeMeta", eventType, "venueLocation"]}
                              rules={[{ required: true, message: `Please enter venue for ${eventType}` }]}
                            >
                              <Input size="large" placeholder={`Venue for ${eventType}`} />
                            </Form.Item>
                            <Form.Item
                              label={`${eventType} Agreed Amount`}
                              name={["eventTypeMeta", eventType, "agreedAmount"]}
                              rules={[{ required: true, message: `Please enter agreed amount for ${eventType}` }]}
                            >
                              <InputNumber
                                size="large"
                                style={{ width: '100%' }}
                                placeholder={`Agreed amount for ${eventType}`}
                                formatter={indianFormatter}
                                parser={indianParser}
                                min={0}
                              />
                            </Form.Item>
                          </div>
                          <Form.List name={["eventTypeAdvances", eventType]}>
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map((field, idx) => (
                                  <div key={field.key} className="glass-advance-card" style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                      <div style={{ flex: 1, minWidth: 240 }}>
                                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Advance #{idx + 1}</div>
                                        <Form.Item
                                          key={`expectedAmount-${field.key}`}
                                          name={[field.name, 'expectedAmount']}
                                          isListField={field.isListField}
                                           
                                          rules={[{ required: true, message: 'Enter amount' }]}
                                        >
                                          <InputNumber size="large" style={{ width: '100%' }} min={0} formatter={indianFormatter} parser={indianParser} placeholder="Enter amount" />
                                        </Form.Item>
                                        <Form.Item
                                          key={`advanceDate-${field.key}`}
                                          label="Advance Date"
                                          name={[field.name, 'advanceDate']}
                                          isListField={field.isListField}
                                           
                                          rules={[{ required: true, message: 'Select date' }]}
                                        >
                                          <DatePicker size="large" style={{ width: '100%' }} format="DD MMM YYYY" />
                                        </Form.Item>
                                      </div>
                                      {fields.length > 1 && (
                                        <div>
                                          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                <div>
                                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Advance for {eventType}</Button>
                                </div>
                              </>
                            )}
                          </Form.List>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <Form.Item
                        label="Agreed Amount (Complete Package)"
                        name="agreedAmount"
                        rules={[{ required: true, message: "Please enter agreed amount for complete package" }]}
                      >
                        <InputNumber
                          size="large"
                          style={{ width: '100%' }}
                          placeholder="Enter agreed amount for complete package"
                          formatter={indianFormatter}
                          parser={indianParser}
                          min={0}
                        />
                      </Form.Item>
                      {selectedEventTypes.map((eventType) => (
                        <div key={eventType} className="glass-event-type-card" style={{ padding: "24px", marginBottom: 16 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginBottom: "20px",
                            }}
                          >
                            <Tag className="event-type-tag">
                              {WEDDING_SUB_TYPES.find(t => t.value === eventType)?.emoji} {eventType}
                            </Tag>
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                              <Form.Item
                                label={`${eventType} Start`}
                                name={["eventTypeDates", eventType, "startDate"]}
                                rules={[{ required: true, message: `Please select start date for ${eventType}` }]}
                              >
                                <DatePicker size="large" style={{ width: '100%' }} format="DD MMM YYYY" />
                              </Form.Item>
                              <Form.Item
                                label={`${eventType} End`}
                                name={["eventTypeDates", eventType, "endDate"]}
                                rules={[{ required: true, message: `Please select end date for ${eventType}` }]}
                              >
                                <DatePicker size="large" style={{ width: '100%' }} format="DD MMM YYYY" />
                              </Form.Item>
                            </div>
                            <Form.Item
                              label={`${eventType} Venue`}
                              name={["eventTypeMeta", eventType, "venueLocation"]}
                              rules={[{ required: true, message: `Please enter venue for ${eventType}` }]}
                            >
                              <Input size="large" placeholder={`Venue for ${eventType}`} />
                            </Form.Item>
                          </div>
                        </div>
                      ))}
                      <div style={{ marginTop: 16 }}>
                        <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: 12, fontSize: 16 }}>📦 Advances (Common for All Events)</div>
                        <Form.List name="advances">
                          {(fields, { add, remove }) => (
                            <>
                              {fields.map((field, idx) => (
                                <div key={field.key} className="glass-advance-card" style={{ marginBottom: 12 }}>
                                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: 240 }}>
                                      <div style={{ fontWeight: 600, marginBottom: 8 }}>Advance #{idx + 1}</div>
                                      <Form.Item
                                        key={`expectedAmount-${field.key}`}
                                        name={[field.name, 'expectedAmount']}
                                        isListField={field.isListField}
                                         
                                        rules={[{ required: true, message: 'Enter amount' }]}
                                      >
                                        <InputNumber size="large" style={{ width: '100%' }} min={0} formatter={indianFormatter} parser={indianParser} placeholder="Enter amount" />
                                      </Form.Item>
                                      <Form.Item
                                        key={`advanceDate-${field.key}`}
                                        label="Advance Date"
                                        name={[field.name, 'advanceDate']}
                                        isListField={field.isListField}
                                         
                                        rules={[{ required: true, message: 'Select date' }]}
                                      >
                                        <DatePicker size="large" style={{ width: '100%' }} format="DD MMM YYYY" />
                                      </Form.Item>
                                    </div>
                                    {fields.length > 1 && (
                                      <div>
                                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              <div>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Advance Payment</Button>
                              </div>
                            </>
                          )}
                        </Form.List>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Non-Wedding Advances */}
              {eventName && eventName !== "Wedding" && (
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
                                      { required: true, message: "Enter amount" },
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
                                        message: "Please select the advance date",
                                      },
                                    ]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <DatePicker
                                      size="large"
                                      style={{ width: "100%" }}
                                      placeholder="Select advance date"
                                      format="DD MMM YYYY"
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