// /* eslint-disable no-unused-vars */
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../../config";
// import { message, Collapse, Table, Modal, Button, Card, Input } from "antd";
// import {
//   EyeOutlined,
//   FilePdfOutlined,
//   SearchOutlined,
//   TeamOutlined,
//   DownloadOutlined,
// } from "@ant-design/icons";
// import { useSelector } from "react-redux";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import { motion } from "framer-motion";

// const { Panel } = Collapse;

// const customStyles = `
//   *{
//  font-family: cormoreg !important;
// }
//   .vendors-glass-card {
//     background: rgba(255,255,255,0.85);
//     border-radius: 1.25rem;
//     box-shadow: 0 8px 32px 0 rgba(102,126,234,0.12);
//     backdrop-filter: blur(12px);
//     -webkit-backdrop-filter: blur(12px);
//     border: 1px solid rgba(255,255,255,0.4);
//     transition: all 0.3s ease;
//   }

//   .vendors-glass-card:hover {
//     box-shadow: 0 12px 40px 0 rgba(102,126,234,0.18);
//     transform: translateY(-2px);
//   }

//   .vendors-collapse {
//     background: transparent !important;
//     border: none !important;
//   }

//   .vendors-collapse .ant-collapse-item {
//     background: rgba(255,255,255,0.9);
//     border-radius: 1rem !important;
//     border: 1px solid rgba(102,126,234,0.15);
//     margin-bottom: 16px;
//     overflow: hidden;
//     box-shadow: 0 4px 16px rgba(102,126,234,0.08);
//     transition: all 0.3s ease;
//   }

//   .vendors-collapse .ant-collapse-item:hover {
//     box-shadow: 0 8px 24px rgba(102,126,234,0.15);
//     transform: translateY(-2px);
//   }

//   .vendors-collapse .ant-collapse-header {
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
//     color: white !important;
//     font-weight: 700;
//     font-size: 16px;
//     padding: 16px 24px !important;
//     border-radius: 1rem 1rem 0 0 !important;
//   }

//   .vendors-collapse .ant-collapse-header:hover {
//     background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%) !important;
//   }

//   .vendors-collapse .ant-collapse-content {
//     background: white;
//     border-top: none;
//   }

//   .vendors-collapse .ant-collapse-content-box {
//     padding: 20px;
//   }

//   .vendors-table .ant-table {
//     border-radius: 0.75rem;
//     overflow: hidden;
//   }

//   .vendors-table .ant-table-thead > tr > th {
//     background: linear-gradient(135deg, #f8f7ff 0%, #f3f1ff 100%);
//     color: #32255e;
//     font-weight: 700;
//     border: none;
//     font-size: 14px;
//   }

//   .vendors-table .ant-table-tbody > tr:hover > td {
//     background: #faf8fe !important;
//   }

//   .vendors-btn-primary {
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     border: none;
//     border-radius: 0.65rem;
//     font-weight: 600;
//     box-shadow: 0 4px 12px rgba(102,126,234,0.25);
//     transition: all 0.3s ease;
//     color: white;
//   }

//   .vendors-btn-primary:hover {
//     background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%) !important;
//     transform: translateY(-2px);
//     box-shadow: 0 6px 16px rgba(102,126,234,0.35) !important;
//     color: white !important;
//   }

//   .vendors-search-input {
//     border-radius: 0.65rem;
//     border: 1.5px solid rgba(102,126,234,0.2);
//     transition: all 0.3s ease;
//   }

//   .vendors-search-input:hover,
//   .vendors-search-input:focus {
//     border-color: #667eea;
//     box-shadow: 0 0 0 2px rgba(102,126,234,0.1);
//   }

//   .vendors-modal .ant-modal-header {
//     background: linear-gradient(135deg, #f8f7ff 0%, #f3f1ff 100%);
//     border-radius: 1rem 1rem 0 0;
//     border: none;
//   }

//   .vendors-modal .ant-modal-content {
//     border-radius: 1rem;
//     overflow: hidden;
//   }

//   .vendors-stats-card {
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     border-radius: 1.25rem;
//     border: none;
//     box-shadow: 0 8px 32px rgba(102,126,234,0.25);
//   }
// `;

// const ViewVendors = () => {
//   const user = useSelector((state) => state.user.value);
//   const config = {
//     headers: {
//       Authorization: user?.access_token,
//     },
//   };

//   const [vendors, setVendors] = useState([]);
//   const [groupedVendors, setGroupedVendors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [selectedVendor, setSelectedVendor] = useState(null);
//   const [search, setSearch] = useState("");
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   // Debounced fetch function
//   const fetchVendors = async (searchQuery = "") => {
//     setLoading(true);
//     try {
//       // Build URL with search query parameter
//       const url = searchQuery
//         ? `${API_BASE_URL}vendor/all?search=${encodeURIComponent(searchQuery)}`
//         : `${API_BASE_URL}vendor/all`;

//       const res = await axios.get(url, config);
//       if (res.data.success && res.data.vendors) {
//         setVendors(res.data.vendors);
//       } else {
//         message.error("Failed to fetch vendors");
//       }
//     } catch (err) {
//       console.error("Error fetching vendors:", err);
//       message.error("Failed to fetch vendors");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Group vendors by department name
//   useEffect(() => {
//     const groups = {};
//     vendors.forEach((vendor) => {
//       const departments =
//         vendor.vendor_belongs_to?.department?.department || [];
//       const deptName =
//         departments.length > 0 ? departments[0].name : "No Department";
//       if (!groups[deptName]) {
//         groups[deptName] = [];
//       }
//       groups[deptName].push(vendor);
//     });
//     setGroupedVendors(groups);
//   }, [vendors]);

//   // Initial fetch on component mount
//   useEffect(() => {
//     fetchVendors();
//   }, []);

//   // Debounced search effect
//   useEffect(() => {
//     const delayDebounceFn = setTimeout(() => {
//       fetchVendors(search);
//     }, 500); // 500ms delay for debouncing

//     return () => clearTimeout(delayDebounceFn);
//   }, [search]);

//   const exportSingleVendorToPDF = (vendor) => {
//     const doc = new jsPDF();

//     doc.setFontSize(14);
//     doc.setFont("helvetica", "Bold");
//     doc.text("Request Form For Opening New Vendor Code", 105, 22, { align: "center" });

