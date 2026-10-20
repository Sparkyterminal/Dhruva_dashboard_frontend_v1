import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Table, message, Pagination, Spin } from "antd";
import { CircleCheck, ClipboardList, IndianRupee, Plus, Search, Clock3 } from "lucide-react";
import axiosClient from "@/api/axiosClient";
import dayjs from "dayjs";
import {
  EmptyState,
  PageHero,
  SearchBox,
  Segmented,
  StatCard,
  StatRow,
} from "@/Components/PageKit";
import "./ViewRequirements.css";

const money = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;
const label = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : "");

const STATUS_TONE = { PENDING: "is-gold", CONFIRMED: "is-blue", COMPLETED: "", REJECTED: "is-red" };
const PRIORITY_TONE = { HIGH: "is-red", MEDIUM: "is-gold", LOW: "" };

const Pill = ({ value, tones }) =>
  value ? (
    <span className={`pk-pill ${tones[String(value).toUpperCase()] ?? "is-grey"}`}>{label(value)}</span>
  ) : null;

const isOverdue = (req) =>
  req.status === "PENDING" &&
  req.due_date &&
  dayjs(req.due_date).startOf("day").isBefore(dayjs().startOf("day"));

/**
 * My Requests. Rendered as a tab on the home screen (no header, the menu is already there)
 * and as its own page at /user/viewrequests (with the green header and a way back).
 */
