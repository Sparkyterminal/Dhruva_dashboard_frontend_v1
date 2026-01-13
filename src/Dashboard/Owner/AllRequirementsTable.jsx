// /* eslint-disable no-unused-vars */
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useSelector } from "react-redux";
// import {
//   Table,
//   Input,
//   Button,
//   DatePicker,
//   Select,
//   Space,
//   message,
//   Card,
//   Row,
//   Col,
//   Statistic,
//   Tag,
// } from "antd";
// import {
//   EditOutlined,
//   CheckOutlined,
//   SearchOutlined,
//   ReloadOutlined,
//   FileTextOutlined,
//   ClockCircleOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";
// import Lottie from "lottie-react";
// import homeIcon from "../../assets/home.json";
// import completed from "../../assets/completed.json";
// import total from "../../assets/total.json";
// import pending from "../../assets/pending.json";

// import { API_BASE_URL } from "../../../config";

// const { Option } = Select;

// const departmentsList = [
//   { name: "Hennur Godown", id: "68fdf1cfe66ed5069ddb9f25" },
// ];

// const AllRequirementsTable = () => {
//   const user = useSelector((state) => state.user.value);
//   const [requirements, setRequirements] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [search, setSearch] = useState("");
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [selectedDept, setSelectedDept] = useState(null);
//   const [editRowId, setEditRowId] = useState(null);
//   const [editPlannedAmount, setEditPlannedAmount] = useState(null);
//   const [editAmountPaid, setEditAmountPaid] = useState(null);

//   const config = {
//     headers: { Authorization: user?.access_token },
//   };

//   // Calculate statistics
//   const stats = {
//     total: requirements.length,
//     pending: requirements.filter((r) => r.owner_check === "PENDING").length,
//     completed: requirements.filter((r) => r.owner_check === "APPROVED").length,
//   };

//   const fetchRequirementsData = async (params = {}) => {
//     setLoading(true);
//     try {
//       let query = [];
//       if (params.search) query.push(`search=${params.search}`);
//       if (params.department) query.push(`department=${params.department}`);
//       const queryString = query.length ? `?${query.join("&")}` : "";
//       const res = await axios.get(
//         `${API_BASE_URL}request${queryString}`,
//         config
//       );
//       setRequirements(res.data.items || []);
//     } catch (err) {
//       message.error("Failed to fetch requirements");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchRequirementsData();
//   }, []);

//   const sortedRequirements = [...requirements].sort((a, b) => {
//     const statusOrder = {
//       PENDING: 0,
//       APPROVED: 1,
//       REJECTED: 1,
//     };

//     const statusA = statusOrder[a.owner_check] !== undefined ? statusOrder[a.owner_check] : 0;
//     const statusB = statusOrder[b.owner_check] !== undefined ? statusOrder[b.owner_check] : 0;

//     return statusA - statusB;
//   });

//   const handleSearch = (e) => setSearch(e.target.value);
//   const handleSearchSubmit = () =>
//     fetchRequirementsData({
//       search,
//       department: selectedDept,
//     });

//   const handleDeptChange = (value) => setSelectedDept(value);

//   const handlePlannedAmountSave = async (row) => {
//     if (editPlannedAmount == null || isNaN(editPlannedAmount)) {
//       message.error("Please enter a valid number for planned amount");
//       return;
//     }
//     try {
//       await axios.patch(
//         `${API_BASE_URL}request/${row.id}`,
//         { planned_amount: Number(editPlannedAmount) },
//         config
//       );
//       message.success("Planned amount updated");
//       setEditRowId(null);
//       fetchRequirementsData({
//         search,
//         department: selectedDept,
//       });
//     } catch (err) {
//       message.error("Failed to update planned amount");
//     }
//   };

//   const handleAmountPaidSave = async (row) => {
//     if (editAmountPaid == null || isNaN(editAmountPaid)) {
//       message.error("Please enter a valid number for amount paid");
//       return;
//     }
//     try {
//       await axios.patch(
//         `${API_BASE_URL}request/${row.id}`,
//         { amount_paid: Number(editAmountPaid) },
//         config
//       );
//       message.success("Amount paid updated");
//       setEditRowId(null);
//       fetchRequirementsData({
//         search,
//         department: selectedDept,
//       });
//     } catch (err) {
//       message.error("Failed to update amount paid");
//     }
//   };

//   const handleOwnerApprove = async (row) => {
//     try {
//       await axios.patch(
//         `${API_BASE_URL}request/${row.id}`,
//         { status: "COMPLETED" },
//         config
//       );
//       message.success("Request approved");
//       fetchRequirementsData({
//         search,
//         department: selectedDept,
//       });
//     } catch (err) {
//       message.error("Failed to approve request");
//     }
//   };

//   const handleOwnerReject = async (row) => {
//     try {
//       await axios.patch(
//         `${API_BASE_URL}request/${row.id}`,
//         { status: "REJECTED" },
//         config
//       );
//       message.success("Request rejected");
//       fetchRequirementsData({
//         search,
//         department: selectedDept,
//       });
//     } catch (err) {
//       message.error("Failed to reject request");
//     }
//   };

