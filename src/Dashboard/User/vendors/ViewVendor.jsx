// /* eslint-disable no-unused-vars */
// import axios from "axios";
// import React, { useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { API_BASE_URL } from "../../../../config";
// import { message, Modal, Table, Button, Card, Input } from "antd";
// import {
//   EyeOutlined,
//   EditOutlined,
//   ArrowLeftOutlined,
//   PlusOutlined,
//   UserOutlined,
//   SearchOutlined,
// } from "@ant-design/icons";

// const customStyles = `
//   .vendor-glass-card {
//     background: rgba(255,255,255,0.85);
//     border-radius: 1.25rem;
//     box-shadow: 0 8px 32px 0 rgba(102,126,234,0.12);
//     backdrop-filter: blur(12px);
//     -webkit-backdrop-filter: blur(12px);
//     border: 1px solid rgba(255,255,255,0.4);
//     transition: all 0.3s ease;
//   }
  
//   .vendor-glass-card:hover {
//     box-shadow: 0 12px 40px 0 rgba(102,126,234,0.18);
//     transform: translateY(-2px);
//   }
  
//   .vendor-stats-card {
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     border-radius: 1.25rem;
//     border: none;
//     box-shadow: 0 8px 32px rgba(102,126,234,0.25);
//   }
  
//   .vendor-btn-primary {
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     border: none;
//     border-radius: 0.65rem;
//     font-weight: 600;
//     box-shadow: 0 4px 12px rgba(102,126,234,0.25);
//     transition: all 0.3s ease;
//   }
  
//   .vendor-btn-primary:hover {
//     background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%) !important;
//     transform: translateY(-2px);
//     box-shadow: 0 6px 16px rgba(102,126,234,0.35) !important;
//   }
  
//   .vendor-search-input {
//     border-radius: 0.65rem;
//     border: 1.5px solid rgba(102,126,234,0.2);
//     transition: all 0.3s ease;
//   }
  
//   .vendor-search-input:hover,
//   .vendor-search-input:focus {
//     border-color: #667eea;
//     box-shadow: 0 0 0 2px rgba(102,126,234,0.1);
//   }
  
//   .vendor-table .ant-table {
//     border-radius: 0.75rem;
//     overflow: hidden;
//   }
  
//   .vendor-table .ant-table-thead > tr > th {
//     background: linear-gradient(135deg, #f8f7ff 0%, #f3f1ff 100%);
//     color: #32255e;
//     font-weight: 700;
//     border: none;
//     font-size: 15px;
//   }
  
//   .vendor-table .ant-table-tbody > tr:hover > td {
//     background: #faf8fe !important;
//   }
  
//   .vendor-mobile-card {
//     background: rgba(255,255,255,0.9);
//     border-radius: 1rem;
//     border: 1px solid rgba(102,126,234,0.15);
//     box-shadow: 0 4px 16px rgba(102,126,234,0.08);
//     transition: all 0.3s ease;
//   }
  
//   .vendor-mobile-card:hover {
//     box-shadow: 0 8px 24px rgba(102,126,234,0.15);
//     transform: translateY(-2px);
//   }
  
//   .vendor-modal .ant-modal-header {
//     background: linear-gradient(135deg, #f8f7ff 0%, #f3f1ff 100%);
//     border-radius: 1rem 1rem 0 0;
//     border: none;
//   }
  
//   .vendor-modal .ant-modal-content {
//     border-radius: 1rem;
//     overflow: hidden;
//   }
// `;

// const ViewVendor = () => {
//   const [vendors, setVendors] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedVendor, setSelectedVendor] = useState(null);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
//   const [search, setSearch] = useState("");

//   const user = useSelector((state) => state.user.value);
//   const navigate = useNavigate();

//   const deptId = user?.departments?.length ? user.departments[0].id : null;

//   const config = {
//     headers: { Authorization: user?.access_token },
//   };

//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   const fetchRequirementsData = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get(
//         `${API_BASE_URL}vendor/department/${deptId}`,
//         config
//       );
//       setVendors(res.data.vendors || []);
//     } catch (err) {
//       message.error("Failed to fetch vendors");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (deptId) fetchRequirementsData();
//     // eslint-disable-next-line
//   }, [deptId]);

//   const showModal = (vendor) => {
//     setSelectedVendor(vendor);
//     setIsModalVisible(true);
//   };

//   const handleCancel = () => {
//     setIsModalVisible(false);
//     setSelectedVendor(null);
//   };

//   const handleEdit = (id) => {
//     navigate(`/user/editvendor/${id}`);
//   };

