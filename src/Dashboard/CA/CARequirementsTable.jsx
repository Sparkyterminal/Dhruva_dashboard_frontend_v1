import React, { useEffect, useState, useRef } from "react";
import RequestsHeader from "../../Components/RequestsDashboard";
import { useSelector } from "react-redux";
import {
  Table,
  Button,
  message,
  Tag,
  Space,
  Input,
  DatePicker,
  Collapse,
  Select,
  Spin,
  Tabs,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  CheckOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axiosClient from "@/api/axiosClient";
import dayjs from "dayjs";
import { getEffectiveCutoffDate } from "../../utils/dataCutoff";
import { Modal } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const { Panel } = Collapse;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CARequirementsTable = () => {
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
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
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
  const [approvingId, setApprovingId] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTargetRow, setDeleteTargetRow] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const fetchEvents = async (query = "") => {
    setEventsLoading(true);
    try {
      const res = await axiosClient.get(`events`, {
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
      const res = await axiosClient.get(`vendor/list`, {
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

  const getCaCheckParam = () => {
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
      const caCheck = getCaCheckParam();
      if (caCheck) params.append("ca_check", caCheck);
      if (searchQuery) params.append("search", searchQuery);
      if (createdStart) params.append("startDate", createdStart);
      if (createdEnd) params.append("endDate", createdEnd);
      // Default to the data-visibility cutoff when the caller hasn't picked
      // its own required-date filter — a real, server-filtered query.
      const effectiveRequiredStart = requiredStart ?? getEffectiveCutoffDate(user);
      if (effectiveRequiredStart)
        params.append("required_date_start", effectiveRequiredStart);
      if (requiredEnd) params.append("required_date_end", requiredEnd);
      if (eventId) params.append("event", eventId);
      if (vendorId) params.append("vendor", vendorId);
      if (departmentId) params.append("department", departmentId);
      params.append("page", String(pageNum));
      params.append("limit", String(PAGE_SIZE));

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await axiosClient.get(
        `request/all${queryString}`,
        config,
      );
      const data = res.data;
      const pagination = data.pagination || {};
      const hasNextPage =
        pagination.hasNextPage ??
        pagination.totalItems >
          (pagination.currentPage || pageNum) * (pagination.size || PAGE_SIZE);

      if (data.departments && typeof data.departments === "object") {
        if (departmentId && append) {
          const list = [];
          Object.entries(data.departments).forEach(([, arr]) => {
            (Array.isArray(arr) ? arr : []).forEach((item) =>
              list.push({ ...item, department: item.department || {} }),
            );
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
          let responseDeptKey = null;
          Object.entries(data.departments).forEach(([deptName, arr]) => {
            responseDeptKey = deptName;
            (Array.isArray(arr) ? arr : []).forEach((item) =>
              normalized.push({
                ...item,
                department: item.department || {
                  id: deptName,
                  name: deptName,
                  _id: item.department?._id || departmentId,
                },
              }),
            );
          });
          if (normalized.length > 0 && responseDeptKey) {
            const stateKey = responseDeptKey;
            setDepartmentData((prev) => ({
              ...prev,
              [stateKey]: {
                department: normalized[0]?.department || {
                  id: departmentId,
                  _id: departmentId,
                  name: responseDeptKey,
                },
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
              items: list.map((item) => ({
                ...item,
                department: item.department || d,
              })),
              page: 1,
              hasMore: hasNextPage,
            };
          });
          setDepartmentData(nextDepts);
        }
      } else if (Array.isArray(data.items)) {
        const items = data.items || [];
        if (departmentId) {
          setDepartmentData((prev) => {
            const stateKey =
              items[0]?.department?.name ||
              (() => {
                const entry = Object.entries(prev || {}).find(
                  ([, v]) =>
                    v?.department?._id === departmentId ||
                    v?.department?.id === departmentId,
                );
                return entry ? entry[0] : departmentId;
              })();
            const existing = prev[stateKey] || prev[departmentId];
            const dept = existing?.department ||
              items[0]?.department || {
                id: departmentId,
                _id: departmentId,
                name: stateKey,
              };
            return {
              ...prev,
              [stateKey]: {
                department: dept,
                items: items.map((item) => ({
                  ...item,
                  department: item.department || dept,
                })),
                page: pageNum,
                hasMore: hasNextPage,
              },
            };
          });
        } else {
          const byDept = items.reduce((acc, item) => {
            const d = item.department || { id: "unknown", name: "Unknown" };
            const id = d.id || "unknown";
            if (!acc[id])
              acc[id] = { department: d, items: [], page: 1, hasMore: true };
            acc[id].items.push(item);
            return acc;
          }, {});
          setDepartmentData(byDept);
        }
      }

      const total = pagination.totalItems ?? data.totalItems ?? data.total ?? 0;
      setTotalItems(total);
      if (data.stats && typeof data.stats === "object") {
        setStats({
          total: data.stats.total ?? data.totalItems ?? total,
          pending: data.stats.pending ?? 0,
          approved: data.stats.approved ?? data.stats.completed ?? 0,
          rejected: data.stats.rejected ?? 0,
        });
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch requirements");
      if (departmentId && append) {
        setDepartmentData((prev) => {
          const existing = prev[departmentId];
          return existing
            ? { ...prev, [departmentId]: { ...existing, hasMore: false } }
            : prev;
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
    return fetchRequirementsData(
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
    const delayDebounceFn = setTimeout(() => {
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
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [
    search,
    createdDateRange,
    requiredDateRange,
    selectedEventId,
    selectedVendorId,
  ]);

  const allItems = Object.values(departmentData).flatMap((d) => d.items || []);
  useEffect(() => {
    const total = totalItems || allItems.length;
    const pending = allItems.filter(
      (r) => r.ca_check === "PENDING" || (r.status && r.status === "PENDING"),
    ).length;
    const approved = allItems.filter(
      (r) =>
        r.ca_check === "APPROVED" || (r.status && r.status === "COMPLETED"),
    ).length;
    const rejected = allItems.filter(
      (r) => r.ca_check === "REJECTED" || (r.status && r.status === "REJECTED"),
    ).length;
    setStats((prev) =>
      prev.total === total &&
      prev.pending === pending &&
      prev.approved === approved &&
      prev.rejected === rejected
        ? prev
        : { total, pending, approved, rejected },
    );
  }, [departmentData, totalItems]);

  const requirementsByDept = departmentData;

  const sortedRequirements = (list) => {
    return list.sort((a, b) => {
      const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (
        priorityOrder[a.priority || "LOW"] - priorityOrder[b.priority || "LOW"]
      );
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
    const id = row._id || row.id;
    setEditRowId(id);
    setEditPlannedAmount(row.planned_amount || "");
    setEditAmountPaid(row.amount_paid || "");
    setEditApproverAmount(row.approver_amount || "");
    setEditEntityAccount(row.entity_account || "");
    setEditAmountPaidTo(row.amount_paid_to || "");
  };

  const handlePlannedAmountChange = (e) => setEditPlannedAmount(e.target.value);
  const handleAmountPaidChange = (e) => setEditAmountPaid(e.target.value);
  const handleApproverAmountChange = (e) =>
    setEditApproverAmount(e.target.value);
  const handleEntityAccountChange = (value) => setEditEntityAccount(value);
  const handleAmountPaidToChange = (e) => setEditAmountPaidTo(e.target.value);

  // Save the editable fields: planned_amount, amount_paid, and approver_amount
  const handleSaveClick = async (row) => {
    try {
      const payload = {
        planned_amount: parseFloat(editPlannedAmount) || row.planned_amount,
        amount_paid: parseFloat(editAmountPaid) || row.amount_paid,
        approver_amount: parseFloat(editApproverAmount) || row.approver_amount,
        entity_account: editEntityAccount || row.entity_account,
        amount_paid_to: editAmountPaidTo || row.amount_paid_to,
      };

      const id = row._id || row.id;
      await axiosClient.patch(`request/${id}`, payload, config);

      message.success("Updated successfully ✅");
      setEditRowId(null);
      refetchDepartment(row.department?._id || row.department?.id);
    } catch (err) {
      console.error(err);
      message.error("Failed to update ❌");
    }
  };

  const handleComplete = async (row) => {
    const id = row._id || row.id;
    setApprovingId(id);
    try {
      await axiosClient.patch(
        `request/${id}`,
        { ca_check: "APPROVED", ca_approved: true },
        config,
      );
      message.success("CA Approved ✅");
      await refetchDepartment(row.department?._id || row.department?.id);
    } catch (err) {
      console.error(err);
      message.error("Failed to approve ❌");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (row) => {
    const id = row._id || row.id;
    setApprovingId(id);
    try {
      await axiosClient.patch(
        `request/${id}`,
        { ca_check: "REJECTED", ca_approved: false },
        config,
      );
      message.success("CA Rejected ❌");
      await refetchDepartment(row.department?._id || row.department?.id);
    } catch (err) {
      console.error(err);
      message.error("Failed to reject ❌");
    } finally {
      setApprovingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetRow) return;
    setDeleteLoading(true);
    try {
      const id = deleteTargetRow._id || deleteTargetRow.id;
      await axiosClient.delete(`request/${id}`, config);
      message.success("Request deleted successfully");
      setDeleteModalVisible(false);
      setDeleteTargetRow(null);
      refetchDepartment(
        deleteTargetRow.department?._id || deleteTargetRow.department?.id,
      );
    } catch {
      message.error("Failed to delete request");
    } finally {
      setDeleteLoading(false);
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
    // {
    //   title: "Requested At",
    //   dataIndex: "createdAt",
    //   key: "createdAt",
    //   width: 150,
    //   render: (date) => (
    //     <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
    //       {date ? dayjs(date).format("DD-MM-YYYY HH:mm") : "-"}
    //     </span>
    //   ),
    // },
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
      render: (val) => (
        <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
          {val || "-"}
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
      title: "Group by",
      dataIndex: "groupBy",
      key: "groupBy",
      width: 140,
      render: (_, record) => (
        <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
          {record?.groupBy && typeof record.groupBy === "object"
            ? record.groupBy.name || "-"
            : "-"}
        </span>
      ),
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      width: 180,
      render: (remarks) => (
        <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
          {remarks ? String(remarks) : "-"}
        </span>
      ),
    },
    {
      title: "Required Date",
      dataIndex: "required_date",
      key: "required_date",
      width: 150,
      render: (date) => (
        <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
          {date ? dayjs(date).format("DD-MM-YYYY") : "-"}
        </span>
      ),
    },
    {
      title: "Expected In",
      dataIndex: "transation_in",
      key: "transation_in",
      width: 120,
      render: (text) => (
        <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
          {text || "-"}
        </span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (val) => (
        <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
          ₹{val || 0}
        </span>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (priority) => (
        <Tag
          color={
            priority === "HIGH"
              ? "#fee2e2"
              : priority === "MEDIUM"
                ? "#fef3c7"
                : "#e0eee1"
          }
          style={{
            color:
              priority === "HIGH"
                ? "#991b1b"
                : priority === "MEDIUM"
                  ? "#92400e"
                  : "#3a934c",
            borderRadius: 6,
            border: "none",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {priority || "-"}
        </Tag>
      ),
    },
    {
      title: "Planned Amount",
      dataIndex: "planned_amount",
      key: "planned_amount",
      width: 180,
      render: (val, row) => {
        if (editRowId === (row._id || row.id)) {
          return (
            <Input
              value={editPlannedAmount}
              onChange={handlePlannedAmountChange}
              placeholder="Planned Amount"
              type="number"
              style={{ width: 140 }}
            />
          );
        }
        return (
          <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
            ₹{val || 0}
          </span>
        );
      },
    },
    {
      title: "Approver Amount",
      dataIndex: "approver_amount",
      key: "approver_amount",
      width: 180,
      render: (val, row) => {
        if (editRowId === (row._id || row.id)) {
          return (
            <Input
              value={editApproverAmount}
              onChange={handleApproverAmountChange}
              placeholder="Approver Amount"
              type="number"
              style={{ width: 140 }}
            />
          );
        }
        return (
          <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
            ₹{val || 0}
          </span>
        );
      },
    },
    {
      title: "Amount Paid",
      dataIndex: "amount_paid",
      key: "amount_paid",
      width: 180,
      render: (val, row) => {
        if (editRowId === (row._id || row.id)) {
          return (
            <Input
              value={editAmountPaid}
              onChange={handleAmountPaidChange}
              placeholder="Amount Paid"
              type="number"
              style={{ width: 140 }}
            />
          );
        }
        return (
          <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
            ₹{val || 0}
          </span>
        );
      },
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
              fontSize: 18,
              fontWeight: 700,
              color: balance < 0 ? "#dc2626" : "#000",
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
      title: "Entity Account",
      dataIndex: "entity_account",
      key: "entity_account",
      width: 220,
      render: (val, row) => {
        if (editRowId === (row._id || row.id)) {
          return (
            <Select
              value={editEntityAccount}
              onChange={handleEntityAccountChange}
              placeholder="Select Entity Account"
              style={{ width: 200 }}
            >
              <Option value="Blue Pulse Ventures Pvt Lmtd.">
                Blue Pulse Ventures Pvt Lmtd.
              </Option>
              <Option value="Nandini Multipurpose Pvt Lmtd.">
                Nandini Multipurpose Pvt Lmtd.
              </Option>
              <Option value="Sky Blue Event Management India Pvt Lmtd.">
                Sky Blue Event Management India Pvt Lmtd.
              </Option>
              <Option value="Sky blue ICICI">Sky blue ICICI</Option>
              <Option value="Sky blue HDFC">Sky blue HDFC</Option>
              <Option value="Dhrua Kumar H P">Dhrua Kumar H P</Option>
              <Option value="MM account">MM account</Option>
              <Option value="Cash Payment">Cash Payment</Option>
            </Select>
          );
        }
        return (
          <span style={{ fontSize: 16, color: "#000", fontWeight: 700 }}>
            {val || "-"}
          </span>
        );
      },
    },
    {
      title: "Amount Paid To",
      dataIndex: "amount_paid_to",
      key: "amount_paid_to",
      width: 180,
      render: (val, row) => {
        if (editRowId === (row._id || row.id)) {
          return (
            <Input
              value={editAmountPaidTo}
              onChange={handleAmountPaidToChange}
              placeholder="Amount Paid To"
              style={{ width: 160 }}
            />
          );
        }
        return (
          <span style={{ fontSize: 16, color: "#000", fontWeight: 700 }}>
            {val || "-"}
          </span>
        );
      },
    },
    {
      title: "Approver Check",
      dataIndex: "approver_check",
      key: "approver_check",
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
      title: "CA Check",
      dataIndex: "ca_check",
      key: "ca_check",
      width: 200,
      render: (_, row) => {
        const isApproving = approvingId === (row._id || row.id);
        if (row.ca_check === "PENDING") {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                loading={isApproving}
                disabled={isApproving}
                onClick={() => handleComplete(row)}
                icon={<CheckCircleOutlined />}
                style={{ background: "#2f8a4b", borderColor: "#2f8a4b" }}
              >
                Approve
              </Button>
              <Button
                danger
                size="small"
                loading={isApproving}
                disabled={isApproving}
                onClick={() => handleReject(row)}
                icon={<CloseCircleOutlined />}
              >
                Reject
              </Button>
            </Space>
          );
        } else if (row.ca_check === "APPROVED") {
          return (
            <Tag
              color="#34d399"
              style={{ fontWeight: 700, fontSize: 16, borderRadius: 6 }}
            >
              Approved
            </Tag>
          );
        } else if (row.ca_check === "REJECTED") {
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
    // {
    //   title: "Accounts Check",
    //   dataIndex: "accounts_check",
    //   key: "accounts_check",
    //   width: 140,
    //   render: (val) => (
    //     <Tag
    //       color={
    //         val === "APPROVED"
    //           ? "#34d399"
    //           : val === "PENDING"
    //             ? "#fbbf24"
    //             : "#f87171"
    //       }
    //       style={{ fontWeight: 700, fontSize: 16, borderRadius: 6 }}
    //     >
    //       {val || "-"}
    //     </Tag>
    //   ),
    // },
    // {
    //   title: "Owner Check",
    //   dataIndex: "owner_check",
    //   key: "owner_check",
    //   width: 140,
    //   render: (val) => (
    //     <Tag
    //       color={
    //         val === "APPROVED"
    //           ? "#34d399"
    //           : val === "PENDING"
    //             ? "#fbbf24"
    //             : "#f87171"
    //       }
    //       style={{ fontWeight: 700, fontSize: 16, borderRadius: 6 }}
    //     >
    //       {val || "-"}
    //     </Tag>
    //   ),
    // },
    // {
    //   title: "Status",
    //   dataIndex: "status",
    //   key: "status",
    //   width: 140,
    //   render: (val) => (
    //     <Tag
    //       color={
    //         val === "COMPLETED"
    //           ? "#34d399"
    //           : val === "PENDING"
    //             ? "#fbbf24"
    //             : "#f87171"
    //       }
    //       style={{ fontWeight: 700, fontSize: 16, borderRadius: 6 }}
    //     >
    //       {val || "-"}
    //     </Tag>
    //   ),
    // },
    // {
    //   title: "Actions",
    //   key: "actions",
    //   width: 100,
    //   fixed: "right",
    //   render: (_, row) => {
    //     if (editRowId === (row._id || row.id)) {
    //       return (
    //         <Button
    //           type="primary"
    //           size="small"
    //           onClick={() => handleSaveClick(row)}
    //           icon={<CheckOutlined />}
    //         >
    //           Save
    //         </Button>
    //       );
    //     }
    //     return (
    //       <Button
    //         type="default"
    //         size="small"
    //         onClick={() => handleEditClick(row)}
    //         icon={<EditOutlined />}
    //       >
    //         Edit
    //       </Button>
    //     );
    //   },
    // },
    {
      title: "Actions",
      key: "actions",
      width: 160, // wider to fit both Edit/Save + Delete
      fixed: "right",
      render: (_, row) => {
        const rowId = row._id || row.id;
        return (
          <Space>
            {editRowId === rowId ? (
              <Button
                type="primary"
                size="small"
                onClick={() => handleSaveClick(row)}
                icon={<CheckOutlined />}
              >
                Save
              </Button>
            ) : (
              <Button
                type="default"
                size="small"
                onClick={() => handleEditClick(row)}
                icon={<EditOutlined />}
              >
                Edit
              </Button>
            )}

            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{ fontWeight: 700 }}
              onClick={() => {
                setDeleteTargetRow(row);
                setDeleteModalVisible(true);
              }}
            >
              Delete
            </Button>
          </Space>
        );
      },
    },
  ];

  const rowClassName = (record) => {
    if (record.status === "COMPLETED") return "ca-row-completed";
    if (record.status === "REJECTED") return "ca-row-rejected";
    if (record.ca_check === "APPROVED") return "ca-row-ca-approved";
    return "";
  };

  const getPanelHeader = (deptObj) => {
    const items = deptObj.items || [];
    const approvedCount = items.filter((r) => r.ca_check === "APPROVED").length;
    const pendingCount = items.filter((r) => r.ca_check === "PENDING").length;
    const rejectedCount = items.filter((r) => r.ca_check === "REJECTED").length;
    return (
      <div className="ca-panel-header">
        <span>{deptObj.department?.name || "No Department"}</span>
        <span>
          CA Approved: {approvedCount} · Pending: {pendingCount} · Rejected:{" "}
          {rejectedCount}
        </span>
      </div>
    );
  };

  return (
    <div className="ca-requirements-page rd-page">
      <div className="ca-content">
        <RequestsHeader title="CA Dashboard" subtitle="Review and approve requirements" stats={stats} />

        <div className="ca-filter-card" style={{ marginBottom: 24 }}>
          <Space size="middle" wrap>
            <Input
              placeholder="Search by purpose, requester..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              style={{ width: 280, borderRadius: 10 }}
              size="large"
              allowClear
            />
            <span style={{ fontWeight: 600, marginRight: 4 }}>
              Created date:
            </span>
            <RangePicker
              value={createdDateRange}
              onChange={handleCreatedDateRangeChange}
              format="DD-MM-YYYY"
              style={{ borderRadius: 10 }}
              size="large"
              placeholder={["Start date", "End date"]}
            />
            <span style={{ fontWeight: 600, marginRight: 4 }}>
              Required date:
            </span>
            <RangePicker
              value={requiredDateRange}
              onChange={handleRequiredDateRangeChange}
              format="DD-MM-YYYY"
              style={{ borderRadius: 10 }}
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
              style={{ width: 240, borderRadius: 10 }}
              size="large"
              options={events.map((ev) => ({
                value: ev.id || ev._id,
                label:
                  ev.clientName ||
                  ev.name ||
                  ev.client_name ||
                  String(ev.id || ev._id),
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
              style={{ width: 240, borderRadius: 10 }}
              size="large"
              options={vendors.map((v) => ({
                value: v.id || v._id,
                label: v.name || String(v.id || v._id),
              }))}
            />
          </Space>
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

        {loading && !Object.keys(departmentData).length ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Collapse
            defaultActiveKey={Object.keys(requirementsByDept)}
            accordion={false}
            bordered={false}
            expandIconPosition="end"
          >
            {Object.entries(requirementsByDept).map(([deptId, deptObj]) => (
              <Panel key={deptId} header={getPanelHeader(deptObj)}>
                <Table
                  columns={columns}
                  dataSource={sortedRequirements(
                    deptObj.items ? [...deptObj.items] : [],
                  )}
                  rowKey="id"
                  loading={loading && !Object.keys(departmentData).length}
                  pagination={false}
                  scroll={{ x: 2940 }}
                  size="middle"
                  bordered
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
        )}
      </div>
      <Modal
        title={
          <span style={{ fontWeight: 700, fontSize: 20 }}>Confirm Delete</span>
        }
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeleteTargetRow(null);
        }}
        okText="Yes, Delete"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          loading: deleteLoading,
          style: { fontWeight: 700 },
        }}
        cancelButtonProps={{ style: { fontWeight: 700 } }}
        centered
      >
        <p style={{ fontSize: 18, fontWeight: 600 }}>
          Are you sure you want to delete this request?{" "}
          <span style={{ color: "#dc2626" }}>
            This action cannot be undone.
          </span>
        </p>
        {deleteTargetRow && (
          <p style={{ fontSize: 16, color: "#6b7280" }}>
            Purpose: <strong>{deleteTargetRow.purpose || "-"}</strong>
            <br />
            Department:{" "}
            <strong>{deleteTargetRow.department?.name || "-"}</strong>
          </p>
        )}
      </Modal>
    </div>
  );
};

export default CARequirementsTable;