//   const handlePlannedAmountEdit = (row) => {
//     setEditRowId(row.id);
//     setEditPlannedAmount(row.planned_amount);
//     setEditAmountPaid(row.amount_paid);
//   };

//   const handlePlannedAmountChange = (e) => setEditPlannedAmount(e.target.value);
//   const handleAmountPaidChange = (e) => setEditAmountPaid(e.target.value);

//   const columns = [
//     {
//       title: "Sl. No",
//       key: "slno",
//       width: 70,
//       fixed: "left",
//       render: (_, __, idx) => (
//         <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>
//           {idx + 1}
//         </span>
//       ),
//     },
//     {
//       title: "Requested At",
//       dataIndex: "createdAt",
//       key: "createdAt",
//       width: 150,
//       render: (date) => (
//         <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
//           {date ? dayjs(date).format("DD-MM-YYYY HH:mm") : "-"}
//         </span>
//       ),
//     },
//     {
//       title: "Requester",
//       dataIndex: ["requested_by", "first_name"],
//       key: "first_name",
//       width: 120,
//       render: (_, record) => (
//         <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
//           {record.requested_by?.first_name || "-"}
//         </span>
//       ),
//     },
//     {
//       title: "Department",
//       dataIndex: ["department", "name"],
//       key: "department",
//       width: 150,
//       render: (_, record) => (
//         <Tag
//           color="blue"
//           style={{ borderRadius: 6, fontWeight: 700, fontSize: 14 }}
//         >
//           {record.department?.name || "-"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Purpose",
//       dataIndex: "purpose",
//       key: "purpose",
//       width: 200,
//       render: (text) => (
//         <span
//           style={{
//             fontWeight: 700,
//             fontSize: 18,
//             color: "#000",
//             whiteSpace: "normal",
//             wordBreak: "break-word",
//             display: "inline-block",
//             maxWidth: 200,
//           }}
//         >
//           {text}
//         </span>
//       ),
//     },
//     {
//       title: "Amount",
//       dataIndex: "amount",
//       key: "amount",
//       width: 120,
//       render: (amt) => (
//         <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>
//           {amt?.toLocaleString("en-IN", {
//             style: "currency",
//             currency: "INR",
//           })}
//         </span>
//       ),
//     },
//     {
//       title: "Priority",
//       dataIndex: "priority",
//       key: "priority",
//       width: 100,
//       render: (priority) => (
//         <Tag
//           color={
//             priority === "HIGH"
//               ? "#fee2e2"
//               : priority === "MEDIUM"
//               ? "#fef3c7"
//               : "#d1fae5"
//           }
//           style={{
//             color:
//               priority === "HIGH"
//                 ? "#991b1b"
//                 : priority === "MEDIUM"
//                 ? "#92400e"
//                 : "#065f46",
//             borderRadius: 6,
//             border: "none",
//             fontWeight: 700,
//             fontSize: 16,
//           }}
//         >
//           {priority}
//         </Tag>
//       ),
//     },
//     {
//       title: "Planned Amount",
//       dataIndex: "planned_amount",
//       key: "planned_amount",
//       width: 180,
//       render: (planned_amount, row) =>
//         row.owner_check === "APPROVED" || row.owner_check === "REJECTED" ? (
//           <span style={{ color: "#555", fontWeight: 700, fontSize: 18 }}>
//             {planned_amount?.toLocaleString("en-IN", {
//               style: "currency",
//               currency: "INR",
//             }) || "₹0"}
//           </span>
//         ) : row.id === editRowId ? (
//           <Space>
//             <Input
//               style={{ width: 100, fontWeight: 600, fontSize: 18 }}
//               value={editPlannedAmount}
//               onChange={handlePlannedAmountChange}
//               size="small"
//             />
//             <Button
//               type="primary"
//               icon={<CheckOutlined />}
//               size="small"
//               onClick={() => handlePlannedAmountSave(row)}
//               style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
//             />
//           </Space>
//         ) : (
//           <Space>
//             <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
//               {planned_amount?.toLocaleString("en-IN", {
//                 style: "currency",
//                 currency: "INR",
//               }) || "₹0"}
//             </span>
//             <Button
//               icon={<EditOutlined />}
//               size="small"
//               onClick={() => handlePlannedAmountEdit(row)}
//             />
//           </Space>
//         ),
//     },
//     {
//       title: "Amount Paid",
//       dataIndex: "amount_paid",
//       key: "amount_paid",
//       width: 180,
//       render: (amount_paid, row) =>
//         row.owner_check === "APPROVED" || row.owner_check === "REJECTED" ? (
//           <span style={{ color: "#555", fontWeight: 700, fontSize: 18 }}>
//             {amount_paid?.toLocaleString("en-IN", {
//               style: "currency",
//               currency: "INR",
//             }) || "₹0"}
//           </span>
//         ) : row.id === editRowId ? (
//           <Space>
//             <Input
//               style={{ width: 100, fontWeight: 600, fontSize: 18 }}
//               value={editAmountPaid}
//               onChange={handleAmountPaidChange}
//               size="small"
//             />
//             <Button
//               type="primary"
//               icon={<CheckOutlined />}
//               size="small"
//               onClick={() => handleAmountPaidSave(row)}
//               style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
//             />
//           </Space>
//         ) : (
//           <Space>
//             <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
//               {amount_paid?.toLocaleString("en-IN", {
//                 style: "currency",
//                 currency: "INR",
//               }) || "₹0"}
//             </span>
//             <Button
//               icon={<EditOutlined />}
//               size="small"
//               onClick={() => handlePlannedAmountEdit(row)}
//             />
//           </Space>
//         ),
//     },
//     {
//       title: "Accounts Check",
//       dataIndex: "accounts_check",
//       key: "accounts_check",
//       width: 140,
//       render: (status) => (
//         <Tag
//           color={
//             status === "APPROVED"
//               ? "#d1fae5"
//               : status === "REJECTED"
//               ? "#fee2e2"
//               : "#fef3c7"
//           }
//           style={{
//             color:
//               status === "APPROVED"
//                 ? "#065f46"
//                 : status === "REJECTED"
//                 ? "#991b1b"
//                 : "#92400e",
//             borderRadius: 6,
//             border: "none",
//             fontWeight: 700,
//             fontSize: 14,
//           }}
//         >
//           {status || "PENDING"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Approver Check",
//       dataIndex: "approver_check",
//       key: "approver_check",
//       width: 140,
//       render: (status) => (
//         <Tag
//           color={
//             status === "APPROVED"
//               ? "#d1fae5"
//               : status === "REJECTED"
//               ? "#fee2e2"
//               : "#fef3c7"
//           }
//           style={{
//             color:
//               status === "APPROVED"
//                 ? "#065f46"
//                 : status === "REJECTED"
//                 ? "#991b1b"
//                 : "#92400e",
//             borderRadius: 6,
//             border: "none",
//             fontWeight: 700,
//             fontSize: 14,
//           }}
//         >
//           {status || "PENDING"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Updated At",
//       dataIndex: "updatedAt",
//       key: "updatedAt",
//       width: 150,
//       render: (date) => (
//         <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
//           {date ? dayjs(date).format("DD-MM-YYYY HH:mm") : "-"}
//         </span>
//       ),
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 250,
//       fixed: "right",
//       render: (_, row) => {
//         if (row.owner_check === "APPROVED") {
//           return (
//             <Tag
//               color="#d1fae5"
//               style={{
//                 color: "#065f46",
//                 borderRadius: 6,
//                 border: "none",
//                 fontWeight: 700,
//                 fontSize: 16,
//                 padding: "4px 12px",
//               }}
//             >
//               Completed
//             </Tag>
//           );
//         }
//         if (row.owner_check === "REJECTED") {
//           return (
//             <Tag
//               color="#fee2e2"
//               style={{
//                 color: "#991b1b",
//                 borderRadius: 6,
//                 border: "none",
//                 fontWeight: 700,
//                 fontSize: 16,
//                 padding: "4px 12px",
//               }}
//             >
//               Rejected
//             </Tag>
//           );
//         }
//         return (
//           <Space>
//             <Button
//               type="primary"
//               size="small"
//               onClick={() => handleOwnerApprove(row)}
//               icon={<CheckCircleOutlined />}
//               style={{
//                 background: "#10b981",
//                 borderColor: "#10b981",
//                 fontWeight: 600,
//                 fontSize: 16,
//               }}
//             >
//               Complete
//             </Button>
//             <Button
//               danger
//               size="small"
//               onClick={() => handleOwnerReject(row)}
//               icon={<CloseCircleOutlined />}
//               style={{ fontWeight: 700, fontSize: 18 }}
//             >
//               Reject
//             </Button>
//           </Space>
//         );
//       },
//     },
//   ];

