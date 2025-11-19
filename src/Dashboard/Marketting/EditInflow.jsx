// /* eslint-disable no-unused-vars */
// import axios from "axios";
// import React, { useEffect, useState } from "react";
// import {
//   Form,
//   Input,
//   DatePicker,
//   Button,
//   InputNumber,
//   Card,
//   message,
// } from "antd";
// import {
//   ArrowLeftOutlined,
//   PlusOutlined,
//   DeleteOutlined,
// } from "@ant-design/icons";
// import { useNavigate } from "react-router-dom";
// import dayjs from "dayjs";
// import { API_BASE_URL } from "../../../config";

// const EditInflow = () => {
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const [initialLoading, setInitialLoading] = useState(true);
//   const navigate = useNavigate();
//   const eventId = "6903af04cd6e43b8bb16cbed";

//   const fetchEventData = async () => {
//     setInitialLoading(true);
//     try {
//       const res = await axios.get(`${API_BASE_URL}events/${eventId}`);
//       const event = res.data.event;
//       console.log("event", event);

//       // Prefill form - convert dates to dayjs as needed
//       form.setFieldsValue({
//         clientName: event.clientName,
//         eventDate: event.eventDate ? dayjs(event.eventDate) : null,
//         venueLocation: event.venueLocation,
//         agreedAmount: event.agreedAmount,
//         advances: event.advances.map((adv) => ({
//           expectedAmount: adv.expectedAmount,
//           receivedAmount: adv.receivedAmount || 0,
//           receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : null,
//           advanceNumber: adv.advanceNumber,
//         })),
//       });
//     } catch (err) {
//       message.error("Failed to fetch event data");
//     } finally {
//       setInitialLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchEventData();
//   }, []);

//   const handleSubmit = async (values) => {
//     setLoading(true);
//     try {
//       const payload = {
//         clientName: values.clientName,
//         eventDate: values.eventDate.toISOString(),
//         venueLocation: values.venueLocation,
//         agreedAmount: values.agreedAmount,
//         advances: values.advances.map((advance, index) => ({
//           advanceNumber: index + 1,
//           expectedAmount: advance.expectedAmount,
//           receivedAmount: advance.receivedAmount || 0,
//           receivedDate: advance.receivedDate
//             ? advance.receivedDate.toISOString()
//             : null,
//         })),
//       };

//       const response = await axios.put(
//         `${API_BASE_URL}events/${eventId}/edit`,
//         payload
//       );

//       if (response.status === 200) {
//         message.success("Booking updated successfully!");
//         navigate("/user/viewclient");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       if (error.response) {
//         const status = error.response.status;
//         const errorMsg =
//           error.response.data?.message || error.response.data?.error;
//         if (status === 400) {
//           message.error(
//             errorMsg || "Invalid booking data. Please check your inputs."
//           );
//         } else if (status === 401) {
//           message.error("Unauthorized. Please login again.");
//         } else if (status === 403) {
//           message.error("You don't have permission to update bookings.");
//         } else if (status === 409) {
//           message.error(
//             errorMsg || "Booking conflict. Please check the details."
//           );
//         } else if (status >= 500) {
//           message.error("Server error. Please try again later.");
//         } else {
//           message.error(
//             errorMsg || "Failed to update booking. Please try again."
//           );
//         }
//       } else if (error.request) {
//         message.error(
//           "Network error. Please check your connection and try again."
//         );
//       } else {
//         message.error("An unexpected error occurred. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (initialLoading) {
//     return <div>Loading event data...</div>;
//   }

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//         padding: "20px",
//       }}
//     >
//       <div style={{ maxWidth: "800px", margin: "0 auto" }}>
//         {/* Back Button */}
//         <Button
//           type="text"
//           icon={<ArrowLeftOutlined />}
//           onClick={() => navigate("/user")}
//           style={{
//             color: "white",
//             fontSize: "16px",
//             marginBottom: "20px",
//             display: "flex",
//             alignItems: "center",
//             gap: "8px",
//           }}
//         >
//           Back
//         </Button>

