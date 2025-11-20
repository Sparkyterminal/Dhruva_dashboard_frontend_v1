// /* eslint-disable no-unused-vars */
// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { API_BASE_URL } from "../../config";
// import { message, Table, Button, Input, Card, Space, Modal } from "antd";
// import { EditOutlined, DeleteOutlined, FilePdfOutlined, ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
// import axios from "axios";
// import { useSelector } from "react-redux";
// import { motion } from "framer-motion";
// import { jsPDF } from "jspdf";

// const customStyles = `
//   .checklist-container {
//     min-height: 100vh;
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     padding: 1.5rem;
//     font-family: 'Cormorant Garamond', serif;
//   }

//   @media (max-width: 640px) {
//     .checklist-container {
//       padding: 1rem;
//     }
//   }

//   .checklist-glass-card {
//     background: rgba(255, 255, 255, 0.95);
//     border-radius: 1.5rem;
//     box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
//     backdrop-filter: blur(20px);
//     -webkit-backdrop-filter: blur(20px);
//     border: 1px solid rgba(255, 255, 255, 0.5);
//     overflow: hidden;
//   }

//   .checklist-header {
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     padding: 2rem;
//     position: relative;
//     overflow: hidden;
//   }

//   @media (max-width: 640px) {
//     .checklist-header {
//       padding: 1.5rem 1rem;
//     }
//   }

//   .checklist-header::before {
//     content: '';
//     position: absolute;
//     top: -50%;
//     right: -10%;
//     width: 300px;
//     height: 300px;
//     background: rgba(255, 255, 255, 0.1);
//     border-radius: 50%;
//     animation: float 6s ease-in-out infinite;
//   }

//   @keyframes float {
//     0%, 100% { transform: translateY(0px); }
//     50% { transform: translateY(-20px); }
//   }

//   .checklist-back-btn {
//     background: rgba(255, 255, 255, 0.2);
//     border: 1px solid rgba(255, 255, 255, 0.3);
//     color: white;
//     border-radius: 0.75rem;
//     font-weight: 600;
//     backdrop-filter: blur(10px);
//     transition: all 0.3s ease;
//     font-family: 'Cormorant Garamond', serif;
//     font-size: 16px;
//   }

//   .checklist-back-btn:hover {
//     background: rgba(255, 255, 255, 0.3) !important;
//     border-color: rgba(255, 255, 255, 0.5) !important;
//     color: white !important;
//     transform: translateX(-4px);
//   }

//   .checklist-main-heading {
//     color: white;
//     font-size: 2.5rem;
//     font-weight: 700;
//     text-align: center;
//     margin: 1.5rem 0 0 0;
//     text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
//     font-family: 'Cormorant Garamond', serif;
//     letter-spacing: 1px;
//   }

//   @media (max-width: 640px) {
//     .checklist-main-heading {
//       font-size: 1.75rem;
//       margin: 1rem 0 0 0;
//     }
//   }

//   .checklist-content {
//     padding: 2rem;
//   }

//   @media (max-width: 640px) {
//     .checklist-content {
//       padding: 1.25rem;
//     }
//   }

//   .checklist-search-input {
//     border-radius: 1rem;
//     border: 2px solid rgba(102, 126, 234, 0.2);
//     transition: all 0.3s ease;
//     margin-bottom: 1.5rem;
//     font-family: 'Cormorant Garamond', serif;
//     font-size: 16px;
//   }

//   .checklist-search-input:hover,
//   .checklist-search-input:focus,
//   .checklist-search-input input:focus {
//     border-color: #667eea !important;
//     box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
//   }

//   .checklist-btn-primary {
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     border: none;
//     border-radius: 0.75rem;
//     font-weight: 600;
//     box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
//     transition: all 0.3s ease;
//     font-family: 'Cormorant Garamond', serif;
//     font-size: 15px;
//   }

//   .checklist-btn-primary:hover {
//     background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%) !important;
//     transform: translateY(-2px);
//     box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
//   }

//   .checklist-add-btn {
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     border: none;
//     border-radius: 0.75rem;
//     font-weight: 600;
//     box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
//     transition: all 0.3s ease;
//     font-family: 'Cormorant Garamond', serif;
//     font-size: 15px;
//     height: auto;
//     padding: 0.5rem 1.25rem;
//   }

