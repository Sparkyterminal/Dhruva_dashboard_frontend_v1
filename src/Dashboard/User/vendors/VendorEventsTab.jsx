import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { Spin, Alert, Card, Table, Typography } from "antd";

const { Text } = Typography;

/**
 * For a single budget report, collect all line items where vendorId matches the current vendor.
 */
function getMatchingRows(report, vendorId) {
  if (!report?.budgetData?.groups || !vendorId) return [];
  const rows = [];
  const groups = report.budgetData.groups;
  Object.entries(groups).forEach(([groupName, items]) => {
    if (!Array.isArray(items)) return;
    items.forEach((row) => {
      const rowVendorId = row.vendorId ?? row.vendor_id ?? "";
      if (String(rowVendorId) === String(vendorId)) {
        rows.push({ ...row, groupName });
      }
    });
  });
  return rows;
}

/**
 * Get event display name from a report.
 */
function getEventName(report) {
  const event = report?.eventId;
  if (!event) return "Unknown event";
  const name = event.eventName?.name ?? event.eventName ?? event.name;
  const client = event.clientName ?? event.client?.name;
  if (name && client) return `${name} — ${client}`;
  return name || client || "Unknown event";
}

const VendorEventsTab = ({ vendorId, config }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      setReports([]);
      return;
    }

    let cancelled = false;
    const fetchVendorEvents = async () => {
      setLoading(true);
      setError(null);
      setReports([]);
      try {
        const res = await axios.get(
          `${API_BASE_URL}budget-report/vendor/${vendorId}`,
          config
        );
        if (cancelled) return;
        const raw = res.data?.data ?? res.data?.reports ?? res.data;
        const list = Array.isArray(raw) ? raw : [];
        setReports(list);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load vendor events");
          console.error("Error fetching vendor events:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVendorEvents();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when vendorId changes
  }, [vendorId]);

  if (!vendorId) {
    return (
      <div style={{ padding: 16, color: "#5b5270" }}>
        No vendor selected.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" tip="Loading events…" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <Alert
          type="error"
          message="Could not load events"
          description={error}
          showIcon
        />
      </div>
    );
  }

  // Build list of { report, eventName, matchingRows } for reports that have at least one matching row
  const eventsWithRows = reports
    .map((report) => ({
      report,
      eventName: getEventName(report),
      matchingRows: getMatchingRows(report, vendorId),
    }))
    .filter((e) => e.matchingRows.length > 0);

  if (eventsWithRows.length === 0) {
    return (
      <div style={{ padding: 16, color: "#5b5270" }}>
        This vendor is not linked to any budget report line items yet.
      </div>
    );
  }

  const columns = [
    {
      title: "Group",
      dataIndex: "groupName",
      key: "groupName",
      width: 140,
      render: (val) => <Text strong>{val}</Text>,
    },
    {
      title: "Particulars",
      dataIndex: "particulars",
      key: "particulars",
      ellipsis: true,
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 80,
    },
    {
      title: "Qty",
      dataIndex: "qnty",
      key: "qnty",
      width: 70,
      align: "right",
    },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
      width: 60,
    },
    {
      title: "Rate",
      dataIndex: "rate",
      key: "rate",
      width: 90,
      align: "right",
      render: (v) => (v != null ? `₹${Number(v).toLocaleString("en-IN")}` : "—"),
    },
    {
      title: "Total cost",
      dataIndex: "totalCost",
      key: "totalCost",
      width: 110,
      align: "right",
      render: (v) => (v != null ? `₹${Number(v).toLocaleString("en-IN")}` : "—"),
    },
    {
      title: "Negotiated",
      dataIndex: "negotiatedAmount",
      key: "negotiatedAmount",
      width: 110,
      align: "right",
      render: (v) => (v != null ? `₹${Number(v).toLocaleString("en-IN")}` : "—"),
    },
    {
      title: "Actual paid",
      dataIndex: "actualPaidAmount",
      key: "actualPaidAmount",
      width: 110,
      align: "right",
      render: (v) => (v != null ? `₹${Number(v).toLocaleString("en-IN")}` : "—"),
    },
  ];

  const formatSum = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ padding: "0 4px" }}>
      {eventsWithRows.map(({ report, eventName, matchingRows }, index) => {
        const grandTotalCost = matchingRows.reduce((s, r) => s + (Number(r.totalCost) || 0), 0);
        const grandNegotiated = matchingRows.reduce((s, r) => s + (Number(r.negotiatedAmount) || 0), 0);
        const grandActualPaid = matchingRows.reduce((s, r) => s + (Number(r.actualPaidAmount) || 0), 0);
        return (
          <Card
            key={report._id || index}
            title={
              <span style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
                {eventName}
              </span>
            }
            size="small"
            style={{
              marginBottom: 16,
              borderRadius: 10,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
            bodyStyle={{ padding: "12px 16px" }}
          >
            <Table
              dataSource={matchingRows.map((row, i) => ({
                ...row,
                key: `${report._id}-${row.groupName}-${i}-${row.particulars}`,
              }))}
              columns={columns}
              pagination={false}
              size="small"
              scroll={{ x: 720 }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={6}>
                      <Text strong>Grand total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      <Text strong>{formatSum(grandTotalCost)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right">
                      <Text strong>{formatSum(grandNegotiated)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align="right">
                      <Text strong>{formatSum(grandActualPaid)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        );
      })}
    </div>
  );
};

export default VendorEventsTab;