//         {/* Main Form Card */}
//         <Card
//           style={{
//             borderRadius: "16px",
//             boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
//           }}
//         >
//           <div style={{ marginBottom: "24px" }}>
//             <h1
//               style={{
//                 fontSize: "28px",
//                 fontWeight: "600",
//                 margin: 0,
//                 background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//                 WebkitBackgroundClip: "text",
//                 WebkitTextFillColor: "transparent",
//               }}
//             >
//               Edit Client Booking
//             </h1>
//             <p style={{ color: "#666", marginTop: "8px", marginBottom: 0 }}>
//               Modify the details and save changes
//             </p>
//           </div>

//           <Form form={form} layout="vertical" onFinish={handleSubmit}>
//             {/* Client Name */}
//             <Form.Item
//               label={<span style={{ fontWeight: "500" }}>Client Name</span>}
//               name="clientName"
//               rules={[{ required: true, message: "Please enter client name" }]}
//             >
//               <Input
//                 size="large"
//                 placeholder="Enter client name"
//                 style={{ borderRadius: "8px" }}
//               />
//             </Form.Item>

//             {/* Event Date */}
//             <Form.Item
//               label={<span style={{ fontWeight: "500" }}>Event Date</span>}
//               name="eventDate"
//               rules={[{ required: true, message: "Please select event date" }]}
//             >
//               <DatePicker
//                 size="large"
//                 showTime
//                 format="YYYY-MM-DD HH:mm"
//                 style={{ width: "100%", borderRadius: "8px" }}
//                 placeholder="Select event date and time"
//               />
//             </Form.Item>

//             {/* Venue Location */}
//             <Form.Item
//               label={<span style={{ fontWeight: "500" }}>Venue Location</span>}
//               name="venueLocation"
//               rules={[
//                 { required: true, message: "Please enter venue location" },
//               ]}
//             >
//               <Input
//                 size="large"
//                 placeholder="Enter venue location"
//                 style={{ borderRadius: "8px" }}
//               />
//             </Form.Item>

//             {/* Agreed Amount */}
//             <Form.Item
//               label={<span style={{ fontWeight: "500" }}>Agreed Amount</span>}
//               name="agreedAmount"
//               rules={[
//                 { required: true, message: "Please enter agreed amount" },
//               ]}
//             >
//               <InputNumber
//                 size="large"
//                 style={{ width: "100%", borderRadius: "8px" }}
//                 placeholder="Enter agreed amount"
//                 prefix="₹"
//                 formatter={(value) =>
//                   `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
//                 }
//                 parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
//                 min={0}
//               />
//             </Form.Item>

//             {/* Advances */}
//             <div style={{ marginTop: "32px" }}>
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                   marginBottom: "16px",
//                 }}
//               >
//                 <span style={{ fontWeight: "500", fontSize: "16px" }}>
//                   Advance Payments
//                 </span>
//               </div>