//   @media (max-width: 640px) {
//     .checklist-add-btn {
//       padding: 0.4rem 1rem;
//       font-size: 14px;
//     }
//   }

//   .checklist-add-btn:hover {
//     background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%) !important;
//     transform: translateY(-2px);
//     box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
//   }

//   .checklist-table .ant-table {
//     border-radius: 1rem;
//     overflow: hidden;
//     font-family: 'Cormorant Garamond', serif;
//   }

//   .checklist-table .ant-table-thead > tr > th {
//     background: linear-gradient(135deg, #f8f7ff 0%, #f3f1ff 100%);
//     color: #32255e;
//     font-weight: 700;
//     border: none;
//     font-size: 16px;
//     font-family: 'Cormorant Garamond', serif;
//     padding: 1rem;
//   }

//   @media (max-width: 640px) {
//     .checklist-table .ant-table-thead > tr > th {
//       font-size: 14px;
//       padding: 0.75rem 0.5rem;
//     }
//   }

//   .checklist-table .ant-table-tbody > tr {
//     transition: all 0.3s ease;
//   }

//   .checklist-table .ant-table-tbody > tr:hover > td {
//     background: linear-gradient(135deg, #faf8fe 0%, #f8f6ff 100%) !important;
//     transform: scale(1.01);
//   }

//   .checklist-table .ant-table-tbody > tr > td {
//     font-family: 'Cormorant Garamond', serif;
//     font-size: 15px;
//     padding: 1rem;
//   }

//   @media (max-width: 640px) {
//     .checklist-table .ant-table-tbody > tr > td {
//       font-size: 14px;
//       padding: 0.75rem 0.5rem;
//     }
//   }

//   .checklist-action-btn {
//     border-radius: 0.5rem;
//     transition: all 0.3s ease;
//     font-family: 'Cormorant Garamond', serif;
//   }

//   .checklist-action-btn:hover {
//     transform: scale(1.1);
//   }

//   .checklist-points-list {
//     margin: 0;
//     padding-left: 1.25rem;
//     font-family: 'Cormorant Garamond', serif;
//   }

//   .checklist-points-list li {
//     margin: 0.5rem 0;
//     line-height: 1.6;
//   }

//   @media (max-width: 640px) {
//     .checklist-points-list {
//       padding-left: 1rem;
//       font-size: 13px;
//     }
    
//     .checklist-points-list li {
//       margin: 0.4rem 0;
//     }
//   }

//   .checklist-heading-text {
//     font-weight: 700;
//     color: #32255e;
//     font-size: 16px;
//     font-family: 'Cormorant Garamond', serif;
//   }

//   @media (max-width: 640px) {
//     .checklist-heading-text {
//       font-size: 14px;
//     }
//   }

//   .ant-modal-content {
//     border-radius: 1rem;
//     font-family: 'Cormorant Garamond', serif;
//   }

//   .ant-modal-header {
//     border-radius: 1rem 1rem 0 0;
//   }

//   .checklist-modal-content {
//     max-height: 400px;
//     overflow-y: auto;
//     padding: 1rem 0;
//   }

//   .checklist-modal-list {
//     margin: 0;
//     padding-left: 1.5rem;
//     font-family: 'Cormorant Garamond', serif;
//     font-size: 16px;
//   }

//   .checklist-modal-list li {
//     margin: 0.75rem 0;
//     line-height: 1.8;
//     color: #32255e;
//   }

//   @media (max-width: 640px) {
//     .checklist-modal-list {
//       padding-left: 1.25rem;
//       font-size: 14px;
//     }
//   }

//   .ant-modal-title {
//     font-family: 'Cormorant Garamond', serif;
//     font-size: 1.5rem;
//     font-weight: 700;
//     color: #32255e;
//   }

//   @media (max-width: 640px) {
//     .ant-modal-title {
//       font-size: 1.25rem;
//     }
//   }

//   .ant-btn-primary.checklist-btn-primary {
//     height: auto;
//     padding: 0.5rem 1rem;
//   }

