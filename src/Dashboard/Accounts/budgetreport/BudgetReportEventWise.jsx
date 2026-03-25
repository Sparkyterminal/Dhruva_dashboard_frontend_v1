import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Drawer, Table, message, Input, Card, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../../../config";
import BudgetReportDetailsView from "./BudgetReportDetailsView";
import AgreedAmountBreakupCard from "./AgreedAmountBreakupCard";

const { Search } = Input;
const { Title, Text } = Typography;

const BudgetReportEventWise = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector((state) => state.user.value);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [drawerTitle, setDrawerTitle] = useState("Budget Report Details");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const fetchReports = useCallback(async (searchTerm = "") => {
    setLoading(true);
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const res = await axios.get(`${API_BASE_URL}budget-report`, {
        headers: { Authorization: user?.access_token },
        params,
      });
      const data = res.data?.data ?? res.data?.budgetReports ?? res.data?.reports ?? [];
      const list = Array.isArray(data) ? data : [];
      setReports(list);
    } catch (err) {
      console.error("Error fetching budget reports:", err);
      message.error(err.response?.data?.message || "Failed to load budget reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [user?.access_token]);

  useEffect(() => {
    const searchTerm = searchParams.get("search") || "";
    setSearchQuery(searchTerm);
    fetchReports(searchTerm);
  }, [fetchReports, searchParams]);

  const getEventDisplay = (record) => {
    const event = record.event ?? record.eventId;
    if (typeof event === "object" && event?.eventName) return event.eventName.name;
    if (typeof event === "object" && event?.name) return event.name;
    return record.eventName ?? record.eventId ?? "—";
  };

  const getClientDisplay = (record) => {
    const event = record.event ?? record.eventId;
    if (typeof event === "object" && event?.clientName) return event.clientName;
    if (typeof event === "object" && event?.client?.name) return event.client.name;
    return record.clientName ?? "—";
  };

  const openViewDrawer = (report, eventLabel) => {
    setSelectedReport(report);
    setDrawerTitle(eventLabel ? `Budget Report: ${eventLabel}` : "Budget Report Details");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedReport(null);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    // Update URL params - useEffect will trigger API call
    setSearchParams(value ? { search: value } : {});
  };

  const columns = [
    {
      title: "Event",
      dataIndex: "event",
      key: "event",
      width: 220,
      render: (_, record) => getEventDisplay(record),
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      width: 180,
      render: (_, record) => getClientDisplay(record),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (val) =>
        val ? new Date(val).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—",
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      fixed: "right",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Button
            type="link"
            size="small"
            onClick={() => openViewDrawer(record, getEventDisplay(record))}
          >
            View details
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/user/budgetreport/edit/${record._id}`)}
          >
            Edit report
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() =>
              navigate(`/user/budgetreport/accounts/${record._id}`)
            }
          >
            Accounts edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="budget-report-container budget-report-eventwise">
      <div className="budget-report-shell space-y-6">
        <Card
          className="border-0 shadow-md"
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(226,232,240,0.9)",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/user")}
                size="large"
                className="rounded-xl"
              >
                Back to Home
              </Button>
              <div>
                <Title level={3} className="!mb-0 !text-slate-800">
                  Budget reports
                </Title>
                <Text type="secondary" className="text-sm">
                  Event-wise list — view details, edit, or open accounts allocation.
                </Text>
              </div>
            </div>
            <Button
              type="primary"
              size="large"
              className="rounded-xl shadow-md border-0"
              style={{
                background:
                  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)",
                boxShadow: "0 4px 14px -4px rgba(79, 70, 229, 0.45)",
              }}
              onClick={() => navigate("/user/budgetreport")}
            >
              Add budget report
            </Button>
          </div>
        </Card>

        <Card
          className="border-0 shadow-md budget-report-ant-table"
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(226,232,240,0.9)",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <div className="mb-5 max-w-xl">
            <Text strong className="text-slate-700 block mb-2">
              Search
            </Text>
            <Search
              placeholder="Event name, client, or report ID"
              allowClear
              enterButton="Search"
              size="large"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (!val) {
                  setSearchParams({});
                  fetchReports("");
                }
              }}
              onSearch={handleSearch}
              className="rounded-xl"
            />
          </div>

          <Table
            rowKey="_id"
            columns={columns}
            dataSource={reports}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} reports`,
            }}
            scroll={{ x: 600 }}
            locale={{
              emptyText: loading
                ? null
                : searchQuery
                  ? `No reports found matching "${searchQuery}"`
                  : "No budget reports yet. Add one from the button above.",
            }}
          />
        </Card>
      </div>

      <Drawer
        title={
          <span className="text-base font-semibold text-slate-800">
            {drawerTitle}
          </span>
        }
        placement="right"
        width="90%"
        open={drawerOpen}
        onClose={closeDrawer}
        destroyOnClose
        styles={{
          body: { padding: 20, background: "#f8fafc" },
          header: { borderBottom: "1px solid #e2e8f0" },
        }}
      >
        {selectedReport && (
          <div className="space-y-5">
            <Card
              className="border-0 shadow-sm"
              style={{
                borderRadius: 14,
                border: "1px solid #e2e8f0",
              }}
              bodyStyle={{ padding: 0 }}
            >
              <BudgetReportDetailsView reportData={selectedReport} />
            </Card>
            {selectedReport.eventId &&
              typeof selectedReport.eventId === "object" &&
              selectedReport.eventId.eventTypes?.length > 0 && (
                <div>
                  <Title level={5} className="!mb-3 !text-slate-800">
                    Agreed amount & breakup
                  </Title>
                  <AgreedAmountBreakupCard event={selectedReport.eventId} />
                </div>
              )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default BudgetReportEventWise;
