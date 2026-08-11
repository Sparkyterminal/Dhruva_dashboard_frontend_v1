import React, { useCallback, useEffect, useState } from "react";
import { Button, Drawer, Spin, Tag, Typography, message } from "antd";
import { CloseOutlined, EditOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import UniverSheets from "../../../Components/UniverSheets";
import {
  cloneWorkbookData,
  getWorkbookStats,
} from "../../../Components/UniverSheets/workbookSnapshot";
import { fetchBudgetReportWorkbook } from "./excel/budgetReportExcelApi";
import { getEventDisplayLabel, getEventName } from "./excel/budgetReportExcelUtils";

const { Text } = Typography;

/**
 * Full-width drawer: read-only Budget Report Excel (all sheets).
 */
const BudgetReportExcelViewDrawer = ({
  open,
  onClose,
  record,
}) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const authHeaders = { headers: { Authorization: user?.access_token } };

  const eventId = record?._id != null ? String(record._id) : null;
  const titleLabel = record
    ? getEventDisplayLabel(record) ||
      `${getEventName(record.eventName)} - ${record.clientName || "—"}`
    : "Budget Report";

  const [loading, setLoading] = useState(false);
  const [workbookData, setWorkbookData] = useState(null);
  const [sheetStats, setSheetStats] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [version, setVersion] = useState(0);
  const [instanceKey, setInstanceKey] = useState(0);

  const load = useCallback(async () => {
    if (!open || !eventId || !user?.access_token) return;

    setLoading(true);
    try {
      const doc = await fetchBudgetReportWorkbook({ eventId, authHeaders });
      const snapshot = cloneWorkbookData(doc.workbookData);
      setWorkbookData(snapshot);
      setSheetStats(doc.stats || getWorkbookStats(snapshot));
      setUpdatedAt(doc.updatedAt);
      setVersion(doc.version ?? 0);
      setInstanceKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.message || "Failed to load budget report Excel.",
      );
      setWorkbookData(null);
      setSheetStats(null);
      setUpdatedAt(null);
      setVersion(0);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, eventId, user?.access_token]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (!open) {
      setWorkbookData(null);
      setSheetStats(null);
    }
  }, [open]);

  const goEdit = () => {
    if (!eventId) return;
    onClose?.();
    navigate(`/user/budgetreport/edit/${eventId}`, {
      state: {
        eventLabel: titleLabel,
        eventName: getEventName(record?.eventName),
        clientName: record?.clientName,
      },
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width="100%"
      destroyOnClose
      closable={false}
      className="budget-report-excel-view-drawer"
      styles={{
        body: {
          padding: 0,
          background: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        },
        header: { display: "none" },
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid #e2e8f0",
          background: "#fff",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 180 }}>
          <div className="text-base font-semibold text-slate-800">
            Budget Report — View
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {titleLabel}
            {updatedAt
              ? ` · Last saved ${dayjs(updatedAt).format("DD MMM YYYY, hh:mm A")}`
              : ""}
            {version > 0 ? ` · v${version}` : ""}
            {sheetStats?.sheetCount
              ? ` · ${sheetStats.sheetCount} sheet${sheetStats.sheetCount === 1 ? "" : "s"}`
              : ""}
          </Text>
        </div>

        <Tag color="blue">Read only</Tag>

        <Button icon={<EditOutlined />} onClick={goEdit} disabled={!eventId}>
          Edit
        </Button>

        <Button
          type="primary"
          icon={<CloseOutlined />}
          onClick={onClose}
        >
          Close
        </Button>
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: 8 }}>
        <div
          style={{
            height: "100%",
            minHeight: 420,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #e2e8f0",
            background: "#fff",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: 420,
              }}
            >
              <Spin size="large" tip="Loading spreadsheet…" />
            </div>
          ) : (
            <UniverSheets
              key={instanceKey}
              workbookData={workbookData || undefined}
              readOnly
              style={{ minHeight: "calc(100vh - 100px)" }}
            />
          )}
        </div>
      </div>
    </Drawer>
  );
};

export default BudgetReportExcelViewDrawer;