//   @media (max-width: 768px) {
//     .checklist-table .ant-table {
//       font-size: 13px;
//     }
    
//     .ant-space {
//       gap: 4px !important;
//     }
    
//     .ant-btn {
//       padding: 4px 8px;
//       font-size: 13px;
//     }
//   }

//   /* Mobile responsive table */
//   @media (max-width: 640px) {
//     .ant-table-wrapper {
//       overflow-x: auto;
//     }
//   }

//   .checklist-actions-wrapper {
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//     margin-bottom: 1.5rem;
//     gap: 1rem;
//   }

//   @media (max-width: 640px) {
//     .checklist-actions-wrapper {
//       flex-direction: column;
//       align-items: stretch;
//     }
//   }
// `;

// const ViewChecklist = () => {
//   const navigate = useNavigate();
//   const user = useSelector((state) => state.user.value);
//   const [checklists, setChecklists] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [searchText, setSearchText] = useState("");
//   const [pagination, setPagination] = useState({
//     current: 1,
//     pageSize: 10,
//     total: 0
//   });
//   const [modalVisible, setModalVisible] = useState(false);
//   const [selectedPoints, setSelectedPoints] = useState([]);
//   const [selectedHeading, setSelectedHeading] = useState("");

//   const config = {
//     headers: {
//       Authorization: user?.access_token,
//     },
//   };

//   const fetchChecklistData = async (page = 1, search = searchText) => {
//     setLoading(true);
//     try {
//       const res = await axios.get(
//         `${API_BASE_URL}checklist?page=${page}&search=${search}`,
//         config
//       );
//       setChecklists(res.data.items || []);
//       setPagination({
//         ...pagination,
//         current: res.data.currentPage,
//         total: res.data.totalItems
//       });
//     } catch (err) {
//       message.error("Failed to fetch checklists");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchChecklistData(1, searchText);
//   }, [searchText]);

//   const handleTableChange = (pagination) => {
//     fetchChecklistData(pagination.current, searchText);
//   };

//   const handleDelete = async (id) => {
//     try {
//       await axios.delete(`${API_BASE_URL}checklist/${id}`, config);
//       message.success("Checklist deleted successfully");
//       fetchChecklistData(pagination.current, searchText);
//     } catch (err) {
//       message.error("Failed to delete checklist");
//     }
//   };

//   const exportToPDF = (record) => {
//     const doc = new jsPDF();
//     const pageWidth = doc.internal.pageSize.getWidth();
    
//     // Add heading
//     doc.setFontSize(18);
//     doc.setFont(undefined, 'bold');
//     const headingWidth = doc.getStringUnitWidth(record.heading) * doc.internal.getFontSize() / doc.internal.scaleFactor;
//     const headingX = (pageWidth - headingWidth) / 2;
//     doc.text(record.heading, headingX, 20);

//     // Add points with checkboxes
//     doc.setFontSize(12);
//     doc.setFont(undefined, 'normal');
//     let y = 40;
//     record.points.forEach((point, index) => {
//       doc.rect(20, y - 4, 5, 5); // Checkbox
//       doc.text(point, 30, y);
//       y += 10;
//     });

//     // Save the PDF
//     doc.save(`${record.heading}-checklist.pdf`);
//   };

//   const handleReadMore = (points, heading) => {
//     setSelectedPoints(points);
//     setSelectedHeading(heading);
//     setModalVisible(true);
//   };

