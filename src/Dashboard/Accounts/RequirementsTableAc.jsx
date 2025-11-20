// /* eslint-disable no-unused-vars */
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useSelector } from "react-redux";
// import {
//   Table,
//   Input,
//   Button,
//   Select,
//   Space,
//   message,
//   Card,
//   Row,
//   Col,
//   Tag,
// } from "antd";
// import {
//   EditOutlined,
//   CheckOutlined,
//   SearchOutlined,
//   ReloadOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";

// import { API_BASE_URL } from "../../../config";

// const { Option } = Select;

// const departmentsList = [
//   { name: "Hennur Godown", id: "68fdf1cfe66ed5069ddb9f25" },
// ];

// const RequirementsTableAc = () => {
//   const user = useSelector((state) => state.user.value);
//   console.log("user", user?.role);

//   const [requirements, setRequirements] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [search, setSearch] = useState("");
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [selectedDept, setSelectedDept] = useState(null);

//   // Track which row is being edited for planned_amount or amount_paid
//   const [editRowId, setEditRowId] = useState(null);
//   const [editField, setEditField] = useState(null); // 'planned_amount' or 'amount_paid'
//   const [editValue, setEditValue] = useState(null);

//   const config = {
//     headers: { Authorization: user?.access_token },
//   };

//   // Calculate statistics
//   const stats = {
//     total: requirements.length,
//     pending: requirements.filter((r) => r.status === "PENDING").length,
//     completed: requirements.filter((r) => r.status === "COMPLETED").length,
//   };

//   const fetchRequirementsData = async (params = {}) => {
//     setLoading(true);
//     try {
//       let query = [];
//       if (params.search) query.push(`search=${params.search}`);
//       if (params.due_date)
//         query.push(`due_date=${params.due_date.format("YYYY-MM-DD")}`);
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
//       COMPLETED: 1,
//       REJECTED: 1,
//     };
//     const statusA =
//       statusOrder[a.status] !== undefined ? statusOrder[a.status] : 0;
//     const statusB =
//       statusOrder[b.status] !== undefined ? statusOrder[b.status] : 0;
//     return statusA - statusB;
//   });

//   const handleSearch = (e) => setSearch(e.target.value);
//   const handleSearchSubmit = () =>
//     fetchRequirementsData({
//       search,
//       due_date: selectedDate,
//       department: selectedDept,
//     });

//   const handleDeptChange = (value) => setSelectedDept(value);

//   const handleEditSave = async (row) => {
//     if (editValue == null || isNaN(editValue)) {
//       message.error("Please enter a valid number");
//       return;
//     }
//     try {
//       await axios.patch(
//         `${API_BASE_URL}request/${row.id}`,
//         { [editField]: Number(editValue) },
//         config
//       );
//       message.success(
//         `${
//           editField === "planned_amount" ? "Planned amount" : "Amount paid"
//         } updated`
//       );
//       setEditRowId(null);
//       setEditField(null);
//       setEditValue(null);
//       fetchRequirementsData({
//         search,
//         due_date: selectedDate,
//         department: selectedDept,
//       });
//     } catch (err) {
//       message.error(
//         `Failed to update ${
//           editField === "planned_amount" ? "planned amount" : "amount paid"
//         }`
//       );
//     }
//   };

//   const handleComplete = async (row) => {
//     try {
//       await axios.patch(
//         `${API_BASE_URL}request/${row.id}`,
//         { status: "COMPLETED" },
//         config
//       );
//       message.success("Request marked as completed");
//       fetchRequirementsData({
//         search,
//         due_date: selectedDate,
//         department: selectedDept,
//       });
//     } catch (err) {
//       message.error("Failed to mark as completed");
//     }
//   };