//     const tableData = [
//       ["Name of The Vendor", vendor.name || ""],
//       ["Category of Person", vendor.person_category || ""],
//       ["Company Name", vendor.company_name || ""],
//       ["", ""],
//       ["Complete Address with PIN code", ""],
//       ["Address-1 (Temporary)", vendor.temp_address_1 || ""],
//       ["City", vendor.temp_city || ""],
//       ["PIN Code", vendor.temp_pin || ""],
//       ["State", vendor.temp_state || ""],
//       ["Country", vendor.temp_country || ""],
//       ["", ""],
//       ["Address-2 (Permanent)", vendor.perm_address_1 + " " + (vendor.perm_address_2 || "")],
//       ["City", vendor.perm_city || ""],
//       ["PIN Code", vendor.perm_pin || ""],
//       ["State", vendor.perm_state || ""],
//       ["Country", vendor.perm_country || ""],
//       ["", ""],
//       ["Contact Person", vendor.cont_person || ""],
//       ["Designation", vendor.designation || ""],
//       ["Contact Number", vendor.mobile_no || ""],
//       ["Type Of Vendor", vendor.vendor_type || ""],
//       ["Mobile Nnumber", vendor.alt_mobile_no || ""],
//       ["GST NO*", vendor.gst_no || ""],
//       ["E-Mail", vendor.email || ""],
//       ["MSMED NO*", vendor.msmed_no || ""],
//       ["PAN NO*", vendor.pan_no || ""],
//       ["", ""],
//       ["BANK DETAILS", ""],
//       ["Bank Name", vendor.bank_name || ""],
//       ["Address-1", vendor.bank_address_1 || ""],
//       ["Address-2", vendor.bank_address_2 || ""],
//       ["PIN Code", vendor.bank_pin || ""],
//       ["Account Number", vendor.account_number || ""],
//       ["IFSCODE", vendor.ifscode || ""],
//       ["Branch", vendor.branch || ""],
//       ["Beneficiary Name", vendor.beneficiary_name || ""],
//       ["", ""],
//       ["Payment Terms", vendor.payment_terms || ""],
//       ["TDS Rate & Section", vendor.tds_details || ""],
//     ];

//     autoTable(doc, {
//       startY: 35,
//       head: [],
//       body: tableData,
//       theme: 'grid',
//       styles: {
//         fontSize: 9,
//         cellPadding: 3,
//       },
//       columnStyles: {
//         0: { fontStyle: 'bold', cellWidth: 70 },
//         1: { cellWidth: 120 }
//       },
//       didParseCell: function(data) {
//         if (data.row.index === 3 || data.row.index === 4 || data.row.index === 10 ||
//             data.row.index === 16 || data.row.index === 26 || data.row.index === 27 ||
//             data.row.index === 36) {
//           data.cell.styles.fillColor = [230, 230, 230];
//           data.cell.styles.fontStyle = 'bold';
//         }
//       }
//     });

//     const finalY = doc.lastAutoTable.finalY + 10;
//     doc.setFontSize(8);
//     doc.setFont("helvetica", "italic");
//     doc.text("*All the columns should be properly filled up. No column should be kept Blank.", 14, finalY);
//     doc.text("*All registered certificates should be scanned and attached in system.", 14, finalY + 5);

//     doc.setFontSize(9);
//     doc.setFont("helvetica", "bold");
//     doc.text("Compulsory Documents to be Attached:", 14, finalY + 15);

//     doc.setFontSize(8);
//     doc.setFont("helvetica", "normal");
//     const docs = [
//       "1) Copy of PAN Card",
//       "2) Address proof- copy of voter card, Aadhar card, license, passport",
//       "3) Copy of GST certificate as applicable",
//       "4) Copy of cancelled cheque",
//       "5) MSMED form"
//     ];

//     let yPos = finalY + 20;
//     docs.forEach(docItem => {
//       doc.text(docItem, 14, yPos);
//       yPos += 5;
//     });

//     doc.setFontSize(10);
//     doc.setFont("helvetica", "bold");
//     doc.text("SIGNATURE", 14, yPos + 10);
//     doc.line(14, yPos + 15, 80, yPos + 15);

//     doc.save(`Vendor_${vendor.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
//     message.success("PDF exported successfully!");
//   };

//   const exportDepartmentToPDF = (departmentName, vendorsList) => {
//     const doc = new jsPDF();

//     doc.setFontSize(16);
//     doc.setFont("helvetica", "bold");
//     doc.text("COMB INDUSTRIES INC", 105, 15, { align: "center" });

//     doc.setFontSize(12);
//     doc.setFont("helvetica", "normal");
//     doc.text("Department Vendors Report", 105, 22, { align: "center" });

//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text(`Department: ${departmentName}`, 105, 29, { align: "center" });

//     doc.setFontSize(10);
//     doc.setFont("helvetica", "normal");
//     doc.text(`Total Vendors: ${vendorsList.length}`, 105, 36, {
//       align: "center",
//     });
//     doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 42, {
//       align: "center",
//     });

//     const tableData = vendorsList.map((vendor) => [
//       vendor.name || "",
//       vendor.company_name || "",
//       vendor.vendor_type || "",
//       vendor.cont_person || "",
//       vendor.mobile_no || "",
//       vendor.email || "",
//     ]);

//     autoTable(doc, {
//       startY: 50,
//       head: [
//         ["Vendor Name", "Company", "Type", "Contact Person", "Mobile", "Email"],
//       ],
//       body: tableData,
//       theme: "striped",
//       headStyles: {
//         fillColor: [102, 126, 234],
//         textColor: 255,
//         fontStyle: "bold",
//         fontSize: 9,
//       },
//       styles: {
//         fontSize: 8,
//         cellPadding: 3,
//       },
//       columnStyles: {
//         0: { cellWidth: 30 },
//         1: { cellWidth: 35 },
//         2: { cellWidth: 25 },
//         3: { cellWidth: 30 },
//         4: { cellWidth: 25 },
//         5: { cellWidth: 45 },
//       },
//     });

//     doc.save(
//       `Department_${departmentName.replace(
//         /\s+/g,
//         "_"
//       )}_Vendors_${new Date().getTime()}.pdf`
//     );
//     message.success(`${departmentName} vendors exported successfully!`);
//   };

//   const exportAllVendorsToPDF = () => {
//     const doc = new jsPDF();

//     doc.setFontSize(16);
//     doc.setFont("helvetica", "bold");
//     doc.text("COMB INDUSTRIES INC", 105, 15, { align: "center" });

//     doc.setFontSize(12);
//     doc.setFont("helvetica", "normal");
//     doc.text("All Vendors Report", 105, 22, { align: "center" });

