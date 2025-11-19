/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Button, Card, Table, message, Modal, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useSelector } from "react-redux";

const customStyles = `
  .glass-card {
    background: rgba(255, 255, 255, 0.75);
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.35);
  }

  .gradient-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 1.5rem;
    box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
  }

  .table-wrapper .ant-table {
    background: transparent;
    font-family: 'cormoreg', sans-serif;
  }

  .table-wrapper .ant-table-thead > tr > th {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    border: none;
    font-size: 16px;
    padding: 16px;
  }

  .table-wrapper .ant-table-tbody > tr > td {
    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
    padding: 16px;
    font-size: 15px;
  }

  .table-wrapper .ant-table-tbody > tr:hover > td {
    background: rgba(102, 126, 234, 0.05);
  }

  .table-wrapper .ant-table-container {
    border-radius: 1rem;
    overflow: hidden;
  }

  .table-wrapper .ant-pagination-item-active {
    border-color: #667eea;
    background: #667eea;
  }

  .table-wrapper .ant-pagination-item-active a {
    color: white;
  }

  .overdue-row {
    background-color: rgba(239, 68, 68, 0.1) !important;
  }

  .paid-row {
    background-color: rgba(34, 197, 94, 0.1) !important;
  }

  .slide-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 50%;
    height: 100vh;
    background: white;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    overflow-y: auto;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .float-animation {
    animation: float 3s ease-in-out infinite;
  }
`;