//   const handleReject = async (row) => {
//     try {
//       await axios.patch(
//         `${API_BASE_URL}request/${row.id}`,
//         { status: "REJECTED" },
//         config
//       );
//       message.success("Request marked as rejected");
//       fetchRequirementsData({
//         search,
//         due_date: selectedDate,
//         department: selectedDept,
//       });
//     } catch (err) {
//       message.error("Failed to reject request");
//     }
//   };

//   const startEdit = (row, field) => {
//     setEditRowId(row.id);
//     setEditField(field);
//     setEditValue(row[field] ?? 0);
//   };

//   const onEditChange = (e) => setEditValue(e.target.value);

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
//       title: "Planned Amount",
//       dataIndex: "planned_amount",
//       key: "planned_amount",
//       width: 180,
//       render: (planned_amount, row) =>
//         row.status === "COMPLETED" || row.status === "REJECTED" ? (
//           <span style={{ color: "#555", fontWeight: 700, fontSize: 18 }}>
//             {planned_amount?.toLocaleString("en-IN", {
//               style: "currency",
//               currency: "INR",
//             }) || "₹0"}
//           </span>
//         ) : row.id === editRowId && editField === "planned_amount" ? (
//           <Space>
//             <Input
//               style={{ width: 120, fontWeight: 600, fontSize: 18 }}
//               value={editValue}
//               onChange={onEditChange}
//               size="small"
//             />
//             <Button
//               type="primary"
//               icon={<CheckOutlined />}
//               size="small"
//               onClick={() => handleEditSave(row)}
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
//               onClick={() => startEdit(row, "planned_amount")}
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
//         row.status === "COMPLETED" || row.status === "REJECTED" ? (
//           <span style={{ color: "#555", fontWeight: 700, fontSize: 18 }}>
//             {amount_paid?.toLocaleString("en-IN", {
//               style: "currency",
//               currency: "INR",
//             }) || "₹0"}
//           </span>
//         ) : row.id === editRowId && editField === "amount_paid" ? (
//           <Space>
//             <Input
//               style={{ width: 120, fontWeight: 600, fontSize: 18 }}
//               value={editValue}
//               onChange={onEditChange}
//               size="small"
//             />
//             <Button
//               type="primary"
//               icon={<CheckOutlined />}
//               size="small"
//               onClick={() => handleEditSave(row)}
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
//               onClick={() => startEdit(row, "amount_paid")}
//             />
//           </Space>
//         ),
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 250,
//       fixed: "right",
//       render: (_, row) => (
//         <Space>
//           {row.accounts_check === "PENDING" ? (
//             <>
//               <Button
//                 type="primary"
//                 size="small"
//                 onClick={() => handleComplete(row)}
//                 icon={<CheckCircleOutlined />}
//                 style={{
//                   background: "#10b981",
//                   borderColor: "#10b981",
//                   fontWeight: 600,
//                   fontSize: 16,
//                 }}
//               >
//                 Completed
//               </Button>
//               <Button
//                 danger
//                 size="small"
//                 onClick={() => handleReject(row)}
//                 icon={<CloseCircleOutlined />}
//                 style={{ fontWeight: 700, fontSize: 18 }}
//               >
//                 Rejected
//               </Button>
//             </>
//           ) : (
//             <span style={{ fontWeight: 700, fontSize: 18, color: "#555" }}>
//               {row.status}
//             </span>
//           )}
//         </Space>
//       ),
//     },
//   ];

//   const rowClassName = (record) => {
//     if (record.status === "COMPLETED") return "completed-row";
//     if (record.status === "REJECTED") return "rejected-row";
//     return "";
//   };

//   return (
//     <div
//       className="min-h-screen w-full relative"
//       style={{ background: "transparent" }}
//     >
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
//         <div
//           className="filter-section"
//           style={{
//             marginBottom: 24,
//             background: "#fff",
//             padding: 24,
//             borderRadius: 16,
//           }}
//         >
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
//                 setSelectedDate(null);
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
//             scroll={{ x: 1500 }}
//             size="middle"
//             rowClassName={rowClassName}
//           />
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default RequirementsTableAc;
/* eslint-disable no-unused-vars */
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useSelector } from "react-redux";
// import {
//   Table,
//   Input,
//   Button,
//   Space,
//   message,
//   Tag,
//   Collapse,
// } from "antd";
// import {
//   EditOutlined,
//   CheckOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   SearchOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";