//     doc.setFontSize(10);
//     doc.text(`Total Vendors: ${vendors.length}`, 105, 29, { align: "center" });
//     doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 35, {
//       align: "center",
//     });

//     let startY = 45;

//     Object.entries(groupedVendors).forEach(([deptName, vendorsList], index) => {
//       if (index > 0) {
//         doc.addPage();
//         startY = 20;
//       }

//       doc.setFontSize(12);
//       doc.setFont("helvetica", "bold");
//       doc.text(`${deptName} (${vendorsList.length} vendors)`, 14, startY);

//       const tableData = vendorsList.map((vendor) => [
//         vendor.name || "",
//         vendor.company_name || "",
//         vendor.vendor_type || "",
//         vendor.cont_person || "",
//         vendor.mobile_no || "",
//       ]);

//       autoTable(doc, {
//         startY: startY + 5,
//         head: [["Vendor Name", "Company", "Type", "Contact Person", "Mobile"]],
//         body: tableData,
//         theme: "striped",
//         headStyles: {
//           fillColor: [102, 126, 234],
//           textColor: 255,
//           fontStyle: "bold",
//           fontSize: 9,
//         },
//         styles: {
//           fontSize: 8,
//           cellPadding: 3,
//         },
//         columnStyles: {
//           0: { cellWidth: 40 },
//           1: { cellWidth: 40 },
//           2: { cellWidth: 35 },
//           3: { cellWidth: 40 },
//           4: { cellWidth: 35 },
//         },
//       });

//       startY = doc.lastAutoTable.finalY + 15;
//     });

//     doc.save(`All_Vendors_Report_${new Date().getTime()}.pdf`);
//     message.success("All vendors exported successfully!");
//   };

//   const columns = [
//     {
//       title: "Vendor Name",
//       dataIndex: "name",
//       key: "name",
//       render: (text) => (
//         <span style={{ fontWeight: 600, color: "#32255e" }}>{text}</span>
//       ),
//     },
//     {
//       title: "Company Name",
//       dataIndex: "company_name",
//       key: "company_name",
//       responsive: ["md"],
//     },
//     {
//       title: "Vendor Type",
//       dataIndex: "vendor_type",
//       key: "vendor_type",
//       responsive: ["lg"],
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
//       title: "Contact Person",
//       dataIndex: "cont_person",
//       key: "cont_person",
//       responsive: ["lg"],
//     },
//     {
//       title: "Action",
//       key: "action",
//       align: "center",
//       width: 150,
//       render: (_, record) => (
//         <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
//           <Button
//             type="text"
//             icon={<EyeOutlined />}
//             onClick={() => {
//               setSelectedVendor(record);
//               setModalVisible(true);
//             }}
//             style={{
//               color: "#667eea",
//               borderRadius: "6px",
//             }}
//             aria-label={`View details of ${record.name}`}
//           />
//           <Button
//             type="text"
//             icon={<FilePdfOutlined />}
//             onClick={() => exportSingleVendorToPDF(record)}
//             style={{
//               color: "#e74c3c",
//               borderRadius: "6px",
//             }}
//             title="Export to PDF"
//           />
//         </div>
//       ),
//     },
//   ];

//   const renderVendorDetails = (vendor) => {
//     if (!vendor) return null;
//     const flatData = [];

//     const pushEntry = (label, value) => {
//       if (value !== undefined && value !== null && value !== "") {
//         flatData.push({ label, value: value.toString() });
//       }
//     };

//     pushEntry("Vendor Name", vendor.name);
//     pushEntry("Person Category", vendor.person_category);
//     pushEntry("Company Name", vendor.company_name);
//     pushEntry("Temporary Address 1", vendor.temp_address_1);
//     pushEntry("Temporary City", vendor.temp_city);
//     pushEntry("Temporary PIN", vendor.temp_pin);
//     pushEntry("Temporary State", vendor.temp_state);
//     pushEntry("Temporary Country", vendor.temp_country);
//     pushEntry("Permanent Address 1", vendor.perm_address_1);
//     pushEntry("Permanent Address 2", vendor.perm_address_2);
//     pushEntry("Permanent City", vendor.perm_city);
//     pushEntry("Permanent PIN", vendor.perm_pin);
//     pushEntry("Permanent State", vendor.perm_state);
//     pushEntry("Permanent Country", vendor.perm_country);
//     pushEntry("Contact Person", vendor.cont_person);
//     pushEntry("Designation", vendor.designation);
//     pushEntry("Mobile Number", vendor.mobile_no);
//     pushEntry("Alternate Mobile Number", vendor.alt_mobile_no);
//     pushEntry("Email", vendor.email);
//     pushEntry("Vendor Type", vendor.vendor_type);
//     pushEntry("GST Number", vendor.gst_no);
//     pushEntry("MSMED Number", vendor.msmed_no);
//     pushEntry("PAN Number", vendor.pan_no);
//     pushEntry("Bank Name", vendor.bank_name);
//     pushEntry("Beneficiary Name", vendor.beneficiary_name);
//     pushEntry("Bank Address 1", vendor.bank_address_1);
//     pushEntry("Bank Address 2", vendor.bank_address_2);
//     pushEntry("Bank PIN", vendor.bank_pin);
//     pushEntry("Account Number", vendor.account_number);
//     pushEntry("IFSC Code", vendor.ifscode);
//     pushEntry("Branch", vendor.branch);
//     pushEntry("Payment Terms", vendor.payment_terms);
//     pushEntry("TDS Details", vendor.tds_details);
//     pushEntry("Vendor Status", vendor.vendor_status);

//     const departmentList =
//       vendor.vendor_belongs_to?.department?.department || [];
//     if (departmentList.length > 0) {
//       pushEntry("Departments", departmentList.map((d) => d.name).join(", "));
//     }

//     pushEntry("Created At", new Date(vendor.createdAt).toLocaleString());
//     pushEntry("Updated At", new Date(vendor.updatedAt).toLocaleString());

