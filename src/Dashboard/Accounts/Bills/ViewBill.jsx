/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { Button, Card, Table, message, Modal, Input, Tabs, Drawer, Select } from "antd";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useSelector } from "react-redux";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

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

  .fc {
    font-family: 'cormoreg', sans-serif;
  }
  
  .fc .fc-toolbar-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
  }
  
  .fc-theme-standard td, .fc-theme-standard th {
    border-color: #e5e7eb;
  }
  
  .fc-theme-standard .fc-scrollgrid {
    border-color: #e5e7eb;
  }
  
  .fc .fc-daygrid-day-number {
    padding: 8px;
    font-weight: 600;
    color: #374151;
  }
  
  .fc .fc-daygrid-day.fc-day-today {
    background-color: #dbeafe !important;
  }
  
  .fc .fc-col-header-cell {
    background-color: #f9fafb;
    font-weight: 600;
    color: #4b5563;
    padding: 12px 0;
  }
  
  .fc-event {
    cursor: pointer;
    margin: 2px 0;
    border-radius: 6px;
    border-width: 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    opacity: 1 !important;
  }
  
  .fc-event:hover {
    opacity: 0.95 !important;
    transform: translateY(-1px);
    transition: all 0.2s;
    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
  }
  
  .fc-event-main {
    opacity: 1 !important;
  }
  
  .fc-daygrid-event {
    opacity: 1 !important;
  }
  
  .fc .fc-button {
    background-color: #667eea;
    border-color: #667eea;
    text-transform: capitalize;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px;
  }
  
  .fc .fc-button:hover {
    background-color: #5568d3;
    border-color: #5568d3;
  }
  
  .fc .fc-button-primary:disabled {
    background-color: #9ca3af;
    border-color: #9ca3af;
  }
  
  .fc-daygrid-event {
    white-space: normal !important;
    overflow: visible !important;
  }
  
  .fc-daygrid-day-frame {
    min-height: 120px !important;
  }
  
  .fc-daygrid-day-events {
    margin-bottom: 0 !important;
  }
  
  .fc-event-main {
    overflow: visible !important;
  }
  
  .fc-daygrid-event-harness {
    margin-bottom: 3px !important;
  }
