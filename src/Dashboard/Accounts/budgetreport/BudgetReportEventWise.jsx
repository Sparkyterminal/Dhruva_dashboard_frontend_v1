import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Drawer, Table, message, Input } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../../../config";
import BudgetReportDetailsView from "./BudgetReportDetailsView";
import AgreedAmountBreakupCard from "./AgreedAmountBreakupCard";

const { Search } = Input;

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
    <div className="budget-report-eventwise" style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/user")}
            style={{ marginRight: 8 }}
          >
            Back to Home
          </Button>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 600 }}>
            Budget Reports (Event-wise)
          </h1>
        </div>
        <Button type="primary" onClick={() => navigate("/user/budgetreport")}>
          Add budget report
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="Search by event name, client name, or report ID"
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
          style={{ maxWidth: 500 }}
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

      <Drawer
        title={drawerTitle}
        placement="right"
        width="90%"
        open={drawerOpen}
        onClose={closeDrawer}
        destroyOnClose
        styles={{ body: { paddingBottom: 24 } }}
      >
        {selectedReport && (
          <>
            <BudgetReportDetailsView reportData={selectedReport} />
            {selectedReport.eventId &&
              typeof selectedReport.eventId === "object" &&
              selectedReport.eventId.eventTypes?.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#1e293b",
                      marginBottom: 12,
                    }}
                  >
                    Agreed Amount & Breakup
                  </div>
                  <AgreedAmountBreakupCard event={selectedReport.eventId} />
                </div>
              )}
          </>
        )}
      </Drawer>
    </div>
  );
};

export default BudgetReportEventWise;