//   const rowClassName = (record) => {
//     if (record.owner_check === "APPROVED") return "completed-row";
//     if (record.owner_check === "REJECTED") return "rejected-row";
//     return "";
//   };

//   return (
//     <div className="min-h-screen w-full bg-[#fefcff] relative">
//       {/* Dreamy Sky Pink Glow */}
//       <div
//         className="absolute inset-0 z-0"
//         style={{
//           backgroundImage: `
//             radial-gradient(circle at 30% 70%, rgba(173, 216, 230, 0.35), transparent 60%),
//             radial-gradient(circle at 70% 30%, rgba(255, 182, 193, 0.4), transparent 60%)`,
//         }}
//       />

//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');

//         * {
//           font-family: 'Cormorant Garamond', serif;
//         }

//         .completed-row {
//           background: #f0fdf4 !important;
//           opacity: 0.85;
//         }
//         .rejected-row {
//           background: #fef2f2 !important;
//           opacity: 0.75;
//         }
//         .stat-card {
//           transition: all 0.3s ease;
//           border-radius: 16px;
//           border: 1px solid transparent;
//           background: linear-gradient(135deg, #ffafbd 0%, #ffc3a0 100%);
//           color: #1f2937;
//           font-weight: 700;
//           font-size: 20px;
//         }
//         .stat-card:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 4px 12px rgba(255, 175, 189, 0.5);
//         }
//         .back-button {
//           transition: all 0.3s ease;
//           border-radius: 12px;
//           background: #ffffff;
//           border: 1px solid #e5e7eb;
//           box-shadow: 0 1px 3px rgba(0,0,0,0.05);
//         }
//         .back-button:hover {
//           transform: translateX(-4px);
//           box-shadow: 0 2px 8px rgba(0,0,0,0.1);
//           border-color: #3b82f6;
//         }
//         .ant-table-thead > tr > th {
//           background: #1d174c !important;
//           color: #fff !important;
//           font-size: 18px !important;
//           font-weight: 700 !important;
//           border-bottom: 2px solid #e5e7eb !important;
//         }
//         .ant-table-tbody > tr > td {
//           color: #000 !important;
//           font-size: 18px !important;
//           font-weight: 700 !important;
//         }
//         .filter-section {
//           background: #ffffff;
//           border-radius: 16px;
//           padding: 24px;
//           border: 1px solid #e5e7eb;
//           box-shadow: 0 1px 3px rgba(0,0,0,0.05);
//         }
//       `}</style>

