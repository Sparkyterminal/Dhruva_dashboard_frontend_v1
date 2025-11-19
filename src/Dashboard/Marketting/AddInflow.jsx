// /* eslint-disable no-unused-vars */
// import React, { useState } from "react";
// import { Form, Input, DatePicker, Button, InputNumber, message } from "antd";
// import {
//   ArrowLeftOutlined,
//   PlusOutlined,
//   DeleteOutlined,
// } from "@ant-design/icons";
// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import dayjs from "dayjs";
// import { API_BASE_URL } from "../../../config";

// // Custom styles matching the glassmorphism theme
// const customStyles = `
//   .glass-card {
//     background: rgba(255, 255, 255, 0.75);
//     border-radius: 1.5rem;
//     box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
//     backdrop-filter: blur(20px);
//     -webkit-backdrop-filter: blur(20px);
//     border: 1px solid rgba(255, 255, 255, 0.35);
//   }

//   .glass-advance-card {
//     background: rgba(255, 255, 255, 0.5);
//     border-radius: 1rem;
//     box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.08);
//     backdrop-filter: blur(12px);
//     -webkit-backdrop-filter: blur(12px);
//     border: 1px solid rgba(255, 255, 255, 0.4);
//     transition: all 0.3s ease;
//   }

//   .glass-advance-card:hover {
//     transform: translateY(-2px);
//     box-shadow: 0 6px 20px 0 rgba(31, 38, 135, 0.12);
//   }

//   @keyframes slide-in-top {
//     0% {
//       transform: translateY(-50px);
//       opacity: 0;
//     }
//     100% {
//       transform: translateY(0);
//       opacity: 1;
//     }
//   }

//   .slide-in-top {
//     animation: slide-in-top 0.6s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
//   }

//   .gradient-text {
//     background: linear-gradient(135deg, #4f46e5, #7c3aed);
//     -webkit-background-clip: text;
//     -webkit-text-fill-color: transparent;
//     background-clip: text;
//   }

//   .ant-form-item-label > label {
//     font-weight: 600 !important;
//     color: #4f46e5 !important;
//     font-size: 15px !important;
//   }

//   .ant-input,
//   .ant-input-number,
//   .ant-picker {
//     border-radius: 0.75rem !important;
//     border: 1px solid rgba(79, 70, 229, 0.2) !important;
//     transition: all 0.3s ease !important;
//   }

//   .ant-input:hover,
//   .ant-input-number:hover,
//   .ant-picker:hover {
//     border-color: #7c3aed !important;
//     box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1) !important;
//   }

//   .ant-input:focus,
//   .ant-input-number-focused,
//   .ant-picker-focused {
//     border-color: #4f46e5 !important;
//     box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15) !important;
//   }

//   .ant-input-number-input {
//     border-radius: 0.75rem !important;
//   }

//   .ant-btn-dashed {
//     border-radius: 0.75rem !important;
//     border: 2px dashed rgba(79, 70, 229, 0.3) !important;
//     color: #4f46e5 !important;
//     font-weight: 600 !important;
//     transition: all 0.3s ease !important;
//   }

//   .ant-btn-dashed:hover {
//     border-color: #7c3aed !important;
//     color: #7c3aed !important;
//     background: rgba(124, 58, 237, 0.05) !important;
//   }

//   @keyframes glow-pulse {
//     0%, 100% {
//       box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
//     }
//     50% {
//       box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);
//     }
//   }

//   .form-glow {
//     animation: glow-pulse 3s ease-in-out infinite;
//   }
// `;