// import { API_BASE_URL } from "../../../config";

// const { Panel } = Collapse;

// const RequirementsTableAc = () => {
//   const user = useSelector((state) => state.user.value);

//   const [requirements, setRequirements] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [search, setSearch] = useState("");
//   const [editRowId, setEditRowId] = useState(null);
//   const [editField, setEditField] = useState(null);
//   const [editValue, setEditValue] = useState(null);

//   const config = {
//     headers: { Authorization: user?.access_token },
//   };

//   const fetchRequirementsData = async (searchQuery = "") => {
//     setLoading(true);
//     try {
//       const queryString = searchQuery ? `?search=${searchQuery}` : "";
//       const res = await axios.get(`${API_BASE_URL}request${queryString}`, config);
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

//   useEffect(() => {
//     // Fetch data on each search input change with a slight debounce
//     const timeoutId = setTimeout(() => {
//       fetchRequirementsData(search);
//     }, 300);

//     return () => clearTimeout(timeoutId);
//   }, [search]);

//   // Group requirements by department id
//   const requirementsByDept = requirements.reduce((acc, req) => {
//     const deptId = req.department?.id || "unknown";
//     if (!acc[deptId]) acc[deptId] = { department: req.department, items: [] };
//     acc[deptId].items.push(req);
//     return acc;
//   }, {});

//   const sortedRequirements = (list) => {
//     const statusOrder = { PENDING: 0, COMPLETED: 1, REJECTED: 1 };
//     return [...list].sort((a, b) => {
//       const statusA = statusOrder[a.status] ?? 0;
//       const statusB = statusOrder[b.status] ?? 0;
//       return statusA - statusB;
//     });
//   };

//   const handleEditSave = async (row) => {
//     if (editValue == null || isNaN(editValue)) {
//       message.error("Please enter a valid number");
//       return;
//     }
//     try {
//       await axios.patch(
//         `${API_BASE_URL}request/${row.id}`,
//         { [editField]: Number(editValue) },
//         config
//       );
//       message.success(
//         `${editField === "planned_amount" ? "Planned amount" : "Amount paid"} updated`
//       );
//       setEditRowId(null);
//       setEditField(null);
//       setEditValue(null);
//       fetchRequirementsData(search);
//     } catch {
//       message.error(`Failed to update ${editField === "planned_amount" ? "planned amount" : "amount paid"}`);
//     }
//   };

//   const handleComplete = async (row) => {
//     try {
//       await axios.patch(
//         `${API_BASE_URL}request/${row.id}`,
//         { status: "COMPLETED" },
//         config
//       );
//       message.success("Request marked as completed");
//       fetchRequirementsData(search);
//     } catch {
//       message.error("Failed to mark as completed");
//     }
//   };

//   const handleReject = async (row) => {
//     try {
//       await axios.patch(
//         `${API_BASE_URL}request/${row.id}`,
//         { status: "REJECTED" },
//         config
//       );
//       message.success("Request marked as rejected");
//       fetchRequirementsData(search);
//     } catch {
//       message.error("Failed to reject request");
//     }
//   };

//   const startEdit = (row, field) => {
//     setEditRowId(row.id);
//     setEditField(field);
//     setEditValue(row[field] ?? 0);
//   };

//   const onEditChange = (e) => setEditValue(e.target.value);

