import React, { useCallback, useMemo, useState } from "react";
import { Button, Dropdown, Modal, Select, Spin, message } from "antd";
import {
  AppstoreOutlined,
  CopyOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  cloneBudgetReportWorkbook,
  eventHasBudgetReport,
  fetchBudgetReportCloneSources,
  getBudgetReportSourceEventId,
} from "./excel/budgetReportExcelApi";
import { getEventName as defaultGetEventName } from "./excel/budgetReportExcelUtils";
import BudgetReportExcelViewDrawer from "./BudgetReportExcelViewDrawer";

/**
 * Client Bookings / Inflow table cell for Budget Report (Excel).
 *
 * - If event has budgetReport / budgetReportsCount → show View
 *   → opens full-width read-only Excel drawer
 * - Else → Budget button with: Clone from existing | Add new
 */
const BudgetReportListCell = ({
  record,
  getEventName = defaultGetEventName,
  onView,
  onAfterMutation,
  accessToken,
  showAddNew = true,
}) => {
  const navigate = useNavigate();
  const [cloneOpen, setCloneOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [sourceEventId, setSourceEventId] = useState(undefined);
  const [cloning, setCloning] = useState(false);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: accessToken } }),
    [accessToken],
  );

  const targetEventId = record?._id != null ? String(record._id) : null;
  const hasReport = eventHasBudgetReport(record);

  const eventLabel = useMemo(() => {
    const name =
      typeof getEventName === "function"
        ? getEventName(record?.eventName)
        : defaultGetEventName(record?.eventName);
    const client = record?.clientName || "—";
    return `${name} - ${client}`;
  }, [getEventName, record]);

  const loadCloneSources = useCallback(async () => {
    if (!accessToken) return;
    setSourcesLoading(true);
    try {
      const list = await fetchBudgetReportCloneSources({
        authHeaders,
        excludeEventId: targetEventId,
      });
      setSources(list);
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.message ||
          "Could not load events with budget reports",
      );
      setSources([]);
    } finally {
      setSourcesLoading(false);
    }
  }, [accessToken, authHeaders, targetEventId]);

  const openCloneModal = () => {
    setSourceEventId(undefined);
    setCloneOpen(true);
    loadCloneSources();
  };

  const runClone = async () => {
    if (!sourceEventId) {
      message.warning("Select a budget report to clone from");
      return;
    }
    if (!targetEventId) {
      message.error("Missing event");
      return;
    }

    const source = sources.find(
      (s) => String(s.sourceEventId) === String(sourceEventId),
    );

    setCloning(true);
    try {
      await cloneBudgetReportWorkbook({
        sourceEventId,
        targetEventId,
        targetEvent: record,
        sourceReportId: source?.sourceReportId || null,
        authHeaders,
      });
      message.success("Budget report cloned for this event");
      setCloneOpen(false);
      onAfterMutation?.();
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.message ||
          err?.message ||
          "Clone failed. Check that the source report can be copied.",
      );
    } finally {
      setCloning(false);
    }
  };

  const goView = () => {
    if (!targetEventId) return;
    // Full-width read-only Excel drawer (handled here — do not open legacy drawer)
    setViewOpen(true);
  };

  const goAddNew = () => {
    if (!targetEventId) return;
    navigate("/user/budgetreport", {
      state: { preselectedEventId: targetEventId },
    });
  };

  const selectOptions = useMemo(
    () =>
      sources.map((s) => ({
        value: s.sourceEventId,
        label: s.sheetCount
          ? `${s.label} (${s.sheetCount} sheet${s.sheetCount === 1 ? "" : "s"})`
          : s.label,
      })),
    [sources],
  );

  if (hasReport) {
    return (
      <>
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={goView}
          className="text-indigo-600 p-0 h-auto"
        >
          View
        </Button>
        <BudgetReportExcelViewDrawer
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          record={record}
        />
      </>
    );
  }

  const menuItems = [
    {
      key: "clone",
      icon: <CopyOutlined />,
      label: "Clone from existing",
    },
    ...(showAddNew
      ? [
          {
            key: "add",
            icon: <PlusOutlined />,
            label: "Add new",
          },
        ]
      : []),
  ];

  const onMenuClick = ({ key, domEvent }) => {
    domEvent?.stopPropagation?.();
    if (key === "clone") openCloneModal();
    if (key === "add") goAddNew();
  };

  return (
    <>
      <Dropdown
        menu={{ items: menuItems, onClick: onMenuClick }}
        trigger={["click"]}
        placement="bottomLeft"
      >
        <Button
          type="default"
          size="small"
          icon={<AppstoreOutlined />}
          className="border-indigo-200 text-indigo-700"
        >
          Budget
        </Button>
      </Dropdown>

      <Modal
        title="Clone budget report"
        open={cloneOpen}
        onCancel={() => !cloning && setCloneOpen(false)}
        onOk={runClone}
        okText="Clone"
        confirmLoading={cloning}
        destroyOnClose
        width={520}
        okButtonProps={{ disabled: !sourceEventId || sourcesLoading }}
      >
        <p className="text-slate-600 text-sm mb-3">
          Copy the full Excel workbook (all sheets) from an existing event into{" "}
          <strong>{eventLabel}</strong>.
        </p>
        {sourcesLoading ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : selectOptions.length === 0 ? (
          <p className="text-amber-700 text-sm">
            No other events have a budget report yet. Use &quot;Add new&quot; to
            create one from scratch for this event.
          </p>
        ) : (
          <Select
            showSearch
            allowClear
            placeholder="Choose source event budget report"
            className="w-full"
            optionFilterProp="label"
            options={selectOptions}
            value={sourceEventId}
            onChange={setSourceEventId}
          />
        )}
      </Modal>
    </>
  );
};

export default BudgetReportListCell;

export { eventHasBudgetReport, getBudgetReportSourceEventId };