// const AddInflow = () => {
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = async (values) => {
//     setLoading(true);
//     try {
//       const payload = {
//         clientName: values.clientName,
//         brideName: values.brideName,
//         groomName: values.groomName,
//         eventDate: values.eventDate.toISOString(),
//         venueLocation: values.venueLocation,
//         agreedAmount: values.agreedAmount,
//         advances: values.advances.map((advance, index) => ({
//           advanceNumber: index + 1,
//           expectedAmount: advance.expectedAmount,
//           advanceDate: advance.advanceDate
//             ? advance.advanceDate.toISOString()
//             : null,
//         })),
//       };

//       const axios = (await import("axios")).default;
//       const response = await axios.post(`${API_BASE_URL}events`, payload);

//       if (response.status === 200 || response.status === 201) {
//         message.success("Client booking created successfully!");
//         form.resetFields();
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
//           message.error("You don't have permission to create bookings.");
//         } else if (status === 409) {
//           message.error(
//             errorMsg || "Booking conflict. Please check the details."
//           );
//         } else if (status >= 500) {
//           message.error("Server error. Please try again later.");
//         } else {
//           message.error(
//             errorMsg || "Failed to create booking. Please try again."
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

//   return (
//     <div
//       className="font-[cormoreg]"
//       style={{
//         minHeight: "100vh",
//         background:
//           "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 50%, #ede9fe 100%)",
//         padding: "24px",
//         position: "relative",
//       }}
//     >
//       <style>{customStyles}</style>

//       {/* Animated Background */}
//       <div
//         style={{
//           position: "fixed",
//           inset: 0,
//           zIndex: 0,
//           pointerEvents: "none",
//           opacity: 0.4,
//           backgroundImage:
//             `radial-gradient(circle at 15% 85%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),` +
//             `radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),` +
//             `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`,
//         }}
//       />

//       <div
//         style={{
//           position: "relative",
//           zIndex: 10,
//           maxWidth: "900px",
//           margin: "0 auto",
//         }}
//       >
//         {/* Back Button */}
//         <motion.div
//           initial={{ opacity: 0, x: -20 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.5 }}
//           style={{ marginBottom: "24px" }}
//         >
//           <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//             <Button
//               icon={<ArrowLeftOutlined />}
//               onClick={() => navigate(-1)}
//               size="large"
//               style={{
//                 borderRadius: 12,
//                 background:
//                   "linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(124, 58, 237, 0.1))",
//                 border: "1px solid rgba(79, 70, 229, 0.3)",
//                 color: "#4f46e5",
//                 fontWeight: 600,
//                 height: 48,
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 8,
//                 paddingLeft: 20,
//                 paddingRight: 24,
//               }}
//             >
//               Back
//             </Button>
//           </motion.div>
//         </motion.div>

//         {/* Main Form Card */}
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.7, ease: "easeOut" }}
//         >
//           <div className="glass-card slide-in-top" style={{ padding: "40px" }}>
//             {/* Header Section */}
//             <div style={{ marginBottom: "32px", textAlign: "center" }}>
//               <motion.div
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
//               >
//                 <div
//                   style={{
//                     width: "80px",
//                     height: "80px",
//                     margin: "0 auto 20px",
//                     borderRadius: "20px",
//                     background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     fontSize: "40px",
//                     boxShadow: "0 8px 24px rgba(79, 70, 229, 0.3)",
//                   }}
//                   className="form-glow"
//                 >
//                   📅
//                 </div>
//               </motion.div>

//               <h1
//                 className="gradient-text"
//                 style={{
//                   fontSize: "clamp(28px, 5vw, 40px)",
//                   fontWeight: 700,
//                   margin: "0 0 12px 0",
//                 }}
//               >
//                 New Client Booking
//               </h1>
//               <p style={{ color: "#64748b", fontSize: "16px", margin: 0 }}>
//                 Fill in the details to create a new booking
//               </p>
//             </div>

//             {/* Form */}
//             <Form
//               form={form}
//               layout="vertical"
//               onFinish={handleSubmit}
//               initialValues={{
//                 advances: [
//                   { expectedAmount: undefined, advanceDate: undefined },
//                 ],
//               }}
//             >
//               {/* Client Name */}
//               <motion.div
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.3 }}
//               >
//                 <Form.Item
//                   label="Client Name"
//                   name="clientName"
//                   rules={[
//                     { required: true, message: "Please enter client name" },
//                   ]}
//                 >
//                   <Input
//                     size="large"
//                     placeholder="Enter client name"
//                     prefix={
//                       <span
//                         style={{ color: "#4f46e5", marginRight: 4, padding: 8 }}
//                       >
//                         👤
//                       </span>
//                     }
//                   />
//                 </Form.Item>
//               </motion.div>