const ViewBill = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEmiStatus, setSelectedEmiStatus] = useState([]);
  const [selectedBillName, setSelectedBillName] = useState("");

  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);

  const fetchBills = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}bills`);
      setBills(res.data || []);
      setFilteredBills(res.data || []);
    } catch (err) {
      message.error("Failed to fetch bills");
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const openEmiStatusModal = (emiStatus, billName) => {
    setSelectedEmiStatus(emiStatus);
    setSelectedBillName(billName);
    setShowStatusModal(true);
  };

  const getCurrentMonthYear = () => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  };

  const isPaid = (bill) => {
    const { month, year } = getCurrentMonthYear();
    const status = bill.emiStatus?.find(
      (s) => s.month === month && s.year === year
    );
    return status?.paid || false;
  };

  const isOverdue = (bill) => {
    if (isPaid(bill)) return false;

    const now = new Date();
    const emiDate = new Date(bill.emiDate);
    const currentMonthEmiDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      emiDate.getDate()
    );

    return now > currentMonthEmiDate;
  };

  const handlePayEMI = async (bill) => {
    Modal.confirm({
      title: "Pay EMI",
      content: `Are you sure you want to pay ₹${bill.amount.toLocaleString()} for ${
        bill.name
      }?`,
      okText: "Pay",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          // PUT request to update bill as paid for current month internally on the server
          await axios.put(`${API_BASE_URL}bills/${bill._id}`, {
            name: bill.name,
            emiDate: bill.emiDate,
            amount: bill.amount,
            paid: true, // just setting "paid": true, no month/year in payload
          });
          message.success("EMI paid successfully");
          // Re-fetch updated bills after successful payment
          fetchBills();
        } catch (error) {
          message.error("Failed to pay EMI");
        }
      },
    });
  };

  const handlePayEMIForMonth = async (bill, month, year) => {
    Modal.confirm({
      title: `Pay EMI for ${month}/${year}`,
      content: `Are you sure you want to pay ₹${bill.amount.toLocaleString()} for ${
        bill.name
      } for ${month}/${year}?`,
      okText: "Pay",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          // Send PUT request with additional month and year info to mark paid for specific month
          await axios.put(`${API_BASE_URL}bills/${bill._id}`, {
            name: bill.name,
            emiDate: bill.emiDate,
            amount: bill.amount,
            paid: true,
            month,
            year,
          });
          message.success(`EMI paid successfully for ${month}/${year}`);
          fetchBills();
        } catch (error) {
          message.error("Failed to pay EMI");
        }
      },
    });
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete Bill",
      content: "Are you sure you want to delete this bill?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE_URL}bills/${id}`);
          message.success("Bill deleted successfully");
          fetchBills();
        } catch (err) {
          message.error("Failed to delete bill");
        }
      },
    });
  };

  const getBasePath = () => {
    if (user?.role === "APPROVER") return "/approver";
    if (user?.role === "OWNER") return "/owner";
    return "/user";
  };

  const handleAddBillClick = () => {
    const basePath = getBasePath();
    navigate(`${basePath}/addbill`);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = bills.filter((bill) =>
      bill.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredBills(filtered);
  };

  const mainColumns = [
    {
      title: "Bill Name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span className="font-semibold text-gray-800">{text}</span>
      ),
    },
    {
      title: "EMI Date",
      dataIndex: "emiDate",
      key: "emiDate",
      render: (date) => (
        <span className="text-gray-700">
          {new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amt) => (
        <span className="font-semibold text-indigo-600 text-lg">
          ₹{amt.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const paid = isPaid(record);
        const overdue = isOverdue(record);

        return (
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              paid
                ? "bg-green-100 text-green-700"
                : overdue
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {paid ? "Paid" : overdue ? "Overdue" : "Pending"}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        // Get current month/year
        const { month: currentMonth, year: currentYear } =
          getCurrentMonthYear();

        // Find unpaid months starting from current month onwards
        const monthsToPay = [];

        // To handle payments for next unpaid months, assume max 2 months for demo
        for (let i = 0; i < 2; i++) {
          let monthToCheck = currentMonth + i;
          let yearToCheck = currentYear;
          if (monthToCheck > 12) {
            monthToCheck = monthToCheck - 12;
            yearToCheck = yearToCheck + 1;
          }
          const status = record.emiStatus?.find(
            (s) => s.month === monthToCheck && s.year === yearToCheck
          );
          if (!status || !status.paid) {
            monthsToPay.push({ month: monthToCheck, year: yearToCheck });
          }
        }

        return (
          <div className="flex gap-2 items-center">
            {/* Eye button to show emiStatus */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => openEmiStatusModal(record.emiStatus, record.name)}
              className="px-3 py-1 rounded-lg bg-blue-500 text-white font-semibold shadow-md"
              title="View EMI Status"
            >
              👁️
            </motion.button>

            {/* Render Pay EMI buttons for unpaid months */}
            {monthsToPay.map(({ month, year }) => (
              <motion.button
                key={`${record._id}-${month}-${year}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePayEMIForMonth(record, month, year)}
                className="px-4 py-2 rounded-lg font-semibold shadow-md text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg"
              >
                Pay EMI ({month}/{year})
              </motion.button>
            ))}

            {/* If all months paid */}
            {monthsToPay.length === 0 && (
              <span className="px-3 py-1 rounded-full bg-gray-300 text-gray-600 font-semibold cursor-not-allowed">
                Paid
              </span>
            )}
          </div>
        );
      },
    },

    // {
    //   title: "Actions",
    //   key: "actions",
    //   render: (_, record) => {
    //     const paid = isPaid(record);

    //     return (
    //       <motion.button
    //         whileHover={{ scale: 1.05 }}
    //         whileTap={{ scale: 0.95 }}
    //         onClick={() => handlePayEMI(record)}
    //         disabled={paid}
    //         className={`px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-300 ${
    //           paid
    //             ? "bg-gray-300 text-gray-500 cursor-not-allowed"
    //             : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg"
    //         }`}
    //       >
    //         {paid ? "Paid" : "Pay EMI"}
    //       </motion.button>
    //     );
    //   },
    // },
  ];

  const modalColumns = [
    {
      title: "Bill Name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span className="font-semibold text-gray-800">{text}</span>
      ),
    },
    {
      title: "EMI Date",
      dataIndex: "emiDate",
      key: "emiDate",
      render: (date) => (
        <span className="text-gray-700">
          {new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amt) => (
        <span className="font-semibold text-indigo-600 text-lg">
          ₹{amt.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowEditModal(false);
              navigate(`${getBasePath()}/editbill/${record._id}`);
            }}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
          >
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleDelete(record._id)}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
          >
            Delete
          </motion.button>
        </div>
      ),
    },
  ];

  const totalAmount = bills.reduce((sum, bill) => sum + (bill.amount || 0), 0);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative font-[cormoreg]">
      <style>{customStyles}</style>

      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            `radial-gradient(circle at 15% 85%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),` +
            `radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),` +
            `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/user")}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-semibold text-indigo-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </motion.button>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          >
            Bills & EMI's
          </motion.h1>

          <div className="w-24" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="gradient-card p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">
                  Total EMI's / Bills
                </p>
                <p className="text-4xl font-bold">{bills.length}</p>
              </div>
              <div className="float-animation">
                <svg
                  className="w-16 h-16 text-white/30"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Total Amount
                </p>
                <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ₹{totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="float-animation">
                <svg
                  className="w-16 h-16 text-indigo-200"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex justify-end gap-4 mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Bills
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddBillClick}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Bills
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="glass-card p-6 table-wrapper"
        >
          <Table
            columns={mainColumns}
            dataSource={bills.map((bill) => ({ ...bill, key: bill._id }))}
            rowClassName={(record) =>
              isPaid(record)
                ? "paid-row"
                : isOverdue(record)
                ? "overdue-row"
                : ""
            }
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} bills`,
            }}
            bordered={false}
            size="middle"
          />
        </motion.div>
      </div>
      <Modal
        title={`EMI Status for ${selectedBillName}`}
        open={showStatusModal}
        onCancel={() => setShowStatusModal(false)}
        footer={null}
      >
        <Table
          dataSource={selectedEmiStatus.map((status, idx) => ({
            key: idx,
            monthYear: `${status.month}/${status.year}`,
            amount: status.amount,
            paid: status.paid ? "Paid" : "Pending",
          }))}
          columns={[
            {
              title: "Month/Year",
              dataIndex: "monthYear",
              key: "monthYear",
            },
            {
              title: "Amount",
              dataIndex: "amount",
              key: "amount",
              render: (amt) => `₹${amt?.toLocaleString() || 0}`,
            },
            {
              title: "Payment Status",
              dataIndex: "paid",
              key: "paid",
              render: (status) => (
                <span
                  className={`px-2 py-1 rounded-full font-semibold ${
                    status === "Paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {status}
                </span>
              ),
            },
          ]}
          pagination={false}
          size="small"
        />
      </Modal>

      <AnimatePresence>
        {showEditModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay"
              onClick={() => setShowEditModal(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="slide-modal"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Edit Bills
                  </h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <Input
                  placeholder="Search bills..."
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  prefix={
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  }
                  className="mb-4"
                  size="large"
                />

                <div className="table-wrapper">
                  <Table
                    columns={modalColumns}
                    dataSource={filteredBills.map((bill) => ({
                      ...bill,
                      key: bill._id,
                    }))}
                    pagination={{
                      pageSize: 8,
                      showSizeChanger: false,
                    }}
                    bordered={false}
                    size="middle"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewBill;