const ViewRequirements = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const standalone = pathname !== "/user";
  const user = useSelector((state) => state.user.value);

  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeTab, setActiveTab] = useState("cards");
  const [search, setSearch] = useState("");

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const fetchRequirementsData = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`request/my-requests?page=${page}`, config);
      setRequirements(res.data.items || []);
      setCurrentPage(res.data.currentPage);
      setTotalItems(res.data.totalItems);
    } catch {
      message.error("Failed to fetch requirements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchRequirementsData(page);
  };

  // Cards show only pending requests; the list shows everything on the page.
  const pendingRequirements = requirements.filter((req) => req.status === "PENDING");
  const pendingAmount = pendingRequirements.reduce((sum, req) => sum + req.amount, 0);
  const completedCount = requirements.filter((req) => req.status === "COMPLETED").length;

  const matches = (req) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(req.purpose || "").toLowerCase().includes(q) ||
      String(req.vendor?.name || "").toLowerCase().includes(q) ||
      String(req.event_reference?.clientName || "").toLowerCase().includes(q)
    );
  };

  const shownPending = useMemo(
    () => pendingRequirements.filter(matches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requirements, search],
  );
  const shownAll = useMemo(
    () => requirements.filter(matches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requirements, search],
  );

  const columns = [
    {
      title: "#",
      key: "slNo",
      width: 60,
      render: (_t, _r, index) => (currentPage - 1) * 10 + index + 1,
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      width: 240,
      render: (text, record) => (
        <div className="pk-who">
          <span className="pk-avatar is-soft" aria-hidden="true">
            {String(text || "?").trim().charAt(0).toUpperCase()}
          </span>
          <div style={{ minWidth: 0 }}>
            <strong style={{ whiteSpace: "normal" }}>{text}</strong>
            <span>{record.vendor?.name || "No vendor"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 130,
      render: (v) => <span className="pk-money">{money(v)}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (v) => <Pill value={v} tones={STATUS_TONE} />,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 110,
      render: (v) => <Pill value={v} tones={PRIORITY_TONE} />,
    },
    {
      title: "Planned",
      dataIndex: "planned_amount",
      key: "planned_amount",
      width: 120,
      render: money,
    },
    {
      title: "Approved",
      dataIndex: "approver_amount",
      key: "approver_amount",
      width: 120,
      render: money,
    },
    {
      title: "Paid",
      dataIndex: "amount_paid",
      key: "amount_paid",
      width: 120,
      render: money,
    },
    {
      title: "Transaction in",
      dataIndex: "transation_in",
      key: "transation_in",
      width: 130,
    },
    {
      title: "Vendor",
      dataIndex: "vendor",
      key: "vendor",
      width: 180,
      render: (vendor) =>
        vendor ? (
          <div>
            <div>{vendor.name}</div>
            <div className="pk-muted" style={{ fontSize: 12 }}>
              {vendor.vendor_code}
            </div>
          </div>
        ) : (
          <span className="pk-muted">—</span>
        ),
    },
    {
      title: "Event",
      dataIndex: "event_reference",
      key: "event_reference",
      width: 200,
      render: (event) =>
        event ? (
          <div>
            <div>{event.eventName?.name || "N/A"}</div>
            <div className="pk-muted" style={{ fontSize: 12 }}>
              {event.clientName}
            </div>
          </div>
        ) : (
          <span className="pk-muted">—</span>
        ),
    },
  ];

  const pager = (
    <div className="rq-pager">
      <Pagination
        current={currentPage}
        total={totalItems}
        pageSize={10}
        onChange={handlePageChange}
        showSizeChanger={false}
        showTotal={(total) => `${total} requests`}
      />
    </div>
  );

  const cards = shownPending.length ? (
    <div className="pk-grid">
      {shownPending.map((req) => (
        <article className="pk-card rq-card" key={req.id}>
          <div className="rq-card-top">
            <h3 className="rq-purpose">{req.purpose}</h3>
            <Pill value={req.priority} tones={PRIORITY_TONE} />
          </div>
          <div className="rq-amount">{money(req.amount)}</div>
          <div className="pk-card-meta">
            {req.due_date && (
              <span className={isOverdue(req) ? "rq-overdue" : undefined}>
                {isOverdue(req) ? "Overdue · " : "Due "}
                {dayjs(req.due_date).format("DD MMM YYYY")}
              </span>
            )}
            {req.transation_in && (
              <span>
                Transaction in <strong>{req.transation_in}</strong>
              </span>
            )}
            {req.vendor && (
              <span>
                Vendor <strong>{req.vendor.name}</strong>
              </span>
            )}
            {req.event_reference && (
              <span>
                Event{" "}
                <strong>
                  {req.event_reference.eventName?.name || "N/A"} · {req.event_reference.clientName}
                </strong>
              </span>
            )}
            {req.department && <span>{req.department.name}</span>}
          </div>
        </article>
      ))}
    </div>
  ) : loading ? (
    <div className="pk-empty">
      <Spin />
    </div>
  ) : (
    <EmptyState
      icon={<ClipboardList size={26} aria-hidden="true" />}
      title={search ? "No pending requests match your search" : "No pending requests"}
      hint={search ? undefined : "Everything you asked for has been handled."}
    />
  );

  const body = (
    <>
      <StatRow>
        <StatCard
          tone="gold"
          icon={<Clock3 size={21} aria-hidden="true" />}
          label="Pending requests"
          value={pendingRequirements.length}
        />
        <StatCard
          icon={<IndianRupee size={21} aria-hidden="true" />}
          label="Pending amount"
          value={money(pendingAmount)}
        />
        <StatCard
          tone="blue"
          icon={<CircleCheck size={21} aria-hidden="true" />}
          label="Completed"
          value={completedCount}
        />
      </StatRow>

      <section className="pk-panel">
        <div className="pk-toolbar">
          <div className="pk-toolbar-left">
            <Segmented
              label="View"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: "cards", label: "Pending", count: pendingRequirements.length },
                { value: "list", label: "All requests", count: requirements.length },
              ]}
            />
            <SearchBox
              icon={<Search size={16} aria-hidden="true" />}
              value={search}
              onChange={setSearch}
              placeholder="Search purpose, vendor or client"
              label="Search requests"
            />
          </div>
          <button type="button" className="pk-btn is-solid" onClick={() => navigate("/user/sendrequest")}>
            <Plus size={14} aria-hidden="true" /> New request
          </button>
        </div>

        {activeTab === "cards" ? (
          cards
        ) : (
          <Table
            className="pk-table"
            dataSource={shownAll}
            columns={columns}
            loading={loading}
            rowKey="id"
            rowClassName={(r) => (isOverdue(r) ? "rq-row-overdue" : "")}
            pagination={false}
            scroll={{ x: 1300 }}
            locale={{
              emptyText: loading ? null : (
                <EmptyState
                  icon={<ClipboardList size={26} aria-hidden="true" />}
                  title={search ? "No requests match your search" : "No requests yet"}
                />
              ),
            }}
          />
        )}
        {pager}
      </section>
    </>
  );

  if (!standalone) {
    return <div className="rq-embedded">{body}</div>;
  }

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Requests"
          title="My Requests"
          subtitle="Track what you have asked for and where each request stands."
          onBack={() => navigate("/user")}
        >
          <button type="button" className="pk-cta" onClick={() => navigate("/user/sendrequest")}>
            <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> New request
          </button>
        </PageHero>
        {body}
      </div>
    </div>
  );
};

export default ViewRequirements;
