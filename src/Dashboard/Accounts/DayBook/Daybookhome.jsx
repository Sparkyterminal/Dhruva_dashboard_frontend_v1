import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
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
} from "antd";
import { ArrowLeftOutlined, BookOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../../../config";
import DaybookDateSelector from "./DaybookDateSelector";
import DaybookSummaryCards from "./DaybookSummaryCards";
import DaybookInflowTable from "./DaybookInflowTable";
import DaybookOutflowTable from "./DaybookOutflowTable";

const { Title, Text } = Typography;

const DEFAULT_DATA_LIMIT = 200;

const Daybookhome = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);

  const [selectedDate, setSelectedDate] = useState(() => dayjs());
  const [loading, setLoading] = useState(false);
  const [daybook, setDaybook] = useState(null);
  const [activeTab, setActiveTab] = useState("inflow");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: user?.access_token } }),
    [user?.access_token],
  );

  const fetchDaybook = useCallback(
    async (dateObj) => {
      if (!dateObj || !dateObj.isValid()) return;
      setLoading(true);
      try {
        const yyyyMmDd = dateObj.format("YYYY-MM-DD");
        const res = await axios.get(`${API_BASE_URL}daybook`, {
          ...authHeaders,
          params: { date: yyyyMmDd, limit: DEFAULT_DATA_LIMIT },
        });
        setDaybook(res?.data || null);
      } catch (err) {
        message.error("Failed to fetch daybook data");
        console.error(err);
        setDaybook(null);
      } finally {
        setLoading(false);
      }
    },
    [authHeaders],
  );

  useEffect(() => {
    fetchDaybook(selectedDate);
  }, [fetchDaybook, selectedDate]);

  const yyyyMmDd = useMemo(
    () =>
      selectedDate?.isValid?.() ? selectedDate.format("YYYY-MM-DD") : "",
    [selectedDate],
  );

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
                  onClick={() => setSelectedDate(dayjs())}
                  className="border-0 shadow-none hover:bg-slate-100 text-slate-700"
                >
                  Today
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <DaybookDateSelector value={selectedDate} onChange={setSelectedDate} />

        <DaybookSummaryCards
          loading={loading}
          inflow={daybook?.inflow}
          outflow={daybook?.outflow}
          profitAndLoss={daybook?.profitAndLoss}
          selectedDateLabel={yyyyMmDd}
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
              <DaybookInflowTable rows={daybook?.inflow?.data} />
            )}
            {!loading && activeTab === "outflow" && (
              <DaybookOutflowTable rows={daybook?.outflow?.data} />
            )}

            {!loading && !daybook && (
              <div className="py-10 text-center">
                <Text type="secondary">No daybook data found.</Text>
              </div>
            )}
          </div>
        </Card>
      </div>

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