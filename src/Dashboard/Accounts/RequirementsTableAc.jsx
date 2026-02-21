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
  Tag,
  Collapse,
  DatePicker,
  Tooltip,
  Select,
  Card,
  Row,
  Col,
  Tabs,
  Spin,
} from "antd";
import {
  EditOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  LockOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { API_BASE_URL } from "../../../config";

const { Panel } = Collapse;
const { Option } = Select;
const { RangePicker } = DatePicker;

const RequirementsTableAc = () => {
  const user = useSelector((state) => state.user.value);

  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
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
  const [editRowId, setEditRowId] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const eventSearchRef = useRef(null);
  const vendorSearchRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const PAGE_SIZE = 30;

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
    fetchVendors("");
  }, []);

  const getAccountsCheckParam = () => {
    if (activeTab === "all") return undefined;
    if (activeTab === "pending") return "PENDING";
    if (activeTab === "completed") return "approved";
    if (activeTab === "rejected") return "rejected";
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
    append = false,
  ) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      const accountsCheck = getAccountsCheckParam();
      if (accountsCheck) params.append("accounts_check", accountsCheck);
      if (searchQuery) params.append("search", searchQuery);
      if (createdStart) params.append("startDate", createdStart);
      if (createdEnd) params.append("endDate", createdEnd);
      if (requiredStart) params.append("required_date_start", requiredStart);
      if (requiredEnd) params.append("required_date_end", requiredEnd);
      if (eventId) params.append("event", eventId);
      if (vendorId) params.append("vendor", vendorId);
      params.append("page", String(pageNum));
      params.append("limit", String(PAGE_SIZE));

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await axios.get(
        `${API_BASE_URL}request/all${queryString}`,
        config,
      );
      const data = res.data;
      let items = [];
      if (data.departments && typeof data.departments === "object") {
        Object.entries(data.departments).forEach(([deptName, arr]) => {
          (Array.isArray(arr) ? arr : []).forEach((item) => {
            items.push({
              ...item,
              department: item.department || { id: deptName, name: deptName },
            });
          });
        });
      } else if (Array.isArray(data.items)) {
        items = data.items;
      }
      const total = data.totalItems ?? data.total ?? items.length;
      if (data.stats && typeof data.stats === "object") {
        setStats({
          total: data.stats.total ?? data.totalItems ?? total,
          pending: data.stats.pending ?? 0,
          approved: data.stats.approved ?? data.stats.completed ?? 0,
          rejected: data.stats.rejected ?? 0,
        });
      }
      setTotalItems(total);
      if (append) {
        setRequirements((prev) => {
          const next = [...prev, ...items];
          setHasMore(next.length < total);
          return next;
        });
      } else {
        setRequirements(items);
        setHasMore(items.length >= PAGE_SIZE && items.length < total);
      }
    } catch (err) {
      message.error("Failed to fetch requirements");
      if (append) setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchRequirementsData(
      search,
      createdDateRange?.[0]?.format("YYYY-MM-DD") ?? null,
      createdDateRange?.[1]?.format("YYYY-MM-DD") ?? null,
      requiredDateRange?.[0]?.format("YYYY-MM-DD") ?? null,
      requiredDateRange?.[1]?.format("YYYY-MM-DD") ?? null,
      selectedEventId || null,
      selectedVendorId || null,
      1,
      false,
    );
  }, [activeTab]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      fetchRequirementsData(
        search,
        createdDateRange?.[0]?.format("YYYY-MM-DD") ?? null,
        createdDateRange?.[1]?.format("YYYY-MM-DD") ?? null,
        requiredDateRange?.[0]?.format("YYYY-MM-DD") ?? null,
        requiredDateRange?.[1]?.format("YYYY-MM-DD") ?? null,
        selectedEventId || null,
        selectedVendorId || null,
        1,
        false,
      );
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, createdDateRange, requiredDateRange, selectedEventId, selectedVendorId]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRequirementsData(
      search,
      createdDateRange?.[0]?.format("YYYY-MM-DD") ?? null,
      createdDateRange?.[1]?.format("YYYY-MM-DD") ?? null,
      requiredDateRange?.[0]?.format("YYYY-MM-DD") ?? null,
      requiredDateRange?.[1]?.format("YYYY-MM-DD") ?? null,
      selectedEventId || null,
      selectedVendorId || null,
      nextPage,
      true,
    );
  };

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: "200px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, search, createdDateRange, requiredDateRange, selectedEventId, selectedVendorId]);

  // Compute stats from loaded data (Total from API, Pending/Approved/Rejected from requirements)
  useEffect(() => {
    const total = totalItems || requirements.length;
    const pending = requirements.filter(
      (r) =>
        r.status === "PENDING" ||
        (r.accounts_check && String(r.accounts_check).toUpperCase() === "PENDING")
    ).length;
    const approved = requirements.filter(
      (r) =>
        r.status === "COMPLETED" ||
        (r.accounts_check && (String(r.accounts_check).toUpperCase() === "APPROVED" || String(r.accounts_check).toLowerCase() === "approved"))
    ).length;
    const rejected = requirements.filter(
      (r) =>
        r.status === "REJECTED" ||
        (r.accounts_check && String(r.accounts_check).toUpperCase() === "REJECTED")
    ).length;
    setStats((prev) =>
      prev.total === total && prev.pending === pending && prev.approved === approved && prev.rejected === rejected
        ? prev
        : { total, pending, approved, rejected }
    );
  }, [requirements, totalItems]);

  // Group requirements by department (backend now sends data per tab; no client-side filter)
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
    // For string fields (entity_account, amount_paid_to), don't validate as number
    if (editField === "entity_account" || editField === "amount_paid_to") {
      if (!editValue || editValue.trim() === "") {
        message.error("Please enter a valid value");
        return;
      }
      try {
        await axios.patch(
          `${API_BASE_URL}request/${row.id}`,
          { [editField]: editValue },
          config,
        );
        message.success(
          `${editField === "entity_account" ? "Entity" : "Paid to"} updated`,
        );
        setEditRowId(null);
        setEditField(null);
        setEditValue(null);
        fetchRequirementsData(
          search,
          createdDateRange?.[0]?.format("YYYY-MM-DD"),
          createdDateRange?.[1]?.format("YYYY-MM-DD"),
          requiredDateRange?.[0]?.format("YYYY-MM-DD"),
          requiredDateRange?.[1]?.format("YYYY-MM-DD"),
          selectedEventId || null,
          selectedVendorId || null,
          1,
          false,
        );
      } catch {
        message.error(
          `Failed to update ${
            editField === "entity_account" ? "entity" : "paid to"
          }`,
        );
      }
      return;
    }

    // For numeric fields
    if (editValue == null || isNaN(editValue)) {
      message.error("Please enter a valid number");
      return;
    }
    // Validate amount_paid against approver_amount
    if (editField === "amount_paid") {
      const approvedAmount = row.approver_amount || 0;
      if (Number(editValue) > approvedAmount) {
        message.error(
          `Amount paid cannot exceed approved amount (₹${approvedAmount})`,
        );
        return;
      }
    }
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { [editField]: Number(editValue) },
        config,
      );
      message.success(
        `${
          editField === "planned_amount" ? "Planned amount" : "Amount paid"
        } updated`,
      );
      setEditRowId(null);
      setEditField(null);
      setEditValue(null);
      fetchRequirementsData(
        search,
        createdDateRange?.[0]?.format("YYYY-MM-DD"),
        createdDateRange?.[1]?.format("YYYY-MM-DD"),
        requiredDateRange?.[0]?.format("YYYY-MM-DD"),
        requiredDateRange?.[1]?.format("YYYY-MM-DD"),
        selectedEventId || null,
        selectedVendorId || null,
        1,
        false,
      );
    } catch {
      message.error(
        `Failed to update ${
          editField === "planned_amount" ? "planned amount" : "amount paid"
        }`,
      );
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
      fetchRequirementsData(
        search,
        createdDateRange?.[0]?.format("YYYY-MM-DD"),
        createdDateRange?.[1]?.format("YYYY-MM-DD"),
        requiredDateRange?.[0]?.format("YYYY-MM-DD"),
        requiredDateRange?.[1]?.format("YYYY-MM-DD"),
        selectedEventId || null,
        selectedVendorId || null,
        1,
        false,
      );
    } catch {
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
      fetchRequirementsData(
        search,
        createdDateRange?.[0]?.format("YYYY-MM-DD"),
        createdDateRange?.[1]?.format("YYYY-MM-DD"),
        requiredDateRange?.[0]?.format("YYYY-MM-DD"),
        requiredDateRange?.[1]?.format("YYYY-MM-DD"),
        selectedEventId || null,
        selectedVendorId || null,
        1,
        false,
      );
    } catch {
      message.error("Failed to reject request");
    }
  };

  const startEdit = (row, field) => {
    setEditRowId(row.id);
    setEditField(field);
    setEditValue(row[field] ?? 0);
  };

  const onEditChange = (e) => {
    // Handle both Input change events and Select direct values
    if (e && e.target) {
      setEditValue(e.target.value);
    } else {
      setEditValue(e);
    }
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
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (text) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#000",
            alignItems: "center",
            justifyContent: "center",
            justifyItems: "center",
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
            {planned_amount?.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            }) || "₹0"}
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
              {planned_amount?.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              }) || "₹0"}
            </span>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => startEdit(row, "planned_amount")}
            />
          </Space>
        ),
    },
    {
      title: "Approved Amount",
      dataIndex: "approver_amount",
      key: "approver_amount",
      width: 180,
      render: (approver_amount) => (
        <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>
          {approver_amount?.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          }) || "₹0"}
        </span>
      ),
    },
    {
      title: "Approver Check",
      dataIndex: "approver_check",
      key: "approver_check",
      width: 160,
      render: (approver_check, row) => {
        const status = approver_check || row.approver_check || "PENDING";
        const color =
          status === "APPROVED"
            ? "green"
            : status === "REJECTED"
              ? "red"
              : "orange";
        return (
          <Tag
            color={color}
            style={{ borderRadius: 8, fontWeight: 700, fontSize: 14 }}
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: "CA Check",
      dataIndex: "ca_check",
      key: "ca_check",
      width: 160,
      render: (ca_check) => {
        const status = ca_check || "PENDING";
        const color =
          status === "APPROVED"
            ? "green"
            : status === "REJECTED"
              ? "red"
              : "orange";
        return (
          <Tag
            color={color}
            style={{ borderRadius: 8, fontWeight: 700, fontSize: 14 }}
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Amount Paid",
      dataIndex: "amount_paid",
      key: "amount_paid",
      width: 180,
      render: (amount_paid, row) => {
        const checkApproved = (v) => {
          if (v === true) return true;
          if (!v && v !== 0) return false;
          if (typeof v === "string") return v.toUpperCase() === "APPROVED";
          if (typeof v === "object")
            return (
              (v.status && v.status.toString().toUpperCase() === "APPROVED") ||
              v.approved === true
            );
          return false;
        };
        const checkRejected = (v) => {
          if (v === false) return true;
          if (!v && v !== 0) return false;
          if (typeof v === "string") return v.toUpperCase() === "REJECTED";
          if (typeof v === "object")
            return (
              (v.status && v.status.toString().toUpperCase() === "REJECTED") ||
              v.rejected === true
            );
          return false;
        };

        const approved =
          checkApproved(row.approver_check) ||
          checkApproved(row.owner_check) ||
          checkApproved(row.ca_check);
        const rejected =
          checkRejected(row.approver_check) ||
          checkRejected(row.owner_check) ||
          row.status === "REJECTED";

        // If rejected -> not editable, show plain value
        if (rejected) {
          return (
            <span style={{ color: "#9ca3af", fontWeight: 700, fontSize: 18 }}>
              {amount_paid?.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              }) || "₹0"}
            </span>
          );
        }

        // If approved -> allow edit
        if (approved && row.id === editRowId && editField === "amount_paid") {
          const approvedAmount = row.approver_amount || 0;
          return (
            <Space>
              <Input
                style={{ width: 120, fontWeight: 600, fontSize: 18 }}
                value={editValue}
                onChange={onEditChange}
                size="small"
                placeholder={`Max: ₹${approvedAmount}`}
              />
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="small"
                onClick={() => handleEditSave(row)}
                style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
              />
            </Space>
          );
        }

        // Show edit icon when approved, lock when pending
        return (
          <Space>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
              {amount_paid?.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              }) || "₹0"}
            </span>
            {approved ? (
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => startEdit(row, "amount_paid")}
              />
            ) : (
              <Tooltip title={"Awaiting approver/owner/CA approval"}>
                <LockOutlined style={{ color: "#9ca3af", fontSize: 18 }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: "Entity",
      dataIndex: "entity_account",
      key: "entity_account",
      width: 250,
      render: (entity_account, row) => {
        const checkApproved = (v) => {
          if (v === true) return true;
          if (!v && v !== 0) return false;
          if (typeof v === "string") return v.toUpperCase() === "APPROVED";
          if (typeof v === "object")
            return (
              (v.status && v.status.toString().toUpperCase() === "APPROVED") ||
              v.approved === true
            );
          return false;
        };
        const checkRejected = (v) => {
          if (v === false) return true;
          if (!v && v !== 0) return false;
          if (typeof v === "string") return v.toUpperCase() === "REJECTED";
          if (typeof v === "object")
            return (
              (v.status && v.status.toString().toUpperCase() === "REJECTED") ||
              v.rejected === true
            );
          return false;
        };

        const approved =
          checkApproved(row.approver_check) ||
          checkApproved(row.owner_check) ||
          checkApproved(row.ca_check);
        const rejected =
          checkRejected(row.approver_check) ||
          checkRejected(row.owner_check) ||
          row.status === "REJECTED";

        if (rejected) {
          return (
            <span style={{ color: "#9ca3af", fontWeight: 700, fontSize: 18 }}>
              {entity_account || "-"}
            </span>
          );
        }

        if (
          approved &&
          row.id === editRowId &&
          editField === "entity_account"
        ) {
          return (
            <Space>
              <Select
                size="small"
                value={editValue}
                onChange={onEditChange}
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
              </Select>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="small"
                onClick={() => handleEditSave(row)}
                style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
              />
            </Space>
          );
        }

        return (
          <Space>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
              {entity_account || "-"}
            </span>
            {approved ? (
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => startEdit(row, "entity_account")}
              />
            ) : (
              <Tooltip title={"Awaiting approver/owner/CA approval"}>
                <LockOutlined style={{ color: "#9ca3af", fontSize: 18 }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: "Paid To",
      dataIndex: "amount_paid_to",
      key: "amount_paid_to",
      width: 200,
      render: (amount_paid_to, row) => {
        const checkApproved = (v) => {
          if (v === true) return true;
          if (!v && v !== 0) return false;
          if (typeof v === "string") return v.toUpperCase() === "APPROVED";
          if (typeof v === "object")
            return (
              (v.status && v.status.toString().toUpperCase() === "APPROVED") ||
              v.approved === true
            );
          return false;
        };
        const checkRejected = (v) => {
          if (v === false) return true;
          if (!v && v !== 0) return false;
          if (typeof v === "string") return v.toUpperCase() === "REJECTED";
          if (typeof v === "object")
            return (
              (v.status && v.status.toString().toUpperCase() === "REJECTED") ||
              v.rejected === true
            );
          return false;
        };

        const approved =
          checkApproved(row.approver_check) ||
          checkApproved(row.owner_check) ||
          checkApproved(row.ca_check);
        const rejected =
          checkRejected(row.approver_check) ||
          checkRejected(row.owner_check) ||
          row.status === "REJECTED";

        if (rejected) {
          return (
            <span style={{ color: "#9ca3af", fontWeight: 700, fontSize: 18 }}>
              {amount_paid_to || "-"}
            </span>
          );
        }

        if (
          approved &&
          row.id === editRowId &&
          editField === "amount_paid_to"
        ) {
          return (
            <Space>
              <Input
                style={{ width: 150, fontWeight: 600, fontSize: 18 }}
                value={editValue}
                onChange={onEditChange}
                size="small"
                placeholder="Enter name"
              />
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="small"
                onClick={() => handleEditSave(row)}
                style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
              />
            </Space>
          );
        }

        return (
          <Space>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
              {amount_paid_to || "-"}
            </span>
            {approved ? (
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => startEdit(row, "amount_paid_to")}
              />
            ) : (
              <Tooltip title={"Awaiting approver/owner/CA approval"}>
                <LockOutlined style={{ color: "#9ca3af", fontSize: 18 }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 250,
      fixed: "right",
      render: (_, row) => {
        const isAmountPaidFilled = row.amount_paid && row.amount_paid > 0;

        return (
          <Space>
            {row.accounts_check === "PENDING" ? (
              <>
                <Tooltip
                  title={
                    !isAmountPaidFilled
                      ? "Amount paid must be filled before completing"
                      : ""
                  }
                >
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleComplete(row)}
                    icon={<CheckCircleOutlined />}
                    disabled={!isAmountPaidFilled}
                    style={{
                      background: isAmountPaidFilled ? "#10b981" : "#d1d5db",
                      borderColor: isAmountPaidFilled ? "#10b981" : "#d1d5db",
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: isAmountPaidFilled ? "pointer" : "not-allowed",
                    }}
                  >
                    Completed
                  </Button>
                </Tooltip>
                <Button
                  danger
                  size="small"
                  onClick={() => handleReject(row)}
                  icon={<CloseCircleOutlined />}
                  style={{ fontWeight: 700, fontSize: 18 }}
                >
                  Rejected
                </Button>
              </>
            ) : (
              <span style={{ fontWeight: 700, fontSize: 18, color: "#555" }}>
                {row.status}
              </span>
            )}
          </Space>
        );
      },
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
        <span className="text-white">
          {deptObj.department?.name || "Unknown Department"}
        </span>
        <span className="text-white">
          Approved: {approvedCount} | Pending: {pendingCount} | Rejected:{" "}
          {rejectedCount} | Total: {total}
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

      <div
        style={{
          padding: "32px",
          background: "transparent",
          minHeight: "100vh",
          position: "relative",
          zIndex: 10,
        }}
      >
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
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.approved}</div>
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

        <div ref={scrollContainerRef}>
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
                  scroll={{ x: 2000 }}
                  size="middle"
                  rowClassName={rowClassName}
                />
              </Panel>
            ))}
          </Collapse>
          <div ref={loadMoreRef} style={{ height: 20, textAlign: "center", padding: 8 }}>
            {loadingMore && <Spin size="small" />}
            {!hasMore && requirements.length > 0 && <span style={{ color: "#888" }}>No more data</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementsTableAc;
