import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Card,
  Col,
  Row,
  Tabs,
  Typography,
  message,
  Spin,
  Space,
  Button,
  Switch,
} from "antd";
import { ArrowLeftOutlined, BookOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import DaybookDateSelector from "./DaybookDateSelector";
import DaybookSummaryCards from "./DaybookSummaryCards";
import DaybookInflowTable from "./DaybookInflowTable";
import DaybookOutflowTable from "./DaybookOutflowTable";
import DaybookInflowModal from "./DaybookInflowModal";
import DaybookAccountsBalanceTable from "./DaybookAccountsBalanceTable";
import DaybookAccountsBalanceModal from "./DaybookAccountsBalanceModal";
import {
  deleteInflow,
  deleteOpenCloseBalance,
  fetchDaybookRange,
} from "./daybookApi";
import { isEventAdvanceDaybookRow } from "./daybookUtils";

const { Title, Text } = Typography;

const DEFAULT_DATA_LIMIT = 200;

const Daybookhome = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);

  const [selectedRange, setSelectedRange] = useState(() => [dayjs(), dayjs()]);
  const [includeEventAdvances, setIncludeEventAdvances] = useState(true);
  const [loading, setLoading] = useState(false);
  const [daybook, setDaybook] = useState(null);
  const [activeTab, setActiveTab] = useState("inflow");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: user?.access_token } }),
    [user?.access_token],
  );

  const startDate = selectedRange?.[0];
  const endDate = selectedRange?.[1];

  const startDateStr = startDate?.isValid?.() ? startDate.format("YYYY-MM-DD") : "";
  const endDateStr = endDate?.isValid?.() ? endDate.format("YYYY-MM-DD") : "";

  const normalizedRangeLabel = useMemo(() => {
    if (!startDateStr || !endDateStr) return "-";
    if (startDateStr === endDateStr) return startDateStr;
    return `${startDateStr} to ${endDateStr}`;
  }, [startDateStr, endDateStr]);

  const fetchDaybook = useCallback(async () => {
    if (!startDateStr || !endDateStr) return;
    setLoading(true);
    try {
      const resData = await fetchDaybookRange({
        startDate: startDateStr,
        endDate: endDateStr,
        limit: DEFAULT_DATA_LIMIT,
        includeEventAdvances,
        authHeaders,
      });
      setDaybook(resData || null);
    } catch (err) {
      message.error("Failed to fetch daybook data");
      // eslint-disable-next-line no-console
      console.error(err);
      setDaybook(null);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, endDateStr, startDateStr, includeEventAdvances]);

  useEffect(() => {
    fetchDaybook();
  }, [fetchDaybook]);

  const accountsCount = daybook?.accounts?.openCloseBalances?.length ?? 0;

  const [inflowModalOpen, setInflowModalOpen] = useState(false);
  const [inflowModalMode, setInflowModalMode] = useState("add"); // add | edit
  const [inflowEditingRecord, setInflowEditingRecord] = useState(null);

  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceModalMode, setBalanceModalMode] = useState("add"); // add | edit
  const [balanceEditingRecord, setBalanceEditingRecord] = useState(null);

  const [deletingInflowId, setDeletingInflowId] = useState(null);
  const [deletingBalanceId, setDeletingBalanceId] = useState(null);

  const handleAddInflow = () => {
    setInflowModalMode("add");
    setInflowEditingRecord(null);
    setInflowModalOpen(true);
  };

  const handleEditInflow = (record) => {
    if (isEventAdvanceDaybookRow(record)) {
      message.warning(
        "This row is a booking advance from an event. Edit it on the event, not in daybook inflow.",
      );
      return;
    }
    setInflowModalMode("edit");
    setInflowEditingRecord(record);
    setInflowModalOpen(true);
  };

  const handleDeleteInflow = async (record) => {
    if (isEventAdvanceDaybookRow(record)) {
      message.warning(
        "Booking advances cannot be deleted from daybook. Remove or change the advance on the event.",
      );
      return;
    }
    const id = record?._id ?? record?.id;
    if (!id) return;
    setDeletingInflowId(id);
    try {
      await deleteInflow({ id, authHeaders });
      message.success("Inflow deleted successfully");
      await fetchDaybook();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      message.error("Failed to delete inflow");
    } finally {
      setDeletingInflowId(null);
    }
  };

  const handleInflowModalSuccess = () => {
    setInflowModalOpen(false);
    message.success(
      inflowModalMode === "edit"
        ? "Inflow updated successfully"
        : "Inflow added successfully",
    );
    fetchDaybook();
  };

  const handleAddBalance = () => {
    setBalanceModalMode("add");
    setBalanceEditingRecord(null);
    setBalanceModalOpen(true);
  };

  const handleEditBalance = (record) => {
    setBalanceModalMode("edit");
    setBalanceEditingRecord(record);
    setBalanceModalOpen(true);
  };

  const handleDeleteBalance = async (record) => {
    const id = record?._id ?? record?.id;
    if (!id) return;
    setDeletingBalanceId(id);
    try {
      await deleteOpenCloseBalance({ id, authHeaders });
      message.success("Balance record deleted successfully");
      await fetchDaybook();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      message.error("Failed to delete balance record");
    } finally {
      setDeletingBalanceId(null);
    }
  };

  const handleBalanceModalSuccess = () => {
    setBalanceModalOpen(false);
    message.success(
      balanceModalMode === "edit"
        ? "Balance record updated successfully"
        : "Balance record added successfully",
    );
    fetchDaybook();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card
          className="border-0 shadow-sm"
          style={{
            borderRadius: "16px",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(10px)",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/user")}
                size="large"
                className="border-0 shadow-none hover:bg-slate-100 text-slate-600"
                style={{ borderRadius: "10px" }}
              >
                Back
              </Button>
            </Col>

            <Col xs={24} sm={8} className="text-center">
              <Title
                level={2}
                className="mb-0! text-2xl! md:text-3xl! font-semibold text-slate-800"
              >
                <span style={{ marginRight: 8 }}>
                  <BookOutlined />
                </span>
                Daybook
              </Title>
              <Text className="text-xs md:text-sm text-slate-500">
                Day to day inflow, outflow & P&L
              </Text>
            </Col>

            <Col xs={24} sm={8} className="text-right">
              <Space size="middle" className="justify-end">
                <Button
                  size="large"
                  onClick={() => setSelectedRange([dayjs(), dayjs()])}
                  className="border-0 shadow-none hover:bg-slate-100 text-slate-700"
                >
                  Today
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <DaybookDateSelector value={selectedRange} onChange={setSelectedRange} />

        <Card
          className="border-0 shadow-sm"
          style={{
            borderRadius: "16px",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(10px)",
          }}
          bodyStyle={{ padding: "14px 20px" }}
        >
          <Space align="center" wrap>
            <Switch
              checked={includeEventAdvances}
              onChange={setIncludeEventAdvances}
            />
            <Text className="text-slate-700">
              Include booking advances in inflow (matched by advance received date in range)
            </Text>
          </Space>
        </Card>

        <DaybookSummaryCards
          loading={loading}
          inflow={daybook?.inflow}
          outflow={daybook?.outflow}
          accounts={daybook?.accounts}
          selectedDateLabel={normalizedRangeLabel}
        />

        <Card
          className="border-0 shadow-sm"
          style={{
            borderRadius: "16px",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(10px)",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "inflow",
                label: `Inflow (${daybook?.inflow?.count ?? 0})`,
              },
              {
                key: "outflow",
                label: `Outflow (${daybook?.outflow?.count ?? 0})`,
              },
              {
                key: "accounts",
                label: `Accounts (${accountsCount})`,
              },
            ]}
            className="modern-tabs"
          />

          <div style={{ marginTop: 16 }}>
            {loading && (
              <div style={{ padding: 24 }}>
                <Spin />
              </div>
            )}

            {!loading && activeTab === "inflow" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 12,
                  }}
                >
                  <Button type="primary" onClick={handleAddInflow}>
                    Add Inflow
                  </Button>
                </div>
                <DaybookInflowTable
                  rows={daybook?.inflow?.data}
                  onEdit={handleEditInflow}
                  onDelete={handleDeleteInflow}
                  deletingId={deletingInflowId}
                />
              </div>
            )}
            {!loading && activeTab === "outflow" && (
              <DaybookOutflowTable rows={daybook?.outflow?.data} />
            )}
            {!loading && activeTab === "accounts" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 12,
                  }}
                >
                  <Button type="primary" onClick={handleAddBalance}>
                    Add Open/Close Balance
                  </Button>
                </div>
                <DaybookAccountsBalanceTable
                  rows={daybook?.accounts?.openCloseBalances}
                  onEdit={handleEditBalance}
                  onDelete={handleDeleteBalance}
                  deletingId={deletingBalanceId}
                />
              </div>
            )}

            {!loading && !daybook && (
              <div className="py-10 text-center">
                <Text type="secondary">No daybook data found.</Text>
              </div>
            )}
          </div>
        </Card>
      </div>

      <DaybookInflowModal
        open={inflowModalOpen}
        mode={inflowModalMode}
        initialValues={inflowEditingRecord}
        authHeaders={authHeaders}
        onCancel={() => setInflowModalOpen(false)}
        onSuccess={handleInflowModalSuccess}
      />

      <DaybookAccountsBalanceModal
        open={balanceModalOpen}
        mode={balanceModalMode}
        initialValues={balanceEditingRecord}
        existingBalances={daybook?.accounts?.openCloseBalances}
        authHeaders={authHeaders}
        onCancel={() => setBalanceModalOpen(false)}
        onSuccess={handleBalanceModalSuccess}
      />

      <style>{`
        .modern-tabs .ant-tabs-tab {
          border-radius: 8px 8px 0 0;
          padding: 12px 20px;
          font-weight: 600;
        }
        .modern-tabs .ant-tabs-tab-active {
          background: rgba(248, 250, 252, 1);
        }
        .modern-tabs .ant-tabs-ink-bar {
          height: 3px;
          border-radius: 3px 3px 0 0;
        }
      `}</style>
    </div>
  );
};

export default Daybookhome;