//               {/* Bride Name */}
//               <motion.div
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.35 }}
//               >
//                 <Form.Item
//                   label="Bride Name"
//                   name="brideName"
//                   rules={[
//                     { required: true, message: "Please enter bride name" },
//                   ]}
//                 >
//                   <Input
//                     size="large"
//                     placeholder="Enter bride name"
//                     prefix={
//                       <span
//                         style={{ color: "#4f46e5", marginRight: 4, padding: 8 }}
//                       >
//                         👰‍♀️
//                       </span>
//                     }
//                   />
//                 </Form.Item>
//               </motion.div>

//               {/* Groom Name */}
//               <motion.div
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.37 }}
//               >
//                 <Form.Item
//                   label="Groom Name"
//                   name="groomName"
//                   rules={[
//                     { required: true, message: "Please enter groom name" },
//                   ]}
//                 >
//                   <Input
//                     size="large"
//                     placeholder="Enter groom name"
//                     prefix={
//                       <span
//                         style={{ color: "#4f46e5", marginRight: 4, padding: 8 }}
//                       >
//                         🤵‍♂️
//                       </span>
//                     }
//                   />
//                 </Form.Item>
//               </motion.div>
//               {/* Contact Number */}
//               <motion.div
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.31 }}
//               >
//                 <Form.Item
//                   label="Contact Number"
//                   name="contactNumber"
//                   rules={[
//                     { required: true, message: "Please enter contact number" },
//                     {
//                       pattern: /^\d{10}$/,
//                       message: "Enter a valid 10-digit number",
//                     },
//                   ]}
//                 >
//                   <Input
//                     size="large"
//                     placeholder="Enter contact number"
//                     prefix={
//                       <span
//                         style={{ color: "#4f46e5", marginRight: 4, padding: 8 }}
//                       >
//                         📞
//                       </span>
//                     }
//                     maxLength={10}
//                   />
//                 </Form.Item>
//               </motion.div>

//               {/* Alternative Contact Number */}
//               <motion.div
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.32 }}
//               >
//                 <Form.Item
//                   label="Alternative Contact Number"
//                   name="altContactNumber"
//                   rules={[
//                     {
//                       pattern: /^\d{10}$/,
//                       message: "Enter a valid 10-digit number",
//                     },
//                   ]}
//                 >
//                   <Input
//                     size="large"
//                     placeholder="Enter alternative contact number (optional)"
//                     prefix={
//                       <span
//                         style={{ color: "#4f46e5", marginRight: 4, padding: 8 }}
//                       >
//                         📞
//                       </span>
//                     }
//                     maxLength={10}
//                   />
//                 </Form.Item>
//               </motion.div>

//               {/* Event Date */}
//               <motion.div
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.4 }}
//               >
//                 <Form.Item
//                   label="Event Date"
//                   name="eventDate"
//                   rules={[
//                     { required: true, message: "Please select event date" },
//                   ]}
//                 >
//                   <DatePicker
//                     size="large"
//                     showTime
//                     format="YYYY-MM-DD HH:mm"
//                     style={{ width: "100%" }}
//                     placeholder="Select event date and time"
//                   />
//                 </Form.Item>
//               </motion.div>

//               {/* Venue Location */}
//               <motion.div
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.5 }}
//               >
//                 <Form.Item
//                   label="Venue Location"
//                   name="venueLocation"
//                   rules={[
//                     { required: true, message: "Please enter venue location" },
//                   ]}
//                 >
//                   <Input
//                     size="large"
//                     placeholder="Enter venue location"
//                     prefix={
//                       <span
//                         style={{ color: "#4f46e5", marginRight: 4, padding: 8 }}
//                       >
//                         📍
//                       </span>
//                     }
//                   />
//                 </Form.Item>
//               </motion.div>

//               {/* Agreed Amount */}
//               <motion.div
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.6 }}
//               >
//                 <Form.Item
//                   label="Agreed Amount"
//                   name="agreedAmount"
//                   rules={[
//                     { required: true, message: "Please enter agreed amount" },
//                   ]}
//                 >
//                   <InputNumber
//                     size="large"
//                     style={{ width: "100%" }}
//                     placeholder="Enter agreed amount"
//                     prefix="₹"
//                     formatter={(value) =>
//                       `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
//                     }
//                     parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
//                     min={0}
//                   />
//                 </Form.Item>
//               </motion.div>