//   const columns = [
//     {
//       title: "Sl. No",
//       key: "slno",
//       width: 70,
//       fixed: "left",
//       render: (_, __, idx) => (
//         <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>{idx + 1}</span>
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
//         <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, fontSize: 14 }}>
//           {record.department?.name || "-"}
//         </Tag>
//       ),
//     },
//     {
//       title: "Priority",
//       dataIndex: "priority",
//       key: "priority",
//       width: 200,
//       render: (text) => (
//         <span
//           style={{
//             fontWeight: 700,
//             fontSize: 18,
//             color: "#000",
//             alignItems: "center",
//             justifyContent: "center",
//             justifyItems: "center",
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
//           {amt?.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
//         </span>
//       ),
//     },
//     {
//       title: "Planned Amount",
//       dataIndex: "planned_amount",
//       key: "planned_amount",
//       width: 180,
//       render: (planned_amount, row) =>
//         row.status === "COMPLETED" || row.status === "REJECTED" ? (
//           <span style={{ color: "#555", fontWeight: 700, fontSize: 18 }}>
//             {planned_amount?.toLocaleString("en-IN", { style: "currency", currency: "INR" }) || "₹0"}
//           </span>
//         ) : row.id === editRowId && editField === "planned_amount" ? (
//           <Space>
//             <Input
//               style={{ width: 120, fontWeight: 600, fontSize: 18 }}
//               value={editValue}
//               onChange={onEditChange}
//               size="small"
//             />
//             <Button
//               type="primary"
//               icon={<CheckOutlined />}
//               size="small"
//               onClick={() => handleEditSave(row)}
//               style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
//             />
//           </Space>
//         ) : (
//           <Space>
//             <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
//               {planned_amount?.toLocaleString("en-IN", { style: "currency", currency: "INR" }) || "₹0"}
//             </span>
//             <Button icon={<EditOutlined />} size="small" onClick={() => startEdit(row, "planned_amount")} />
//           </Space>
//         ),
//     },
//     {
//       title: "Amount Paid",
//       dataIndex: "amount_paid",
//       key: "amount_paid",
//       width: 180,
//       render: (amount_paid, row) =>
//         row.status === "COMPLETED" || row.status === "REJECTED" ? (
//           <span style={{ color: "#555", fontWeight: 700, fontSize: 18 }}>
//             {amount_paid?.toLocaleString("en-IN", { style: "currency", currency: "INR" }) || "₹0"}
//           </span>
//         ) : row.id === editRowId && editField === "amount_paid" ? (
//           <Space>
//             <Input
//               style={{ width: 120, fontWeight: 600, fontSize: 18 }}
//               value={editValue}
//               onChange={onEditChange}
//               size="small"
//             />
//             <Button
//               type="primary"
//               icon={<CheckOutlined />}
//               size="small"
//               onClick={() => handleEditSave(row)}
//               style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
//             />
//           </Space>
//         ) : (
//           <Space>
//             <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
//               {amount_paid?.toLocaleString("en-IN", { style: "currency", currency: "INR" }) || "₹0"}
//             </span>
//             <Button icon={<EditOutlined />} size="small" onClick={() => startEdit(row, "amount_paid")} />
//           </Space>
//         ),
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 250,
//       fixed: "right",
//       render: (_, row) => (
//         <Space>
//           {row.accounts_check === "PENDING" ? (
//             <>
//               <Button
//                 type="primary"
//                 size="small"
//                 onClick={() => handleComplete(row)}
//                 icon={<CheckCircleOutlined />}
//                 style={{
//                   background: "#10b981",
//                   borderColor: "#10b981",
//                   fontWeight: 600,
//                   fontSize: 16,
//                 }}
//               >
//                 Completed
//               </Button>
//               <Button danger size="small" onClick={() => handleReject(row)} icon={<CloseCircleOutlined />} style={{ fontWeight: 700, fontSize: 18 }}>
//                 Rejected
//               </Button>
//             </>
//           ) : (
//             <span style={{ fontWeight: 700, fontSize: 18, color: "#555" }}>{row.status}</span>
//           )}
//         </Space>
//       ),
//     },
//   ];