`;

const getDueDaysInfo = (emiDate) => {
  const now = new Date();
  const emiDay = new Date(emiDate).getDate();
  const dueDate = new Date(now.getFullYear(), now.getMonth(), emiDay);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (today > dueDate) {
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    return {
      type: "overdue",
      label: `Due since ${daysOverdue} day${daysOverdue > 1 ? "s" : ""}`,
    };
  } else if (today < dueDate) {
    const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return {
      type: "upcoming",
      label: `Due in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""}`,
    };
  } else {
    return { type: "today", label: "Due today" };
  }
};

const ViewBill = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [emiTypes, setEmiTypes] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEmiStatus, setSelectedEmiStatus] = useState([]);
  const [selectedBillName, setSelectedBillName] = useState("");
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [selectedBillEmiDate, setSelectedBillEmiDate] = useState(null);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payRemarks, setPayRemarks] = useState("");
  const [payMode, setPayMode] = useState("Cash");
  const [payLoading, setPayLoading] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list" or "calendar"
  const calendarRef = useRef(null);

  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);

  const fetchBills = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}bills`);
      setBills(res.data || []);
      setFilteredBills(res.data || []);
      // Extract unique emi types for tabs
      const types = Array.from(
        new Set((res.data || []).map((b) => b.emiType || "Other"))
      );
      setEmiTypes(types);
    } catch (err) {
      message.error("Failed to fetch bills");
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    if (activeTab === "ALL") {
      setFilteredBills(
        bills.filter((bill) =>
          bill.name.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    } else {
      setFilteredBills(
        bills.filter(
          (bill) =>
            bill.emiType === activeTab &&
            bill.name.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
  }, [activeTab, bills, searchText]);

  const getMonthName = (monthNumber) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[monthNumber - 1] || "";
  };

  const generateAllMonths = (bill) => {
    if (!bill.createdAt && (!bill.emiStatus || bill.emiStatus.length === 0)) {
      return [];
    }

    const startDate = bill.createdAt
      ? new Date(bill.createdAt)
      : new Date(bill.emiStatus[0].year, bill.emiStatus[0].month - 1, 1);
    const now = new Date();
    const months = [];
    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 12, 1); // Show up to 12 months ahead

    while (currentDate <= endDate) {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const existingStatus = bill.emiStatus?.find(
        (s) => s.month === month && s.year === year
      );

      months.push({
        month,
        year,
        paid: existingStatus?.paid || false,
        amount: existingStatus?.amount || bill.amount,
        remarks: existingStatus?.remarks || undefined,
        paymentMode: existingStatus?.paymentMode || undefined,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months;
  };

  const openEmiStatusModal = (bill) => {
    setSelectedEmiStatus(generateAllMonths(bill));
    setSelectedBillName(bill.name);
    setSelectedBillId(bill._id || null);
    setSelectedBillEmiDate(bill.emiDate || null);
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

  // Open pay modal to collect remarks and confirm payment
  const openPayModal = (billId, billName, amount, month, year, emiDate) => {
    setPayTarget({ billId, billName, amount, month, year, emiDate });
    setPayRemarks("");
    setPayMode("Cash");
    setPayModalVisible(true);
  };

  const confirmPayEMI = async () => {
    if (!payTarget || !payTarget.billId) return;
    const { billId, billName, amount, month, year } = payTarget;
    const monthName = getMonthName(month);

    setPayLoading(true);
    try {
      const config = { headers: { Authorization: user?.access_token } };
      await axios.put(`${API_BASE_URL}bills/${billId}`, {
        name: billName,
        emiDate: payTarget.emiDate || undefined,
        amount,
        paid: true,
        month,
        year,
        remarks: payRemarks || undefined,
        paymentMode: payMode || undefined,
      }, config);

      message.success(`EMI paid successfully for ${monthName} ${year}`);
      // Update drawer state immediately if open (include remarks & paymentMode)
      setSelectedEmiStatus((prev) => prev.map((s) => (s.month === month && s.year === year ? { ...s, paid: true, remarks: payRemarks || s.remarks, paymentMode: payMode || s.paymentMode } : s)));
      setPayModalVisible(false);
      setPayTarget(null);
      setPayRemarks("");
      setPayMode("Cash");
      fetchBills();
    } catch (error) {
      console.error(error);
      message.error("Failed to pay EMI");
    } finally {
      setPayLoading(false);
    }
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

  const emiTypeTabs = [
    { key: "ALL", label: "All" },
    ...emiTypes.map((type) => ({
      key: type,
      label: type,
    })),
  ];

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
      title: "EMI Type",
      dataIndex: "emiType",
      key: "emiType",
      render: (text) => (
        <span className="text-indigo-700 font-semibold">{text}</span>
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
        const dueDaysInfo = paid
          ? { label: "Paid", type: "paid" }
          : getDueDaysInfo(record.emiDate);

        return (
          <div>
            <span
              className={`mr-2 px-3 py-1 rounded-full text-sm font-semibold ${
                paid
                  ? "bg-green-100 text-green-700"
                  : overdue
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {paid ? "Paid" : overdue ? "Overdue" : "Pending"}
            </span>
            <span className="ml-2 text-gray-600 italic">
              {paid ? "" : dueDaysInfo.label}
            </span>
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const { month: currentMonth, year: currentYear } =
          getCurrentMonthYear();
        const currentStatus = record.emiStatus?.find(
          (s) => s.month === currentMonth && s.year === currentYear
        );
        const isCurrentMonthPaid = currentStatus?.paid || false;

        return (
          <div className="flex gap-2 items-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => openEmiStatusModal(record)}
              className="px-3 py-1 rounded-lg bg-blue-500 text-white font-semibold shadow-md hover:bg-blue-600 transition-colors"
              title="View EMI Status"
            >
              👁️
            </motion.button>
            {!isCurrentMonthPaid ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openPayModal(record._id, record.name, record.amount, currentMonth, currentYear, record.emiDate)}
                className="px-4 py-2 rounded-lg font-semibold shadow-md text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg transition-all"
              >
                Pay EMI ({currentMonth}/{currentYear})
              </motion.button>
            ) : (
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
                Paid
              </span>
            )}
          </div>
        );
      },
    },
  ];

  const totalAmount = bills.reduce((sum, bill) => sum + (bill.amount || 0), 0);

  // Organize bills by month for calendar view
  const organizeBillsByMonth = () => {
    const monthMap = new Map();
    const now = new Date();

    // Use filteredBills to respect search and tab filters
    filteredBills.forEach((bill) => {
      if (!bill.createdAt && (!bill.emiStatus || bill.emiStatus.length === 0)) {
        return;
      }

      const startDate = bill.createdAt
        ? new Date(bill.createdAt)
        : new Date(bill.emiStatus[0].year, bill.emiStatus[0].month - 1, 1);
      
      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 12, 1);

      while (currentDate <= endDate) {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const monthKey = `${year}-${month}`;
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, {
            month,
            year,
            bills: [],
          });
        }

        const existingStatus = bill.emiStatus?.find(
          (s) => s.month === month && s.year === year
        );

        const emiData = {
          billId: bill._id,
          billName: bill.name,
          emiType: bill.emiType,
          amount: existingStatus?.amount || bill.amount,
          paid: existingStatus?.paid || false,
          emiDate: bill.emiDate,
          dueDaysInfo: getDueDaysInfoForMonth(bill, month, year),
        };

        monthMap.get(monthKey).bills.push(emiData);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    });

    // Convert to array and sort by year, month, filter out empty months
    return Array.from(monthMap.values())
      .filter((monthData) => monthData.bills.length > 0)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
  };

  const getDueDaysInfoForMonth = (bill, month, year) => {
    const now = new Date();
    const emiDate = new Date(bill.emiDate);
    const dueDate = new Date(year, month - 1, emiDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthDate = new Date(year, month - 1, 1);

    if (monthDate > now) {
      const daysUntil = Math.ceil((monthDate - today) / (1000 * 60 * 60 * 24));
      return { type: "upcoming", label: `Due in ${daysUntil} days`, days: daysUntil };
    }

    if (today > dueDate) {
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      return { type: "overdue", label: `Overdue by ${daysOverdue} days`, days: daysOverdue };
    } else if (today < dueDate) {
      const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return { type: "upcoming", label: `Due in ${daysRemaining} days`, days: daysRemaining };
    } else {
      return { type: "today", label: "Due today", days: 0 };
    }
  };

  // Helper function to format date as YYYY-MM-DD without timezone conversion
  const formatDateForCalendar = (year, month, day) => {
    const monthStr = String(month).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${monthStr}-${dayStr}`;
  };

  // Convert bills to calendar events for FullCalendar
  const getCalendarEvents = () => {
    const calendarEvents = [];
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 12, 1);

    filteredBills.forEach((bill) => {
      if (!bill.emiDate) return;

      const emiDate = new Date(bill.emiDate);
      const dueDay = emiDate.getDate();
      
      // Generate events from bill creation date to 12 months ahead
      const startDate = bill.createdAt
        ? new Date(bill.createdAt)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Start from the first month after creation, or current month
      let currentMonth = startDate.getMonth();
      let currentYear = startDate.getFullYear();
      
      // If we're starting from creation date, use that month
      if (bill.createdAt) {
        currentMonth = startDate.getMonth();
        currentYear = startDate.getFullYear();
      } else {
        currentMonth = now.getMonth();
        currentYear = now.getFullYear();
      }
      
      const endMonth = endDate.getMonth();
      const endYear = endDate.getFullYear();
      
      while (
        currentYear < endYear ||
        (currentYear === endYear && currentMonth <= endMonth)
      ) {
        const month = currentMonth + 1;
        const year = currentYear;
        
        // Handle cases where the day doesn't exist in the month (e.g., Feb 30)
        const daysInMonth = new Date(year, month, 0).getDate();
        const actualDay = Math.min(dueDay, daysInMonth);
        
        // Skip if the date is before creation
        const eventDate = new Date(year, currentMonth, actualDay);
        if (bill.createdAt && eventDate < new Date(bill.createdAt)) {
          currentMonth++;
          if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
          }
          continue;
        }

        const existingStatus = bill.emiStatus?.find(
          (s) => s.month === month && s.year === year
        );
        
        const isPaid = existingStatus?.paid || false;
        const amount = existingStatus?.amount || bill.amount;
        
        // Determine color based on status
        let backgroundColor = "#f59e0b"; // yellow for pending
        if (isPaid) {
          backgroundColor = "#10b981"; // green for paid
        } else {
          const dueDate = new Date(year, currentMonth, actualDay);
          if (now > dueDate) {
            backgroundColor = "#ef4444"; // red for overdue
          }
        }

        // Format date string without timezone conversion
        const dateString = formatDateForCalendar(year, month, actualDay);

        calendarEvents.push({
          id: `${bill._id}-${year}-${month}`,
          title: `${bill.name} - ₹${amount.toLocaleString()}`,
          start: dateString,
          allDay: true,
          backgroundColor: backgroundColor,
          borderColor: backgroundColor,
          textColor: "#ffffff",
          extendedProps: {
            billId: bill._id,
            billName: bill.name,
            emiType: bill.emiType,
            amount: amount,
            paid: isPaid,
            month: month,
            year: year,
          },
        });

        // Move to next month
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }
    });

    return calendarEvents;
  };

  // Render event content for calendar
  const renderEventContent = (eventInfo) => {
    const { billName, amount, paid } = eventInfo.event.extendedProps || {};
    return (
      <div className="p-1 text-xs overflow-hidden">
        <div className="font-semibold truncate text-white mb-0.5">
          {billName}
        </div>
        <div className="text-white opacity-90">
          ₹{amount?.toLocaleString() || 0}
        </div>
        <div className="text-white opacity-80 text-[10px]">
          {paid ? "✓ Paid" : "Pending"}
        </div>
      </div>
    );
  };

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
                <p className="text-4xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
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
          className="glass-card p-6"
        >
          <Tabs
            activeKey={viewMode}
            onChange={setViewMode}
            type="line"
            items={[
              {
                key: "calendar",
                label: (
                  <span className="flex items-center gap-2 font-semibold">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Calendar View
                  </span>
                ),
                children: (
                  <div className="mt-6">
                    {filteredBills.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>No EMI records found</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl overflow-hidden">
                        <FullCalendar
                          ref={calendarRef}
                          plugins={[dayGridPlugin, interactionPlugin]}
                          initialView="dayGridMonth"
                          headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "dayGridMonth",
                          }}
                          events={getCalendarEvents()}
                          eventContent={renderEventContent}
                          height="auto"
                          dayMaxEvents={false}
                          eventMaxStack={10}
                          eventDidMount={(info) => {
                            try {
                              const {
                                billId,
                                billName,
                                emiType,
                                amount,
                                paid,
                                month,
                                year,
                              } = info.event.extendedProps;

                              const bill = bills.find((b) => b._id === billId);
                              if (!bill) return;

                              let tooltip = `${billName}\nType: ${emiType}\nAmount: ₹${amount.toLocaleString()}\nStatus: ${paid ? "Paid" : "Pending"}`;
                              
                              if (!paid) {
                                const dueDaysInfo = getDueDaysInfoForMonth(bill, month, year);
                                tooltip += `\n${dueDaysInfo.label}`;
                              }

                              info.el.setAttribute("title", tooltip);
                              info.el.style.cursor = "pointer";
                              
                              info.el.addEventListener("click", () => {
                                openEmiStatusModal(bill);
                              });
                            } catch (error) {
                              console.error("Error mounting event:", error);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: "list",
                label: (
                  <span className="flex items-center gap-2 font-semibold">
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
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    List View
                  </span>
                ),
                children: (
                  <div className="table-wrapper mt-6">
                    <Tabs
                      activeKey={activeTab}
                      onChange={setActiveTab}
                      type="card"
                      items={emiTypeTabs.map((tab) => ({
                        key: tab.key,
                        label: (
                          <span
                            className={
                              tab.key === activeTab
                                ? "font-bold text-indigo-700"
                                : "font-semibold text-gray-800"
                            }
                          >
                            {tab.label}
                          </span>
                        ),
                      }))}
                    />
                    <Table
                      columns={mainColumns}
                      dataSource={filteredBills.map((bill) => ({
                        ...bill,
                        key: bill._id,
                      }))}
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
                      style={{ marginTop: 20 }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </motion.div>
      </div>

      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent m-0">
                EMI Status
              </h2>
              <p className="text-gray-500 text-sm mt-1">{selectedBillName}</p>
            </div>
          </div>
        }
        placement="right"
        onClose={() => setShowStatusModal(false)}
        open={showStatusModal}
        width={600}
        styles={{
          body: {
            padding: "24px",
            background: "linear-gradient(to bottom, #f8fafc, #f1f5f9)",
          },
        }}
      >
        <div className="space-y-4">
          {selectedEmiStatus.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No EMI records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEmiStatus.map((status, idx) => {
                const monthName = getMonthName(status.month);
                const isCurrentMonth =
                  status.month === getCurrentMonthYear().month &&
                  status.year === getCurrentMonthYear().year;
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      status.paid
                        ? "bg-green-50 border-green-200"
                        : isCurrentMonth
                        ? "bg-yellow-50 border-yellow-300 shadow-md"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">
                            {monthName} {status.year}
                          </h3>
                          {isCurrentMonth && (
                            <span className="px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                              Current Month
                            </span>
                          )}
                        </div>

                        <p className="text-2xl font-bold text-indigo-600">
                          ₹{status.amount?.toLocaleString() || 0}
                        </p>

                        {/* Payment details */}
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          {status.paymentMode && (
                            <div className="flex items-center gap-2">
                              <strong className="text-gray-800">Mode:</strong>
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">{status.paymentMode}</span>
                            </div>
                          )}

                          {status.remarks && (
                            <div className="">
                              <strong className="text-gray-800">Remarks:</strong>
                              <p className="mt-1 text-gray-600 text-sm whitespace-pre-wrap">{status.remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col items-end gap-2">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
                            status.paid
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {status.paid ? (
                            <>
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Paid
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Pending
                            </>
                          )}
                        </span>

                        {!status.paid && (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => openPayModal(selectedBillId, selectedBillName, status.amount, status.month, status.year, selectedBillEmiDate)}
                            className="px-3 py-1 rounded-lg font-semibold shadow-md text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg transition-all text-sm"
                          >
                            Pay
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {selectedEmiStatus.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total Paid:</span>
                <span className="text-xl font-bold">
                  {selectedEmiStatus.filter((s) => s.paid).length} /{" "}
                  {selectedEmiStatus.length}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-xl font-bold">
                  ₹
                  {selectedEmiStatus
                    .filter((s) => s.paid)
                    .reduce((sum, s) => sum + (s.amount || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      <Modal
        title={
          payTarget
            ? `Pay EMI for ${getMonthName(payTarget.month)} ${payTarget.year}`
            : "Pay EMI"
        }
        open={payModalVisible}
        onCancel={() => setPayModalVisible(false)}
        onOk={confirmPayEMI}
        okText="Pay"
        okButtonProps={{ loading: payLoading }}
        destroyOnClose
      >
        {payTarget && (
          <div className="space-y-4">
            <p className="text-gray-700">Please confirm payment for <strong>{payTarget.billName}</strong> — <strong>₹{(payTarget.amount || 0).toLocaleString()}</strong> ({getMonthName(payTarget.month)} {payTarget.year}).</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Remarks (optional)</label>
              <Input.TextArea
                value={payRemarks}
                onChange={(e) => setPayRemarks(e.target.value)}
                rows={4}
                placeholder="Add remarks, notes or reference (optional)"
                maxLength={500}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mode of Payment</label>
              <Select
                value={payMode}
                onChange={(val) => setPayMode(val)}
                options={[
                  { label: "Cash", value: "Cash" },
                  { label: "Account", value: "Account" },
                ]}
                placeholder="Select payment mode"
                className="w-full"
              />
            </div>
          </div>
        )}
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
                  onChange={(e) => setSearchText(e.target.value)}
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
                    columns={[
                      {
                        title: "Bill Name",
                        dataIndex: "name",
                        key: "name",
                        render: (text) => (
                          <span className="font-semibold text-gray-800">
                            {text}
                          </span>
                        ),
                      },
                      {
                        title: "EMI Type",
                        dataIndex: "emiType",
                        key: "emiType",
                        render: (text) => (
                          <span className="text-indigo-700 font-semibold">
                            {text}
                          </span>
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
                                navigate(
                                  `${getBasePath()}/editbill/${record._id}`
                                );
                              }}
                              className="px-4 py-2 bg-linear-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                            >
                              Edit
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                Modal.confirm({
                                  title: "Delete Bill",
                                  content:
                                    "Are you sure you want to delete this bill?",
                                  okText: "Delete",
                                  okType: "danger",
                                  cancelText: "Cancel",
                                  onOk: async () => {
                                    try {
                                      await axios.delete(
                                        `${API_BASE_URL}bills/${record._id}`
                                      );
                                      message.success(
                                        "Bill deleted successfully"
                                      );
                                      fetchBills();
                                    } catch (err) {
                                      message.error("Failed to delete bill");
                                    }
                                  },
                                });
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                            >
                              Delete
                            </motion.button>
                          </div>
                        ),
                      },
                    ]}
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