//   const columns = [
//     {
//       title: "Sl. No",
//       key: "index",
//       width: 80,
//       responsive: ['md'],
//       render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
//     },
//     {
//       title: "Heading",
//       dataIndex: "heading",
//       key: "heading",
//       render: (text) => (
//         <span className="checklist-heading-text">{text}</span>
//       ),
//     },
//     {
//       title: "Points",
//       dataIndex: "points",
//       key: "points",
//       render: (points, record) => (
//         <div>
//           <ul className="checklist-points-list">
//             {points.slice(0, 3).map((point, index) => (
//               <li key={index}>{point}</li>
//             ))}
//           </ul>
//           {points.length > 3 && (
//             <Button 
//               type="link" 
//               onClick={() => handleReadMore(points, record.heading)}
//               style={{ 
//                 padding: '0 0 0 1.25rem', 
//                 color: '#667eea', 
//                 fontWeight: 600,
//                 fontFamily: 'Cormorant Garamond, serif'
//               }}
//             >
//               Read More ({points.length - 3} more)
//             </Button>
//           )}
//         </div>
//       ),
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 220,
//       render: (_, record) => (
//         <Space size="small">
//           <Button
//             type="text"
//             icon={<EditOutlined />}
//             onClick={() => navigate(`/user/editchecklists/${record.id}`)}
//             className="checklist-action-btn"
//             title="Edit"
//           />
//           <Button
//             type="text"
//             danger
//             icon={<DeleteOutlined />}
//             onClick={() => Modal.confirm({
//               title: 'Delete Checklist',
//               content: 'Are you sure you want to delete this checklist?',
//               okButtonProps: { className: 'checklist-btn-primary' },
//               onOk: () => handleDelete(record.id)
//             })}
//             className="checklist-action-btn"
//             title="Delete"
//           />
//           <Button
//             type="primary"
//             icon={<FilePdfOutlined />}
//             onClick={() => exportToPDF(record)}
//             className="checklist-btn-primary"
//             size="small"
//             title="Export to PDF"
//           >
//             Export
//           </Button>
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div className="checklist-container">
//       <style>{customStyles}</style>
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         <Card className="checklist-glass-card" variant={false}>
//           <div className="checklist-header">
//             <Button
//               icon={<ArrowLeftOutlined />}
//               onClick={() => navigate(-1)}
//               className="checklist-back-btn"
//             >
//               Back
//             </Button>
//             <h1 className="checklist-main-heading">Checklist Points</h1>
//           </div>

//           <div className="checklist-content">
//             <div className="checklist-actions-wrapper">
//               <Input.Search
//                 placeholder="Search checklists..."
//                 className="checklist-search-input"
//                 allowClear
//                 onChange={(e) => setSearchText(e.target.value)}
//                 size="large"
//                 style={{ flex: 1 }}
//               />
//               <Button
//                 type="primary"
//                 icon={<PlusOutlined />}
//                 onClick={() => navigate("/user/addchecklists")}
//                 className="checklist-add-btn"
//               >
//                 Add Checklist
//               </Button>
//             </div>

//             <Table
//               columns={columns}
//               dataSource={checklists}
//               loading={loading}
//               pagination={pagination}
//               onChange={handleTableChange}
//               rowKey="id"
//               className="checklist-table"
//               scroll={{ x: 'max-content' }}
//             />
//           </div>
//         </Card>
//       </motion.div>

//       <Modal
//         title={selectedHeading}
//         open={modalVisible}
//         onCancel={() => setModalVisible(false)}
//         footer={[
//           <Button 
//             key="close" 
//             onClick={() => setModalVisible(false)}
//             className="checklist-btn-primary"
//           >
//             Close
//           </Button>
//         ]}
//         width={600}
//         centered
//       >
//         <div className="checklist-modal-content">
//           <ul className="checklist-modal-list">
//             {selectedPoints.map((point, index) => (
//               <li key={index}>{point}</li>
//             ))}
//           </ul>
//         </div>
//       </Modal>
//     </div>
//   );
// };

// export default ViewChecklist;
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import { message, Table, Button, Input, Card, Space, Modal } from "antd";
import { EditOutlined, DeleteOutlined, FilePdfOutlined, ArrowLeftOutlined, PlusOutlined, EyeOutlined, FileWordOutlined } from "@ant-design/icons";
import axios from "axios";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