//   const rowClassName = (record) => {
//     if (record.status === "COMPLETED") return "completed-row";
//     if (record.status === "REJECTED") return "rejected-row";
//     return "";
//   };

//   const getPanelHeader = (deptObj) => {
//     const items = deptObj.items;
//     const total = items.length;
//     const approvedCount = items.filter((r) => r.status === "COMPLETED").length;
//     const pendingCount = items.filter((r) => r.status === "PENDING").length;
//     const rejectedCount = items.filter((r) => r.status === "REJECTED").length;

//     return (
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           fontWeight: 600,
//           fontSize: 20,
//           color: "#1d174c",
//         }}
//       >
//         <span className="text-white">{deptObj.department?.name || "Unknown Department"}</span>
//         <span className="text-white">
//           Approved: {approvedCount} | Pending: {pendingCount} | Rejected: {rejectedCount} | Total: {total}
//         </span>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen w-full relative" style={{ background: "transparent" }}>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
//         * { font-family: 'Cormorant Garamond', serif; }
//         .completed-row { background: #f0fdf4 !important; opacity: 0.85; }
//         .rejected-row { background: #fef2f2 !important; opacity: 0.75; }
//         .ant-collapse-item { border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
//         .ant-collapse-header { background: linear-gradient(135deg, #7b2ff7, #f107a3); color: white !important; font-weight: 700; font-size: 20px; border-radius: 12px; }
//         .ant-collapse-content { background: linear-gradient(180deg, #d8b4fe 0%, #fbcfe8 100%); border-radius: 0 0 12px 12px; }
//         .ant-collapse-arrow svg { fill: white; }
//         .ant-table-thead > tr > th { background: #1d174c !important; color: #fff !important; font-size: 18px !important; font-weight: 700 !important; border-bottom: 2px solid #e5e7eb !important; }
//         .ant-table-tbody > tr > td { color: #000 !important; font-size: 18px !important; font-weight: 700 !important; }
//       `}</style>

//       <div style={{ padding: "32px", background: "transparent", minHeight: "100vh", position: "relative", zIndex: 10 }}>
//         <h1 style={{ textAlign: "center", fontSize: 48, fontWeight: 600, color: "#1f2937", marginBottom: 24, letterSpacing: "-0.02em" }}>
//           Request's Dashboard
//         </h1>
//         {/* Search input only */}
//         <div
//           style={{
//             marginBottom: 24,
//             background: "#fff",
//             padding: 24,
//             borderRadius: 16,
//             display: "flex",
//             alignItems: "center",
//           }}
//         >
//           <Input
//             placeholder="Search requirements..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
//             style={{ width: 320, borderRadius: 8 }}
//             size="large"
//           />
//         </div>

//         <Collapse
//           accordion={false}
//           bordered={false}
//           expandIconPosition="end"
//           defaultActiveKey={Object.keys(requirementsByDept)}
//         >
//           {Object.entries(requirementsByDept).map(([deptId, deptObj]) => (
//             <Panel key={deptId} header={getPanelHeader(deptObj)}>
//               <Table
//                 rowKey="id"
//                 loading={loading}
//                 columns={columns}
//                 dataSource={sortedRequirements(deptObj.items)}
//                 pagination={false}
//                 scroll={{ x: 1500 }}
//                 size="middle"
//                 rowClassName={rowClassName}
//               />
//             </Panel>
//           ))}
//         </Collapse>
//       </div>
//     </div>
//   );
// };

