/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  Table,
  Input,
  Button,
  Space,
  message,
  Card,
  Row,
  Col,
  Tag,
  Collapse,
  DatePicker,
  Select,
  Tabs,
  Spin,
} from "antd";
import {
  EditOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { API_BASE_URL } from "../../../config";

const { Panel } = Collapse;
const { Option } = Select;
const { RangePicker } = DatePicker;

const RequirementTableApprover = () => {
  const user = useSelector((state) => state.user.value);
  const [departmentData, setDepartmentData] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingMoreDeptId, setLoadingMoreDeptId] = useState(null);
  const [search, setSearch] = useState("");
  const [createdDateRange, setCreatedDateRange] = useState(null);
  const [requiredDateRange, setRequiredDateRange] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(undefined);
  const [selectedVendorId, setSelectedVendorId] = useState(undefined);
  const [events, setEvents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, rejected: 0 });
  const eventSearchRef = useRef(null);
  const vendorSearchRef = useRef(null);
  const PAGE_SIZE = 30;

  // Editable row IDs and values for planned_amount, amount_paid, and approver_amount
  const [editRowId, setEditRowId] = useState(null);
  const [editPlannedAmount, setEditPlannedAmount] = useState(null);
  const [editAmountPaid, setEditAmountPaid] = useState(null);
  const [editApproverAmount, setEditApproverAmount] = useState(null);
  const [editEntityAccount, setEditEntityAccount] = useState(null);
  const [editAmountPaidTo, setEditAmountPaidTo] = useState(null);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const fetchEvents = async (query = "") => {
    setEventsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}events`, {
        ...config,
        params: query ? { search: query } : {},
      });
      setEvents(res.data.events || res.data.data || res.data || []);
    } catch {
      message.error("Failed to fetch events");
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchVendors = async (query = "") => {
    setVendorsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}vendor/list`, {
        ...config,
        params: query ? { search: query } : {},
      });
      const list = res.data.vendors || res.data || [];
      setVendors(Array.isArray(list) ? list : []);
    } catch {
      message.error("Failed to fetch vendors");
    } finally {
      setVendorsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents("");
    fetchVendors();
  }, []);

  const getApproverCheckParam = () => {
    if (activeTab === "all") return undefined;
    if (activeTab === "pending") return "PENDING";
    if (activeTab === "completed") return "APPROVED";
    if (activeTab === "rejected") return "REJECTED";
    return undefined;
  };

  const fetchRequirementsData = async (
    searchQuery = "",
    createdStart = null,
    createdEnd = null,
    requiredStart = null,
    requiredEnd = null,
    eventId = null,
    vendorId = null,
    pageNum = 1,
    departmentId = null,
    append = false,
  ) => {
    if (!departmentId) setLoading(true);
    else if (append) setLoadingMoreDeptId(departmentId);
    try {
      const params = new URLSearchParams();
      const approverCheck = getApproverCheckParam();
      if (approverCheck) params.append("approver_check", approverCheck);
      if (searchQuery) params.append("search", searchQuery);
      if (createdStart) params.append("startDate", createdStart);
      if (createdEnd) params.append("endDate", createdEnd);
      if (requiredStart) params.append("required_date_start", requiredStart);
      if (requiredEnd) params.append("required_date_end", requiredEnd);
      if (eventId) params.append("event", eventId);
      if (vendorId) params.append("vendor", vendorId);
      if (departmentId) params.append("department", departmentId);
      params.append("page", String(pageNum));
      params.append("limit", String(PAGE_SIZE));

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await axios.get(
        `${API_BASE_URL}request/all${queryString}`,
        config,
      );
      const data = res.data;
      const pagination = data.pagination || {};
      const hasNextPage = pagination.hasNextPage ?? (pagination.totalItems > (pagination.currentPage || pageNum) * (pagination.size || PAGE_SIZE));

      if (data.departments && typeof data.departments === "object") {
        if (departmentId && append) {
          const list = [];
          Object.entries(data.departments).forEach(([, arr]) => {
            (Array.isArray(arr) ? arr : []).forEach((item) => list.push({ ...item, department: item.department || {} }));
          });
          if (list.length > 0) {
            setDepartmentData((prev) => {
              const existing = prev[departmentId];
              if (!existing) return prev;
              return {
                ...prev,
                [departmentId]: {
                  ...existing,
                  items: [...existing.items, ...list],
                  page: pageNum,
                  hasMore: hasNextPage,
                },
              };
            });
          }
        } else if (departmentId && !append) {
          let normalized = [];
          Object.entries(data.departments).forEach(([deptName, arr]) => {
            (Array.isArray(arr) ? arr : []).forEach((item) =>
              normalized.push({ ...item, department: item.department || { id: deptName, name: deptName } })
            );
          });
          if (normalized.length > 0) {
            setDepartmentData((prev) => ({
              ...prev,
              [departmentId]: {
                department: normalized[0]?.department || { id: departmentId, name: "Department" },
                items: normalized,
                page: pageNum,
                hasMore: hasNextPage,
              },
            }));
          }
        } else {
          const nextDepts = {};
          Object.entries(data.departments).forEach(([deptName, arr]) => {
            const list = Array.isArray(arr) ? arr : [];
            if (list.length === 0) return;
            const d = list[0].department || { id: deptName, name: deptName };
            const id = d.id || deptName;
            nextDepts[id] = {
              department: d,
              items: list.map((item) => ({ ...item, department: item.department || d })),
              page: 1,
              hasMore: hasNextPage,
            };
          });
          setDepartmentData(nextDepts);
        }
      } else if (Array.isArray(data.items) && !departmentId) {
        const byDept = (data.items || []).reduce((acc, item) => {
          const d = item.department || { id: "unknown", name: "Unknown" };
          const id = d.id || "unknown";
          if (!acc[id]) acc[id] = { department: d, items: [], page: 1, hasMore: true };
          acc[id].items.push(item);
          return acc;
        }, {});
        setDepartmentData(byDept);
      }

      const total = pagination.totalItems ?? data.totalItems ?? data.total ?? 0;
      setTotalItems(total);
      if (data.stats && typeof data.stats === "object") {
        setStats({
          total: data.stats.total ?? data.totalItems ?? total,
          pending: data.stats.pending ?? 0,
          completed: data.stats.completed ?? data.stats.approved ?? 0,
          rejected: data.stats.rejected ?? 0,
        });
      }
    } catch (err) {
      message.error("Failed to fetch requirements");
      if (departmentId && append) {
        setDepartmentData((prev) => {
          const existing = prev[departmentId];
          return existing ? { ...prev, [departmentId]: { ...existing, hasMore: false } } : prev;
        });
      }
    } finally {
      setLoading(false);
      setLoadingMoreDeptId(null);
    }
  };

  const loadMoreForDepartment = (deptId) => {
    const dept = departmentData[deptId];
    if (!dept || dept.hasMore === false || loadingMoreDeptId) return;
    fetchRequirementsData(
      search,
      createdDateRange?.[0]?.format("YYYY-MM-DD") ?? null,
      createdDateRange?.[1]?.format("YYYY-MM-DD") ?? null,
      requiredDateRange?.[0]?.format("YYYY-MM-DD") ?? null,
      requiredDateRange?.[1]?.format("YYYY-MM-DD") ?? null,
      selectedEventId || null,
      selectedVendorId || null,
      (dept.page || 1) + 1,
      deptId,
      true,
    );
  };

  const refetchDepartment = (deptId) => {
    fetchRequirementsData(
      search,
      createdDateRange?.[0]?.format("YYYY-MM-DD") ?? null,
      createdDateRange?.[1]?.format("YYYY-MM-DD") ?? null,
      requiredDateRange?.[0]?.format("YYYY-MM-DD") ?? null,
      requiredDateRange?.[1]?.format("YYYY-MM-DD") ?? null,
      selectedEventId || null,
      selectedVendorId || null,
      1,
      deptId,
      false,
    );
  };

  useEffect(() => {
    fetchRequirementsData(
      search,
      createdDateRange?.[0]?.format("YYYY-MM-DD") ?? null,
      createdDateRange?.[1]?.format("YYYY-MM-DD") ?? null,
      requiredDateRange?.[0]?.format("YYYY-MM-DD") ?? null,
      requiredDateRange?.[1]?.format("YYYY-MM-DD") ?? null,
      selectedEventId || null,
      selectedVendorId || null,
      1,
      null,
      false,
    );
  }, [activeTab]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRequirementsData(
        search,
        createdDateRange?.[0]?.format("YYYY-MM-DD") ?? null,
        createdDateRange?.[1]?.format("YYYY-MM-DD") ?? null,
        requiredDateRange?.[0]?.format("YYYY-MM-DD") ?? null,
        requiredDateRange?.[1]?.format("YYYY-MM-DD") ?? null,
        selectedEventId || null,
        selectedVendorId || null,
        1,
        null,
        false,
      );
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, createdDateRange, requiredDateRange, selectedEventId, selectedVendorId]);

  const allItems = Object.values(departmentData).flatMap((d) => d.items || []);
  useEffect(() => {
    const total = totalItems || allItems.length;
    const pending = allItems.filter(
      (r) => r.approver_check === "PENDING" || (r.status && r.status === "PENDING")
    ).length;
    const completed = allItems.filter(
      (r) => r.approver_check === "APPROVED" || (r.status && r.status === "COMPLETED")
    ).length;
    const rejected = allItems.filter(
      (r) => r.approver_check === "REJECTED" || (r.status && r.status === "REJECTED")
    ).length;
    setStats((prev) =>
      prev.total === total && prev.pending === pending && prev.completed === completed && prev.rejected === rejected
        ? prev
        : { total, pending, completed, rejected }
    );
  }, [departmentData, totalItems]);

  const requirementsByDept = departmentData;

  const sortedRequirements = (list) => {
    return [...list].sort((a, b) => {
      const statusOrder = {
        PENDING: 0,
        COMPLETED: 1,
        REJECTED: 1,
      };
      const statusA = statusOrder[a.status] ?? 0;
      const statusB = statusOrder[b.status] ?? 0;
      return statusA - statusB;
    });
  };

  const handleCreatedDateRangeChange = (dates) => {
    setCreatedDateRange(dates?.length === 2 ? dates : null);
  };

  const handleRequiredDateRangeChange = (dates) => {
    setRequiredDateRange(dates?.length === 2 ? dates : null);
  };

  const handleEventSearch = (value) => {
    if (eventSearchRef.current) clearTimeout(eventSearchRef.current);
    eventSearchRef.current = setTimeout(() => fetchEvents(value || ""), 300);
  };

  const handleVendorSearch = (value) => {
    if (vendorSearchRef.current) clearTimeout(vendorSearchRef.current);
    vendorSearchRef.current = setTimeout(() => fetchVendors(value || ""), 300);
  };

  // Start editing planned_amount, amount_paid, and approver_amount for a row
  const handleEditClick = (row) => {
    setEditRowId(row.id);
    setEditPlannedAmount(row.planned_amount ?? "");
    setEditAmountPaid(row.amount_paid ?? "");
    setEditApproverAmount(row.approver_amount ?? "");
    setEditEntityAccount(row.entity_account ?? "");
    setEditAmountPaidTo(row.amount_paid_to ?? "");
  };
  const handlePlannedAmountChange = (e) => setEditPlannedAmount(e.target.value);
  const handleAmountPaidChange = (e) => setEditAmountPaid(e.target.value);
  const handleApproverAmountChange = (e) =>
    setEditApproverAmount(e.target.value);
  const handleEntityAccountChange = (value) => setEditEntityAccount(value);
  const handleAmountPaidToChange = (e) => setEditAmountPaidTo(e.target.value);

  // Save the editable fields: planned_amount, amount_paid, and approver_amount
  const handleSaveClick = async (row) => {
    const planned = Number(editPlannedAmount);
    const paid = Number(editAmountPaid);
    const approved = Number(editApproverAmount);
    if (isNaN(planned) || planned < 0) {
      message.error("Please enter a valid planned amount");
      return;
    }
    if (isNaN(paid) || paid < 0) {
      message.error("Please enter a valid amount paid");
      return;
    }
    if (isNaN(approved) || approved < 0) {
      message.error("Please enter a valid approved amount");
      return;
    }

    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        {
          planned_amount: planned,
          amount_paid: paid,
          approver_amount: approved,
          entity_account: editEntityAccount || "",
          amount_paid_to: editAmountPaidTo || "",
        },
        config,
      );
      message.success("Updated successfully");
      setEditRowId(null);
      refetchDepartment(row.department?.id);
    } catch (err) {
      message.error("Failed to update amounts");
    }
  };

  const handleComplete = async (row) => {
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { status: "COMPLETED" },
        config,
      );
      message.success("Request marked as completed");
      refetchDepartment(row.department?.id);
    } catch (err) {
      message.error("Failed to mark as completed");
    }
  };

  const handleReject = async (row) => {
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { status: "REJECTED" },
        config,
      );
      message.success("Request marked as rejected");
      refetchDepartment(row.department?.id);
    } catch (err) {
      message.error("Failed to reject request");
    }
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
          style={{ borderRadius: 6, fontWeight: 700, fontSize: 12 }}
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
      title: "Vendor Name",
      dataIndex: ["vendor", "name"],
      key: "vendor_name",
      width: 150,
      render: (_, record) => (
        <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
          {record.vendor?.name || "-"}
        </span>
      ),
    },
    {
      title: "Event Reference",
      dataIndex: "event_reference",
      key: "event_reference",
      width: 150,
      render: (text) => (
        <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
          {text?.clientName || "-"}
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
    // {
    //   title: "Priority",
    //   dataIndex: "priority",
    //   key: "priority",
    //   width: 100,
    //   render: (priority) => (
    //     <Tag
    //       color={
    //         priority === "HIGH"
    //           ? "#fee2e2"
    //           : priority === "MEDIUM"
    //           ? "#fef3c7"
    //           : "#d1fae5"
    //       }
    //       style={{
    //         color:
    //           priority === "HIGH"
    //             ? "#991b1b"
    //             : priority === "MEDIUM"
    //             ? "#92400e"
    //             : "#065f46",
    //         borderRadius: 6,
    //         border: "none",
    //         fontWeight: 700,
    //         fontSize: 16,
    //       }}
    //     >
    //       {priority}
    //     </Tag>
    //   ),
    // },
    // {
    //   title: "Updated At",
    //   dataIndex: "updatedAt",
    //   key: "updatedAt",
    //   width: 150,
    //   render: (date) => (
    //     <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
    //       {date ? dayjs(date).format("DD-MM-YYYY HH:mm") : "-"}
    //     </span>
    //   ),
    // },
    {
      title: "Planned Amount",
      dataIndex: "planned_amount",
      key: "planned_amount",
      width: 180,
      render: (planned_amount, row) =>
        row.id === editRowId ? (
          <Space>
            <Input
              style={{ width: 120, fontWeight: 600, fontSize: 18 }}
              value={editPlannedAmount}
              onChange={handlePlannedAmountChange}
              size="small"
            />
          </Space>
        ) : (
          <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>
            {planned_amount?.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            }) || "₹0"}
          </span>
        ),
    },
    {
      title: "Approved Amount",
      dataIndex: "approver_amount",
      key: "approver_amount",
      width: 180,
      render: (approver_amount, row) =>
        row.id === editRowId ? (
          <Space>
            <Input
              style={{ width: 120, fontWeight: 600, fontSize: 18 }}
              value={editApproverAmount}
              onChange={handleApproverAmountChange}
              size="small"
            />
          </Space>
        ) : (
          <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>
            {approver_amount?.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            }) || "₹0"}
          </span>
        ),
    },
    {
      title: "Amount Paid",
      dataIndex: "amount_paid",
      key: "amount_paid",
      width: 180,
      render: (amount_paid, row) =>
        row.id === editRowId ? (
          <Space>
            <Input
              style={{ width: 120, fontWeight: 600, fontSize: 18 }}
              value={editAmountPaid}
              onChange={handleAmountPaidChange}
              size="small"
            />
          </Space>
        ) : (
          <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>
            {amount_paid?.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            }) || "₹0"}
          </span>
        ),
    },
    {
      title: "Balance",
      key: "balance",
      width: 180,
      render: (_, row) => {
        const amount = Number(row?.amount) || 0;
        const paid = Number(row?.amount_paid) || 0;
        const balance = amount - paid;
        return (
          <span
            style={{
              fontWeight: 700,
              color: balance < 0 ? "#dc2626" : "#000",
              fontSize: 18,
            }}
          >
            {balance.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            })}
          </span>
        );
      },
    },
    {
      title: "Entity",
      dataIndex: "entity_account",
      key: "entity_account",
      width: 250,
      render: (entity_account, row) =>
        row.id === editRowId ? (
          <Space>
            <Select
              size="small"
              value={editEntityAccount}
              onChange={handleEntityAccountChange}
              style={{ width: 200, fontWeight: 600, fontSize: 16 }}
              placeholder="Select entity"
            >
              <Option value="Blue Pulse Ventures Pvt Lmtd.">
                Blue Pulse Ventures Pvt Lmtd.
              </Option>
              <Option value="Sky Blue Event Management India Pvt Lmtd.">
                Sky Blue Event Management India Pvt Lmtd.
              </Option>
              <Option value="Dhrua Kumar H P">Dhrua Kumar H P</Option>
              <Option value="MM account">MM account</Option>
              <Option value="Cash Payment">Cash Payment</Option>
            </Select>
          </Space>
        ) : (
          <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
            {entity_account || "-"}
          </span>
        ),
    },
    {
      title: "Paid To",
      dataIndex: "amount_paid_to",
      key: "amount_paid_to",
      width: 200,
      render: (amount_paid_to, row) =>
        row.id === editRowId ? (
          <Space>
            <Input
              style={{ width: 150, fontWeight: 600, fontSize: 18 }}
              value={editAmountPaidTo}
              onChange={handleAmountPaidToChange}
              size="small"
              placeholder="Enter name"
            />
          </Space>
        ) : (
          <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
            {amount_paid_to || "-"}
          </span>
        ),
    },

    {
      title: "Approver Check",
      dataIndex: "approver_check",
      key: "approver_check",
      width: 200,
      render: (_, row) => {
        if (row.approver_check === "PENDING") {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => handleComplete(row)}
                icon={<CheckCircleOutlined />}
                style={{ background: "#10b981", borderColor: "#10b981" }}
              >
                Approved
              </Button>
              <Button
                danger
                size="small"
                onClick={() => handleReject(row)}
                icon={<CloseCircleOutlined />}
              >
                Rejected
              </Button>
            </Space>
          );
        } else if (row.approver_check === "APPROVED") {
          return (
            <Tag
              color="#34d399"
              style={{ fontWeight: 700, fontSize: 16, borderRadius: 6 }}
            >
              Approved
            </Tag>
          );
        } else if (row.approver_check === "REJECTED") {
          return (
            <Tag
              color="#f87171"
              style={{ fontWeight: 700, fontSize: 16, borderRadius: 6 }}
            >
              Rejected
            </Tag>
          );
        }
        return "-";
      },
    },
    {
      title: "CA Check",
      dataIndex: "ca_check",
      key: "ca_check",
      width: 140,
      render: (val) => (
        <Tag
          color={
            val === "APPROVED"
              ? "#34d399"
              : val === "PENDING"
                ? "#fbbf24"
                : "#f87171"
          }
          style={{ fontWeight: 700, fontSize: 16, borderRadius: 6 }}
        >
          {val || "PENDING"}
        </Tag>
      ),
    },
    {
      title: "Accounts Check",
      dataIndex: "accounts_check",
      key: "accounts_check",
      width: 140,
      render: (val) => (
        <Tag
          color={
            val === "APPROVED"
              ? "#34d399"
              : val === "PENDING"
                ? "#fbbf24"
                : "#f87171"
          }
          style={{ fontWeight: 700, fontSize: 16, borderRadius: 6 }}
        >
          {val || "-"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, row) => {
        if (row.id === editRowId) {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => handleSaveClick(row)}
                icon={<CheckOutlined />}
              >
                Save
              </Button>
            </Space>
          );
        } else {
          return (
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditClick(row)}
            />
          );
        }
      },
    },
  ];

  const rowClassName = (record) => {
    if (record.status === "COMPLETED") return "completed-row";
    if (record.status === "REJECTED") return "rejected-row";
    return "";
  };

  const getPanelHeader = (deptObj) => {
    const items = deptObj.items || [];
    const approvedCount = items.filter(
      (r) => r.approver_check === "APPROVED",
    ).length;
    const pendingCount = items.filter(
      (r) => r.approver_check === "PENDING",
    ).length;
    const rejectedCount = items.filter(
      (r) => r.approver_check === "REJECTED",
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

        {/* Statistics Cards: Total, Pending, Approved, Rejected */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderColor: "transparent", color: "#fff" }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Total</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", borderColor: "transparent", color: "#fff" }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Pending</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.pending}</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", borderColor: "transparent", color: "#fff" }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Approved</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.completed}</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", borderColor: "transparent", color: "#fff" }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Rejected</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.rejected}</div>
            </Card>
          </Col>
        </Row>

        {/* Filters: Search, Date Range, Event, Vendor */}
        <div
          className="filter-section"
          style={{
            marginBottom: 24,
            background: "#fff",
            padding: 24,
            borderRadius: 16,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Input
            placeholder="Search requirements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
            style={{ width: 280, borderRadius: 8 }}
            size="large"
          />
          <span style={{ fontWeight: 600, marginRight: 4 }}>Created date:</span>
          <RangePicker
            value={createdDateRange}
            onChange={handleCreatedDateRangeChange}
            format="DD-MM-YYYY"
            style={{ borderRadius: 8 }}
            size="large"
            placeholder={["Start date", "End date"]}
          />
          <span style={{ fontWeight: 600, marginRight: 4 }}>Required date:</span>
          <RangePicker
            value={requiredDateRange}
            onChange={handleRequiredDateRangeChange}
            format="DD-MM-YYYY"
            style={{ borderRadius: 8 }}
            size="large"
            placeholder={["Start date", "End date"]}
          />
          <Select
            placeholder="Select event"
            allowClear
            showSearch
            value={selectedEventId ?? undefined}
            onChange={setSelectedEventId}
            onSearch={handleEventSearch}
            loading={eventsLoading}
            filterOption={false}
            optionFilterProp="label"
            style={{ width: 240, borderRadius: 8 }}
            size="large"
            options={events.map((ev) => ({
              value: ev.id || ev._id,
              label: ev.clientName || ev.name || ev.client_name || String(ev.id || ev._id),
            }))}
          />
          <Select
            placeholder="Select vendor"
            allowClear
            showSearch
            value={selectedVendorId ?? undefined}
            onChange={setSelectedVendorId}
            onSearch={handleVendorSearch}
            loading={vendorsLoading}
            filterOption={false}
            optionFilterProp="label"
            style={{ width: 240, borderRadius: 8 }}
            size="large"
            options={vendors.map((v) => ({
              value: v.id || v._id,
              label: v.name || String(v.id || v._id),
            }))}
          />
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          style={{ marginBottom: 16 }}
          items={[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "completed", label: "Completed" },
            { key: "rejected", label: "Rejected" },
          ]}
        />

        {/* Accordion grouped by department */}
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
                loading={loading && !Object.keys(departmentData).length}
                columns={columns}
                dataSource={sortedRequirements(deptObj.items ? [...deptObj.items] : [])}
                pagination={false}
                scroll={{ x: 2100 }}
                size="middle"
                rowClassName={rowClassName}
              />
              {deptObj.hasMore && (
                <div style={{ textAlign: "center", padding: 12 }}>
                  <Button
                    type="default"
                    onClick={() => loadMoreForDepartment(deptId)}
                    loading={loadingMoreDeptId === deptId}
                    disabled={!!loadingMoreDeptId}
                  >
                    Load more
                  </Button>
                </div>
              )}
            </Panel>
          ))}
        </Collapse>
      </div>
    </div>
  );
};

export default RequirementTableApprover;