//   const filteredVendors = vendors.filter(
//     (v) =>
//       v.name?.toLowerCase().includes(search.toLowerCase()) ||
//       v.vendor_category?.toLowerCase().includes(search.toLowerCase()) ||
//       v.person_category?.toLowerCase().includes(search.toLowerCase())
//   );

//   const columns = [
//     {
//       title: "Vendor Name",
//       dataIndex: "name",
//       key: "name",
//       responsive: ["md"],
//       render: (text) => (
//         <span style={{ fontWeight: 600, color: "#32255e" }}>{text}</span>
//       ),
//     },
//     {
//       title: "Contact Person",
//       dataIndex: "cont_person",
//       key: "cont_person",
//       responsive: ["lg"],
//     },
//     {
//       title: "Category",
//       dataIndex: "person_category",
//       key: "person_category",
//       responsive: ["md"],
//       render: (text) => (
//         <span
//           style={{
//             padding: "4px 12px",
//             background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
//             borderRadius: "6px",
//             color: "#667eea",
//             fontWeight: 500,
//           }}
//         >
//           {text}
//         </span>
//       ),
//     },
//     {
//       title: "Type",
//       dataIndex: "vendor_type",
//       key: "vendor_type",
//       responsive: ["md"],
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       align: "center",
//       width: 140,
//       render: (_, record) => (
//         <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
//           <Button
//             type="text"
//             icon={<EyeOutlined />}
//             onClick={() => showModal(record)}
//             style={{
//               color: "#667eea",
//               borderRadius: "6px",
//               transition: "all 0.3s",
//             }}
//           />
//           <Button
//             type="primary"
//             size="small"
//             icon={<EditOutlined />}
//             onClick={() => handleEdit(record.id)}
//             className="vendor-btn-primary"
//             style={{ height: "32px" }}
//           >
//             Edit
//           </Button>
//         </div>
//       ),
//     },
//   ];

//   const renderMobileCards = () => (
//     <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
//       {filteredVendors.map((vendor, index) => (
//         <motion.div
//           key={vendor.id}
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.3, delay: index * 0.05 }}
//         >
//           <Card className="vendor-mobile-card" bodyStyle={{ padding: "20px" }}>
//             <div style={{ marginBottom: "16px" }}>
//               <div
//                 style={{
//                   fontSize: "20px",
//                   fontWeight: 700,
//                   color: "#32255e",
//                   marginBottom: "8px",
//                 }}
//               >
//                 {vendor.name}
//               </div>
//               <div
//                 style={{
//                   display: "flex",
//                   flexDirection: "column",
//                   gap: "6px",
//                   fontSize: "14px",
//                 }}
//               >
//                 <div style={{ color: "#5b5270" }}>
//                   <span style={{ fontWeight: 600, color: "#32255e" }}>Contact: </span>
//                   {vendor.cont_person}
//                 </div>
//                 <div>
//                   <span
//                     style={{
//                       padding: "3px 10px",
//                       background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
//                       borderRadius: "6px",
//                       color: "#667eea",
//                       fontWeight: 500,
//                       fontSize: "13px",
//                     }}
//                   >
//                     {vendor.person_category}
//                   </span>
//                   <span style={{ margin: "0 8px", color: "#d1c9e0" }}>•</span>
//                   <span style={{ color: "#5b5270" }}>{vendor.vendor_type}</span>
//                 </div>
//               </div>
//             </div>
//             <div
//               style={{
//                 display: "flex",
//                 gap: "10px",
//                 justifyContent: "flex-end",
//               }}
//             >
//               <Button
//                 icon={<EyeOutlined />}
//                 onClick={() => showModal(vendor)}
//                 style={{
//                   borderRadius: "8px",
//                   border: "1.5px solid #667eea30",
//                   color: "#667eea",
//                 }}
//               >
//                 View
//               </Button>
//               <Button
//                 type="primary"
//                 icon={<EditOutlined />}
//                 onClick={() => handleEdit(vendor.id)}
//                 className="vendor-btn-primary"
//               >
//                 Edit
//               </Button>
//             </div>
//           </Card>
//         </motion.div>
//       ))}
//     </div>
//   );

//   return (
//     <div
//       className="font-[cormoreg]"
//       style={{
//         minHeight: "100vh",
//         background: "linear-gradient(135deg, #f8f7ff 0%, #f0edff 100%)",
//         padding: isMobile ? "16px" : "32px",
//       }}
//     >
//       <style>{customStyles}</style>

