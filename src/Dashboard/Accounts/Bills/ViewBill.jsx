import React, { useEffect, useState, useRef } from "react";
import ExcelDownloadButton from "@/Components/ExcelDownloadButton";
import { downloadBillsExcel } from "./billsExcel";
import { Table, message, Modal, Input, Drawer, Select } from "antd";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CircleCheck,
  Eye,
  IndianRupee,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import {
  EmptyState,
  PageHero,
  SearchBox,
  Segmented,
  StatCard,
  StatRow,
} from "@/Components/PageKit";
import "./Bills.css";
import axiosClient from "@/api/axiosClient";
import { useSelector } from "react-redux";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";


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
  const [belongsToList, setBelongsToList] = useState([]);
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

  const handleDownloadExcel = async () => {
    if (filteredBills.length === 0) {
      message.info("No bills to download");
      return;
    }
    const filterLines = [];
    if (activeTab !== "ALL") filterLines.push(`Belongs to: ${activeTab}`);
    if (searchText.trim()) filterLines.push(`Search: ${searchText.trim()}`);
    await downloadBillsExcel(filteredBills, { filterLines });
  };

  const fetchBills = async () => {
    try {
      const res = await axiosClient.get(`bills`);
      setBills(res.data || []);
      setFilteredBills(res.data || []);
      // Extract unique belongs_to for tabs
      const belongsTo = Array.from(
        new Set((res.data || []).map((b) => b.belongs_to || "Other")),
      );
      setBelongsToList(belongsTo);
    } catch {
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
          bill.name.toLowerCase().includes(searchText.toLowerCase()),
        ),
      );
    } else {
      setFilteredBills(
        bills.filter(
          (bill) =>
            bill.belongs_to === activeTab &&
            bill.name.toLowerCase().includes(searchText.toLowerCase()),
        ),
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

  const isEmiClosed = (bill) => {
    const now = new Date();
    const emiEndDate = new Date(bill.emi_end_date);
    return now > emiEndDate;
  };

  const generateAllMonths = (bill) => {
    if (!bill.createdAt && (!bill.emiStatus || bill.emiStatus.length === 0)) {
      return [];
    }

    const months = [];
    const now = new Date();
    const emiEndDate = new Date(bill.emi_end_date);

    // Only show months up to EMI end date, not beyond
    const endDate =
      emiEndDate < new Date(now.getFullYear(), now.getMonth() + 12, 1)
        ? emiEndDate
        : new Date(now.getFullYear(), now.getMonth() + 12, 1);

    bill.emiStatus?.forEach((status) => {
      const statusDate = new Date(status.year, status.month - 1, 1);
      if (statusDate <= endDate) {
        months.push({
          month: status.month,
          year: status.year,
          paid: status.paid || false,
          emiAmount: status.emiAmount || bill.defaultAmount,
          amountPaid: status.amountPaid || 0,
          pending: status.pending || status.emiAmount || bill.defaultAmount,
          remarks: status.remarks || undefined,
          paymentMode: status.paymentMode || undefined,
          paymentDate: status.paymentDate || undefined,
        });
      }
    });

    return months.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
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
      (s) => s.month === month && s.year === year,
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
      emiDate.getDate(),
    );
    return now > currentMonthEmiDate;
  };

  // Open pay modal to collect remarks and confirm payment
  const openPayModal = (billId, billName, emiAmount, month, year, emiDate) => {
    setPayTarget({ billId, billName, emiAmount, month, year, emiDate });
    setPayRemarks("");
    setPayMode("Cash");
    setPayModalVisible(true);
  };

  const confirmPayEMI = async () => {
    if (!payTarget || !payTarget.billId) return;
    const { billId, billName, emiAmount, month, year } = payTarget;
    const monthName = getMonthName(month);

    setPayLoading(true);
    try {
      const config = { headers: { Authorization: user?.access_token } };
      await axiosClient.put(
        `bills/${billId}`,
        {
          name: billName,
          emiDate: payTarget.emiDate || undefined,
          emiAmount,
          amountPaid: emiAmount,
          pending: 0,
          paid: true,
          month,
          year,
          remarks: payRemarks || undefined,
          paymentMode: payMode || undefined,
          paymentDate: new Date().toISOString(),
        },
        config,
      );

      message.success(`EMI paid successfully for ${monthName} ${year}`);
      // Update drawer state immediately if open (include remarks & paymentMode)
      setSelectedEmiStatus((prev) =>
        prev.map((s) =>
          s.month === month && s.year === year
            ? {
                ...s,
                paid: true,
                amountPaid: emiAmount,
                pending: 0,
                remarks: payRemarks || s.remarks,
                paymentMode: payMode || s.paymentMode,
                paymentDate: new Date().toISOString(),
              }
            : s,
        ),
      );
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
    return "/user";
  };

  const handleAddBillClick = () => {
    const basePath = getBasePath();
    navigate(`${basePath}/addbill`);
  };

  const belongsToTabs = [
    { key: "ALL", label: "All" },
    ...belongsToList.map((belongsTo) => ({
      key: belongsTo,
      label: belongsTo,
    })),
  ];

  const fmtDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const mainColumns = [
    {
      title: "Bill",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="pk-who">
          <span className="pk-avatar is-soft" aria-hidden="true">
            {String(text || "?").trim().charAt(0).toUpperCase()}
          </span>
          <div style={{ minWidth: 0 }}>
            <strong>{text}</strong>
            <span>{record.belongs_to || "Other"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "EMI date",
      dataIndex: "emiDate",
      key: "emiDate",
      width: 140,
      render: (date) => <span>{fmtDate(date)}</span>,
    },
    {
      title: "Amount",
      dataIndex: "defaultAmount",
      key: "defaultAmount",
      width: 130,
      render: (amt) => <span className="pk-money">₹{amt?.toLocaleString("en-IN")}</span>,
    },
    {
      title: "Status",
      key: "status",
      width: 230,
      render: (_, record) => {
        if (isEmiClosed(record)) {
          return <span className="pk-pill is-grey">Closed</span>;
        }
        const paid = isPaid(record);
        const overdue = isOverdue(record);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className={`pk-pill ${paid ? "" : overdue ? "is-red" : "is-gold"}`}>
              {paid ? "Paid" : overdue ? "Overdue" : "Pending"}
            </span>
            {!paid && <span className="pk-muted">{getDueDaysInfo(record.emiDate).label}</span>}
          </div>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 300,
      align: "right",
      render: (_, record) => {
        const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
        const currentStatus = record.emiStatus?.find(
          (s) => s.month === currentMonth && s.year === currentYear,
        );
        const isCurrentMonthPaid = currentStatus?.paid || false;

        return (
          <div className="pk-actions">
            <button type="button" className="pk-btn" onClick={() => openEmiStatusModal(record)}>
              <Eye size={14} aria-hidden="true" /> Schedule
            </button>
            {!isEmiClosed(record) && !isCurrentMonthPaid ? (
              <button
                type="button"
                className="pk-btn is-solid"
                onClick={() => {
                  const emiAmount = currentStatus?.emiAmount || record.defaultAmount;
                  openPayModal(
                    record._id,
                    record.name,
                    emiAmount,
                    currentMonth,
                    currentYear,
                    record.emiDate,
                  );
                }}
              >
                <Wallet size={14} aria-hidden="true" /> Pay {currentMonth}/{currentYear}
              </button>
            ) : !isEmiClosed(record) ? (
              <span className="pk-pill">Paid</span>
            ) : (
              <span className="pk-pill is-grey">Closed</span>
            )}
          </div>
        );
      },
    },
  ];

  const paidCount = bills.filter((b) => !isEmiClosed(b) && isPaid(b)).length;
  const overdueCount = bills.filter((b) => !isEmiClosed(b) && isOverdue(b)).length;

  const totalAmount = bills.reduce(
    (sum, bill) => sum + (bill.defaultAmount || 0),
    0,
  );

  const getDueDaysInfoForMonth = (bill, month, year) => {
    const now = new Date();
    const emiDate = new Date(bill.emiDate);
    const dueDate = new Date(year, month - 1, emiDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthDate = new Date(year, month - 1, 1);

    if (monthDate > now) {
      const daysUntil = Math.ceil((monthDate - today) / (1000 * 60 * 60 * 24));
      return {
        type: "upcoming",
        label: `Due in ${daysUntil} days`,
        days: daysUntil,
      };
    }

    if (today > dueDate) {
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      return {
        type: "overdue",
        label: `Overdue by ${daysOverdue} days`,
        days: daysOverdue,
      };
    } else if (today < dueDate) {
      const daysRemaining = Math.ceil(
        (dueDate - today) / (1000 * 60 * 60 * 24),
      );
      return {
        type: "upcoming",
        label: `Due in ${daysRemaining} days`,
        days: daysRemaining,
      };
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
          (s) => s.month === month && s.year === year,
        );

        const isPaid = existingStatus?.paid || false;
        const amount = existingStatus?.emiAmount || bill.defaultAmount;

        // Determine color based on status
        let backgroundColor = "#f59e0b"; // yellow for pending
        if (isPaid) {
          backgroundColor = "#2f8a4b"; // green for paid
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
          title: `${bill.name} - ₹${(amount || 0).toLocaleString()}`,
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

  const { month: nowMonth, year: nowYear } = getCurrentMonthYear();

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Accounts"
          title="Bills & EMI's"
          subtitle="Track every EMI and bill, see what is due, and record payments."
          onBack={() => navigate("/user")}
        >
          <button type="button" className="pk-cta is-ghost" onClick={() => setShowEditModal(true)}>
            <Pencil size={16} aria-hidden="true" /> Edit bills
          </button>
          <button type="button" className="pk-cta" onClick={handleAddBillClick}>
            <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add bill
          </button>
        </PageHero>

        <StatRow>
          <StatCard icon={<ReceiptText size={21} aria-hidden="true" />} label="Total EMI's / bills" value={bills.length} />
          <StatCard tone="gold" icon={<IndianRupee size={21} aria-hidden="true" />} label="Total amount" value={`₹${totalAmount.toLocaleString("en-IN")}`} />
          <StatCard icon={<CircleCheck size={21} aria-hidden="true" />} label={`Paid (${nowMonth}/${nowYear})`} value={paidCount} />
          <StatCard tone="red" icon={<TriangleAlert size={21} aria-hidden="true" />} label="Overdue" value={overdueCount} />
        </StatRow>

        <section className="pk-panel">
          <div className="pk-toolbar">
            <div className="pk-toolbar-left">
              <Segmented
                label="View"
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { value: "list", label: "List" },
                  { value: "calendar", label: "Calendar" },
                ]}
              />
              <SearchBox
                icon={<Search size={16} aria-hidden="true" />}
                value={searchText}
                onChange={setSearchText}
                placeholder="Search bills by name"
                label="Search bills"
              />
            </div>
            <div className="pk-toolbar-right">
              <ExcelDownloadButton onDownload={handleDownloadExcel} />
            </div>
          </div>

          {viewMode === "list" ? (
            <>
              <div className="bl-subbar">
                <Segmented
                  label="Belongs to"
                  value={activeTab}
                  onChange={setActiveTab}
                  options={belongsToTabs.map((t) => ({ value: t.key, label: t.label }))}
                />
              </div>
              <Table
                className="pk-table"
                columns={mainColumns}
                dataSource={filteredBills.map((bill) => ({ ...bill, key: bill._id }))}
                rowClassName={(record) =>
                  isPaid(record) ? "bl-row-paid" : isOverdue(record) ? "bl-row-overdue" : ""
                }
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} bills`,
                }}
                scroll={{ x: 900 }}
                locale={{
                  emptyText: (
                    <EmptyState
                      icon={<ReceiptText size={26} aria-hidden="true" />}
                      title="No bills found"
                      hint={searchText ? "Try a different search." : "Use “Add bill” to create the first one."}
                    />
                  ),
                }}
              />
            </>
          ) : filteredBills.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={26} aria-hidden="true" />}
              title="No EMI records found"
              hint={searchText ? "Try a different search." : undefined}
            />
          ) : (
            <div className="bl-calendar">
              <div className="bl-legend">
                <span><i style={{ background: "#2f8a4b" }} /> Paid</span>
                <span><i style={{ background: "#f59e0b" }} /> Pending</span>
                <span><i style={{ background: "#ef4444" }} /> Overdue</span>
              </div>
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
                    const { billId, billName, emiType, amount, paid, month, year } =
                      info.event.extendedProps;

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
        </section>
      </div>

      <Drawer
        title={
          <div>
            <div style={{ fontWeight: 700, color: "var(--brand)" }}>EMI schedule</div>
            <div style={{ fontSize: 13, fontWeight: 400, color: "var(--ink-soft)" }}>{selectedBillName}</div>
          </div>
        }
        placement="right"
        onClose={() => setShowStatusModal(false)}
        open={showStatusModal}
        width={560}
        styles={{ body: { padding: 20, background: "var(--bg-page)" } }}
      >
        {selectedEmiStatus.length === 0 ? (
          <EmptyState icon={<CalendarDays size={26} aria-hidden="true" />} title="No EMI records found" />
        ) : (
          <div className="bl-months">
            {selectedEmiStatus.map((status, idx) => {
              const isCurrentMonth =
                status.month === getCurrentMonthYear().month &&
                status.year === getCurrentMonthYear().year;

              return (
                <article
                  key={idx}
                  className={`bl-month${status.paid ? " is-paid" : isCurrentMonth ? " is-current" : ""}`}
                >
                  <div className="bl-month-top">
                    <div>
                      <h3>
                        {getMonthName(status.month)} {status.year}
                      </h3>
                      <p className="bl-month-amount">₹{status.emiAmount?.toLocaleString("en-IN") || 0}</p>
                    </div>
                    <div className="bl-month-side">
                      <span className={`pk-pill ${status.paid ? "" : "is-gold"}`}>
                        {status.paid ? "Paid" : "Pending"}
                      </span>
                      {isCurrentMonth && <span className="pk-pill is-blue">This month</span>}
                    </div>
                  </div>

                  {(status.paid || status.paymentMode || status.remarks) && (
                    <dl className="bl-month-meta">
                      {status.paid && (
                        <div>
                          <dt>Amount paid</dt>
                          <dd>₹{status.amountPaid?.toLocaleString("en-IN") || 0}</dd>
                        </div>
                      )}
                      {status.paymentMode && (
                        <div>
                          <dt>Mode</dt>
                          <dd>{status.paymentMode}</dd>
                        </div>
                      )}
                      {status.paymentDate && status.paid && (
                        <div>
                          <dt>Paid on</dt>
                          <dd>{fmtDate(status.paymentDate)}</dd>
                        </div>
                      )}
                      {status.remarks && (
                        <div style={{ gridColumn: "1 / -1" }}>
                          <dt>Remarks</dt>
                          <dd style={{ whiteSpace: "pre-wrap" }}>{status.remarks}</dd>
                        </div>
                      )}
                    </dl>
                  )}

                  {!status.paid && (
                    <button
                      type="button"
                      className="pk-btn is-solid"
                      onClick={() =>
                        openPayModal(
                          selectedBillId,
                          selectedBillName,
                          status.emiAmount,
                          status.month,
                          status.year,
                          selectedBillEmiDate,
                        )
                      }
                    >
                      <Wallet size={14} aria-hidden="true" /> Pay now
                    </button>
                  )}
                </article>
              );
            })}

            <div className="bl-total">
              <span>
                Paid <strong>{selectedEmiStatus.filter((s) => s.paid).length} / {selectedEmiStatus.length}</strong>
              </span>
              <span>
                Total paid{" "}
                <strong>
                  ₹
                  {selectedEmiStatus
                    .filter((s) => s.paid)
                    .reduce((sum, s) => sum + (s.amountPaid || 0), 0)
                    .toLocaleString("en-IN")}
                </strong>
              </span>
            </div>
          </div>
        )}
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
        destroyOnHidden
      >
        {payTarget && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Please confirm payment for <strong>{payTarget.billName}</strong> —{" "}
              <strong>₹{(payTarget.emiAmount || 0).toLocaleString("en-IN")}</strong> (
              {getMonthName(payTarget.month)} {payTarget.year}).
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Remarks (optional)
              </label>
              <Input.TextArea
                value={payRemarks}
                onChange={(e) => setPayRemarks(e.target.value)}
                rows={4}
                placeholder="Add remarks, notes or reference (optional)"
                maxLength={500}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Mode of Payment
              </label>
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

      <Drawer
        title="Edit bills"
        placement="right"
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        width={760}
        styles={{ body: { padding: 0 } }}
      >
        <div className="pk-toolbar">
          <div className="pk-toolbar-left">
            <SearchBox
              icon={<Search size={16} aria-hidden="true" />}
              value={searchText}
              onChange={setSearchText}
              placeholder="Search bills by name"
              label="Search bills to edit"
            />
          </div>
        </div>
        <Table
          className="pk-table"
          columns={[
            {
              title: "Bill",
              dataIndex: "name",
              key: "name",
              render: (text, record) => (
                <div className="pk-who">
                  <span className="pk-avatar is-soft" aria-hidden="true">
                    {String(text || "?").trim().charAt(0).toUpperCase()}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <strong>{text}</strong>
                    <span>{record.emiType || "—"}</span>
                  </div>
                </div>
              ),
            },
            {
              title: "EMI date",
              dataIndex: "emiDate",
              key: "emiDate",
              width: 130,
              render: (date) => fmtDate(date),
            },
            {
              title: "Amount",
              dataIndex: "defaultAmount",
              key: "defaultAmount",
              width: 120,
              render: (amt) => <span className="pk-money">₹{amt?.toLocaleString("en-IN") || 0}</span>,
            },
            {
              title: "",
              key: "actions",
              width: 170,
              align: "right",
              render: (_, record) => (
                <div className="pk-actions">
                  <button
                    type="button"
                    className="pk-btn is-solid"
                    onClick={() => {
                      setShowEditModal(false);
                      navigate(`${getBasePath()}/editbill/${record._id}`);
                    }}
                  >
                    <Pencil size={13} aria-hidden="true" /> Edit
                  </button>
                  <button
                    type="button"
                    className="pk-btn is-danger is-icon"
                    aria-label="Delete bill"
                    onClick={() => {
                      Modal.confirm({
                        title: "Delete bill",
                        content: "Are you sure you want to delete this bill?",
                        okText: "Delete",
                        okType: "danger",
                        cancelText: "Cancel",
                        onOk: async () => {
                          try {
                            await axiosClient.delete(`bills/${record._id}`);
                            message.success("Bill deleted successfully");
                            fetchBills();
                          } catch {
                            message.error("Failed to delete bill");
                          }
                        },
                      });
                    }}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              ),
            },
          ]}
          dataSource={filteredBills.map((bill) => ({ ...bill, key: bill._id }))}
          pagination={{ pageSize: 8, showSizeChanger: false }}
        />
      </Drawer>
    </div>
  );
};

export default ViewBill;
