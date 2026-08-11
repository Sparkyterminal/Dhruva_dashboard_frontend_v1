import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button, Spin, Tag, Typography, message } from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import UniverSheets from "../../../../Components/UniverSheets";
import {
  cloneWorkbookData,
  getWorkbookStats,
} from "../../../../Components/UniverSheets/workbookSnapshot";
import {
  fetchBudgetReportWorkbook,
  fetchEventById,
  saveBudgetReportWorkbook,
} from "./budgetReportExcelApi";
import { getEventDisplayLabel } from "./budgetReportExcelUtils";

const { Title, Text } = Typography;

/**
 * Shared Excel editor/viewer for a budget report mapped to an event
 * (Confirmed Event or InProgress).
 * mode: "edit" | "view" | "create"
 */
const BudgetReportExcelWorkspace = ({ mode = "edit" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId: eventIdParam, id: idParam } = useParams();
  const [searchParams] = useSearchParams();
  const user = useSelector((state) => state.user.value);
  const authHeaders = { headers: { Authorization: user?.access_token } };

  const eventId =
    eventIdParam ||
    idParam ||
    searchParams.get("eventId") ||
    null;

  const navLabel = (() => {
    const s = location.state || {};
    if (s.eventLabel) return String(s.eventLabel);
    if (s.eventName || s.clientName) {
      return [s.eventName, s.clientName].filter(Boolean).join(" - ");
    }
    return "";
  })();

  const readOnly = mode === "view";
  const sheetsRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workbookData, setWorkbookData] = useState(null);
  const [version, setVersion] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [sheetReady, setSheetReady] = useState(false);
  const [sheetStats, setSheetStats] = useState(null);
  const [event, setEvent] = useState(null);
  const [eventLabel, setEventLabel] = useState(navLabel);
  const [instanceKey, setInstanceKey] = useState(0);

  const load = useCallback(async () => {
    if (!user?.access_token) {
      message.error("Authentication required. Please login again.");
      setLoading(false);
      return;
    }
    if (!eventId) {
      message.error("Missing event id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setSheetReady(false);
    try {
      let doc = null;
      let ev = null;

      try {
        ev = await fetchEventById({ eventId, authHeaders });
        if (ev) {
          setEvent(ev);
          setEventLabel(getEventDisplayLabel(ev));
        }
      } catch {
        // label resolved below from workbook meta if needed
      }

      try {
        doc = await fetchBudgetReportWorkbook({ eventId, authHeaders });
      } catch (wbErr) {
        message.error(
          wbErr?.response?.data?.message ||
            "Failed to load budget report Excel.",
        );
        setWorkbookData(null);
        setVersion(0);
        setUpdatedAt(null);
        setSheetStats(null);
        setInstanceKey((k) => k + 1);
        return;
      }

      const snapshot = cloneWorkbookData(doc.workbookData);
      setWorkbookData(snapshot);
      setVersion(doc.version ?? 0);
      setUpdatedAt(doc.updatedAt);
      setSheetStats(doc.stats || getWorkbookStats(snapshot));

      if (!ev) {
        const meta = doc?.meta || {};
        const fromMeta =
          meta.eventName || meta.clientName
            ? [meta.eventName, meta.clientName].filter(Boolean).join(" - ")
            : "";
        if (fromMeta) setEventLabel(fromMeta);
      }

      setInstanceKey((k) => k + 1);
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Failed to load budget report Excel.",
      );
      setWorkbookData(null);
      setVersion(0);
      setUpdatedAt(null);
      setSheetStats(null);
      setInstanceKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auth from token
  }, [user?.access_token, eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (readOnly) return;
    if (!user?.access_token) {
      message.error("Authentication required. Please login again.");
      return;
    }
    if (!eventId) {
      message.error("Select an event before saving.");
      return;
    }

    setSaving(true);
    try {
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

      const saved = await saveBudgetReportWorkbook({
        eventId,
        event,
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

      message.success(
        `Saved ${stats.sheetCount} sheet${stats.sheetCount === 1 ? "" : "s"} · ${stats.cellCount} cell${stats.cellCount === 1 ? "" : "s"} (mapped to this event)`,
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
          err?.response?.data?.message || "Failed to save budget report Excel.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const titleLabel =
    eventLabel ||
    (event ? getEventDisplayLabel(event) : "") ||
    "Loading event…";

  const modeLabel =
    mode === "view" ? "View" : mode === "create" ? "Create" : "Edit";

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
          onClick={() => navigate("/user/budgetreport/eventwise")}
          style={{ padding: "4px 8px" }}
        >
          Back
        </Button>
        <div style={{ flex: 1, minWidth: 180 }}>
          <Title level={4} style={{ margin: 0 }}>
            Budget Report Excel — {modeLabel}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {titleLabel}
            {updatedAt
              ? ` · Last saved ${dayjs(updatedAt).format("DD MMM YYYY, hh:mm A")}`
              : " · Not saved yet"}
            {version > 0 ? ` · v${version}` : ""}
            {sheetStats?.sheetCount
              ? ` · ${sheetStats.sheetCount} sheet${sheetStats.sheetCount === 1 ? "" : "s"}`
              : ""}
          </Text>
        </div>

        <Tag color={readOnly ? "blue" : "green"}>
          {readOnly ? "Read only" : "Editable"}
        </Tag>

        {readOnly ? (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() =>
              navigate(`/user/budgetreport/edit/${eventId}`, {
                state: {
                  eventLabel: titleLabel,
                  eventName: event
                    ? undefined
                    : location.state?.eventName,
                  clientName: location.state?.clientName,
                },
              })
            }
          >
            Edit
          </Button>
        ) : (
          <>
            <Button
              icon={<EyeOutlined />}
              onClick={() =>
                navigate(`/user/budgetreport/view/${eventId}`, {
                  state: {
                    eventLabel: titleLabel,
                    eventName: location.state?.eventName,
                    clientName: location.state?.clientName,
                  },
                })
              }
              disabled={!eventId}
            >
              View
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={load}
              disabled={loading || saving}
            >
              Reload
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={loading || !sheetReady || !eventId}
            >
              Save
            </Button>
          </>
        )}
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
              readOnly={readOnly}
              onReady={() => setSheetReady(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetReportExcelWorkspace;