//       {/* Gradient Background Overlay */}
//       <div
//         style={{
//           position: "fixed",
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           background:
//             "radial-gradient(circle at 20% 80%, rgba(102,126,234,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(118,75,162,0.08) 0%, transparent 50%)",
//           pointerEvents: "none",
//           zIndex: 0,
//         }}
//       />

//       <div style={{ position: "relative", zIndex: 1 }}>
//         {/* Header */}
//         <motion.div
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           style={{ marginBottom: "24px" }}
//         >
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "12px",
//               marginBottom: "8px",
//             }}
//           >
//             <Button
//               type="text"
//               icon={<ArrowLeftOutlined />}
//               onClick={() => navigate("/user")}
//               style={{
//                 color: "#667eea",
//                 fontSize: "16px",
//                 fontWeight: 600,
//                 height: "40px",
//               }}
//             >
//               Back
//             </Button>
//           </div>
//           <h1
//             style={{
//               fontSize: isMobile ? "32px" : "42px",
//               fontWeight: "bold",
//               color: "#32255e",
//               margin: 0,
//               letterSpacing: "-1px",
//             }}
//           >
//             Vendor Management
//           </h1>
//           <p style={{ color: "#9079a5", fontSize: "16px", marginTop: "4px" }}>
//             Manage and track all your vendors
//           </p>
//         </motion.div>

//         {/* Stats Card */}
//         <motion.div
//           initial={{ opacity: 0, scale: 0.95 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 0.5, delay: 0.1 }}
//         >
//           <Card className="vendor-stats-card" style={{ marginBottom: "24px" }}>
//             <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
//               <div
//                 style={{
//                   width: "64px",
//                   height: "64px",
//                   borderRadius: "16px",
//                   background: "rgba(255,255,255,0.25)",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   backdropFilter: "blur(10px)",
//                 }}
//               >
//                 <UserOutlined style={{ fontSize: "32px", color: "white" }} />
//               </div>
//               <div>
//                 <div
//                   style={{
//                     fontSize: "15px",
//                     color: "rgba(255,255,255,0.85)",
//                     marginBottom: "4px",
//                     fontWeight: 500,
//                   }}
//                 >
//                   Total Vendors
//                 </div>
//                 <div
//                   style={{
//                     fontSize: "36px",
//                     fontWeight: 700,
//                     color: "#fff",
//                     lineHeight: 1,
//                   }}
//                 >
//                   {vendors.length}
//                 </div>
//               </div>
//             </div>
//           </Card>
//         </motion.div>

//         {/* Main Content Card */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.2 }}
//         >
//           <Card className="vendor-glass-card" bodyStyle={{ padding: isMobile ? "16px" : "28px" }}>
//             {/* Search and Add Button */}
//             <div
//               style={{
//                 display: "flex",
//                 flexDirection: isMobile ? "column" : "row",
//                 alignItems: isMobile ? "stretch" : "center",
//                 justifyContent: "space-between",
//                 gap: "16px",
//                 marginBottom: "24px",
//               }}
//             >
//               <h2
//                 style={{
//                   color: "#32255e",
//                   fontWeight: 700,
//                   fontSize: "24px",
//                   margin: 0,
//                 }}
//               >
//                 All Vendors
//               </h2>
//               <div
//                 style={{
//                   display: "flex",
//                   gap: "12px",
//                   flexDirection: isMobile ? "column" : "row",
//                 }}
//               >
//                 <Input
//                   prefix={<SearchOutlined style={{ color: "#9079a5" }} />}
//                   allowClear
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   placeholder="Search vendors..."
//                   className="vendor-search-input"
//                   style={{
//                     width: isMobile ? "100%" : 280,
//                     height: "42px",
//                     fontSize: "15px",
//                   }}
//                 />
//                 <Button
//                   type="primary"
//                   icon={<PlusOutlined />}
//                   onClick={() => navigate("/user/addvendor")}
//                   className="vendor-btn-primary"
//                   style={{
//                     height: "42px",
//                     fontSize: "15px",
//                     paddingLeft: "24px",
//                     paddingRight: "24px",
//                   }}
//                 >
//                   Add Vendor
//                 </Button>
//               </div>
//             </div>

