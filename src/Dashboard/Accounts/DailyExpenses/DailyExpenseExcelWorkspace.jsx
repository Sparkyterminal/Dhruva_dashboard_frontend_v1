import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Form, Input, Modal, DatePicker, Spin, Typography, message } from "antd";
import { ArrowLeft, Eye, FilePen, Pencil, RefreshCw, Save } from "lucide-react";
import dayjs from "dayjs";
import "./DailyExpenses.css";
import UniverSheets from "../../../Components/UniverSheets";
import {
  applySheetNamesToWorkbook,
  cloneWorkbookData,
  getWorkbookStats,
  listWorkbookSheets,
} from "../../../Components/UniverSheets/workbookSnapshot";
import {
  fetchDailyExpenseWorkbook,
  saveDailyExpenseWorkbook,
} from "./dailyExpensesApi";
import {
  formatDisplayDate,
  toBusinessDate,
  todayBusinessDate,
} from "./dailyExpensesUtils";

const { Text } = Typography;

const defaultWorkbookTitle = (dateKey) =>
  `Daily Expenses — ${formatDisplayDate(dateKey)}`;

/**
 * Try to rename sheet tabs in the live Univer workbook so the footer updates immediately.
 */
const applyNamesToLiveUniver = (api, sheetRows, workbookTitle) => {
  if (!api) return;
  try {
    const workbook = api.getActiveWorkbook?.();
    if (!workbook) return;

    if (workbookTitle && typeof workbook.setName === "function") {
      try {
        workbook.setName(workbookTitle);
      } catch {
        // optional
      }
    }

    (sheetRows || []).forEach((row) => {
      const name = String(row?.name || "").trim();
      if (!name || !row?.id) return;
      try {
        const sheet =
          workbook.getSheetBySheetId?.(row.id) ||
          workbook.getSheetBySheetId?.(String(row.id));
        if (sheet && typeof sheet.setName === "function") {
          sheet.setName(name);
          return;
        }
      } catch {
        // try next approach
      }
      try {
        // Some Univer builds expose sheets via getSheets()
        const sheets = workbook.getSheets?.() || [];
        const match = sheets.find(
          (s) =>
            s?.getSheetId?.() === row.id ||
            s?.getSheetId?.() === String(row.id),
        );
        match?.setName?.(name);
      } catch {
        // ignore — snapshot apply on save still persists names
      }
    });
  } catch {
    // ignore
  }
};

/**
 * Univer Excel workspace for Daily Expenses.
 * Mapped to one business date (YYYY-MM-DD). Supports multi-sheet workbooks.
 * mode: "add" | "edit" | "view"
 *
 * Add/Edit: user can set workbook title and rename each sheet tab.
 */