const customStyles = `
  .checklist-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1.5rem;
    font-family: 'Cormorant Garamond', serif;
  }

  @media (max-width: 640px) {
    .checklist-container {
      padding: 1rem;
    }
  }

  .checklist-glass-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 1.5rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    overflow: hidden;
  }

  .checklist-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }

  @media (max-width: 640px) {
    .checklist-header {
      padding: 1.5rem 1rem;
    }
  }

  .checklist-header::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    animation: float 6s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  .checklist-back-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    border-radius: 0.75rem;
    font-weight: 600;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px;
  }

  .checklist-back-btn:hover {
    background: rgba(255, 255, 255, 0.3) !important;
    border-color: rgba(255, 255, 255, 0.5) !important;
    color: white !important;
    transform: translateX(-4px);
  }

  .checklist-main-heading {
    color: white;
    font-size: 2.5rem;
    font-weight: 700;
    text-align: center;
    margin: 1.5rem 0 0 0;
    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
    font-family: 'Cormorant Garamond', serif;
    letter-spacing: 1px;
  }

  @media (max-width: 640px) {
    .checklist-main-heading {
      font-size: 1.75rem;
      margin: 1rem 0 0 0;
    }
  }

  .checklist-content {
    padding: 2rem;
  }

  @media (max-width: 640px) {
    .checklist-content {
      padding: 1.25rem;
    }
  }

  .checklist-search-input {
    border-radius: 1rem;
    border: 2px solid rgba(102, 126, 234, 0.2);
    transition: all 0.3s ease;
    margin-bottom: 1.5rem;
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px;
  }

  .checklist-search-input:hover,
  .checklist-search-input:focus,
  .checklist-search-input input:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
  }

  .checklist-btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px;
  }

  .checklist-btn-primary:hover {
    background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
  }

  .checklist-add-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px;
    height: auto;
    padding: 0.5rem 1.25rem;
  }

  @media (max-width: 640px) {
    .checklist-add-btn {
      padding: 0.4rem 1rem;
      font-size: 14px;
    }
  }

  .checklist-add-btn:hover {
    background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
  }

  .checklist-table .ant-table {
    border-radius: 1rem;
    overflow: hidden;
    font-family: 'Cormorant Garamond', serif;
  }

  .checklist-table .ant-table-thead > tr > th {
    background: linear-gradient(135deg, #f8f7ff 0%, #f3f1ff 100%);
    color: #32255e;
    font-weight: 700;
    border: none;
    font-size: 16px;
    font-family: 'Cormorant Garamond', serif;
    padding: 1rem;
  }

  @media (max-width: 640px) {
    .checklist-table .ant-table-thead > tr > th {
      font-size: 14px;
      padding: 0.75rem 0.5rem;
    }
  }

  .checklist-table .ant-table-tbody > tr {
    transition: all 0.3s ease;
  }

  .checklist-table .ant-table-tbody > tr:hover > td {
    background: linear-gradient(135deg, #faf8fe 0%, #f8f6ff 100%) !important;
  }

  .checklist-table .ant-table-tbody > tr > td {
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px;
    padding: 1rem;
  }

  @media (max-width: 640px) {
    .checklist-table .ant-table-tbody > tr > td {
      font-size: 14px;
      padding: 0.75rem 0.5rem;
    }
  }

  .checklist-action-btn {
    border-radius: 0.5rem;
    transition: all 0.3s ease;
    font-family: 'Cormorant Garamond', serif;
  }

  .checklist-action-btn:hover {
    transform: scale(1.1);
  }

  .checklist-heading-text {
    font-weight: 700;
    color: #32255e;
    font-size: 16px;
    font-family: 'Cormorant Garamond', serif;
  }

  @media (max-width: 640px) {
    .checklist-heading-text {
      font-size: 14px;
    }
  }

  .ant-modal-content {
    border-radius: 1rem;
    font-family: 'Cormorant Garamond', serif;
  }

  .ant-modal-header {
    border-radius: 1rem 1rem 0 0;
  }

  .checklist-modal-content {
    padding: 1rem 0;
  }

  .ant-modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #32255e;
  }

  @media (max-width: 640px) {
    .ant-modal-title {
      font-size: 1.25rem;
    }
  }

  .ant-btn-primary.checklist-btn-primary {
    height: auto;
    padding: 0.5rem 1rem;
  }

  @media (max-width: 768px) {
    .checklist-table .ant-table {
      font-size: 13px;
    }
    
    .ant-space {
      gap: 4px !important;
    }
    
    .ant-btn {
      padding: 4px 8px;
      font-size: 13px;
    }
  }

  @media (max-width: 640px) {
    .ant-table-wrapper {
      overflow-x: auto;
    }
  }

  .checklist-actions-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  @media (max-width: 640px) {
    .checklist-actions-wrapper {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .modal-header-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: linear-gradient(135deg, #f8f7ff 0%, #f3f1ff 100%);
    border-radius: 0.75rem;
  }

  .modal-header-item {
    font-size: 16px;
    margin-bottom: 0.5rem;
    color: #32255e;
  }

  .modal-header-label {
    font-weight: 700;
    margin-right: 0.5rem;
  }

  .points-modal-table .ant-table {
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .points-modal-table .ant-table-thead > tr > th {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 700;
    font-family: 'Cormorant Garamond', serif;
  }

  .points-modal-table .ant-table-tbody > tr > td {
    font-family: 'Cormorant Garamond', serif;
  }
`;