//               {/* Advances Section */}
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.7 }}
//                 style={{ marginTop: "40px" }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: "12px",
//                     marginBottom: "20px",
//                   }}
//                 >
//                   <div
//                     style={{
//                       width: "48px",
//                       height: "48px",
//                       borderRadius: "12px",
//                       background:
//                         "linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(124, 58, 237, 0.1))",
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       fontSize: "24px",
//                     }}
//                   >
//                     💰
//                   </div>
//                   <span
//                     style={{
//                       fontWeight: 600,
//                       fontSize: "18px",
//                       color: "#4f46e5",
//                     }}
//                   >
//                     Advance Payments
//                   </span>
//                 </div>

//                 <Form.List name="advances">
//                   {(fields, { add, remove }) => (
//                     <>
//                       {fields.map((field, index) => (
//                         <motion.div
//                           key={field.key}
//                           initial={{ opacity: 0, scale: 0.95 }}
//                           animate={{ opacity: 1, scale: 1 }}
//                           transition={{ delay: index * 0.1 }}
//                         >
//                           <div
//                             className="glass-advance-card"
//                             style={{
//                               padding: "20px",
//                               marginBottom: "16px",
//                             }}
//                           >
//                             <div
//                               style={{
//                                 display: "flex",
//                                 gap: "16px",
//                                 alignItems: "flex-start",
//                                 flexWrap: "wrap",
//                               }}
//                             >
//                               <div style={{ flex: "1", minWidth: "250px" }}>
//                                 <div
//                                   style={{
//                                     fontSize: "13px",
//                                     color: "#7c3aed",
//                                     marginBottom: "12px",
//                                     fontWeight: 600,
//                                     display: "flex",
//                                     alignItems: "center",
//                                     gap: "8px",
//                                   }}
//                                 >
//                                   <span
//                                     style={{
//                                       width: "24px",
//                                       height: "24px",
//                                       borderRadius: "6px",
//                                       background:
//                                         "linear-gradient(135deg, #4f46e5, #7c3aed)",
//                                       color: "white",
//                                       display: "flex",
//                                       alignItems: "center",
//                                       justifyContent: "center",
//                                       fontSize: "12px",
//                                       fontWeight: 700,
//                                     }}
//                                   >
//                                     {index + 1}
//                                   </span>
//                                   Advance #{index + 1}
//                                 </div>
//                                 <Form.Item
//                                   {...field}
//                                   name={[field.name, "expectedAmount"]}
//                                   rules={[
//                                     { required: true, message: "Enter amount" },
//                                   ]}
//                                   style={{ marginBottom: 12 }}
//                                 >
//                                   <InputNumber
//                                     size="large"
//                                     style={{ width: "100%" }}
//                                     placeholder="Enter advance amount"
//                                     prefix="₹"
//                                     formatter={(value) =>
//                                       `${value}`.replace(
//                                         /\B(?=(\d{3})+(?!\d))/g,
//                                         ","
//                                       )
//                                     }
//                                     parser={(value) =>
//                                       value.replace(/₹\s?|(,*)/g, "")
//                                     }
//                                     min={0}
//                                   />
//                                 </Form.Item>
//                                 <Form.Item
//                                   {...field}
//                                   label="Advance Date"
//                                   name={[field.name, "advanceDate"]}
//                                   rules={[
//                                     {
//                                       required: true,
//                                       message: "Please select the advance date",
//                                     },
//                                   ]}
//                                   style={{ marginBottom: 0 }}
//                                 >
//                                   <DatePicker
//                                     size="large"
//                                     style={{ width: "100%" }}
//                                     placeholder="Select advance date"
//                                     format="YYYY-MM-DD"
//                                   />
//                                 </Form.Item>
//                               </div>
//                               {fields.length > 1 && (
//                                 <motion.div
//                                   whileHover={{ scale: 1.1 }}
//                                   whileTap={{ scale: 0.9 }}
//                                 >
//                                   <Button
//                                     type="text"
//                                     danger
//                                     icon={<DeleteOutlined />}
//                                     onClick={() => remove(field.name)}
//                                     style={{
//                                       marginTop: "32px",
//                                       borderRadius: "8px",
//                                       width: "40px",
//                                       height: "40px",
//                                     }}
//                                   />
//                                 </motion.div>
//                               )}
//                             </div>
//                           </div>
//                         </motion.div>
//                       ))}

//                       <motion.div
//                         whileHover={{ scale: 1.02 }}
//                         whileTap={{ scale: 0.98 }}
//                       >
//                         <Button
//                           type="dashed"
//                           onClick={() => add()}
//                           block
//                           icon={<PlusOutlined />}
//                           size="large"
//                           style={{
//                             height: "56px",
//                             fontSize: "15px",
//                           }}
//                         >
//                           Add Advance Payment
//                         </Button>
//                       </motion.div>
//                     </>
//                   )}
//                 </Form.List>
//               </motion.div>

//               {/* Submit Button */}
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.8 }}
//               >
//                 <Form.Item style={{ marginTop: "40px", marginBottom: 0 }}>
//                   <motion.div
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                   >
//                     <Button
//                       type="primary"
//                       htmlType="submit"
//                       size="large"
//                       loading={loading}
//                       block
//                       style={{
//                         height: "56px",
//                         borderRadius: "12px",
//                         fontSize: "17px",
//                         fontWeight: 600,
//                         background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
//                         border: "none",
//                         boxShadow: "0 8px 24px rgba(79, 70, 229, 0.3)",
//                       }}
//                     >
//                       ✨ Create Booking
//                     </Button>
//                   </motion.div>
//                 </Form.Item>
//               </motion.div>
//             </Form>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default AddInflow;
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Form, Input, DatePicker, Button, InputNumber, message, Select, Space, Tag } from "antd";
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

const { Option } = Select;

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

  .glass-event-type-card {
    background: rgba(255, 255, 255, 0.6);
    border-radius: 1rem;
    box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.08);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    transition: all 0.3s ease;
    margin-bottom: 24px;
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
  .ant-picker,
  .ant-select-selector {
    border-radius: 0.75rem !important;
    border: 1px solid rgba(79, 70, 229, 0.2) !important;
    transition: all 0.3s ease !important;
  }

  .ant-input:hover,
  .ant-input-number:hover,
  .ant-picker:hover,
  .ant-select-selector:hover {
    border-color: #7c3aed !important;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1) !important;
  }

  .ant-input:focus,
  .ant-input-number-focused,
  .ant-picker-focused,
  .ant-select-focused .ant-select-selector {
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

  .event-type-tag {
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(124, 58, 237, 0.1));
    border: 1px solid rgba(79, 70, 229, 0.3);
    color: #4f46e5;
  }
`;

const EVENT_TYPES = [
  { value: "Wedding", label: "Wedding", emoji: "💒" },
  { value: "House Warming Ceremony", label: "House Warming Ceremony", emoji: "🏡" },
  { value: "Baby Shower", label: "Baby Shower", emoji: "👶" },
  { value: "Temple Decor", label: "Temple Decor", emoji: "🛕" },
  { value: "Birthday", label: "Birthday", emoji: "🎂" },
  { value: "Government Events", label: "Government Events", emoji: "🏛️" },
  { value: "Bhumi Pooje", label: "Bhumi Pooje", emoji: "🙏" },
  { value: "Other", label: "Other", emoji: "✨" },
];

const WEDDING_SUB_TYPES = [
  { value: "Muhurtham", label: "Muhurtham", emoji: "💍" },
  { value: "Reception", label: "Reception", emoji: "🎊" },
  { value: "Beegara Uta", label: "Beegara Uta", emoji: "🍽️" },
  { value: "Bride Home Decor", label: "Bride Home Decor", emoji: "🏠" },
  { value: "Groom Home Decor", label: "Groom Home Decor", emoji: "🏘️" },
];

const AddInflow = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [eventName, setEventName] = useState("");
  const [selectedEventTypes, setSelectedEventTypes] = useState([]);
  const navigate = useNavigate();

  const handleEventNameChange = (value) => {
    setEventName(value);
    if (value !== "Wedding") {
      setSelectedEventTypes([]);
      form.setFieldsValue({ eventTypes: [] });
    }
    // Reset bride/groom names when changing event type
    if (value !== "Wedding") {
      form.setFieldsValue({ brideName: undefined, groomName: undefined });
    }
  };

  const handleEventTypesChange = (values) => {
    setSelectedEventTypes(values);
    
    // Initialize advances for new event types
    const currentAdvances = form.getFieldValue("eventTypeAdvances") || {};
    const newAdvances = { ...currentAdvances };
    
    values.forEach(eventType => {
      if (!newAdvances[eventType]) {
        newAdvances[eventType] = [{ expectedAmount: undefined, advanceDate: undefined }];
      }
    });
    
    // Remove advances for deselected event types
    Object.keys(newAdvances).forEach(key => {
      if (!values.includes(key)) {
        delete newAdvances[key];
      }
    });
    
    form.setFieldsValue({ eventTypeAdvances: newAdvances });
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Build event types array
      const eventTypes = eventName === "Wedding" 
        ? values.eventTypes.map(type => ({
            eventType: type,
            advances: (values.eventTypeAdvances?.[type] || []).map((advance, index) => ({
              advanceNumber: index + 1,
              expectedAmount: advance.expectedAmount,
              advanceDate: advance.advanceDate ? advance.advanceDate.toISOString() : null,
            }))
          }))
        : [{
            eventType: eventName === "Other" ? values.customEventName : eventName,
            advances: (values.advances || []).map((advance, index) => ({
              advanceNumber: index + 1,
              expectedAmount: advance.expectedAmount,
              advanceDate: advance.advanceDate ? advance.advanceDate.toISOString() : null,
            }))
          }];

      const payload = {
        eventName: eventName === "Other" ? values.customEventName : eventName,
        eventTypes: eventTypes,
        clientName: values.clientName,
        ...(eventName === "Wedding" && {
          brideName: values.brideName,
          groomName: values.groomName,
        }),
        eventDate: values.eventDate.toISOString(),
        venueLocation: values.venueLocation,
        contactNumber: values.contactNumber,
        ...(values.altContactNumber && { altContactNumber: values.altContactNumber }),
        agreedAmount: values.agreedAmount,
      };

      const axios = (await import("axios")).default;
      const response = await axios.post(`${API_BASE_URL}events`, payload);

      if (response.status === 200 || response.status === 201) {
        message.success("Event booking created successfully!");
        form.resetFields();
        setEventName("");
        setSelectedEventTypes([]);
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
          message.error("You don't have permission to create bookings.");
        } else if (status === 409) {
          message.error(
            errorMsg || "Booking conflict. Please check the details."
          );
        } else if (status >= 500) {
          message.error("Server error. Please try again later.");
        } else {
          message.error(
            errorMsg || "Failed to create booking. Please try again."
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
          maxWidth: "900px",
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

              {/* Custom Event Name (when Other is selected) */}
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

              {/* Wedding Event Types (Multiple Selection) */}
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

              {/* Bride and Groom Names (only for Wedding) */}
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

              {/* Event Date */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
              >
                <Form.Item
                  label="Event Date"
                  name="eventDate"
                  rules={[
                    { required: true, message: "Please select event date" },
                  ]}
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

              {/* Agreed Amount */}
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
                    prefix="₹"
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
                    min={0}
                  />
                </Form.Item>
              </motion.div>

              {/* Advances Section - For Wedding with Multiple Event Types */}
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
                      Advance Payments by Event Type
                    </span>
                  </div>

                  {selectedEventTypes.map((eventType, typeIndex) => (
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

                      <Form.List name={["eventTypeAdvances", eventType]}>
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
                                          format="YYYY-MM-DD"
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
                                  height: "48px",
                                  fontSize: "14px",
                                }}
                              >
                                Add Advance for {eventType}
                              </Button>
                            </motion.div>
                          </>
                        )}
                      </Form.List>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Advances Section - For Non-Wedding Events */}
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
                                      format="YYYY-MM-DD"
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