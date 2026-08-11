import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button, Spin, Typography, message } from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import UniverSheets from "../../../Components/UniverSheets";
import {
  SPREADSHEET_KEY_DEFAULT,
  SPREADSHEET_MODULE_CLIENT_LEADS,
  fetchSpreadsheetWorkbook,
  saveSpreadsheetWorkbook,
} from "../../../Components/UniverSheets/spreadsheetWorkbooksApi";
import {
  cloneWorkbookData,
  getWorkbookStats,
} from "../../../Components/UniverSheets/workbookSnapshot";

const { Title, Text } = Typography;

const TITLE = "Leads Tracker Excel";

const LeadsTrackerExcel = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const authHeaders = { headers: { Authorization: user?.access_token } };

  const sheetsRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workbookData, setWorkbookData] = useState(null);
  const [version, setVersion] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [sheetReady, setSheetReady] = useState(false);
  const [sheetStats, setSheetStats] = useState(null);
  /** Remount key so Univer gets the loaded snapshot after fetch. */
  const [instanceKey, setInstanceKey] = useState(0);

  const loadWorkbook = useCallback(async () => {
    if (!user?.access_token) {
      message.error("Authentication required. Please login again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setSheetReady(false);
    try {
      const doc = await fetchSpreadsheetWorkbook({
        module: SPREADSHEET_MODULE_CLIENT_LEADS,
        key: SPREADSHEET_KEY_DEFAULT,
        authHeaders,
      });
      // Clone so React state holds a full multi-sheet copy
      const snapshot = cloneWorkbookData(doc.workbookData);
      setWorkbookData(snapshot);
      setVersion(doc.version ?? 0);
      setUpdatedAt(doc.updatedAt);
      setSheetStats(doc.stats || getWorkbookStats(snapshot));
      setInstanceKey((k) => k + 1);
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Failed to load spreadsheet.",
      );
      setWorkbookData(null);
      setVersion(0);
      setUpdatedAt(null);
      setSheetStats(null);
      setInstanceKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- authHeaders from user token
  }, [user?.access_token]);

  useEffect(() => {
    loadWorkbook();
  }, [loadWorkbook]);

  const handleSave = async () => {
    if (!user?.access_token) {
      message.error("Authentication required. Please login again.");
      return;
    }

    setSaving(true);
    try {
      // Full workbook: every sheet tab + all cellData (after committing active cell)
      const snapshot =
        (await sheetsRef.current?.getWorkbookDataAsync?.()) ??
        sheetsRef.current?.getWorkbookData?.();

      if (!snapshot || typeof snapshot !== "object") {
        message.warning("Spreadsheet is not ready yet.");
        return;
      }

      const stats = getWorkbookStats(snapshot);
      if (stats.sheetCount === 0) {
        message.warning("No sheets found to save.");
        return;
      }

      const saved = await saveSpreadsheetWorkbook({
        module: SPREADSHEET_MODULE_CLIENT_LEADS,
        key: SPREADSHEET_KEY_DEFAULT,
        title: TITLE,
        workbookData: snapshot,
        version,
        authHeaders,
      });

      setVersion(saved.version ?? version + 1);
      setUpdatedAt(saved.updatedAt ?? new Date().toISOString());
      // Prefer server echo if present (full replace); else keep what we sent
      const persisted =
        cloneWorkbookData(saved.workbookData) || cloneWorkbookData(snapshot);
      setWorkbookData(persisted);
      setSheetStats(saved.stats || stats);

      message.success(
        `Saved ${stats.sheetCount} sheet${stats.sheetCount === 1 ? "" : "s"} · ${stats.cellCount} cell${stats.cellCount === 1 ? "" : "s"}`,
      );
    } catch (err) {
      if (err?.code === "INVALID_WORKBOOK") {
        message.error(err.message);
      } else if (err?.response?.status === 409) {
        message.error(
          err?.response?.data?.message ||
            "Someone else saved this sheet. Reload, then try again.",
        );
      } else {
        message.error(
          err?.response?.data?.message || "Failed to save spreadsheet.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid #e2e8f0",
          background: "#ffffff",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ padding: "4px 8px" }}
        >
          Back
        </Button>
        <div style={{ flex: 1, minWidth: 160 }}>
          <Title level={4} style={{ margin: 0 }}>
            {TITLE}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {updatedAt
              ? `Last saved ${dayjs(updatedAt).format("DD MMM YYYY, hh:mm A")}`
              : "Not saved yet"}
            {version > 0 ? ` · v${version}` : ""}
            {sheetStats?.sheetCount
              ? ` · ${sheetStats.sheetCount} sheet${sheetStats.sheetCount === 1 ? "" : "s"}`
              : ""}
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadWorkbook}
          disabled={loading || saving}
        >
          Reload
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          disabled={loading || !sheetReady}
        >
          Save
        </Button>
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: 8 }}>
        <div
          style={{
            height: "100%",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #e2e8f0",
            background: "#fff",
            position: "relative",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: 320,
              }}
            >
              <Spin size="large" tip="Loading spreadsheet…" />
            </div>
          ) : (
            <UniverSheets
              key={instanceKey}
              ref={sheetsRef}
              workbookData={workbookData || undefined}
              onReady={() => setSheetReady(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadsTrackerExcel;