const ViewChecklist = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const config = {
    headers: {
      Authorization: user?.access_token,
    },
  };

  const fetchChecklistData = async (page = 1, search = searchText) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}checklist?page=${page}&search=${search}`,
        config
      );
      setChecklists(res.data.items || []);
      setPagination({
        ...pagination,
        current: res.data.currentPage,
        total: res.data.totalItems
      });
    } catch (err) {
      message.error("Failed to fetch checklists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklistData(1, searchText);
  }, [searchText]);

  const handleTableChange = (pagination) => {
    fetchChecklistData(pagination.current, searchText);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}checklist/${id}`, config);
      message.success("Checklist deleted successfully");
      fetchChecklistData(pagination.current, searchText);
    } catch (err) {
      message.error("Failed to delete checklist");
    }
  };

  const handleViewPoints = (record) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const exportToPDF = (record) => {
    const doc = new jsPDF();
    
    // Add heading
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(record.heading, 14, 20);
    
    // Add event reference if exists
    let yPosition = 30;
    if (record.eventReference) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Event Reference: ${record.eventReference}`, 14, yPosition);
      yPosition += 8;
    }
    
    // Add department if exists
    if (record.department?.name) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Department: ${record.department.name}`, 14, yPosition);
      yPosition += 10;
    }

    // Prepare table data
    const tableData = record.points.map((point, index) => [
      index + 1,
      point.checklistPoint || '-',
      point.units || '-',
      point.length || '-',
      point.breadth || '-',
      point.depth || '-',
      point.quantity || '-',
      point.numbers || '-',
      point.rate || '-'
    ]);

    // Add table using autoTable
    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Checkpoint', 'Units', 'Length', 'Breadth', 'Depth', 'Quantity', 'Numbers', 'Rate']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [102, 126, 234],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 35 }
      }
    });

    doc.save(`${record.heading}-checklist.pdf`);
    message.success('PDF exported successfully');
  };

  const exportToDOCX = (record) => {
    let htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #667eea; margin-bottom: 10px; }
            .metadata { margin-bottom: 20px; font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #667eea; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8f7ff; }
          </style>
        </head>
        <body>
          <h1>${record.heading}</h1>
          <div class="metadata">
            ${record.eventReference ? `<p><strong>Event Reference:</strong> ${record.eventReference}</p>` : ''}
            ${record.department?.name ? `<p><strong>Department:</strong> ${record.department.name}</p>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Checkpoint</th>
                <th>Units</th>
                <th>Length</th>
                <th>Breadth</th>
                <th>Depth</th>
                <th>Quantity</th>
                <th>Numbers</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
    `;

    record.points.forEach((point, index) => {
      htmlContent += `
        <tr>
          <td>${index + 1}</td>
          <td>${point.checklistPoint || '-'}</td>
          <td>${point.units || '-'}</td>
          <td>${point.length || '-'}</td>
          <td>${point.breadth || '-'}</td>
          <td>${point.depth || '-'}</td>
          <td>${point.quantity || '-'}</td>
          <td>${point.numbers || '-'}</td>
          <td>${point.rate || '-'}</td>
        </tr>
      `;
    });

    htmlContent += `
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.heading}-checklist.doc`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('DOCX exported successfully');
  };

  const pointsColumns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Checkpoint',
      dataIndex: 'checklistPoint',
      key: 'checklistPoint',
      render: (text) => text || '-',
    },
    {
      title: 'Units',
      dataIndex: 'units',
      key: 'units',
      width: 80,
      render: (text) => text || '-',
    },
    {
      title: 'Length',
      dataIndex: 'length',
      key: 'length',
      width: 80,
      render: (text) => text || '-',
    },
    {
      title: 'Breadth',
      dataIndex: 'breadth',
      key: 'breadth',
      width: 80,
      render: (text) => text || '-',
    },
    {
      title: 'Depth',
      dataIndex: 'depth',
      key: 'depth',
      width: 80,
      render: (text) => text || '-',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (text) => text ?? '-',
    },
    {
      title: 'Numbers',
      dataIndex: 'numbers',
      key: 'numbers',
      width: 80,
      render: (text) => text ?? '-',
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      width: 80,
      render: (text) => text ?? '-',
    },
  ];

  const columns = [
    {
      title: "Sl. No",
      key: "index",
      width: 80,
      responsive: ['md'],
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Heading",
      dataIndex: "heading",
      key: "heading",
      render: (text) => (
        <span className="checklist-heading-text">{text}</span>
      ),
    },
    {
      title: "Event Reference",
      dataIndex: "eventReference",
      key: "eventReference",
      render: (text) => text || '-',
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (dept) => dept?.name || '-',
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewPoints(record)}
            className="checklist-action-btn"
            title="View Points"
            style={{ color: '#667eea' }}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(`/user/editchecklists/${record.id}`)}
            className="checklist-action-btn"
            title="Edit"
          />
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={() => exportToPDF(record)}
            className="checklist-btn-primary"
            size="small"
            title="Export to PDF"
          >
            PDF
          </Button>
          <Button
            type="primary"
            icon={<FileWordOutlined />}
            onClick={() => exportToDOCX(record)}
            className="checklist-btn-primary"
            size="small"
            title="Export to DOCX"
          >
            DOCX
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => Modal.confirm({
              title: 'Delete Checklist',
              content: 'Are you sure you want to delete this checklist?',
              okButtonProps: { className: 'checklist-btn-primary' },
              onOk: () => handleDelete(record.id)
            })}
            className="checklist-action-btn"
            title="Delete"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="checklist-container">
      <style>{customStyles}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="checklist-glass-card" variant={false}>
          <div className="checklist-header">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              className="checklist-back-btn"
            >
              Back
            </Button>
            <h1 className="checklist-main-heading">Checklist Management</h1>
          </div>

          <div className="checklist-content">
            <div className="checklist-actions-wrapper">
              <Input.Search
                placeholder="Search checklists..."
                className="checklist-search-input"
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
                size="large"
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/user/addchecklists")}
                className="checklist-add-btn"
              >
                Add Checklist
              </Button>
            </div>

            <Table
              columns={columns}
              dataSource={checklists}
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
              rowKey="id"
              className="checklist-table"
              scroll={{ x: 'max-content' }}
            />
          </div>
        </Card>
      </motion.div>

      <Modal
        title="Checklist Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button 
            key="close" 
            onClick={() => setModalVisible(false)}
            className="checklist-btn-primary"
          >
            Close
          </Button>
        ]}
        width={1000}
        centered
      >
        {selectedRecord && (
          <div className="checklist-modal-content">
            <div className="modal-header-section">
              <div className="modal-header-item">
                <span className="modal-header-label">Heading:</span>
                {selectedRecord.heading}
              </div>
              {selectedRecord.eventReference && (
                <div className="modal-header-item">
                  <span className="modal-header-label">Event Reference:</span>
                  {selectedRecord.eventReference}
                </div>
              )}
              {selectedRecord.department?.name && (
                <div className="modal-header-item">
                  <span className="modal-header-label">Department:</span>
                  {selectedRecord.department.name}
                </div>
              )}
            </div>
            
            <Table
              columns={pointsColumns}
              dataSource={selectedRecord.points}
              pagination={false}
              rowKey={(record, index) => index}
              className="points-modal-table"
              scroll={{ x: 'max-content' }}
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViewChecklist;