import axiosClient from "@/api/axiosClient";
import React, { useEffect, useMemo, useState } from "react";
import { message, Table } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ClipboardList, IndianRupee, Search, Wallet } from "lucide-react";
import {
  EmptyState,
  PageHero,
  SearchBox,
  Segmented,
  StatCard,
  StatRow,
} from "@/Components/PageKit";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_TONE = {
  PENDING: "is-gold",
  APPROVED: "",
  COMPLETED: "is-blue",
  REJECTED: "is-red",
  IN_PROGRESS: "is-blue",
};

const PRIORITY_TONE = {
  HIGH: "is-red",
  URGENT: "is-red",
  MEDIUM: "is-gold",
  LOW: "",
};

const Pill = ({ value, tones }) =>
  value ? (
    <span className={`pk-pill ${tones[String(value).toUpperCase()] ?? "is-grey"}`}>
      {String(value).replace(/_/g, " ")}
    </span>
  ) : (
    <span className="pk-muted">—</span>
  );

const Departmentwise = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const fetchdeptwiserequest = async () => {
    setLoadingRequests(true);
    try {
      const res = await axiosClient.get(`request/department/${id}`, config);
      setRequests(res.data.requests && Array.isArray(res.data.requests) ? res.data.requests : []);

      // Extract department name from first request
      if (res.data.requests && res.data.requests.length > 0 && res.data.requests[0].department) {
        setDepartmentName(res.data.requests[0].department.name);
      }
    } catch {
      message.error("Failed to fetch requests");
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchdeptwiserequest();
    // eslint-disable-next-line
  }, [id]);

  const requestColumns = [
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      width: 240,
      fixed: "left",
      render: (text, record) => (
        <div className="pk-who">
          <span className="pk-avatar is-soft" aria-hidden="true">
            {String(text || "?").trim().charAt(0).toUpperCase()}
          </span>
          <div style={{ minWidth: 0 }}>
            <strong>{text || "—"}</strong>
            <span>{record.vendor?.name || "No vendor"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Requested",
      dataIndex: "amount",
      key: "amount",
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
      width: 130,
      render: (amount) => <span className="pk-money">{money(amount)}</span>,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 110,
      render: (p) => <Pill value={p} tones={PRIORITY_TONE} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (s) => <Pill value={s} tones={STATUS_TONE} />,
    },
    {
      title: "Requested by",
      key: "requested_by",
      width: 200,
      render: (_, record) => {
        const r = record.requested_by;
        const name = `${r?.first_name || ""} ${r?.last_name || ""}`.trim();
        return name ? (
          <div>
            <div>{name}</div>
            {r?.designation ? <div className="pk-muted" style={{ fontSize: 12 }}>{r.designation}</div> : null}
          </div>
        ) : (
          <span className="pk-muted">—</span>
        );
      },
    },
    {
      title: "Planned",
      dataIndex: "planned_amount",
      key: "planned_amount",
      width: 120,
      render: (amount) => (amount ? <span className="pk-money">{money(amount)}</span> : <span className="pk-muted">—</span>),
    },
    {
      title: "Paid",
      dataIndex: "amount_paid",
      key: "amount_paid",
      width: 120,
      render: (amount) => (amount ? <span className="pk-money">{money(amount)}</span> : <span className="pk-muted">—</span>),
    },
    { title: "Accounts remarks", dataIndex: "accounts_check", key: "accounts_check", width: 170, render: (v) => v || <span className="pk-muted">—</span> },
    { title: "Approver remarks", dataIndex: "approver_check", key: "approver_check", width: 170, render: (v) => v || <span className="pk-muted">—</span> },
    { title: "Chairman remarks", dataIndex: "owner_check", key: "owner_check", width: 170, render: (v) => v || <span className="pk-muted">—</span> },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (text) =>
        text ? (
          new Date(text).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        ) : (
          <span className="pk-muted">—</span>
        ),
    },
  ];

  const totalAmount = requests.reduce((sum, req) => sum + (req.amount || 0), 0);
  const totalPaid = requests.reduce((sum, req) => sum + (req.amount_paid || 0), 0);

  const statusOptions = useMemo(() => {
    const counts = requests.reduce((acc, r) => {
      const s = String(r.status || "").toUpperCase();
      if (s) acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    return [
      { value: "ALL", label: "All", count: requests.length },
      ...Object.keys(counts).map((s) => ({
        value: s,
        label: s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " "),
        count: counts[s],
      })),
    ];
  }, [requests]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (status !== "ALL" && String(r.status || "").toUpperCase() !== status) return false;
      if (!q) return true;
      return (
        String(r.purpose || "").toLowerCase().includes(q) ||
        String(r.vendor?.name || "").toLowerCase().includes(q) ||
        `${r.requested_by?.first_name || ""} ${r.requested_by?.last_name || ""}`.toLowerCase().includes(q)
      );
    });
  }, [requests, search, status]);

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Department"
          title={departmentName || "Department dashboard"}
          subtitle="Every request raised by this department, with amounts and status."
          onBack={() => navigate(-1)}
          backLabel="Back"
        />

        <StatRow>
          <StatCard
            icon={<ClipboardList size={21} aria-hidden="true" />}
            label="Total requests"
            value={requests.length}
          />
          <StatCard
            tone="gold"
            icon={<IndianRupee size={21} aria-hidden="true" />}
            label="Total requested"
            value={money(totalAmount)}
          />
          <StatCard
            tone="blue"
            icon={<Wallet size={21} aria-hidden="true" />}
            label="Total paid"
            value={money(totalPaid)}
          />
        </StatRow>

        <section className="pk-panel">
          <div className="pk-toolbar">
            <div className="pk-toolbar-left">
              <SearchBox
                icon={<Search size={16} aria-hidden="true" />}
                value={search}
                onChange={setSearch}
                placeholder="Search purpose, vendor or requester"
                label="Search requests"
              />
              <Segmented options={statusOptions} value={status} onChange={setStatus} label="Status" />
            </div>
          </div>

          <Table
            className="pk-table"
            columns={requestColumns}
            dataSource={visible}
            rowKey={(record) => record.id}
            loading={loadingRequests}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requests`,
            }}
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: loadingRequests ? null : (
                <EmptyState
                  icon={<ClipboardList size={26} aria-hidden="true" />}
                  title="No requests found"
                  hint={search || status !== "ALL" ? "Try a different search or status." : undefined}
                />
              ),
            }}
          />
        </section>
      </div>
    </div>
  );
};

export default Departmentwise;