// export default RequirementsTableAc;
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  Table,
  Input,
  Button,
  Space,
  message,
  Tag,
  Collapse,
  DatePicker,
} from "antd";
import {
  EditOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { API_BASE_URL } from "../../../config";

const { Panel } = Collapse;

const RequirementsTableAc = () => {
  const user = useSelector((state) => state.user.value);

  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [editRowId, setEditRowId] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState(null);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const fetchRequirementsData = async (searchQuery = "", date = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (date) params.append("singleDate", date);
      
      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await axios.get(`${API_BASE_URL}request${queryString}`, config);
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
      fetchRequirementsData(search, selectedDate ? selectedDate.format("YYYY-MM-DD") : null);
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
    const statusOrder = { PENDING: 0, COMPLETED: 1, REJECTED: 1 };
    return [...list].sort((a, b) => {
      const statusA = statusOrder[a.status] ?? 0;
      const statusB = statusOrder[b.status] ?? 0;
      return statusA - statusB;
    });
  };

  const handleEditSave = async (row) => {
    if (editValue == null || isNaN(editValue)) {
      message.error("Please enter a valid number");
      return;
    }
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { [editField]: Number(editValue) },
        config
      );
      message.success(
        `${editField === "planned_amount" ? "Planned amount" : "Amount paid"} updated`
      );
      setEditRowId(null);
      setEditField(null);
      setEditValue(null);
      fetchRequirementsData(search, selectedDate ? selectedDate.format("YYYY-MM-DD") : null);
    } catch {
      message.error(`Failed to update ${editField === "planned_amount" ? "planned amount" : "amount paid"}`);
    }
  };

  const handleComplete = async (row) => {
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { status: "COMPLETED" },
        config
      );
      message.success("Request marked as completed");
      fetchRequirementsData(search, selectedDate ? selectedDate.format("YYYY-MM-DD") : null);
    } catch {
      message.error("Failed to mark as completed");
    }
  };

  const handleReject = async (row) => {
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { status: "REJECTED" },
        config
      );
      message.success("Request marked as rejected");
      fetchRequirementsData(search, selectedDate ? selectedDate.format("YYYY-MM-DD") : null);
    } catch {
      message.error("Failed to reject request");
    }
  };

  const startEdit = (row, field) => {
    setEditRowId(row.id);
    setEditField(field);
    setEditValue(row[field] ?? 0);
  };

  const onEditChange = (e) => setEditValue(e.target.value);

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
        <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>{idx + 1}</span>
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
        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, fontSize: 14 }}>
          {record.department?.name || "-"}
        </Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 200,
      render: (text) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#000",
            alignItems: "center",
            justifyContent: "center",
            justifyItems: "center",
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
          {amt?.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
        </span>
      ),
    },
    {
      title: "Planned Amount",
      dataIndex: "planned_amount",
      key: "planned_amount",
      width: 180,
      render: (planned_amount, row) =>
        row.status === "COMPLETED" || row.status === "REJECTED" ? (
          <span style={{ color: "#555", fontWeight: 700, fontSize: 18 }}>
            {planned_amount?.toLocaleString("en-IN", { style: "currency", currency: "INR" }) || "₹0"}
          </span>
        ) : row.id === editRowId && editField === "planned_amount" ? (
          <Space>
            <Input
              style={{ width: 120, fontWeight: 600, fontSize: 18 }}
              value={editValue}
              onChange={onEditChange}
              size="small"
            />
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleEditSave(row)}
              style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
            />
          </Space>
        ) : (
          <Space>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
              {planned_amount?.toLocaleString("en-IN", { style: "currency", currency: "INR" }) || "₹0"}
            </span>
            <Button icon={<EditOutlined />} size="small" onClick={() => startEdit(row, "planned_amount")} />
          </Space>
        ),
    },
    {
      title: "Amount Paid",
      dataIndex: "amount_paid",
      key: "amount_paid",
      width: 180,
      render: (amount_paid, row) =>
        row.status === "COMPLETED" || row.status === "REJECTED" ? (
          <span style={{ color: "#555", fontWeight: 700, fontSize: 18 }}>
            {amount_paid?.toLocaleString("en-IN", { style: "currency", currency: "INR" }) || "₹0"}
          </span>
        ) : row.id === editRowId && editField === "amount_paid" ? (
          <Space>
            <Input
              style={{ width: 120, fontWeight: 600, fontSize: 18 }}
              value={editValue}
              onChange={onEditChange}
              size="small"
            />
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleEditSave(row)}
              style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
            />
          </Space>
        ) : (
          <Space>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
              {amount_paid?.toLocaleString("en-IN", { style: "currency", currency: "INR" }) || "₹0"}
            </span>
            <Button icon={<EditOutlined />} size="small" onClick={() => startEdit(row, "amount_paid")} />
          </Space>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 250,
      fixed: "right",
      render: (_, row) => (
        <Space>
          {row.accounts_check === "PENDING" ? (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleComplete(row)}
                icon={<CheckCircleOutlined />}
                style={{
                  background: "#10b981",
                  borderColor: "#10b981",
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                Completed
              </Button>
              <Button danger size="small" onClick={() => handleReject(row)} icon={<CloseCircleOutlined />} style={{ fontWeight: 700, fontSize: 18 }}>
                Rejected
              </Button>
            </>
          ) : (
            <span style={{ fontWeight: 700, fontSize: 18, color: "#555" }}>{row.status}</span>
          )}
        </Space>
      ),
    },
  ];

  const rowClassName = (record) => {
    if (record.status === "COMPLETED") return "completed-row";
    if (record.status === "REJECTED") return "rejected-row";
    return "";
  };

  const getPanelHeader = (deptObj) => {
    const items = deptObj.items;
    const total = items.length;
    const approvedCount = items.filter((r) => r.status === "COMPLETED").length;
    const pendingCount = items.filter((r) => r.status === "PENDING").length;
    const rejectedCount = items.filter((r) => r.status === "REJECTED").length;

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 600,
          fontSize: 20,
          color: "#1d174c",
        }}
      >
        <span className="text-white">{deptObj.department?.name || "Unknown Department"}</span>
        <span className="text-white">
          Approved: {approvedCount} | Pending: {pendingCount} | Rejected: {rejectedCount} | Total: {total}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full relative" style={{ background: "transparent" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Cormorant Garamond', serif; }
        .completed-row { background: #f0fdf4 !important; opacity: 0.85; }
        .rejected-row { background: #fef2f2 !important; opacity: 0.75; }
        .ant-collapse-item { border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
        .ant-collapse-header { background: linear-gradient(135deg, #7b2ff7, #f107a3); color: white !important; font-weight: 700; font-size: 20px; border-radius: 12px; }
        .ant-collapse-content { background: linear-gradient(180deg, #d8b4fe 0%, #fbcfe8 100%); border-radius: 0 0 12px 12px; }
        .ant-collapse-arrow svg { fill: white; }
        .ant-table-thead > tr > th { background: #1d174c !important; color: #fff !important; font-size: 18px !important; font-weight: 700 !important; border-bottom: 2px solid #e5e7eb !important; }
        .ant-table-tbody > tr > td { color: #000 !important; font-size: 18px !important; font-weight: 700 !important; }
      `}</style>

      <div style={{ padding: "32px", background: "transparent", minHeight: "100vh", position: "relative", zIndex: 10 }}>
        <h1 style={{ textAlign: "center", fontSize: 48, fontWeight: 600, color: "#1f2937", marginBottom: 24, letterSpacing: "-0.02em" }}>
          Request's Dashboard
        </h1>
        {/* Search and Date Filter */}
        <div
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

        <Collapse
          accordion={false}
          bordered={false}
          expandIconPosition="end"
          defaultActiveKey={Object.keys(requirementsByDept)}
        >
          {Object.entries(requirementsByDept).map(([deptId, deptObj]) => (
            <Panel key={deptId} header={getPanelHeader(deptObj)}>
              <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={sortedRequirements(deptObj.items)}
                pagination={false}
                scroll={{ x: 1500 }}
                size="middle"
                rowClassName={rowClassName}
              />
            </Panel>
          ))}
        </Collapse>
      </div>
    </div>
  );
};

export default RequirementsTableAc;