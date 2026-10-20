import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Spin, message } from "antd";
import { ArrowLeft, RefreshCw, Save } from "lucide-react";
import dayjs from "dayjs";
import "@/Components/PageKit/PageKit.css";
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
    <div className="pk-ws">
      <div className="pk-ws-bar">
        <button type="button" className="pk-ws-back" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <div className="pk-ws-heading">
          <h1>{TITLE}</h1>
          <p className="pk-ws-meta">
            {updatedAt
              ? `Last saved ${dayjs(updatedAt).format("DD MMM YYYY, hh:mm A")}`
              : "Not saved yet"}
            {version > 0 ? ` · v${version}` : ""}
            {sheetStats?.sheetCount
              ? ` · ${sheetStats.sheetCount} sheet${sheetStats.sheetCount === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
        <div className="pk-ws-actions">
          <button type="button" className="pk-btn" onClick={loadWorkbook} disabled={loading || saving}>
            <RefreshCw size={14} aria-hidden="true" /> Reload
          </button>
          <button
            type="button"
            className="pk-btn is-solid"
            onClick={handleSave}
            disabled={loading || saving || !sheetReady}
          >
            <Save size={14} aria-hidden="true" /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="pk-ws-sheetwrap">
        <div className="pk-ws-sheet">
          {loading ? (
            <div className="pk-ws-loading">
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