//               <Form.List name="advances">
//                 {(fields, { add, remove }) => (
//                   <>
//                     {fields.map((field, index) => (
//                       <Card
//                         key={field.key}
//                         size="small"
//                         style={{
//                           marginBottom: "16px",
//                           borderRadius: "8px",
//                           border: "1px solid #e0e0e0",
//                           background: "#fafafa",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             gap: "12px",
//                             alignItems: "flex-start",
//                             flexWrap: "wrap",
//                           }}
//                         >
//                           <div style={{ flex: "1", minWidth: "200px" }}>
//                             <div
//                               style={{
//                                 fontSize: "12px",
//                                 color: "#666",
//                                 marginBottom: "8px",
//                                 fontWeight: "500",
//                               }}
//                             >
//                               Advance #{index + 1}
//                             </div>
//                             <Form.Item
//                               {...field}
//                               name={[field.name, "expectedAmount"]}
//                               rules={[
//                                 {
//                                   required: true,
//                                   message: "Enter expected amount",
//                                 },
//                               ]}
//                               style={{ marginBottom: 0 }}
//                             >
//                               <InputNumber
//                                 size="large"
//                                 style={{ width: "100%", borderRadius: "8px" }}
//                                 placeholder="Enter expected amount"
//                                 prefix="₹"
//                                 formatter={(value) =>
//                                   `${value}`.replace(
//                                     /\B(?=(\d{3})+(?!\d))/g,
//                                     ","
//                                   )
//                                 }
//                                 parser={(value) =>
//                                   value.replace(/₹\s?|(,*)/g, "")
//                                 }
//                                 min={0}
//                               />
//                             </Form.Item>
//                           </div>
//                           {fields.length > 1 && (
//                             <Button
//                               type="text"
//                               danger
//                               icon={<DeleteOutlined />}
//                               onClick={() => remove(field.name)}
//                               style={{ marginTop: "28px" }}
//                             />
//                           )}
//                         </div>
//                       </Card>
//                     ))}
//                     <Button
//                       type="dashed"
//                       onClick={() => add()}
//                       block
//                       icon={<PlusOutlined />}
//                       size="large"
//                       style={{
//                         borderRadius: "8px",
//                         borderStyle: "dashed",
//                         borderWidth: "2px",
//                         height: "48px",
//                         fontSize: "15px",
//                         fontWeight: "500",
//                       }}
//                     >
//                       Add Advance Payment
//                     </Button>
//                   </>
//                 )}
//               </Form.List>
//             </div>

//             {/* Submit Button */}
//             <Form.Item style={{ marginTop: "32px", marginBottom: 0 }}>
//               <Button
//                 type="primary"
//                 htmlType="submit"
//                 size="large"
//                 loading={loading}
//                 block
//                 style={{
//                   height: "48px",
//                   borderRadius: "8px",
//                   fontSize: "16px",
//                   fontWeight: "500",
//                   background:
//                     "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//                   border: "none",
//                 }}
//               >
//                 Update Booking
//               </Button>
//             </Form.Item>
//           </Form>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default EditInflow;
/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  Button,
  InputNumber,
  Card,
  message,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { API_BASE_URL } from "../../../config";

// Custom styles matching the glassmorphism theme
const customStyles = `
  .glass-card {
    background: rgba(255, 255, 255, 0.75);
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.35);
  }

  .glass-advance-card {
    background: rgba(255, 255, 255, 0.5);
    border-radius: 1rem;
    box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.08);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    transition: all 0.3s ease;
  }

  .glass-advance-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px 0 rgba(31, 38, 135, 0.12);
  }

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

  .gradient-text {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .ant-form-item-label > label {
    font-weight: 600 !important;
    color: #4f46e5 !important;
    font-size: 15px !important;
  }

  .ant-input,
  .ant-input-number,
  .ant-picker {
    border-radius: 0.75rem !important;
    border: 1px solid rgba(79, 70, 229, 0.2) !important;
    transition: all 0.3s ease !important;
  }

  .ant-input:hover,
  .ant-input-number:hover,
  .ant-picker:hover {
    border-color: #7c3aed !important;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1) !important;
  }

  .ant-input:focus,
  .ant-input-number-focused,
  .ant-picker-focused {
    border-color: #4f46e5 !important;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15) !important;
  }

  .ant-input-number-input {
    border-radius: 0.75rem !important;
  }

  .ant-btn-dashed {
    border-radius: 0.75rem !important;
    border: 2px dashed rgba(79, 70, 229, 0.3) !important;
    color: #4f46e5 !important;
    font-weight: 600 !important;
    transition: all 0.3s ease !important;
  }

  .ant-btn-dashed:hover {
    border-color: #7c3aed !important;
    color: #7c3aed !important;
    background: rgba(124, 58, 237, 0.05) !important;
  }

  @keyframes glow-pulse {
    0%, 100% {
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
    }
    50% {
      box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);
    }
  }

  .form-glow {
    animation: glow-pulse 3s ease-in-out infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .spin-animation {
    animation: spin 1s linear infinite;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 20px;
  }
`;