//     return (
//       <div
//         style={{
//           display: "grid",
//           gap: "12px",
//           maxHeight: isMobile ? "60vh" : "65vh",
//           overflowY: "auto",
//           padding: "8px",
//         }}
//       >
//         {flatData.map(({ label, value }, index) => (
//           <div
//             key={label}
//             style={{
//               display: "grid",
//               gridTemplateColumns: isMobile ? "1fr" : "180px 1fr",
//               gap: "12px",
//               padding: "14px",
//               background: index % 2 === 0 ? "#faf8fe" : "#fff",
//               borderRadius: "10px",
//               transition: "all 0.2s",
//             }}
//           >
//             <span
//               style={{
//                 color: "#32255e",
//                 fontWeight: 700,
//                 fontSize: "15px",
//               }}
//             >
//               {label}
//             </span>
//             <span
//               style={{
//                 wordBreak: "break-word",
//                 color: "#5b5270",
//                 fontSize: "15px",
//               }}
//             >
//               {value}
//             </span>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   const totalVendors = vendors.length;

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "linear-gradient(135deg, #f8f7ff 0%, #f0edff 100%)",
//         padding: isMobile ? "16px" : "32px",
//       }}
//     >
//       <style>{customStyles}</style>

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
//         <motion.div
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           style={{ marginBottom: "24px" }}
//         >
//           <h1
//             style={{
//               fontSize: isMobile ? "32px" : "42px",
//               fontWeight: "bold",
//               color: "#32255e",
//               margin: 0,
//               letterSpacing: "-1px",
//             }}
//           >
//             Vendors by Department
//           </h1>
//           <p style={{ color: "#9079a5", fontSize: "16px", marginTop: "4px" }}>
//             View all vendors organized by departments
//           </p>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, scale: 0.95 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 0.5, delay: 0.1 }}
//         >
//           <Card className="vendors-stats-card" style={{ marginBottom: "24px" }}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 flexWrap: "wrap",
//                 gap: "20px",
//               }}
//             >
//               <div
//                 style={{ display: "flex", alignItems: "center", gap: "20px" }}
//               >
//                 <div
//                   style={{
//                     width: "64px",
//                     height: "64px",
//                     borderRadius: "16px",
//                     background: "rgba(255,255,255,0.25)",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     backdropFilter: "blur(10px)",
//                   }}
//                 >
//                   <TeamOutlined style={{ fontSize: "32px", color: "white" }} />
//                 </div>
//                 <div>
//                   <div
//                     style={{
//                       fontSize: "15px",
//                       color: "rgba(255,255,255,0.85)",
//                       marginBottom: "4px",
//                       fontWeight: 500,
//                     }}
//                   >
//                     Total Vendors
//                   </div>
//                   <div
//                     style={{
//                       fontSize: "36px",
//                       fontWeight: 700,
//                       color: "#fff",
//                       lineHeight: 1,
//                     }}
//                   >
//                     {totalVendors}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </Card>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.2 }}
//         >
//           <Card
//             className="vendors-glass-card"
//             bodyStyle={{ padding: isMobile ? "16px" : "28px" }}
//           >
//             <div style={{ marginBottom: "24px" }}>
//               <Input
//                 prefix={<SearchOutlined style={{ color: "#9079a5" }} />}
//                 allowClear
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Search vendors by name, company, type, or contact person..."
//                 className="vendors-search-input"
//                 style={{
//                   width: "100%",
//                   height: "48px",
//                   fontSize: "15px",
//                 }}
//               />
//               {loading && (
//                 <div style={{
//                   marginTop: "8px",
//                   color: "#667eea",
//                   fontSize: "13px",
//                   fontWeight: 500
//                 }}>
//                   Searching...
//                 </div>
//               )}
//             </div>

//             {loading && !vendors.length ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "80px 20px",
//                   color: "#9079a5",
//                 }}
//               >
//                 <div style={{ fontSize: "18px", fontWeight: 500 }}>
//                   Loading vendors...
//                 </div>
//               </div>
//             ) : Object.keys(groupedVendors).length === 0 ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "80px 20px",
//                   color: "#9079a5",
//                 }}
//               >
//                 <TeamOutlined
//                   style={{
//                     fontSize: "48px",
//                     marginBottom: "16px",
//                     opacity: 0.3,
//                   }}
//                 />
//                 <div style={{ fontSize: "18px", fontWeight: 500 }}>
//                   No vendors found
//                 </div>
//                 <div style={{ fontSize: "14px", marginTop: "8px" }}>
//                   {search
//                     ? "Try adjusting your search"
//                     : "No vendors available"}
//                 </div>
//               </div>
//             ) : (
//               <Collapse
//                 accordion
//                 bordered={false}
//                 expandIconPosition="end"
//                 className="vendors-collapse"
//               >
//                 {Object.entries(groupedVendors).map(
//                   ([departmentName, vendorsList]) => (
//                     <Panel
//                       header={
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                             width: "100%",
//                           }}
//                         >
//                           <span style={{ fontSize: "16px" }}>
//                             {departmentName}
//                           </span>
//                           <div
//                             style={{
//                               display: "flex",
//                               alignItems: "center",
//                               gap: "16px",
//                             }}
//                           >
//                             <span
//                               style={{
//                                 background: "rgba(255,255,255,0.25)",
//                                 padding: "4px 12px",
//                                 borderRadius: "6px",
//                                 fontSize: "14px",
//                                 fontWeight: 600,
//                               }}
//                             >
//                               {vendorsList.length} Vendors
//                             </span>
//                           </div>
//                         </div>
//                       }
//                       key={departmentName}
//                     >
//                       <Table
//                         dataSource={vendorsList}
//                         columns={columns}
//                         rowKey="id"
//                         pagination={false}
//                         size="small"
//                         className="vendors-table"
//                         style={{ backgroundColor: "#ffffff", marginTop: "4px" }}
//                       />
//                     </Panel>
//                   )
//                 )}
//               </Collapse>
//             )}
//           </Card>
//         </motion.div>

//         <Modal
//           className="vendors-modal"
//           title={
//             selectedVendor
//               ? `Vendor Details - ${selectedVendor.name}`
//               : "Vendor Details"
//           }
//           open={modalVisible}
//           onCancel={() => setModalVisible(false)}
//           footer={[
//             <Button
//               key="close"
//               type="primary"
//               onClick={() => setModalVisible(false)}
//             >
//               Close
//             </Button>,
//             selectedVendor && (
//               <Button
//                 key="pdf"
//                 icon={<FilePdfOutlined />}
//                 onClick={() => exportSingleVendorToPDF(selectedVendor)}
//                 style={{
//                   background: "#667eea",
//                   color: "#fff",
//                   borderRadius: "8px",
//                   fontWeight: 600,
//                 }}
//               >
//                 Export as PDF
//               </Button>
//             ),
//           ]}
//           width={isMobile ? "98vw" : 700}
//           bodyStyle={{
//             maxHeight: isMobile ? "75vh" : "70vh",
//             overflowY: "auto",
//           }}
//         >
//           {renderVendorDetails(selectedVendor)}
//         </Modal>
//       </div>
//     </div>
//   );
// };