//       <div
//         style={{
//           padding: "32px",
//           background: "transparent",
//           minHeight: "100vh",
//           position: "relative",
//           zIndex: 10,
//         }}
//       >
//         {/* Back Button */}
//         <div>
//           <Button
//             className="back-button"
//             onClick={() => (window.location.href = "/")}
//             style={{
//               display: "inline-flex",
//               alignItems: "center",
//               height: 48,
//               padding: "0 20px",
//               fontSize: 16,
//             }}
//           >
//             <div style={{ width: 32, height: 32, marginRight: 8 }}>
//               <Lottie animationData={homeIcon} loop={true} />
//             </div>
//             <span style={{ fontWeight: 500 }}>Back</span>
//           </Button>
//         </div>

//         {/* Centered Heading */}
//         <h1
//           style={{
//             textAlign: "center",
//             fontSize: 48,
//             fontWeight: 600,
//             color: "#1f2937",
//             marginBottom: 24,
//             letterSpacing: "-0.02em",
//           }}
//         >
//           Request's Dashboard
//         </h1>

//         {/* Statistics Cards */}
//         <Row
//           gutter={[24, 24]}
//           style={{
//             marginBottom: 32,
//             maxWidth: 900,
//             marginLeft: "auto",
//             marginRight: "auto",
//           }}
//         >
//           <Col xs={24} sm={8}>
//             <Card
//               className="stat-card"
//               hoverable
//               style={{
//                 background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//                 borderColor: "transparent",
//                 color: "#ffffff",
//               }}
//             >
//               <div
//                 style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
//               >
//                 <div style={{ width: 40, height: 40, flexShrink: 0 }}>
//                   <Lottie animationData={total} loop={true} />
//                 </div>
//                 <div style={{ flex: 1 }}>
//                   <div
//                     style={{
//                       fontSize: 20,
//                       fontWeight: 700,
//                       color: "#ffffff",
//                       marginBottom: 8,
//                     }}
//                   >
//                     Total Requests
//                   </div>
//                   <div
//                     style={{ color: "#ffffff", fontSize: 34, fontWeight: 700 }}
//                   >
//                     {stats.total}
//                   </div>
//                 </div>
//               </div>
//             </Card>
//           </Col>
//           <Col xs={24} sm={8}>
//             <Card
//               className="stat-card"
//               hoverable
//               style={{
//                 background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
//                 borderColor: "transparent",
//                 color: "#ffffff",
//               }}
//             >
//               <div
//                 style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
//               >
//                 <div style={{ width: 40, height: 40, flexShrink: 0 }}>
//                   <Lottie animationData={pending} loop={true} />
//                 </div>
//                 <div style={{ flex: 1 }}>
//                   <div
//                     style={{
//                       fontSize: 20,
//                       fontWeight: 700,
//                       color: "#ffffff",
//                       marginBottom: 8,
//                     }}
//                   >
//                     Pending
//                   </div>
//                   <div
//                     style={{ color: "#ffffff", fontSize: 34, fontWeight: 700 }}
//                   >
//                     {stats.pending}
//                   </div>
//                 </div>
//               </div>
//             </Card>
//           </Col>
//           <Col xs={24} sm={8}>
//             <Card
//               className="stat-card"
//               hoverable
//               style={{
//                 background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
//                 borderColor: "transparent",
//                 color: "#ffffff",
//               }}
//             >
//               <div
//                 style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
//               >
//                 <div style={{ width: 40, height: 40, flexShrink: 0 }}>
//                   <Lottie animationData={completed} loop={true} />
//                 </div>
//                 <div style={{ flex: 1 }}>
//                   <div
//                     style={{
//                       fontSize: 20,
//                       fontWeight: 700,
//                       color: "#ffffff",
//                       marginBottom: 8,
//                     }}
//                   >
//                     Completed
//                   </div>
//                   <div
//                     style={{ color: "#ffffff", fontSize: 34, fontWeight: 700 }}
//                   >
//                     {stats.completed}
//                   </div>
//                 </div>
//               </div>
//             </Card>
//           </Col>
//         </Row>

//         {/* Filters */}
//         <div className="filter-section" style={{ marginBottom: 24 }}>
//           <Space size="middle" wrap style={{ width: "100%" }}>
//             <Input
//               placeholder="Search requirements..."
//               value={search}
//               onChange={handleSearch}
//               onPressEnter={handleSearchSubmit}
//               prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
//               style={{ width: 240, borderRadius: 8 }}
//               size="large"
//             />
//             <Select
//               placeholder="Department"
//               value={selectedDept}
//               onChange={handleDeptChange}
//               allowClear
//               style={{ width: 180, borderRadius: 8 }}
//               size="large"
//             >
//               {departmentsList.map((dept) => (
//                 <Option value={dept.id} key={dept.id}>
//                   {dept.name}
//                 </Option>
//               ))}
//             </Select>
//             <Button
//               type="primary"
//               size="large"
//               onClick={handleSearchSubmit}
//               icon={<SearchOutlined />}
//               style={{
//                 borderRadius: 8,
//                 background: "#3b82f6",
//                 borderColor: "#3b82f6",
//               }}
//             >
//               Search
//             </Button>
//             <Button
//               size="large"
//               onClick={() => {
//                 setSearch("");
//                 setSelectedDept(null);
//                 fetchRequirementsData();
//               }}
//               icon={<ReloadOutlined />}
//               style={{ borderRadius: 8 }}
//             >
//               Reset
//             </Button>
//           </Space>
//         </div>