const EditInflow = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();
  const eventId = "6903af04cd6e43b8bb16cbed";

  const fetchEventData = async () => {
    setInitialLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}events/${eventId}`);
      const event = res.data.event;
      console.log("event", event);

      // Prefill form - convert dates to dayjs as needed
      form.setFieldsValue({
        clientName: event.clientName,
        eventDate: event.eventDate ? dayjs(event.eventDate) : null,
        venueLocation: event.venueLocation,
        agreedAmount: event.agreedAmount,
        advances: event.advances.map((adv) => ({
          expectedAmount: adv.expectedAmount,
          receivedAmount: adv.receivedAmount || 0,
          receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : null,
          advanceNumber: adv.advanceNumber,
        })),
      });
    } catch (err) {
      message.error("Failed to fetch event data");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, []);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        clientName: values.clientName,
        eventDate: values.eventDate.toISOString(),
        venueLocation: values.venueLocation,
        agreedAmount: values.agreedAmount,
        advances: values.advances.map((advance, index) => ({
          advanceNumber: index + 1,
          expectedAmount: advance.expectedAmount,
          receivedAmount: advance.receivedAmount || 0,
          receivedDate: advance.receivedDate
            ? advance.receivedDate.toISOString()
            : null,
        })),
      };

      const response = await axios.put(
        `${API_BASE_URL}events/${eventId}/edit`,
        payload
      );

      if (response.status === 200) {
        message.success("Booking updated successfully!");
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
          background: "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 50%, #ede9fe 100%)",
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
        background: "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 50%, #ede9fe 100%)",
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

      <div style={{ position: "relative", zIndex: 10, maxWidth: "900px", margin: "0 auto" }}>
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
              onClick={() => navigate("/user/viewclient")}
              size="large"
              style={{
                borderRadius: 12,
                background: "linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(124, 58, 237, 0.1))",
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
              Back to Bookings
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
                Edit Client Booking
              </h1>
              <p style={{ color: "#64748b", fontSize: "16px", margin: 0 }}>
                Modify the details and save changes
              </p>
            </div>

            {/* Form */}
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              {/* Client Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Form.Item
                  label="Client Name"
                  name="clientName"
                  rules={[{ required: true, message: "Please enter client name" }]}
                >
                  <Input
                    size="large"
                    placeholder="Enter client name"
                    prefix={<span style={{ color: "#4f46e5", marginRight: 4,padding:8 }}>👤</span>}
                  />
                </Form.Item>
              </motion.div>

              {/* Event Date */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Form.Item
                  label="Event Date"
                  name="eventDate"
                  rules={[{ required: true, message: "Please select event date" }]}
                >
                  <DatePicker
                    size="large"
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: "100%" }}
                    placeholder="Select event date and time"
                  />
                </Form.Item>
              </motion.div>

              {/* Venue Location */}
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
                    prefix={<span style={{ color: "#4f46e5", marginRight: 4,padding:8 }}>📍</span>}
                  />
                </Form.Item>
              </motion.div>

              {/* Agreed Amount */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
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
                    prefix="₹"
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
                    min={0}
                  />
                </Form.Item>
              </motion.div>

              {/* Advances Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
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
                      background: "linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(124, 58, 237, 0.1))",
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
                                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
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
                                      message: "Enter expected amount",
                                    },
                                  ]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <InputNumber
                                    size="large"
                                    style={{ width: "100%" }}
                                    placeholder="Enter expected amount"
                                    prefix="₹"
                                    formatter={(value) =>
                                      `${value}`.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        ","
                                      )
                                    }
                                    parser={(value) =>
                                      value.replace(/₹\s?|(,*)/g, "")
                                    }
                                    min={0}
                                  />
                                </Form.Item>
                              </div>
                              {fields.length > 1 && (
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
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

                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Form.Item style={{ marginTop: "40px", marginBottom: 0 }}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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