import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Spin, Alert } from "antd";
import { API_BASE_URL } from "../../../../config";
import { parseBudgetDataToRowData } from "./budgetReportUtils";
import BudgetReportViewGrid from "./BudgetReportViewGrid";

const ViewEventwiseBudgetReport = ({ eventId, onClose }) => {
  const user = useSelector((state) => state.user.value);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = useMemo(
    () => ({ headers: { Authorization: user?.access_token } }),
    [user?.access_token],
  );

  const fetchReport = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL}budget-report/event/${eventId}`,
        config,
      );
      const raw = res.data?.data ?? res.data;
      const budgetData = raw?.budgetData ?? raw;
      const rows = parseBudgetDataToRowData(budgetData);
      setRowData(rows);
    } catch (err) {
      console.error("Error fetching budget report by event:", err);
      setError(
        err.response?.data?.message || "Failed to load budget report details.",
      );
      setRowData([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, config]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const pinnedBottomRowData = useMemo(() => {
    if (!rowData.length) return [];
    let totalCost = 0;
    let grandTotal = 0;
    let negotiatedAmount = 0;
    let actualPaidAmount = 0;
    for (const r of rowData) {
      if (r.isGroupRow) grandTotal += Number(r.grandTotal) || 0;
      else {
        totalCost += Number(r.totalCost) || 0;
        negotiatedAmount += Number(r.negotiatedAmount) || 0;
        actualPaidAmount += Number(r.actualPaidAmount) || 0;
      }
    }
    return [
      {
        id: "pinned_total",
        isGroupRow: false,
        slNo: "",
        particulars: "GRAND TOTAL",
        size: "",
        qnty: "",
        unit: "",
        rate: "",
        totalCost,
        grandTotal,
        negotiatedAmount,
        vendorCode: "",
        vendorName: "",
        vendorContactNumber: "",
        vendorId: "",
        inhouseAmount: "",
        assetsPurchase: "",
        directPayment: "",
        actualPaidAmount,
      },
    ];
  }, [rowData]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Spin size="large" tip="Loading report…" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message={error}
        action={
          <span
            style={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={fetchReport}
          >
            Retry
          </span>
        }
      />
    );
  }

  if (!rowData.length) {
    return (
      <Alert type="info" message="No budget data found for this event." />
    );
  }

  return (
    <BudgetReportViewGrid
      rowData={rowData}
      pinnedBottomRowData={pinnedBottomRowData}
    />
  );
};

export default ViewEventwiseBudgetReport;
