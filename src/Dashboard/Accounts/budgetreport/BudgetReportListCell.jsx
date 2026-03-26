import React, { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { Button, Dropdown, Modal, Select, Spin, message } from "antd";
import {
  AppstoreOutlined,
  CopyOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../../config";

/** Same event list shape as BudgetReportHome (GET /events + embedded budgetReport). */
const parseEventsPayload = (res) => {
  const raw = res.data?.events ?? res.data?.data ?? res.data;
  return Array.isArray(raw) ? raw : [];
};

const getReportIdFromEvent = (ev) => {
  const br = ev?.budgetReport;
  if (!br) return null;
  if (typeof br === "string") return br;
  return br._id != null ? String(br._id) : null;
};

const getCloneSourceLabelFromEvent = (ev, getEventName) => {
  const name = getEventName(ev?.eventName);
  const client = ev?.clientName || "—";
  return `${name} - ${client}`;
};

/**
 * Table cell: View when event has a budget; otherwise App menu (clone / add new).
 * Clone uses POST /api/budget-report/:id/clone with { eventId } per FRONTEND.md.
 */
const BudgetReportListCell = ({
  record,
  getEventName,
  onView,
  onAfterMutation,
  accessToken,
  /** If false, skip "Add new" (e.g. route not mounted for role) */
  showAddNew = true,
}) => {
  const navigate = useNavigate();
  const [cloneOpen, setCloneOpen] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [sourceReportId, setSourceReportId] = useState(undefined);
  const [cloning, setCloning] = useState(false);

  const config = useMemo(
    () => ({ headers: { Authorization: accessToken } }),
    [accessToken],
  );

  const targetEventId = record?._id;

  const loadCloneSources = useCallback(async () => {
    if (!accessToken) return;
    setSourcesLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}events`, {
        ...config,
        params: { page: 1, limit: 1000 },
      });
      const bookings = parseEventsPayload(res);
      const tid = targetEventId != null ? String(targetEventId) : "";
      // Same /events payload as BudgetReportHome; any row with embedded budgetReport can be a clone source
      const withBudget = bookings.filter((ev) => {
        const rid = getReportIdFromEvent(ev);
        if (!rid) return false;
        if (String(ev._id) === tid) return false;
        return true;
      });
      setSources(withBudget);
    } catch (err) {
      console.error(err);
      message.error(
        err.response?.data?.message || "Could not load events with budget reports",
      );
      setSources([]);
    } finally {
      setSourcesLoading(false);
    }
  }, [accessToken, config, targetEventId]);

  const openCloneModal = () => {
    setSourceReportId(undefined);
    setCloneOpen(true);
    loadCloneSources();
  };

  const runClone = async () => {
    if (!sourceReportId) {
      message.warning("Select a budget report to clone from");
      return;
    }
    if (!targetEventId) {
      message.error("Missing event");
      return;
    }
    setCloning(true);
    try {
      await axios.post(
        `${API_BASE_URL}budget-report/${sourceReportId}/clone`,
        { eventId: String(targetEventId) },
        config,
      );
      message.success("Budget report cloned for this event");
      setCloneOpen(false);
      onAfterMutation?.();
    } catch (err) {
      console.error(err);
      message.error(
        err.response?.data?.message ||
          "Clone failed. Check that the source report can be copied.",
      );
    } finally {
      setCloning(false);
    }
  };

  const goAddNew = () => {
    navigate("/user/budgetreport", {
      state: { preselectedEventId: String(targetEventId) },
    });
  };

  const selectOptions = useMemo(
    () =>
      sources.map((ev) => ({
        value: getReportIdFromEvent(ev),
        label: getCloneSourceLabelFromEvent(ev, getEventName),
      })),
    [sources, getEventName],
  );

  if (record?.budgetReport) {
    return (
      <Button
        type="link"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => onView?.(record)}
        className="text-indigo-600 p-0 h-auto"
      >
        View
      </Button>
    );
  }

  const menuItems = [
    {
      key: "clone",
      icon: <CopyOutlined />,
      label: "Clone from another event",
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
        width={480}
      >
        <p className="text-slate-600 text-sm mb-3">
          Copy line items and structure from an existing report into this event.
        </p>
        {sourcesLoading ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : selectOptions.length === 0 ? (
          <p className="text-amber-700 text-sm">
            No other events in this list have a budget report yet. Use
            &quot;Add new&quot; on another booking first, or create from
            scratch.
          </p>
        ) : (
          <Select
            showSearch
            allowClear
            placeholder="Choose source report"
            className="w-full"
            optionFilterProp="label"
            options={selectOptions}
            value={sourceReportId}
            onChange={setSourceReportId}
          />
        )}
      </Modal>
    </>
  );
};

export default BudgetReportListCell;