// export default ViewVendors;

/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../config";
import { message, Collapse, Table, Modal, Button, Card, Input } from "antd";
import {
  EyeOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  SearchOutlined,
  TeamOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";
import {
  Document,
  Packer,
  Paragraph,
  Table as DocxTable,
  TableCell,
  TableRow,
  WidthType,
  BorderStyle,
  AlignmentType,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";

const { Panel } = Collapse;

const customStyles = `
  *{
 font-family: cormoreg !important;
}
  .vendors-glass-card {
    background: rgba(255,255,255,0.85);
    border-radius: 1.25rem;
    box-shadow: 0 8px 32px 0 rgba(102,126,234,0.12);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.4);
    transition: all 0.3s ease;
  }
  
  .vendors-glass-card:hover {
    box-shadow: 0 12px 40px 0 rgba(102,126,234,0.18);
    transform: translateY(-2px);
  }
  
  .vendors-collapse {
    background: transparent !important;
    border: none !important;
  }
  
  .vendors-collapse .ant-collapse-item {
    background: rgba(255,255,255,0.9);
    border-radius: 1rem !important;
    border: 1px solid rgba(102,126,234,0.15);
    margin-bottom: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(102,126,234,0.08);
    transition: all 0.3s ease;
  }
  
  .vendors-collapse .ant-collapse-item:hover {
    box-shadow: 0 8px 24px rgba(102,126,234,0.15);
    transform: translateY(-2px);
  }
  
  .vendors-collapse .ant-collapse-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    color: white !important;
    font-weight: 700;
    font-size: 16px;
    padding: 16px 24px !important;
    border-radius: 1rem 1rem 0 0 !important;
  }
  
  .vendors-collapse .ant-collapse-header:hover {
    background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%) !important;
  }
  
  .vendors-collapse .ant-collapse-content {
    background: white;
    border-top: none;
  }
  
  .vendors-collapse .ant-collapse-content-box {
    padding: 20px;
  }
  
  .vendors-table .ant-table {
    border-radius: 0.75rem;
    overflow: hidden;
  }
  
  .vendors-table .ant-table-thead > tr > th {
    background: linear-gradient(135deg, #f8f7ff 0%, #f3f1ff 100%);
    color: #32255e;
    font-weight: 700;
    border: none;
    font-size: 14px;
  }
  
  .vendors-table .ant-table-tbody > tr:hover > td {
    background: #faf8fe !important;
  }
  
  .vendors-btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 0.65rem;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(102,126,234,0.25);
    transition: all 0.3s ease;
    color: white;
  }
  
  .vendors-btn-primary:hover {
    background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102,126,234,0.35) !important;
    color: white !important;
  }
  
  .vendors-search-input {
    border-radius: 0.65rem;
    border: 1.5px solid rgba(102,126,234,0.2);
    transition: all 0.3s ease;
  }
  
  .vendors-search-input:hover,
  .vendors-search-input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102,126,234,0.1);
  }
  
  .vendors-modal .ant-modal-header {
    background: linear-gradient(135deg, #f8f7ff 0%, #f3f1ff 100%);
    border-radius: 1rem 1rem 0 0;
    border: none;
  }
  
  .vendors-modal .ant-modal-content {
    border-radius: 1rem;
    overflow: hidden;
  }
  
  .vendors-stats-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 1.25rem;
    border: none;
    box-shadow: 0 8px 32px rgba(102,126,234,0.25);
  }
`;

const ViewVendors = () => {
  const user = useSelector((state) => state.user.value);
  const config = {
    headers: {
      Authorization: user?.access_token,
    },
  };

  const [vendors, setVendors] = useState([]);
  const [groupedVendors, setGroupedVendors] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Debounced fetch function
  const fetchVendors = async (searchQuery = "") => {
    setLoading(true);
    try {
      // Build URL with search query parameter
      const url = searchQuery
        ? `${API_BASE_URL}vendor/all?search=${encodeURIComponent(searchQuery)}`
        : `${API_BASE_URL}vendor/all`;

      const res = await axios.get(url, config);
      if (res.data.success && res.data.vendors) {
        setVendors(res.data.vendors);
      } else {
        message.error("Failed to fetch vendors");
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
      message.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  // Group vendors by department name
  useEffect(() => {
    const groups = {};
    vendors.forEach((vendor) => {
      const departments =
        vendor.vendor_belongs_to?.department?.department || [];
      const deptName =
        departments.length > 0 ? departments[0].name : "No Department";
      if (!groups[deptName]) {
        groups[deptName] = [];
      }
      groups[deptName].push(vendor);
    });
    setGroupedVendors(groups);
  }, [vendors]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVendors(search);
    }, 500); // 500ms delay for debouncing

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const exportSingleVendorToPDF = (vendor) => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Request Form For Opening New Vendor Code", 105, 22, {
      align: "center",
    });

    const tableData = [];

    // Helper function to add row only if value exists
    const addRow = (label, value) => {
      if (value && value.toString().trim() !== "") {
        tableData.push([label, value.toString()]);
      }
    };

    // Basic Information
    addRow("Name of The Vendor", vendor.name);
    addRow("Category of Person", vendor.person_category);
    addRow("Company Name", vendor.company_name);
    addRow("Referred By", vendor.refered_by);

    // Permanent Address Section
    const hasPermanentAddress =
      vendor.perm_address_1 ||
      vendor.perm_address_2 ||
      vendor.perm_city ||
      vendor.perm_pin ||
      vendor.perm_state ||
      vendor.perm_country;

    if (hasPermanentAddress) {
      tableData.push(["", ""]);
      tableData.push(["PERMANENT ADDRESS", ""]);
      addRow("Address ", vendor.perm_address_1);
      addRow("Address ", vendor.perm_address_2);
      addRow("City", vendor.perm_city);
      addRow("PIN Code", vendor.perm_pin);
      addRow("State", vendor.perm_state);
      addRow("Country", vendor.perm_country);
    }

    // Temporary Address Section
    const hasTemporaryAddress =
      vendor.temp_address_1 ||
      vendor.temp_city ||
      vendor.temp_pin ||
      vendor.temp_state ||
      vendor.temp_country;

    if (hasTemporaryAddress) {
      tableData.push(["", ""]);
      tableData.push(["TEMPORARY ADDRESS", ""]);
      addRow("Address ", vendor.temp_address_1);
      addRow("City", vendor.temp_city);
      addRow("PIN Code", vendor.temp_pin);
      addRow("State", vendor.temp_state);
      addRow("Country", vendor.temp_country);
    }

    // Contact Information
    tableData.push(["", ""]);
    tableData.push(["CONTACT INFORMATION", ""]);
    addRow("Contact Person", vendor.cont_person);
    addRow("Designation", vendor.designation);
    addRow("Mobile Number", vendor.mobile_no);
    addRow("Alternate Mobile Number", vendor.alt_mobile_no);
    addRow("Email", vendor.email);

    // Vendor Details
    tableData.push(["", ""]);
    tableData.push(["VENDOR DETAILS", ""]);
    addRow("Type Of Vendor", vendor.vendor_type);
    addRow("GST NO", vendor.gst_no);
    addRow("MSMED NO", vendor.msmed_no);
    addRow("PAN NO", vendor.pan_no);

    // Bank Details Section
    const hasBankDetails =
      vendor.bank_name ||
      vendor.beneficiary_name ||
      vendor.bank_address_1 ||
      vendor.bank_address_2 ||
      vendor.bank_pin ||
      vendor.account_number ||
      vendor.ifscode ||
      vendor.branch;

    if (hasBankDetails) {
      tableData.push(["", ""]);
      tableData.push(["BANK DETAILS", ""]);
      addRow("Bank Name", vendor.bank_name);
      addRow("Beneficiary Name", vendor.beneficiary_name);
      addRow("Bank Address ", vendor.bank_address_1);
      addRow("Bank Address ", vendor.bank_address_2);
      addRow("Bank PIN Code", vendor.bank_pin);
      addRow("Account Number", vendor.account_number);
      addRow("IFSC Code", vendor.ifscode);
      addRow("Branch", vendor.branch);
    }

    // Payment Information
    tableData.push(["", ""]);
    addRow("Payment Terms", vendor.payment_terms);
    addRow("TDS Rate & Section", vendor.tds_details);

    autoTable(doc, {
      startY: 35,
      head: [],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 70 },
        1: { cellWidth: 120 },
      },
      didParseCell: function (data) {
        const cellText = data.cell.text[0];
        // Section headers
        if (
          cellText === "PERMANENT ADDRESS" ||
          cellText === "TEMPORARY ADDRESS" ||
          cellText === "CONTACT INFORMATION" ||
          cellText === "VENDOR DETAILS" ||
          cellText === "BANK DETAILS"
        ) {
          data.cell.styles.fillColor = [230, 230, 230];
          data.cell.styles.fontStyle = "bold";
        }
        // Empty separator rows
        if (cellText === "" && data.column.index === 0) {
          data.cell.styles.fillColor = [245, 245, 245];
        }
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      "*All the columns should be properly filled up. No column should be kept Blank.",
      14,
      finalY,
    );
    doc.text(
      "*All registered certificates should be scanned and attached in system.",
      14,
      finalY + 5,
    );

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
      "5) MSMED form",
    ];

    let yPos = finalY + 20;
    docs.forEach((docItem) => {
      doc.text(docItem, 14, yPos);
      yPos += 5;
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SIGNATURE", 14, yPos + 10);
    doc.line(14, yPos + 15, 80, yPos + 15);

    doc.save(
      `Vendor_${vendor.name.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`,
    );
    message.success("PDF exported successfully!");
  };

  const exportSingleVendorToDOCX = async (vendor) => {
    const rows = [];

    // Helper function to create a row
    const createRow = (label, value, isHeader = false) => {
      if (!isHeader && (!value || value.toString().trim() === "")) {
        return null;
      }

      return new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: label,
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
            ],
            shading: isHeader ? { fill: "E6E6E6" } : undefined,
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: value ? value.toString() : "",
                    size: 20,
                  }),
                ],
              }),
            ],
            shading: isHeader ? { fill: "E6E6E6" } : undefined,
          }),
        ],
      });
    };

    // Title rows
    const addRow = (label, value, isHeader = false) => {
      const row = createRow(label, value, isHeader);
      if (row) rows.push(row);
    };

    // Basic Information
    addRow("Name of The Vendor", vendor.name);
    addRow("Category of Person", vendor.person_category);
    addRow("Company Name", vendor.company_name);
    addRow("Referred By", vendor.refered_by);

    // Permanent Address Section
    const hasPermanentAddress =
      vendor.perm_address_1 ||
      vendor.perm_address_2 ||
      vendor.perm_city ||
      vendor.perm_pin ||
      vendor.perm_state ||
      vendor.perm_country;

    if (hasPermanentAddress) {
      rows.push(createRow("", "", false));
      rows.push(createRow("PERMANENT ADDRESS", "", true));
      addRow("Address ", vendor.perm_address_1);
      addRow("Address ", vendor.perm_address_2);
      addRow("City", vendor.perm_city);
      addRow("PIN Code", vendor.perm_pin);
      addRow("State", vendor.perm_state);
      addRow("Country", vendor.perm_country);
    }

    // Temporary Address Section
    const hasTemporaryAddress =
      vendor.temp_address_1 ||
      vendor.temp_city ||
      vendor.temp_pin ||
      vendor.temp_state ||
      vendor.temp_country;

    if (hasTemporaryAddress) {
      rows.push(createRow("", "", false));
      rows.push(createRow("TEMPORARY ADDRESS", "", true));
      addRow("Address ", vendor.temp_address_1);
      addRow("City", vendor.temp_city);
      addRow("PIN Code", vendor.temp_pin);
      addRow("State", vendor.temp_state);
      addRow("Country", vendor.temp_country);
    }

    // Contact Information
    rows.push(createRow("", "", false));
    rows.push(createRow("CONTACT INFORMATION", "", true));
    addRow("Contact Person", vendor.cont_person);
    addRow("Designation", vendor.designation);
    addRow("Mobile Number", vendor.mobile_no);
    addRow("Alternate Mobile Number", vendor.alt_mobile_no);
    addRow("Email", vendor.email);

    // Vendor Details
    rows.push(createRow("", "", false));
    rows.push(createRow("VENDOR DETAILS", "", true));
    addRow("Type Of Vendor", vendor.vendor_type);
    addRow("GST NO", vendor.gst_no);
    addRow("MSMED NO", vendor.msmed_no);
    addRow("PAN NO", vendor.pan_no);

    // Bank Details Section
    const hasBankDetails =
      vendor.bank_name ||
      vendor.beneficiary_name ||
      vendor.bank_address_1 ||
      vendor.bank_address_2 ||
      vendor.bank_pin ||
      vendor.account_number ||
      vendor.ifscode ||
      vendor.branch;

    if (hasBankDetails) {
      rows.push(createRow("", "", false));
      rows.push(createRow("BANK DETAILS", "", true));
      addRow("Bank Name", vendor.bank_name);
      addRow("Beneficiary Name", vendor.beneficiary_name);
      addRow("Bank Address ", vendor.bank_address_1);
      addRow("Bank Address ", vendor.bank_address_2);
      addRow("Bank PIN Code", vendor.bank_pin);
      addRow("Account Number", vendor.account_number);
      addRow("IFSC Code", vendor.ifscode);
      addRow("Branch", vendor.branch);
    }

    // Payment Information
    rows.push(createRow("", "", false));
    addRow("Payment Terms", vendor.payment_terms);
    addRow("TDS Rate & Section", vendor.tds_details);

    const table = new DocxTable({
      rows: rows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      },
    });

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: "Request Form For Opening New Vendor Code",
              heading: "Heading1",
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            table,
            new Paragraph({
              text: "",
              spacing: { before: 400 },
            }),
            new Paragraph({
              text: "*All the columns should be properly filled up. No column should be kept Blank.",
              italics: true,
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: "*All registered certificates should be scanned and attached in system.",
              italics: true,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: "Compulsory Documents to be Attached:",
              bold: true,
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: "1) Copy of PAN Card",
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: "2) Address proof- copy of voter card, Aadhar card, license, passport",
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: "3) Copy of GST certificate as applicable",
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: "4) Copy of cancelled cheque",
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: "5) MSMED form",
              spacing: { after: 300 },
            }),
            new Paragraph({
              text: "SIGNATURE",
              bold: true,
              spacing: { before: 200 },
            }),
            new Paragraph({
              text: "_______________________",
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(
      blob,
      `Vendor_${vendor.name.replace(/\s+/g, "_")}_${new Date().getTime()}.docx`,
    );
    message.success("DOCX exported successfully!");
  };

  const exportDepartmentToPDF = (departmentName, vendorsList) => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("COMB INDUSTRIES INC", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Department Vendors Report", 105, 22, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Department: ${departmentName}`, 105, 29, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Vendors: ${vendorsList.length}`, 105, 36, {
      align: "center",
    });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 42, {
      align: "center",
    });

    const tableData = vendorsList.map((vendor) => [
      vendor.name || "",
      vendor.company_name || "",
      vendor.gst_no || "",
      vendor.vendor_type || "",
      vendor.refered_by || "",
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["Vendor Name", "Company", "GST No", "Type", "Referred By"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { cellWidth: 30 },
        4: { cellWidth: 35 },
      },
    });

    doc.save(
      `Department_${departmentName.replace(
        /\s+/g,
        "_",
      )}_Vendors_${new Date().getTime()}.pdf`,
    );
    message.success(`${departmentName} vendors exported successfully!`);
  };

  const exportAllVendorsToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("COMB INDUSTRIES INC", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("All Vendors Report", 105, 22, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Total Vendors: ${vendors.length}`, 105, 29, { align: "center" });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 35, {
      align: "center",
    });

    let startY = 45;

    Object.entries(groupedVendors).forEach(([deptName, vendorsList], index) => {
      if (index > 0) {
        doc.addPage();
        startY = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${deptName} (${vendorsList.length} vendors)`, 14, startY);

      const tableData = vendorsList.map((vendor) => [
        vendor.name || "",
        vendor.company_name || "",
        vendor.gst_no || "",
        vendor.vendor_type || "",
        vendor.refered_by || "",
      ]);

      autoTable(doc, {
        startY: startY + 5,
        head: [["Vendor Name", "Company", "GST No", "Type", "Referred By"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9,
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 40 },
          2: { cellWidth: 35 },
          3: { cellWidth: 30 },
          4: { cellWidth: 35 },
        },
      });

      startY = doc.lastAutoTable.finalY + 15;
    });

    doc.save(`All_Vendors_Report_${new Date().getTime()}.pdf`);
    message.success("All vendors exported successfully!");
  };

  const columns = [
    {
      title: "Vendor Name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span style={{ fontWeight: 600, color: "#32255e" }}>{text}</span>
      ),
    },
    {
      title: "Company Name",
      dataIndex: "company_name",
      key: "company_name",
      responsive: ["md"],
    },
    {
      title: "GST No",
      dataIndex: "gst_no",
      key: "gst_no",
      responsive: ["lg"],
    },
    {
      title: "Vendor Type",
      dataIndex: "vendor_type",
      key: "vendor_type",
      responsive: ["lg"],
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
      title: "Referred By",
      dataIndex: "refered_by",
      key: "refered_by",
      responsive: ["lg"],
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 180,
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedVendor(record);
              setModalVisible(true);
            }}
            style={{
              color: "#667eea",
              borderRadius: "6px",
            }}
            aria-label={`View details of ${record.name}`}
          />
          <Button
            type="text"
            icon={<FilePdfOutlined />}
            onClick={() => exportSingleVendorToPDF(record)}
            style={{
              color: "#e74c3c",
              borderRadius: "6px",
            }}
            title="Export to PDF"
          />
          <Button
            type="text"
            icon={<FileWordOutlined />}
            onClick={() => exportSingleVendorToDOCX(record)}
            style={{
              color: "#2980b9",
              borderRadius: "6px",
            }}
            title="Export to DOCX"
          />
        </div>
      ),
    },
  ];

  const renderVendorDetails = (vendor) => {
    if (!vendor) return null;
    const flatData = [];

    const pushEntry = (label, value) => {
      if (value !== undefined && value !== null && value !== "") {
        flatData.push({ label, value: value.toString() });
      }
    };

    pushEntry("Vendor Name", vendor.name);
    pushEntry("Person Category", vendor.person_category);
    pushEntry("Company Name", vendor.company_name);
    pushEntry("Referred By", vendor.refered_by);

    // Permanent Address
    pushEntry("Permanent Address 1", vendor.perm_address_1);
    pushEntry("Permanent Address 2", vendor.perm_address_2);
    pushEntry("Permanent City", vendor.perm_city);
    pushEntry("Permanent PIN", vendor.perm_pin);
    pushEntry("Permanent State", vendor.perm_state);
    pushEntry("Permanent Country", vendor.perm_country);

    // Temporary Address
    pushEntry("Temporary Address 1", vendor.temp_address_1);
    pushEntry("Temporary City", vendor.temp_city);
    pushEntry("Temporary PIN", vendor.temp_pin);
    pushEntry("Temporary State", vendor.temp_state);
    pushEntry("Temporary Country", vendor.temp_country);

    pushEntry("Contact Person", vendor.cont_person);
    pushEntry("Designation", vendor.designation);
    pushEntry("Mobile Number", vendor.mobile_no);
    pushEntry("Alternate Mobile Number", vendor.alt_mobile_no);
    pushEntry("Email", vendor.email);
    pushEntry("Vendor Type", vendor.vendor_type);
    pushEntry("GST Number", vendor.gst_no);
    pushEntry("MSMED Number", vendor.msmed_no);
    pushEntry("PAN Number", vendor.pan_no);

    // Bank Details
    pushEntry("Bank Name", vendor.bank_name);
    pushEntry("Beneficiary Name", vendor.beneficiary_name);
    pushEntry("Bank Address 1", vendor.bank_address_1);
    pushEntry("Bank Address 2", vendor.bank_address_2);
    pushEntry("Bank PIN", vendor.bank_pin);
    pushEntry("Account Number", vendor.account_number);
    pushEntry("IFSC Code", vendor.ifscode);
    pushEntry("Branch", vendor.branch);

    pushEntry("Payment Terms", vendor.payment_terms);
    pushEntry("TDS Details", vendor.tds_details);
    pushEntry("Vendor Status", vendor.vendor_status);

    const departmentList =
      vendor.vendor_belongs_to?.department?.department || [];
    if (departmentList.length > 0) {
      pushEntry("Departments", departmentList.map((d) => d.name).join(", "));
    }

    pushEntry("Created At", new Date(vendor.createdAt).toLocaleString());
    pushEntry("Updated At", new Date(vendor.updatedAt).toLocaleString());

    return (
      <div
        style={{
          display: "grid",
          gap: "12px",
          maxHeight: isMobile ? "60vh" : "65vh",
          overflowY: "auto",
          padding: "8px",
        }}
      >
        {flatData.map(({ label, value }, index) => (
          <div
            key={label}
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
              {label}
            </span>
            <span
              style={{
                wordBreak: "break-word",
                color: "#5b5270",
                fontSize: "15px",
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const totalVendors = vendors.length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8f7ff 0%, #f0edff 100%)",
        padding: isMobile ? "16px" : "32px",
      }}
    >
      <style>{customStyles}</style>

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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: "24px" }}
        >
          <h1
            style={{
              fontSize: isMobile ? "32px" : "42px",
              fontWeight: "bold",
              color: "#32255e",
              margin: 0,
              letterSpacing: "-1px",
            }}
          >
            Vendors by Department
          </h1>
          <p style={{ color: "#9079a5", fontSize: "16px", marginTop: "4px" }}>
            View all vendors organized by departments
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="vendors-stats-card" style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "20px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "20px" }}
              >
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
                  <TeamOutlined style={{ fontSize: "32px", color: "white" }} />
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
                    {totalVendors}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card
            className="vendors-glass-card"
            bodyStyle={{ padding: isMobile ? "16px" : "28px" }}
          >
            <div style={{ marginBottom: "24px" }}>
              <Input
                prefix={<SearchOutlined style={{ color: "#9079a5" }} />}
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendors by name, company, GST, type, or referred by..."
                className="vendors-search-input"
                style={{
                  width: "100%",
                  height: "48px",
                  fontSize: "15px",
                }}
              />
              {loading && (
                <div
                  style={{
                    marginTop: "8px",
                    color: "#667eea",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  Searching...
                </div>
              )}
            </div>

            {loading && !vendors.length ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 20px",
                  color: "#9079a5",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: 500 }}>
                  Loading vendors...
                </div>
              </div>
            ) : Object.keys(groupedVendors).length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 20px",
                  color: "#9079a5",
                }}
              >
                <TeamOutlined
                  style={{
                    fontSize: "48px",
                    marginBottom: "16px",
                    opacity: 0.3,
                  }}
                />
                <div style={{ fontSize: "18px", fontWeight: 500 }}>
                  No vendors found
                </div>
                <div style={{ fontSize: "14px", marginTop: "8px" }}>
                  {search
                    ? "Try adjusting your search"
                    : "No vendors available"}
                </div>
              </div>
            ) : (
              <Collapse
                accordion
                bordered={false}
                expandIconPosition="end"
                className="vendors-collapse"
              >
                {Object.entries(groupedVendors).map(
                  ([departmentName, vendorsList]) => (
                    <Panel
                      header={
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          <span style={{ fontSize: "16px" }}>
                            {departmentName}
                          </span>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "16px",
                            }}
                          >
                            <span
                              style={{
                                background: "rgba(255,255,255,0.25)",
                                padding: "4px 12px",
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: 600,
                              }}
                            >
                              {vendorsList.length} Vendors
                            </span>
                          </div>
                        </div>
                      }
                      key={departmentName}
                    >
                      <Table
                        dataSource={vendorsList}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        className="vendors-table"
                        style={{ backgroundColor: "#ffffff", marginTop: "4px" }}
                      />
                    </Panel>
                  ),
                )}
              </Collapse>
            )}
          </Card>
        </motion.div>

        <Modal
          className="vendors-modal"
          title={
            selectedVendor
              ? `Vendor Details - ${selectedVendor.name}`
              : "Vendor Details"
          }
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setModalVisible(false)}>
              Close
            </Button>,
            selectedVendor && (
              <Button
                key="pdf"
                icon={<FilePdfOutlined />}
                onClick={() => exportSingleVendorToPDF(selectedVendor)}
                style={{
                  background: "#e74c3c",
                  color: "#fff",
                  borderRadius: "8px",
                  fontWeight: 600,
                  border: "none",
                }}
              >
                Export PDF
              </Button>
            ),
            selectedVendor && (
              <Button
                key="docx"
                icon={<FileWordOutlined />}
                onClick={() => exportSingleVendorToDOCX(selectedVendor)}
                style={{
                  background: "#2980b9",
                  color: "#fff",
                  borderRadius: "8px",
                  fontWeight: 600,
                  border: "none",
                }}
              >
                Export DOCX
              </Button>
            ),
          ]}
          width={isMobile ? "98vw" : 700}
          bodyStyle={{
            maxHeight: isMobile ? "75vh" : "70vh",
            overflowY: "auto",
          }}
        >
          {renderVendorDetails(selectedVendor)}
        </Modal>
      </div>
    </div>
  );
};

export default ViewVendors;