//             {/* Content */}
//             {loading ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "80px 20px",
//                   color: "#9079a5",
//                 }}
//               >
//                 <div style={{ fontSize: "18px", fontWeight: 500 }}>Loading vendors...</div>
//               </div>
//             ) : filteredVendors.length === 0 ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "80px 20px",
//                   color: "#9079a5",
//                 }}
//               >
//                 <UserOutlined
//                   style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}
//                 />
//                 <div style={{ fontSize: "18px", fontWeight: 500 }}>No vendors found</div>
//                 <div style={{ fontSize: "14px", marginTop: "8px" }}>
//                   {search ? "Try adjusting your search" : "Add your first vendor to get started"}
//                 </div>
//               </div>
//             ) : isMobile ? (
//               renderMobileCards()
//             ) : (
//               <div className="vendor-table">
//                 <Table
//                   columns={columns}
//                   dataSource={filteredVendors}
//                   loading={loading}
//                   rowKey="id"
//                   pagination={{
//                     pageSize: 10,
//                     showSizeChanger: true,
//                     showTotal: (total) => `Total ${total} vendors`,
//                   }}
//                   scroll={{ x: 800 }}
//                 />
//               </div>
//             )}
//           </Card>
//         </motion.div>
//       </div>

//       {/* Modal to show vendor details */}
//       <Modal
//         title={
//           <span style={{ fontSize: "22px", fontWeight: 700, color: "#32255e" }}>
//             Vendor Details
//           </span>
//         }
//         open={isModalVisible}
//         onCancel={handleCancel}
//         footer={[
//           <Button
//             key="close"
//             onClick={handleCancel}
//             className="vendor-btn-primary"
//             style={{ height: "40px" }}
//           >
//             Close
//           </Button>,
//         ]}
//         width={isMobile ? "95%" : 700}
//         className="vendor-modal"
//         style={{ top: isMobile ? 20 : 40 }}
//       >
//         {selectedVendor && (
//           <div
//             style={{
//               display: "grid",
//               gap: "12px",
//               maxHeight: isMobile ? "60vh" : "65vh",
//               overflowY: "auto",
//               padding: "8px",
//             }}
//           >
//             {[
//               { label: "Vendor Name", value: selectedVendor.name },
//               { label: "Company Name", value: selectedVendor.company_name || "N/A" },
//               { label: "Person Category", value: selectedVendor.person_category || "N/A" },
//               { label: "Temporary Address", value: selectedVendor.temp_address_1 || "N/A" },
//               { label: "Temporary City", value: selectedVendor.temp_city || "N/A" },
//               { label: "Temporary PIN", value: selectedVendor.temp_pin || "N/A" },
//               { label: "Temporary State", value: selectedVendor.temp_state || "N/A" },
//               { label: "Temporary Country", value: selectedVendor.temp_country || "N/A" },
//               { label: "Permanent Address 1", value: selectedVendor.perm_address_1 || "N/A" },
//               { label: "Permanent Address 2", value: selectedVendor.perm_address_2 || "N/A" },
//               { label: "Permanent City", value: selectedVendor.perm_city || "N/A" },
//               { label: "Permanent PIN", value: selectedVendor.perm_pin || "N/A" },
//               { label: "Permanent State", value: selectedVendor.perm_state || "N/A" },
//               { label: "Permanent Country", value: selectedVendor.perm_country || "N/A" },
//               { label: "Contact Person", value: selectedVendor.cont_person || "N/A" },
//               { label: "Designation", value: selectedVendor.designation || "N/A" },
//               { label: "Mobile Number", value: selectedVendor.mobile_no || "N/A" },
//               { label: "Alternate Mobile Number", value: selectedVendor.alt_mobile_no || "N/A" },
//               { label: "Email Address", value: selectedVendor.email || "N/A" },
//               { label: "Vendor Type", value: selectedVendor.vendor_type || "N/A" },
//               { label: "GST Number", value: selectedVendor.gst_no || "N/A" },
//               { label: "MSMED Number", value: selectedVendor.msmed_no || "N/A" },
//               { label: "PAN Number", value: selectedVendor.pan_no || "N/A" },
//               { label: "Bank Name", value: selectedVendor.bank_name || "N/A" },
//               { label: "Beneficiary Name", value: selectedVendor.beneficiary_name || "N/A" },
//               { label: "Bank Address 1", value: selectedVendor.bank_address_1 || "N/A" },
//               { label: "Bank Address 2", value: selectedVendor.bank_address_2 || "N/A" },
//               { label: "Bank PIN", value: selectedVendor.bank_pin || "N/A" },
//               { label: "Account Number", value: selectedVendor.account_number || "N/A" },
//               { label: "IFSC Code", value: selectedVendor.ifscode || "N/A" },
//               { label: "Branch", value: selectedVendor.branch || "N/A" },
//               { label: "Payment Terms", value: selectedVendor.payment_terms || "N/A" },
//               { label: "TDS Details", value: selectedVendor.tds_details || "N/A" },
//               { label: "Vendor Status", value: selectedVendor.vendor_status || "N/A" },
//             ].map((item, index) => (
//               <div
//                 key={index}
//                 style={{
//                   display: "grid",
//                   gridTemplateColumns: isMobile ? "1fr" : "180px 1fr",
//                   gap: "12px",
//                   padding: "14px",
//                   background: index % 2 === 0 ? "#faf8fe" : "#fff",
//                   borderRadius: "10px",
//                   transition: "all 0.2s",
//                 }}
//               >
//                 <span
//                   style={{
//                     color: "#32255e",
//                     fontWeight: 700,
//                     fontSize: "15px",
//                   }}
//                 >
//                   {item.label}
//                 </span>
//                 <span
//                   style={{
//                     wordBreak: "break-word",
//                     color: "#5b5270",
//                     fontSize: "15px",
//                   }}
//                 >
//                   {item.value}
//                 </span>
//               </div>
//             ))}
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default ViewVendor;
/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { message, Modal, Table, Button, Card, Input } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  UserOutlined,
  SearchOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { API_BASE_URL } from "../../../../config";