//         {/* Table */}
//         <Card
//           variant={false}
//           style={{
//             borderRadius: 16,
//             overflow: "hidden",
//             border: "1px solid #e5e7eb",
//             boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
//           }}
//         >
//           <Table
//             rowKey="id"
//             loading={loading}
//             columns={columns}
//             dataSource={sortedRequirements}
//             pagination={{
//               pageSize: 10,
//               showTotal: (total) => `Total ${total} requirements`,
//               showSizeChanger: true,
//             }}
//             scroll={{ x: 1800 }}
//             variant
//             size="middle"
//             rowClassName={rowClassName}
//           />
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default AllRequirementsTable;
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  Table,
  Input,
  Button,
  Select,
  Space,
  message,
  Card,
  Row,
  Col,
  Tag,
  Collapse,
  DatePicker,
} from "antd";
import {
  EditOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { API_BASE_URL } from "../../../config";

const { Option } = Select;
const { Panel } = Collapse;

const AllRequirementsTable = () => {
  const user = useSelector((state) => state.user.value);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedDept, setSelectedDept] = useState(null);
  const [editRowId, setEditRowId] = useState(null);
  const [editPlannedAmount, setEditPlannedAmount] = useState(null);
  const [editAmountPaid, setEditAmountPaid] = useState(null);
  const [editApprovedAmount, setEditApprovedAmount] = useState(null);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  // Calculate statistics
  const stats = {
    total: requirements.length,
    pending: requirements.filter((r) => r.owner_check === "PENDING").length,
    completed: requirements.filter((r) => r.owner_check === "APPROVED").length,
  };

  const fetchRequirementsData = async (searchQuery = "", date = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (date) params.append("singleDate", date);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await axios.get(
        `${API_BASE_URL}request${queryString}`,
        config
      );
      setRequirements(res.data.items || []);
    } catch (err) {
      message.error("Failed to fetch requirements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementsData("", dayjs().format("YYYY-MM-DD"));
  }, []);

  useEffect(() => {
    // Fetch data on each search input change with a slight debounce
    const timeoutId = setTimeout(() => {
      fetchRequirementsData(
        search,
        selectedDate ? selectedDate.format("YYYY-MM-DD") : null
      );
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, selectedDate]);

  // Group requirements by department id
  const requirementsByDept = requirements.reduce((acc, req) => {
    const deptId = req.department?.id || "unknown";
    if (!acc[deptId]) acc[deptId] = { department: req.department, items: [] };
    acc[deptId].items.push(req);
    return acc;
  }, {});

  const sortedRequirements = (list) => {
    return [...list].sort((a, b) => {
      const statusOrder = {
        PENDING: 0,
        APPROVED: 1,
        REJECTED: 1,
      };
      const statusA =
        statusOrder[a.owner_check] !== undefined
          ? statusOrder[a.owner_check]
          : 0;
      const statusB =
        statusOrder[b.owner_check] !== undefined
          ? statusOrder[b.owner_check]
          : 0;
      return statusA - statusB;
    });
  };

  const handleSearch = (e) => setSearch(e.target.value);
  const handleSearchSubmit = () =>
    fetchRequirementsData({
      search,
      department: selectedDept,
    });
  const handleDeptChange = (value) => setSelectedDept(value);

  const handlePlannedAmountSave = async (row) => {
    if (editPlannedAmount == null || isNaN(editPlannedAmount)) {
      message.error("Please enter a valid number for planned amount");
      return;
    }
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { planned_amount: Number(editPlannedAmount) },
        config
      );
      message.success("Planned amount updated");
      setEditRowId(null);
      fetchRequirementsData({
        search,
        department: selectedDept,
      });
    } catch (err) {
      message.error("Failed to update planned amount");
    }
  };

  const handleAmountPaidSave = async (row) => {
    if (editAmountPaid == null || isNaN(editAmountPaid)) {
      message.error("Please enter a valid number for amount paid");
      return;
    }
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { amount_paid: Number(editAmountPaid) },
        config
      );
      message.success("Amount paid updated");
      setEditRowId(null);
      fetchRequirementsData(
        search,
        selectedDate ? selectedDate.format("YYYY-MM-DD") : null
      );
    } catch (err) {
      message.error("Failed to update amount paid");
    }
  };

  const handleApprovedAmountSave = async (row) => {
    if (editApprovedAmount == null || isNaN(editApprovedAmount)) {
      message.error("Please enter a valid number for approved amount");
      return;
    }
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { approver_amount: Number(editApprovedAmount) },
        config
      );
      message.success("Approved amount updated");
      setEditRowId(null);
      fetchRequirementsData(
        search,
        selectedDate ? selectedDate.format("YYYY-MM-DD") : null
      );
    } catch (err) {
      message.error("Failed to update approved amount");
    }
  };

  const handleOwnerApprove = async (row) => {
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { status: "COMPLETED" },
        config
      );
      message.success("Request approved");
      fetchRequirementsData({
        search,
        department: selectedDept,
      });
    } catch (err) {
      message.error("Failed to approve request");
    }
  };

  const handleOwnerReject = async (row) => {
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { status: "REJECTED" },
        config
      );
      message.success("Request rejected");
      fetchRequirementsData({
        search,
        department: selectedDept,
      });
    } catch (err) {
      message.error("Failed to reject request");
    }
  };

  const handlePlannedAmountEdit = (row) => {
    setEditRowId(row.id);
    setEditPlannedAmount(row.planned_amount);
    setEditAmountPaid(row.amount_paid);
    setEditApprovedAmount(row.approver_amount);
  };

  const handlePlannedAmountChange = (e) => setEditPlannedAmount(e.target.value);
  const handleAmountPaidChange = (e) => setEditAmountPaid(e.target.value);
  const handleApprovedAmountChange = (e) =>
    setEditApprovedAmount(e.target.value);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const columns = [
    {
      title: "Sl. No",
      key: "slno",
      width: 70,
      fixed: "left",
      render: (_, __, idx) => (
        <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>
          {idx + 1}
        </span>
      ),
    },
    {
      title: "Requested At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) => (
        <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
          {date ? dayjs(date).format("DD-MM-YYYY HH:mm") : "-"}
        </span>
      ),
    },
    {
      title: "Requester",
      dataIndex: ["requested_by", "first_name"],
      key: "first_name",
      width: 120,
      render: (_, record) => (
        <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
          {record.requested_by?.first_name || "-"}
        </span>
      ),
    },
    {
      title: "Department",
      dataIndex: ["department", "name"],
      key: "department",
      width: 150,
      render: (_, record) => (
        <Tag
          color="blue"
          style={{ borderRadius: 6, fontWeight: 700, fontSize: 14 }}
        >
          {record.department?.name || "-"}
        </Tag>
      ),
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      width: 200,
      render: (text) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#000",
            whiteSpace: "normal",
            wordBreak: "break-word",
            display: "inline-block",
            maxWidth: 200,
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amt) => (
        <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>
          {amt?.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
        </span>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => (
        <Tag
          color={
            priority === "HIGH"
              ? "#fee2e2"
              : priority === "MEDIUM"
              ? "#fef3c7"
              : "#d1fae5"
          }
          style={{
            color:
              priority === "HIGH"
                ? "#991b1b"
                : priority === "MEDIUM"
                ? "#92400e"
                : "#065f46",
            borderRadius: 6,
            border: "none",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {priority}
        </Tag>
      ),
    },
    {
      title: "Planned Amount",
      dataIndex: "planned_amount",
      key: "planned_amount",
      width: 180,
      render: (planned_amount, row) =>
        row.owner_check === "APPROVED" || row.owner_check === "REJECTED" ? (
          <span style={{ color: "#555", fontWeight: 700, fontSize: 18 }}>
            {planned_amount?.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            }) || "₹0"}
          </span>
        ) : row.id === editRowId ? (
          <Space>
            <Input
              style={{ width: 100, fontWeight: 600, fontSize: 18 }}
              value={editPlannedAmount}
              onChange={handlePlannedAmountChange}
              size="small"
            />
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handlePlannedAmountSave(row)}
              style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
            />
          </Space>
        ) : (
          <Space>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
              {planned_amount?.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              }) || "₹0"}
            </span>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handlePlannedAmountEdit(row)}
            />
          </Space>
        ),
    },

    {
      title: "Approved Amount",
      dataIndex: "approver_amount",
      key: "approver_amount",
      width: 160,
      render: (approver_amount, row) =>
        row.owner_check === "APPROVED" || row.owner_check === "REJECTED" ? (
          <span style={{ color: "#555", fontWeight: 700, fontSize: 18 }}>
            {approver_amount?.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            }) || "₹0"}
          </span>
        ) : row.id === editRowId ? (
          <Space>
            <Input
              style={{ width: 100, fontWeight: 600, fontSize: 18 }}
              value={editApprovedAmount}
              onChange={handleApprovedAmountChange}
              size="small"
            />
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleApprovedAmountSave(row)}
              style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
            />
          </Space>
        ) : (
          <Space>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
              {approver_amount?.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              }) || "₹0"}
            </span>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handlePlannedAmountEdit(row)}
            />
          </Space>
        ),
    },
    {
      title: "Amount Paid",
      dataIndex: "amount_paid",
      key: "amount_paid",
      width: 180,
      render: (amount_paid, row) =>
        row.owner_check === "APPROVED" || row.owner_check === "REJECTED" ? (
          <span style={{ color: "#555", fontWeight: 700, fontSize: 18 }}>
            {amount_paid?.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            }) || "₹0"}
          </span>
        ) : row.id === editRowId ? (
          <Space>
            <Input
              style={{ width: 100, fontWeight: 600, fontSize: 18 }}
              value={editAmountPaid}
              onChange={handleAmountPaidChange}
              size="small"
            />
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleAmountPaidSave(row)}
              style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
            />
          </Space>
        ) : (
          <Space>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
              {amount_paid?.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              }) || "₹0"}
            </span>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handlePlannedAmountEdit(row)}
            />
          </Space>
        ),
    },
    {
      title: "Accounts Check",
      dataIndex: "accounts_check",
      key: "accounts_check",
      width: 140,
      render: (status) => (
        <Tag
          color={
            status === "APPROVED"
              ? "#d1fae5"
              : status === "REJECTED"
              ? "#fee2e2"
              : "#fef3c7"
          }
          style={{
            color:
              status === "APPROVED"
                ? "#065f46"
                : status === "REJECTED"
                ? "#991b1b"
                : "#92400e",
            borderRadius: 6,
            border: "none",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {status || "PENDING"}
        </Tag>
      ),
    },
    {
      title: "Approver Check",
      dataIndex: "approver_check",
      key: "approver_check",
      width: 140,
      render: (status) => (
        <Tag
          color={
            status === "APPROVED"
              ? "#d1fae5"
              : status === "REJECTED"
              ? "#fee2e2"
              : "#fef3c7"
          }
          style={{
            color:
              status === "APPROVED"
                ? "#065f46"
                : status === "REJECTED"
                ? "#991b1b"
                : "#92400e",
            borderRadius: 6,
            border: "none",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {status || "PENDING"}
        </Tag>
      ),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 150,
      render: (date) => (
        <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
          {date ? dayjs(date).format("DD-MM-YYYY HH:mm") : "-"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 250,
      fixed: "right",
      render: (_, row) => {
        if (row.owner_check === "APPROVED") {
          return (
            <Tag
              color="#d1fae5"
              style={{
                color: "#065f46",
                borderRadius: 6,
                border: "none",
                fontWeight: 700,
                fontSize: 16,
                padding: "4px 12px",
              }}
            >
              Approved
            </Tag>
          );
        }
        if (row.owner_check === "REJECTED") {
          return (
            <Tag
              color="#fee2e2"
              style={{
                color: "#991b1b",
                borderRadius: 6,
                border: "none",
                fontWeight: 700,
                fontSize: 16,
                padding: "4px 12px",
              }}
            >
              Rejected
            </Tag>
          );
        }
        return (
          <Space>
            <Button
              type="primary"
              size="small"
              onClick={() => handleOwnerApprove(row)}
              icon={<CheckCircleOutlined />}
              style={{
                background: "#10b981",
                borderColor: "#10b981",
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              Approved
            </Button>
            <Button
              danger
              size="small"
              onClick={() => handleOwnerReject(row)}
              icon={<CloseCircleOutlined />}
              style={{ fontWeight: 700, fontSize: 18 }}
            >
              Rejected
            </Button>
          </Space>
        );
      },
    },
  ];

  const rowClassName = (record) => {
    if (record.owner_check === "APPROVED") return "completed-row";
    if (record.owner_check === "REJECTED") return "rejected-row";
    return "";
  };

  // Accordion header with department name + counts of APPROVED, PENDING, REJECTED
  const getPanelHeader = (deptObj) => {
    const items = deptObj.items;
    const approvedCount = items.filter(
      (r) => r.owner_check === "APPROVED"
    ).length;
    const pendingCount = items.filter(
      (r) => r.owner_check === "PENDING"
    ).length;
    const rejectedCount = items.filter(
      (r) => r.owner_check === "REJECTED"
    ).length;

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 600,
          fontSize: 20,
          color: "#fff",
          padding: "0 12px",
          alignItems: "center",
          height: "46px",
          borderRadius: "12px",
        }}
      >
        <span>{deptObj.department?.name || "Unknown Department"}</span>
        <span>
          Approved: {approvedCount} | Pending: {pendingCount} | Rejected:{" "}
          {rejectedCount}
        </span>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen w-full relative"
      style={{ background: "transparent" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
        * {
          font-family: 'Cormorant Garamond', serif;
        }
        .completed-row {
          background: #f0fdf4 !important;
          opacity: 0.85;
        }
        .rejected-row {
          background: #fef2f2 !important;
          opacity: 0.75;
        }
        .ant-table-thead > tr > th {
          background: #1d174c !important;
          color: #fff !important;
          font-size: 18px !important;
          font-weight: 700 !important;
          border-bottom: 2px solid #e5e7eb !important;
        }
        .ant-table-tbody > tr > td {
          color: #000 !important;
          font-size: 18px !important;
          font-weight: 700 !important;
        }
        .ant-collapse-item {
          border-radius: 12px;
          margin-bottom: 12px;
          overflow: hidden;
          border: none !important;
        }
        .ant-collapse-header {
          background: linear-gradient(135deg, #7b2ff7, #f107a3);
          color: white !important;
          font-weight: 700;
          font-size: 20px;
          border-radius: 12px;
          padding: 0 12px !important;
        }
        .ant-collapse-content {
          background: linear-gradient(180deg, #d8b4fe 0%, #fbcfe8 100%);
          border-radius: 0 0 12px 12px;
          padding: 12px !important;
        }
        .ant-collapse-arrow svg {
          fill: white;
        }
        .filter-section {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          margin-bottom: 24px;
        }
        /* Scrolling Styles */
        .overflow-x-auto {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        .overflow-x-auto::-webkit-scrollbar {
          height: 8px;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>

      <div
        style={{
          padding: "32px",
          background: "transparent",
          minHeight: "100vh",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Centered Heading */}
        <h1
          style={{
            textAlign: "center",
            fontSize: 48,
            fontWeight: 600,
            color: "#1f2937",
            marginBottom: 24,
            letterSpacing: "-0.02em",
          }}
        >
          Request's Dashboard
        </h1>

        {/* Statistics Cards */}
        <Row
          gutter={[24, 24]}
          style={{
            marginBottom: 32,
            maxWidth: 900,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <Col xs={24} sm={8}>
            <Card
              className="stat-card"
              hoverable
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderColor: "transparent",
                color: "#ffffff",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#ffffff",
                      marginBottom: 8,
                    }}
                  >
                    Total Requests
                  </div>
                  <div
                    style={{ color: "#ffffff", fontSize: 34, fontWeight: 700 }}
                  >
                    {stats.total}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              className="stat-card"
              hoverable
              style={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                borderColor: "transparent",
                color: "#ffffff",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#ffffff",
                      marginBottom: 8,
                    }}
                  >
                    Pending
                  </div>
                  <div
                    style={{ color: "#ffffff", fontSize: 34, fontWeight: 700 }}
                  >
                    {stats.pending}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              className="stat-card"
              hoverable
              style={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                borderColor: "transparent",
                color: "#ffffff",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#ffffff",
                      marginBottom: 8,
                    }}
                  >
                    Completed
                  </div>
                  <div
                    style={{ color: "#ffffff", fontSize: 34, fontWeight: 700 }}
                  >
                    {stats.completed}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <div
          className="filter-section"
          style={{
            marginBottom: 24,
            background: "#fff",
            padding: 24,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Input
            placeholder="Search requirements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
            style={{ width: 320, borderRadius: 8 }}
            size="large"
          />
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            format="DD-MM-YYYY"
            style={{ width: 200, borderRadius: 8 }}
            size="large"
            placeholder="Select date"
          />
        </div>

        {/* Accordion grouped by department */}
        <Collapse
          accordion={false}
          bordered={false}
          expandIconPosition="end"
          defaultActiveKey={Object.keys(requirementsByDept)} // expand all by default
        >
          {Object.entries(requirementsByDept).map(([deptId, deptObj]) => (
            <Panel key={deptId} header={getPanelHeader(deptObj)}>
              <div className="bg-white rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={sortedRequirements(deptObj.items)}
                    pagination={false}
                    scroll={{ x: 2000 }}
                    size="middle"
                    rowClassName={rowClassName}
                  />
                </div>
              </div>
            </Panel>
          ))}
        </Collapse>
      </div>
    </div>
  );
};

export default AllRequirementsTable;
