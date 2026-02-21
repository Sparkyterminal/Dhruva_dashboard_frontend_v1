import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Table, message, Spin, Alert, InputNumber } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../../../config";
import AgreedAmountBreakupCard from "./AgreedAmountBreakupCard";

const ACCOUNT_PERCENT = 0.8; // 80% of event account amount – max we can allocate as "account"

const formatINR = (val) => {
  if (val == null || isNaN(Number(val))) return "—";
  return `₹${Number(val).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
};

/**
 * Event account amount used for the 80% pool. Matches the "Account Amount"
 * shown in Agreed Amount & Breakup (first eventType, same as the card).
 */
const getEventAccountTotal = (event) => {
  if (!event?.eventTypes?.length) return 0;
  const first = event.eventTypes[0];
  return Number(first?.accountAmount) || 0;
};

const AccountsBudgetReportMgmt = () => {
  const { id: reportId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const [report, setReport] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendorRows, setVendorRows] = useState([]);

  const config = useMemo(
    () => ({ headers: { Authorization: user?.access_token } }),
    [user?.access_token],
  );

  const fetchReport = useCallback(async () => {
    if (!reportId) return null;
    const res = await axios.get(
      `${API_BASE_URL}budget-report/${reportId}`,
      config,
    );
    const raw = res.data?.data ?? res.data;
    return raw;
  }, [reportId, config]);

  const fetchEvent = useCallback(
    async (eventId) => {
      if (!eventId) return null;
      try {
        const res = await axios.get(
          `${API_BASE_URL}events/${eventId}`,
          config,
        );
        return res.data?.data ?? res.data?.event ?? res.data ?? null;
      } catch (e) {
        console.warn("Could not fetch event details:", e);
        return null;
      }
    },
    [config],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await fetchReport();
      if (!raw) {
        setError("Report not found.");
        setLoading(false);
        return;
      }

      const budgetData = raw?.budgetData ?? raw;
      const eventIdRef = raw?.eventId ?? raw?.event?._id ?? raw?.event;
      const eventId =
        typeof eventIdRef === "string"
          ? eventIdRef
          : eventIdRef?._id ?? null;

      let eventObj = typeof eventIdRef === "object" && eventIdRef?.eventTypes
        ? eventIdRef
        : null;
      if (!eventObj && eventId) {
        eventObj = await fetchEvent(eventId);
      }

      setReport(raw);
      setEvent(eventObj || null);

      const eventAccountTotal = getEventAccountTotal(eventObj);
      const pool = eventAccountTotal * ACCOUNT_PERCENT; // 80% of event Account Amount (from breakup)

      const built = [];
      const groups = budgetData?.groups || {};
      Object.entries(groups).forEach(([groupName, rows]) => {
        (rows || []).forEach((row, indexInGroup) => {
          const hasVendor =
            row.vendorCode || row.vendorName || row.vendorId;
          if (!hasVendor) return;
          const actual = Number(row.actualPaidAmount) || 0;
          built.push({
            groupName,
            indexInGroup,
            rowKey: `${groupName}-${indexInGroup}`,
            vendorName: row.vendorName || row.vendorCode || "—",
            actualPaidAmount: actual,
            accountAuto: 0,
            cashAuto: actual,
            finalAccount: Number(row.finalAccount) || 0,
            finalCash: Number(row.finalCash) || 0,
          });
        });
      });

      const totalActual = built.reduce(
        (s, r) => s + (Number(r.actualPaidAmount) || 0),
        0,
      );
      const amountToDistribute =
        totalActual > 0 && pool > 0
          ? Math.min(pool, totalActual)
          : 0;
      built.forEach((r) => {
        const actual = Number(r.actualPaidAmount) || 0;
        if (totalActual > 0 && amountToDistribute >= 0) {
          const share =
            Math.round(
              (actual / totalActual) * amountToDistribute * 100,
            ) / 100;
          r.accountAuto = share;
          r.cashAuto = Math.max(
            0,
            Math.round((actual - share) * 100) / 100,
          );
        }
      });

      setVendorRows(built);
    } catch (err) {
      console.error("Error loading budget report:", err);
      setError(
        err.response?.data?.message || "Failed to load budget report.",
      );
      setReport(null);
      setEvent(null);
      setVendorRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetchReport, fetchEvent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateFinalAmounts = useCallback((rowKey, field, value) => {
    setVendorRows((prev) =>
      prev.map((r) =>
        r.rowKey === rowKey ? { ...r, [field]: Number(value) || 0 } : r,
      ),
    );
  }, []);

  const buildMergedBudgetData = useCallback(() => {
    if (!report?.budgetData?.groups) return null;
    const finalByKey = {};
    vendorRows.forEach((r) => {
      finalByKey[r.rowKey] = {
        finalAccount: r.finalAccount,
        finalCash: r.finalCash,
      };
    });

    const groups = {};
    Object.entries(report.budgetData.groups).forEach(([groupName, rows]) => {
      groups[groupName] = (rows || []).map((row, indexInGroup) => {
        const key = `${groupName}-${indexInGroup}`;
        const f = finalByKey[key];
        return {
          ...row,
          finalAccount: f ? f.finalAccount : Number(row.finalAccount) || 0,
          finalCash: f ? f.finalCash : Number(row.finalCash) || 0,
        };
      });
    });

    return {
      ...report.budgetData,
      groups,
      grandTotals: report.budgetData.grandTotals || {},
      summary: report.budgetData.summary || {},
    };
  }, [report, vendorRows]);

  const handleSubmit = useCallback(async () => {
    if (!reportId || !report) return;
    setIsSubmitting(true);
    try {
      const budgetData = buildMergedBudgetData();
      const payload = {
        eventId:
          typeof report.eventId === "object"
            ? report.eventId?._id ?? report.eventId
            : report.eventId,
        budgetData,
        metadata: {
          ...report.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
      await axios.put(
        `${API_BASE_URL}budget-report/${reportId}`,
        payload,
        config,
      );
      message.success("Saved successfully.");
      setIsEditing(false);
      await loadData();
    } catch (err) {
      console.error("Error saving:", err);
      message.error(
        err.response?.data?.message || "Failed to save. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [reportId, report, config, buildMergedBudgetData, loadData]);

  const columns = useMemo(() => {
    const base = [
      {
        title: "Vendor Name",
        dataIndex: "vendorName",
        key: "vendorName",
        width: 220,
        render: (val) => val || "—",
      },
      {
        title: "Actual Paid Amount (₹)",
        dataIndex: "actualPaidAmount",
        key: "actualPaidAmount",
        width: 180,
        align: "right",
        render: (val) => formatINR(val),
      },
      {
        title: "Account (Auto)",
        dataIndex: "accountAuto",
        key: "accountAuto",
        width: 140,
        align: "right",
        render: (val) => formatINR(val),
      },
      {
        title: "Cash (Auto)",
        dataIndex: "cashAuto",
        key: "cashAuto",
        width: 140,
        align: "right",
        render: (val) => formatINR(val != null ? Math.max(0, Number(val)) : 0),
      },
    ];
    if (isEditing) {
      base.push(
        {
          title: "Final Account (₹)",
          dataIndex: "finalAccount",
          key: "finalAccount",
          width: 160,
          align: "right",
          render: (val, record) => (
            <InputNumber
              min={0}
              step={100}
              value={val}
              onChange={(v) =>
                updateFinalAmounts(record.rowKey, "finalAccount", v)
              }
              style={{ width: "100%" }}
              formatter={(v) =>
                `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(v) => String(v).replace(/,/g, "")}
            />
          ),
        },
        {
          title: "Final Cash (₹)",
          dataIndex: "finalCash",
          key: "finalCash",
          width: 160,
          align: "right",
          render: (val, record) => (
            <InputNumber
              min={0}
              step={100}
              value={val}
              onChange={(v) =>
                updateFinalAmounts(record.rowKey, "finalCash", v)
              }
              style={{ width: "100%" }}
              formatter={(v) =>
                `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(v) => String(v).replace(/,/g, "")}
            />
          ),
        },
      );
    } else {
      base.push(
        {
          title: "Final Account (₹)",
          dataIndex: "finalAccount",
          key: "finalAccount",
          width: 160,
          align: "right",
          render: (val) => formatINR(val),
        },
        {
          title: "Final Cash (₹)",
          dataIndex: "finalCash",
          key: "finalCash",
          width: 160,
          align: "right",
          render: (val) => formatINR(val),
        },
      );
    }
    return base;
  }, [isEditing, updateFinalAmounts]);

  const totalActual = vendorRows.reduce(
    (s, r) => s + (Number(r.actualPaidAmount) || 0),
    0,
  );
  const totalAccountAuto = vendorRows.reduce(
    (s, r) => s + (Number(r.accountAuto) || 0),
    0,
  );
  const totalCashAuto = vendorRows.reduce(
    (s, r) => s + (Number(r.cashAuto) || 0),
    0,
  );
  const totalFinalAccount = vendorRows.reduce(
    (s, r) => s + (Number(r.finalAccount) || 0),
    0,
  );
  const totalFinalCash = vendorRows.reduce(
    (s, r) => s + (Number(r.finalCash) || 0),
    0,
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Spin size="large" tip="Loading…" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          showIcon
          message={error}
          action={
            <Button size="small" onClick={() => navigate("/user/budgetreport/eventwise")}>
              Back to list
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/user/budgetreport/eventwise")}
          >
            Back
          </Button>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 600 }}>
            Accounts – Budget Report Management
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type={isEditing ? "default" : "primary"}
            onClick={() => setIsEditing((e) => !e)}
          >
            {isEditing ? "Cancel edit" : "Edit"}
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!isEditing}
          >
            Submit
          </Button>
        </div>
      </div>

      {event?.eventTypes?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#1e293b",
              marginBottom: 12,
            }}
          >
            Agreed Amount & Breakup
          </div>
          <AgreedAmountBreakupCard event={event} />
        </div>
      )}

      {vendorRows.length === 0 ? (
        <Alert
          type="info"
          message="No vendor rows in this budget report. Rows with a selected vendor and Actual Paid Amount are shown here."
        />
      ) : (
        <Table
          rowKey="rowKey"
          columns={columns}
          dataSource={vendorRows}
          pagination={false}
          scroll={{ x: 900 }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <strong>Total</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  {formatINR(totalActual)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  {formatINR(totalAccountAuto)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  {formatINR(Math.max(0, totalCashAuto))}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {formatINR(totalFinalAccount)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {formatINR(totalFinalCash)}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      )}
    </div>
  );
};

export default AccountsBudgetReportMgmt;