const customStyles = `
  .vendor-glass-card {
    background: rgba(255,255,255,0.85);
    border-radius: 1.25rem;
    box-shadow: 0 8px 32px 0 rgba(102,126,234,0.12);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.4);
    transition: all 0.3s ease;
  }
  
  .vendor-glass-card:hover {
    box-shadow: 0 12px 40px 0 rgba(102,126,234,0.18);
    transform: translateY(-2px);
  }
  
  .vendor-stats-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 1.25rem;
    border: none;
    box-shadow: 0 8px 32px rgba(102,126,234,0.25);
  }
  
  .vendor-btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 0.65rem;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(102,126,234,0.25);
    transition: all 0.3s ease;
  }
  
  .vendor-btn-primary:hover {
    background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102,126,234,0.35) !important;
  }
  
  .vendor-search-input {
    border-radius: 0.65rem;
    border: 1.5px solid rgba(102,126,234,0.2);
    transition: all 0.3s ease;
  }
  
  .vendor-search-input:hover,
  .vendor-search-input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102,126,234,0.1);
  }
  
  .vendor-table .ant-table {
    border-radius: 0.75rem;
    overflow: hidden;
  }
  
  .vendor-table .ant-table-thead > tr > th {
    background: linear-gradient(135deg, #f8f7ff 0%, #f3f1ff 100%);
    color: #32255e;
    font-weight: 700;
    border: none;
    font-size: 15px;
  }
  
  .vendor-table .ant-table-tbody > tr:hover > td {
    background: #faf8fe !important;
  }
  
  .vendor-mobile-card {
    background: rgba(255,255,255,0.9);
    border-radius: 1rem;
    border: 1px solid rgba(102,126,234,0.15);
    box-shadow: 0 4px 16px rgba(102,126,234,0.08);
    transition: all 0.3s ease;
  }
  
  .vendor-mobile-card:hover {
    box-shadow: 0 8px 24px rgba(102,126,234,0.15);
    transform: translateY(-2px);
  }
  
  .vendor-modal .ant-modal-header {
    background: linear-gradient(135deg, #f8f7ff 0%, #f3f1ff 100%);
    border-radius: 1rem 1rem 0 0;
    border: none;
  }
  
  .vendor-modal .ant-modal-content {
    border-radius: 1rem;
    overflow: hidden;
  }
`;