const DailyExpenseExcelWorkspace = ({ mode = "edit" }) => {
  const navigate = useNavigate();
  const { date: dateParam } = useParams();
  const [searchParams] = useSearchParams();
  const user = useSelector((state) => state.user.value);
  const authHeaders = { headers: { Authorization: user?.access_token } };

  const initialDate =
    toBusinessDate(dateParam) ||
    toBusinessDate(searchParams.get("date")) ||
    todayBusinessDate();

  const readOnly = mode === "view";
  const sheetsRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [workbookTitle, setWorkbookTitle] = useState(
    defaultWorkbookTitle(initialDate),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workbookData, setWorkbookData] = useState(null);
  const [version, setVersion] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [sheetReady, setSheetReady] = useState(false);
  const [sheetStats, setSheetStats] = useState(null);
  const [instanceKey, setInstanceKey] = useState(0);

  const [namesModalOpen, setNamesModalOpen] = useState(false);
  const [sheetNameRows, setSheetNameRows] = useState([]);
  const [namesForm] = Form.useForm();
  /** Last applied { id, name }[] so Save persists even if live Univer rename API is missing. */
  const pendingSheetNamesRef = useRef(null);

  const load = useCallback(async () => {
    if (!user?.access_token) {
      message.error("Authentication required. Please login again.");
      setLoading(false);
      return;
    }
    const dateKey = toBusinessDate(selectedDate);
    if (!dateKey) {
      message.error("Select a valid date.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setSheetReady(false);
    try {
      const doc = await fetchDailyExpenseWorkbook({
        date: dateKey,
        authHeaders,
      });
      const snapshot = cloneWorkbookData(doc.workbookData);
      setWorkbookData(snapshot);
      setVersion(doc.version ?? 0);
      setUpdatedAt(doc.updatedAt);
      setSheetStats(doc.stats || getWorkbookStats(snapshot));
      setWorkbookTitle(
        doc.title ||
          snapshot?.name ||
          defaultWorkbookTitle(dateKey),
      );
      pendingSheetNamesRef.current = null;
      setInstanceKey((k) => k + 1);
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Failed to load daily expenses Excel.",
      );
      setWorkbookData(null);
      setVersion(0);
      setUpdatedAt(null);
      setSheetStats(null);
      setWorkbookTitle(defaultWorkbookTitle(dateKey));
      setInstanceKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.access_token, selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDateChange = (d) => {
    if (readOnly) return;
    const next = d?.isValid?.() ? d.format("YYYY-MM-DD") : todayBusinessDate();
    setSelectedDate(next);
    if (mode === "edit") {
      navigate(`/user/daily-expenses/edit/${next}`, { replace: true });
    } else if (mode === "add") {
      navigate(`/user/daily-expenses/add?date=${next}`, { replace: true });
    }
  };

  const openSheetNamesModal = async () => {
    if (readOnly) return;
    let snapshot =
      (await sheetsRef.current?.getWorkbookDataAsync?.()) ??
      sheetsRef.current?.getWorkbookData?.() ??
      workbookData;

    const rows = listWorkbookSheets(snapshot);
    if (rows.length === 0) {
      message.warning("No sheets found yet. Wait for the spreadsheet to load.");
      return;
    }
    setSheetNameRows(rows);
    namesForm.setFieldsValue({
      sheets: rows.map((r) => ({ id: r.id, name: r.name })),
    });
    setNamesModalOpen(true);
  };

  const applySheetNamesFromModal = async () => {
    try {
      const values = await namesForm.validateFields();
      const rows = (values.sheets || []).map((row, idx) => ({
        id: row.id || sheetNameRows[idx]?.id,
        name: String(row.name || "").trim(),
      }));

      if (rows.some((r) => !r.name)) {
        message.warning("Each sheet needs a name.");
        return;
      }

      const nameSet = new Set(rows.map((r) => r.name.toLowerCase()));
      if (nameSet.size !== rows.length) {
        message.warning("Sheet names must be unique.");
        return;
      }

      applyNamesToLiveUniver(
        sheetsRef.current?.getAPI?.(),
        rows,
        workbookTitle.trim(),
      );

      pendingSheetNamesRef.current = rows;
      setSheetStats((prev) => ({
        sheetCount: rows.length,
        cellCount: prev?.cellCount ?? 0,
        sheetNames: rows.map((r) => r.name),
      }));

      setNamesModalOpen(false);
      message.success("Sheet names updated. Click Save to persist.");
    } catch {
      // validation errors
    }
  };

  const handleSave = async () => {
    if (readOnly) return;
    if (!user?.access_token) {
      message.error("Authentication required. Please login again.");
      return;
    }
    const dateKey = toBusinessDate(selectedDate);
    if (!dateKey) {
      message.error("Select a date before saving.");
      return;
    }

    const title = String(workbookTitle || "").trim() || defaultWorkbookTitle(dateKey);

    setSaving(true);
    try {
      let snapshot =
        (await sheetsRef.current?.getWorkbookDataAsync?.()) ??
        sheetsRef.current?.getWorkbookData?.();

      if (!snapshot || typeof snapshot !== "object") {
        message.warning("Spreadsheet is not ready yet.");
        return;
      }

      // Ensure workbook display name + any pending sheet renames are in the snapshot
      snapshot =
        applySheetNamesToWorkbook(
          snapshot,
          pendingSheetNamesRef.current || [],
          title,
        ) || snapshot;

      const stats = getWorkbookStats(snapshot);
      if (stats.sheetCount === 0) {
        message.warning("No sheets found to save.");
        return;
      }

      const saved = await saveDailyExpenseWorkbook({
        date: dateKey,
        title,
        workbookData: snapshot,
        version,
        authHeaders,
      });

      setVersion(saved.version ?? version + 1);
      setUpdatedAt(saved.updatedAt ?? new Date().toISOString());
      const persisted =
        cloneWorkbookData(saved.workbookData) || cloneWorkbookData(snapshot);
      setWorkbookData(persisted);
      setSheetStats(saved.stats || stats);
      setWorkbookTitle(saved.title || title);
      pendingSheetNamesRef.current = null;

      message.success(
        `Saved “${saved.title || title}” · ${stats.sheetCount} sheet${stats.sheetCount === 1 ? "" : "s"} · ${stats.cellCount} cell${stats.cellCount === 1 ? "" : "s"}`,
      );

      if (mode === "add") {
        navigate(`/user/daily-expenses/edit/${dateKey}`, { replace: true });
      }
    } catch (err) {
      if (err?.code === "INVALID_WORKBOOK" || err?.code === "INVALID_DATE") {
        message.error(err.message);
      } else if (err?.response?.status === 409) {
        message.error(
          err?.response?.data?.message ||
            "Someone else saved this sheet. Reload, then try again.",
        );
      } else {
        message.error(
          err?.response?.data?.message || "Failed to save daily expenses Excel.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const modeLabel =
    mode === "view" ? "View" : mode === "add" ? "Add" : "Edit";

  return (
    <div className="dew-shell">
      <div className="dew-bar">
        <button
          type="button"
          className="dew-back"
          onClick={() => navigate("/user/daily-expenses")}
          aria-label="Back to Daily Expenses"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>

        <div className="dew-heading">
          <h1>
            Daily Expenses
            <span className={`dew-mode${readOnly ? " is-readonly" : ""}`}>{modeLabel}</span>
          </h1>
          <p className="dew-meta">
            {formatDisplayDate(selectedDate)}
            {updatedAt
              ? ` · Last saved ${dayjs(updatedAt).format("DD MMM YYYY, hh:mm A")}`
              : " · Not saved yet"}
            {version > 0 ? ` · v${version}` : ""}
            {sheetStats?.sheetCount
              ? ` · ${sheetStats.sheetCount} sheet${sheetStats.sheetCount === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>

        <label className="dew-field">
          <span>Excel name</span>
          <Input
            value={workbookTitle}
            onChange={(e) => setWorkbookTitle(e.target.value)}
            disabled={readOnly || loading}
            placeholder="e.g. Daily Expenses — Petty cash"
            style={{ width: 260 }}
            maxLength={120}
          />
        </label>

        <label className="dew-field">
          <span>Date</span>
          <DatePicker
            value={dayjs(selectedDate)}
            onChange={handleDateChange}
            format="DD-MM-YYYY"
            allowClear={false}
            disabled={readOnly}
            style={{ width: 150 }}
          />
        </label>

        <div className="dew-actions">
          {readOnly ? (
            <button
              type="button"
              className="de-btn is-primary"
              onClick={() => navigate(`/user/daily-expenses/edit/${selectedDate}`)}
            >
              <Pencil size={14} aria-hidden="true" /> Edit
            </button>
          ) : (
            <>
              <button
                type="button"
                className="de-btn"
                onClick={openSheetNamesModal}
                disabled={loading || !sheetReady}
              >
                <FilePen size={14} aria-hidden="true" /> Sheet names
              </button>
              <button
                type="button"
                className="de-btn"
                onClick={() => navigate(`/user/daily-expenses/view/${selectedDate}`)}
                disabled={!selectedDate}
              >
                <Eye size={14} aria-hidden="true" /> View
              </button>
              <button
                type="button"
                className="de-btn"
                onClick={load}
                disabled={loading || saving}
              >
                <RefreshCw size={14} aria-hidden="true" /> Reload
              </button>
              <button
                type="button"
                className="de-btn is-primary"
                onClick={handleSave}
                disabled={loading || saving || !sheetReady || !selectedDate}
              >
                <Save size={14} aria-hidden="true" /> {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="dew-sheetwrap">
        <div className="dew-sheet">
          {loading ? (
            <div className="dew-loading">
              <Spin size="large" tip="Loading spreadsheet…" />
            </div>
          ) : (
            <UniverSheets
              key={`${instanceKey}-${selectedDate}`}
              ref={sheetsRef}
              workbookData={workbookData || undefined}
              readOnly={readOnly}
              onReady={() => setSheetReady(true)}
            />
          )}
        </div>
      </div>

      <Modal
        title="Name Excel sheets"
        open={namesModalOpen}
        onCancel={() => setNamesModalOpen(false)}
        onOk={applySheetNamesFromModal}
        okText="Apply names"
        destroyOnHidden
        width={480}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Rename each sheet tab. Names must be unique. Click Save afterward to
          store them on the server.
        </Text>
        <Form form={namesForm} layout="vertical">
          <Form.List name="sheets">
            {(fields) =>
              fields.map((field, index) => (
                <Form.Item
                  key={field.key}
                  label={`Sheet ${index + 1}`}
                  required
                >
                  <Form.Item name={[field.name, "id"]} hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, "name"]}
                    noStyle
                    rules={[
                      { required: true, message: "Enter a sheet name" },
                      { max: 80, message: "Max 80 characters" },
                    ]}
                  >
                    <Input placeholder={`Sheet ${index + 1} name`} />
                  </Form.Item>
                </Form.Item>
              ))
            }
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default DailyExpenseExcelWorkspace;