const ViewVendor = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [search, setSearch] = useState("");

  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();

  const deptId = user?.departments?.length ? user.departments[0].id : null;

  const config = {
    headers: { Authorization: user?.access_token },
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchRequirementsData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}vendor/department/${deptId}`,
        config
      );
      setVendors(res.data.vendors || []);
    } catch (err) {
      message.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deptId) fetchRequirementsData();
    // eslint-disable-next-line
  }, [deptId]);

  const exportToPDF = (vendor) => {
    const doc = new jsPDF();
    
    // Company Header
    // doc.setFontSize(16);
    // doc.setFont("helvetica", "bold");
    // doc.text("COMB INDUSTRIES INC", 105, 15, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Request Form For Opening New Vendor Code", 105, 22, { align: "center" });
    
    // doc.setFontSize(11);
    // doc.setFont("helvetica", "bold");
    // doc.text("List of Data Particulars", 105, 29, { align: "center" });

    // Vendor Information Table
    const tableData = [
      ["Name of The Vendor", vendor.name || ""],
      ["Category of Person", vendor.person_category || ""],
      ["Company Name", vendor.company_name || ""],
      ["", ""],
      ["Complete Address with PIN code", ""],
      ["Address-1 (Temporary)", vendor.temp_address_1 || ""],
      ["City", vendor.temp_city || ""],
      ["PIN Code", vendor.temp_pin || ""],
      ["State", vendor.temp_state || ""],
      ["Country", vendor.temp_country || ""],
      ["", ""],
      ["Address-2 (Permanent)", vendor.perm_address_1 + " " + (vendor.perm_address_2 || "")],
      ["City", vendor.perm_city || ""],
      ["PIN Code", vendor.perm_pin || ""],
      ["State", vendor.perm_state || ""],
      ["Country", vendor.perm_country || ""],
      ["", ""],
      ["Contact Person", vendor.cont_person || ""],
      ["Designation", vendor.designation || ""],
      ["Contact Number", vendor.mobile_no || ""],
      ["Type Of Vendor", vendor.vendor_type || ""],
      ["Mobile Nnumber", vendor.alt_mobile_no || ""],
      ["GST NO*", vendor.gst_no || ""],
      ["E-Mail", vendor.email || ""],
      ["MSMED NO*", vendor.msmed_no || ""],
      ["PAN NO*", vendor.pan_no || ""],
      ["", ""],
      ["BANK DETAILS", ""],
      ["Bank Name", vendor.bank_name || ""],
      ["Address-1", vendor.bank_address_1 || ""],
      ["Address-2", vendor.bank_address_2 || ""],
      ["PIN Code", vendor.bank_pin || ""],
      ["Account Number", vendor.account_number || ""],
      ["IFSCODE", vendor.ifscode || ""],
      ["Branch", vendor.branch || ""],
      ["Beneficiary Name", vendor.beneficiary_name || ""],
      ["", ""],
      ["Payment Terms", vendor.payment_terms || ""],
      ["TDS Rate & Section", vendor.tds_details || ""],
    ];

    autoTable(doc, {
      startY: 35,
      head: [],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { cellWidth: 120 }
      },
      didParseCell: function(data) {
        if (data.row.index === 3 || data.row.index === 4 || data.row.index === 10 || 
            data.row.index === 16 || data.row.index === 26 || data.row.index === 27 || 
            data.row.index === 36) {
          data.cell.styles.fillColor = [230, 230, 230];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // Footer Notes
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("*All the columns should be properly filled up. No column should be kept Blank.", 14, finalY);
    doc.text("*All registered certificates should be scanned and attached in system.", 14, finalY + 5);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Compulsory Documents to be Attached:", 14, finalY + 15);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const docs = [
      "1) Copy of PAN Card",
      "2) Address proof- copy of voter card, Aadhar card, license, passport",
      "3) Copy of GST certificate as applicable",
      "4) Copy of cancelled cheque",
      "5) MSMED form"
    ];
    
    let yPos = finalY + 20;
    docs.forEach(docItem => {
      doc.text(docItem, 14, yPos);
      yPos += 5;
    });

    // Signature line
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SIGNATURE", 14, yPos + 10);
    doc.line(14, yPos + 15, 80, yPos + 15);

    // Save the PDF
    doc.save(`Vendor_${vendor.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    message.success("PDF exported successfully!");
  };

  const showModal = (vendor) => {
    setSelectedVendor(vendor);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedVendor(null);
  };

  const handleEdit = (id) => {
    navigate(`/user/editvendor/${id}`);
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.vendor_category?.toLowerCase().includes(search.toLowerCase()) ||
      v.person_category?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: "Vendor Name",
      dataIndex: "name",
      key: "name",
      responsive: ["md"],
      render: (text) => (
        <span style={{ fontWeight: 600, color: "#32255e" }}>{text}</span>
      ),
    },
    {
      title: "Contact Person",
      dataIndex: "cont_person",
      key: "cont_person",
      responsive: ["lg"],
    },
    {
      title: "Category",
      dataIndex: "person_category",
      key: "person_category",
      responsive: ["md"],
      render: (text) => (
        <span
          style={{
            padding: "4px 12px",
            background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
            borderRadius: "6px",
            color: "#667eea",
            fontWeight: 500,
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "vendor_type",
      key: "vendor_type",
      responsive: ["md"],
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 200,
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => showModal(record)}
            style={{
              color: "#667eea",
              borderRadius: "6px",
              transition: "all 0.3s",
            }}
          />
          <Button
            type="text"
            icon={<FilePdfOutlined />}
            onClick={() => exportToPDF(record)}
            style={{
              color: "#e74c3c",
              borderRadius: "6px",
              transition: "all 0.3s",
            }}
            title="Export to PDF"
          />
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
            className="vendor-btn-primary"
            style={{ height: "32px" }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  const renderMobileCards = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {filteredVendors.map((vendor, index) => (
        <motion.div
          key={vendor.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className="vendor-mobile-card" bodyStyle={{ padding: "20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#32255e",
                  marginBottom: "8px",
                }}
              >
                {vendor.name}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "14px",
                }}
              >
                <div style={{ color: "#5b5270" }}>
                  <span style={{ fontWeight: 600, color: "#32255e" }}>Contact: </span>
                  {vendor.cont_person}
                </div>
                <div>
                  <span
                    style={{
                      padding: "3px 10px",
                      background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                      borderRadius: "6px",
                      color: "#667eea",
                      fontWeight: 500,
                      fontSize: "13px",
                    }}
                  >
                    {vendor.person_category}
                  </span>
                  <span style={{ margin: "0 8px", color: "#d1c9e0" }}>•</span>
                  <span style={{ color: "#5b5270" }}>{vendor.vendor_type}</span>
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <Button
                icon={<EyeOutlined />}
                onClick={() => showModal(vendor)}
                style={{
                  borderRadius: "8px",
                  border: "1.5px solid #667eea30",
                  color: "#667eea",
                }}
              >
                View
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                onClick={() => exportToPDF(vendor)}
                style={{
                  borderRadius: "8px",
                  border: "1.5px solid #e74c3c30",
                  color: "#e74c3c",
                }}
              >
                PDF
              </Button>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => handleEdit(vendor.id)}
                className="vendor-btn-primary"
              >
                Edit
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div
      className="font-[cormoreg]"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8f7ff 0%, #f0edff 100%)",
        padding: isMobile ? "16px" : "32px",
      }}
    >
      <style>{customStyles}</style>

      {/* Gradient Background Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 20% 80%, rgba(102,126,234,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(118,75,162,0.08) 0%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: "24px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/user")}
              style={{
                color: "#667eea",
                fontSize: "16px",
                fontWeight: 600,
                height: "40px",
              }}
            >
              Back
            </Button>
          </div>
          <h1
            style={{
              fontSize: isMobile ? "32px" : "42px",
              fontWeight: "bold",
              color: "#32255e",
              margin: 0,
              letterSpacing: "-1px",
            }}
          >
            Vendor Management
          </h1>
          <p style={{ color: "#9079a5", fontSize: "16px", marginTop: "4px" }}>
            Manage and track all your vendors
          </p>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="vendor-stats-card" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(10px)",
                }}
              >
                <UserOutlined style={{ fontSize: "32px", color: "white" }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "rgba(255,255,255,0.85)",
                    marginBottom: "4px",
                    fontWeight: 500,
                  }}
                >
                  Total Vendors
                </div>
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {vendors.length}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="vendor-glass-card" bodyStyle={{ padding: isMobile ? "16px" : "28px" }}>
            {/* Search and Add Button */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  color: "#32255e",
                  fontWeight: 700,
                  fontSize: "24px",
                  margin: 0,
                }}
              >
                All Vendors
              </h2>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <Input
                  prefix={<SearchOutlined style={{ color: "#9079a5" }} />}
                  allowClear
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vendors..."
                  className="vendor-search-input"
                  style={{
                    width: isMobile ? "100%" : 280,
                    height: "42px",
                    fontSize: "15px",
                  }}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate("/user/addvendor")}
                  className="vendor-btn-primary"
                  style={{
                    height: "42px",
                    fontSize: "15px",
                    paddingLeft: "24px",
                    paddingRight: "24px",
                  }}
                >
                  Add Vendor
                </Button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 20px",
                  color: "#9079a5",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: 500 }}>Loading vendors...</div>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 20px",
                  color: "#9079a5",
                }}
              >
                <UserOutlined
                  style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}
                />
                <div style={{ fontSize: "18px", fontWeight: 500 }}>No vendors found</div>
                <div style={{ fontSize: "14px", marginTop: "8px" }}>
                  {search ? "Try adjusting your search" : "Add your first vendor to get started"}
                </div>
              </div>
            ) : isMobile ? (
              renderMobileCards()
            ) : (
              <div className="vendor-table">
                <Table
                  columns={columns}
                  dataSource={filteredVendors}
                  loading={loading}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} vendors`,
                  }}
                  scroll={{ x: 800 }}
                />
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Modal to show vendor details */}
      <Modal
        title={
          <span style={{ fontSize: "22px", fontWeight: 700, color: "#32255e" }}>
            Vendor Details
          </span>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button
            key="pdf"
            icon={<FilePdfOutlined />}
            onClick={() => {
              exportToPDF(selectedVendor);
              handleCancel();
            }}
            style={{
              background: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "0.65rem",
              height: "40px",
            }}
          >
            Export PDF
          </Button>,
          <Button
            key="close"
            onClick={handleCancel}
            className="vendor-btn-primary"
            style={{ height: "40px" }}
          >
            Close
          </Button>,
        ]}
        width={isMobile ? "95%" : 700}
        className="vendor-modal"
        style={{ top: isMobile ? 20 : 40 }}
      >
        {selectedVendor && (
          <div
            style={{
              display: "grid",
              gap: "12px",
              maxHeight: isMobile ? "60vh" : "65vh",
              overflowY: "auto",
              padding: "8px",
            }}
          >
            {[
              { label: "Vendor Name", value: selectedVendor.name },
              { label: "Person Category", value: selectedVendor.person_category || "N/A" },
              { label: "Company Name", value: selectedVendor.company_name || "N/A" },
              { label: "Temporary Address", value: selectedVendor.temp_address_1 || "N/A" },
              { label: "Temporary City", value: selectedVendor.temp_city || "N/A" },
              { label: "Temporary PIN", value: selectedVendor.temp_pin || "N/A" },
              { label: "Temporary State", value: selectedVendor.temp_state || "N/A" },
              { label: "Temporary Country", value: selectedVendor.temp_country || "N/A" },
              { label: "Permanent Address 1", value: selectedVendor.perm_address_1 || "N/A" },
              { label: "Permanent Address 2", value: selectedVendor.perm_address_2 || "N/A" },
              { label: "Permanent City", value: selectedVendor.perm_city || "N/A" },
              { label: "Permanent PIN", value: selectedVendor.perm_pin || "N/A" },
              { label: "Permanent State", value: selectedVendor.perm_state || "N/A" },
              { label: "Permanent Country", value: selectedVendor.perm_country || "N/A" },
              { label: "Contact Person", value: selectedVendor.cont_person || "N/A" },
              { label: "Designation", value: selectedVendor.designation || "N/A" },
              { label: "Mobile Number", value: selectedVendor.mobile_no || "N/A" },
              { label: "Alternate Mobile Number", value: selectedVendor.alt_mobile_no || "N/A" },
              { label: "Email Address", value: selectedVendor.email || "N/A" },
              { label: "Vendor Type", value: selectedVendor.vendor_type || "N/A" },
              { label: "GST Number", value: selectedVendor.gst_no || "N/A" },
              { label: "MSMED Number", value: selectedVendor.msmed_no || "N/A" },
              { label: "PAN Number", value: selectedVendor.pan_no || "N/A" },
              { label: "Bank Name", value: selectedVendor.bank_name || "N/A" },
              { label: "Beneficiary Name", value: selectedVendor.beneficiary_name || "N/A" },
              { label: "Bank Address 1", value: selectedVendor.bank_address_1 || "N/A" },
              { label: "Bank Address 2", value: selectedVendor.bank_address_2 || "N/A" },
              { label: "Bank PIN", value: selectedVendor.bank_pin || "N/A" },
              { label: "Account Number", value: selectedVendor.account_number || "N/A" },
              { label: "IFSC Code", value: selectedVendor.ifscode || "N/A" },
              { label: "Branch", value: selectedVendor.branch || "N/A" },
              { label: "Payment Terms", value: selectedVendor.payment_terms || "N/A" },
              { label: "TDS Details", value: selectedVendor.tds_details || "N/A" },
              { label: "Vendor Status", value: selectedVendor.vendor_status || "N/A" },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "180px 1fr",
                  gap: "12px",
                  padding: "14px",
                  background: index % 2 === 0 ? "#faf8fe" : "#fff",
                  borderRadius: "10px",
                  transition: "all 0.2s",
                }}
              >
                <span
                  style={{
                    color: "#32255e",
                    fontWeight: 700,
                    fontSize: "15px",
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    wordBreak: "break-word",
                    color: "#5b5270",
                    fontSize: "15px",
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViewVendor;