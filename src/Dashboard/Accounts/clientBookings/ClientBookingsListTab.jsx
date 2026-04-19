import React from "react";
import {
  Card,
  Row,
  Tabs,
  Table,
  Button,
  Tag,
  Typography,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  PhoneOutlined,
  HeartOutlined,
  TeamOutlined,
  EyeOutlined,
  AppstoreOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import {
  getEventName,
  formatDate,
  formatAmount,
  getTotalPayable,
  getTotalExpectedAdvances,
  getTotalReceivedAdvances,
  getTabLabelBookingCount,
} from "./clientBookingsUtils";
import ClientBookingsFilters from "./ClientBookingsFilters";
import ClientBookingsStatsCards from "./ClientBookingsStatsCards";
import BudgetReportListCell from "../budgetreport/BudgetReportListCell";

const { Text } = Typography;

const buildColumns = (
  listStatusTab,
  formatDateFn,
  formatAmountFn,
  getEventNameFn,
  getTotalBookedFn,
  getTotalExpectedFn,
  getTotalReceivedFn,
  onViewDetails,
  onViewBudgetReport,
  accessToken,
  onAfterBudgetMutation,
) => [
  {
    title: "Booked By",
    key: "bookedBy",
    width: 160,
    render: (_, record) => {
      const bookedByFirst =
        record?.bookedBy?.first_name ??
        record?.bookedBy?.firstName ??
        null;
      const createdByFirst =
        record?.createdBy?.first_name ??
        record?.createdBy?.firstName ??
        null;

      const raw = bookedByFirst ?? createdByFirst;
      const firstName =
        typeof raw === "string" ? raw.trim().split(/\s+/)[0] : null;

      return <Text strong className="text-slate-800">{firstName || "-"}</Text>;
    },
  },
  {
    title: "Event Confirmation",
    dataIndex: "eventConfirmation",
    key: "eventConfirmation",
    width: 140,
    render: (status) => {
      const colorMap = {
        "Confirmed Event": "green",
        InProgress: "orange",
        Cancelled: "red",
        Pending: "blue",
      };
      return (
        <Tag
          color={colorMap[status] || "default"}
          className="text-sm font-semibold px-3 py-1"
        >
          {status || "N/A"}
        </Tag>
      );
    },
  },
  {
    title: "Event Name",
    dataIndex: "eventName",
    key: "eventName",
    width: 140,
    render: (text) => {
      const eventNameStr = getEventNameFn(text);
      return (
        <Tag color="purple" className="text-sm font-semibold px-3 py-1">
          {eventNameStr}
        </Tag>
      );
    },
  },
  // {
  //   title: "Note",
  //   key: "note",
  //   width: 120,
  //   align: "right",
  //   render: (_, record) => (
  //     <Text strong className="text-black text-wrap">
  //       {record.note ? record.note : "N/A"}
  //     </Text>
  //   ),
  // },
  ...(listStatusTab === "inprogress" || listStatusTab === "cancelled"
    ? [
        {
          title: "Next Meeting Date",
          key: "meetingDate",
          width: 140,
          render: (_, record) => (
            <div className="flex items-center gap-1">
              <CalendarOutlined className="text-blue-500 text-xs" />
              <Text className="text-sm">
                {record.meetingDate
                  ? formatDateFn(record.meetingDate)
                  : "Not Set"}
              </Text>
            </div>
          ),
        },
      ]
    : []),
  {
    title: "Client Details",
    key: "clientDetails",
    width: 180,
    render: (_, record) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <UserOutlined className="text-blue-500" />
          <Text strong className="text-base">
            {record.clientName}
          </Text>
        </div>
        {record.brideName && record.groomName && (
          <div className="flex items-center gap-2">
            <HeartOutlined className="text-pink-500" />
            <Text className="text-sm text-gray-600">
              {record.brideName} & {record.groomName}
            </Text>
          </div>
        )}
      </div>
    ),
  },
  {
    title: "Contact",
    key: "contact",
    width: 130,
    render: (_, record) => (
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <PhoneOutlined className="text-green-500 text-xs" />
          <Text className="text-sm">{record.contactNumber}</Text>
        </div>
        {record.altContactNumber &&
          record.altContactNumber !== record.contactNumber && (
            <div className="flex items-center gap-1">
              <PhoneOutlined className="text-orange-500 text-xs" />
              <Text className="text-sm text-gray-500">
                {record.altContactNumber}
              </Text>
            </div>
          )}
      </div>
    ),
  },
  {
    title: "Leads",
    key: "leads",
    width: 120,
    render: (_, record) => (
      <div className="space-y-1">
        {record.lead1 && (
          <div className="flex items-center gap-1">
            <TeamOutlined className="text-blue-500 text-xs" />
            <Text className="text-sm">
              {typeof record.lead1 === "string"
                ? record.lead1
                : record.lead1?.name || "N/A"}
            </Text>
          </div>
        )}
        {record.lead2 && (
          <div className="flex items-center gap-1">
            <TeamOutlined className="text-purple-500 text-xs" />
            <Text className="text-sm">
              {typeof record.lead2 === "string"
                ? record.lead2
                : record.lead2?.name || "N/A"}
            </Text>
          </div>
        )}
        {!record.lead1 && !record.lead2 && (
          <Text className="text-xs text-gray-400">No leads</Text>
        )}
      </div>
    ),
  },
  {
    title: "Booked Amount",
    key: "bookedAmount",
    width: 130,
    align: "right",
    render: (_, record) => (
      <Text strong className="text-slate-800">
        {formatAmountFn(getTotalBookedFn(record))}
      </Text>
    ),
  },
  {
    title: "Payment Status",
    key: "paymentStatus",
    width: 150,
    render: (_, record) => {
      const expected = getTotalExpectedFn(record);
      const received = getTotalReceivedFn(record);
      const percentage =
        expected > 0 ? Math.round((received / expected) * 100) : 0;
      return (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <Text className="text-xs text-gray-500">Received:</Text>
            <Text strong className="text-sm text-green-600">
              {formatAmountFn(received)}
            </Text>
          </div>
          <div className="flex justify-between items-center">
            <Text className="text-xs text-gray-500">Balance:</Text>
            <Text className="text-sm">{formatAmountFn(expected)}</Text>
          </div>
          <Tag
            color={
              percentage === 100 ? "success" : percentage > 0 ? "warning" : "default"
            }
          >
            {percentage}% Collected
          </Tag>
        </div>
      );
    },
  },
  {
    title: "Budget Report",
    key: "budgetReport",
    width: 120,
    align: "center",
    render: (_, record) => (
      <BudgetReportListCell
        record={record}
        getEventName={getEventNameFn}
        onView={onViewBudgetReport}
        accessToken={accessToken}
        onAfterMutation={onAfterBudgetMutation}
      />
    ),
  },
  {
    title: "Event Types",
    key: "eventTypes",
    width: 110,
    align: "center",
    render: (_, record) => (
      <Button
        type="primary"
        icon={<EyeOutlined />}
        onClick={() => onViewDetails(record)}
        className="bg-gradient-to-r from-blue-500 to-purple-500 border-none"
      >
        View ({record.eventTypes?.length || 0})
      </Button>
    ),
  },
];

const ClientBookingsListTab = ({
  bookings,
  loading,
  filterEventName,
  filterDateRange,
  filterVenueId,
  eventNameOptions,
  venueOptions,
  listStatusTab,
  onListStatusTabChange,
  pagination,
  handleTableChange,
  showEventDetailsDrawer,
  onViewBudgetReport,
  accessToken,
  onBookingsMutated,
  bookingsSummary,
  setFilterEventName,
  setFilterDateRange,
  setFilterVenueId,
}) => {
  const totalsByStatus = bookingsSummary?.totalsByStatus;
  const tabCount = (key) => getTabLabelBookingCount(totalsByStatus, key);

  const totalPayableRevenue = bookings.reduce(
    (acc, curr) => acc + getTotalPayable(curr),
    0,
  );
  const totalReceivedRevenue = bookings.reduce(
    (acc, curr) => acc + getTotalReceivedAdvances(curr),
    0,
  );
  const totalPendingRevenue = bookings.reduce((acc, curr) => {
    const expected = getTotalExpectedAdvances(curr);
    const received = getTotalReceivedAdvances(curr);
    return acc + (expected - received);
  }, 0);

  const columns = buildColumns(
    listStatusTab,
    formatDate,
    formatAmount,
    getEventName,
    getTotalPayable,
    getTotalExpectedAdvances,
    getTotalReceivedAdvances,
    showEventDetailsDrawer,
    onViewBudgetReport,
    accessToken,
    onBookingsMutated,
  );

  return (
    <div className="space-y-6">
      <ClientBookingsFilters
        filterEventName={filterEventName}
        filterDateRange={filterDateRange}
        filterVenueId={filterVenueId}
        eventNameOptions={eventNameOptions}
        venueOptions={venueOptions}
        onEventNameChange={setFilterEventName}
        onDateRangeChange={setFilterDateRange}
        onVenueChange={setFilterVenueId}
        onClear={() => {
          setFilterEventName(undefined);
          setFilterDateRange(null);
          setFilterVenueId?.(undefined);
        }}
      />

      <Tabs
        activeKey={listStatusTab}
        onChange={onListStatusTabChange}
        items={[
          {
            key: "all",
            label: (
              <span>
                <AppstoreOutlined /> All
                {tabCount("all") != null && (
                  <span className="ml-1">({tabCount("all")})</span>
                )}
              </span>
            ),
          },
          {
            key: "confirmed",
            label: (
              <span>
                <CheckCircleOutlined /> Confirmed
                {tabCount("confirmed") != null && (
                  <span className="ml-1">({tabCount("confirmed")})</span>
                )}
              </span>
            ),
          },
          {
            key: "inprogress",
            label: (
              <span>
                <ClockCircleOutlined /> In progress
                {tabCount("inprogress") != null && (
                  <span className="ml-1">({tabCount("inprogress")})</span>
                )}
              </span>
            ),
          },
          {
            key: "cancelled",
            label: (
              <span>
                <CloseCircleOutlined /> Cancelled
                {tabCount("cancelled") != null && (
                  <span className="ml-1">({tabCount("cancelled")})</span>
                )}
              </span>
            ),
          },
        ]}
      />

      <ClientBookingsStatsCards
        summary={bookingsSummary}
        statusKey={listStatusTab}
        totalPayableRevenue={totalPayableRevenue}
        totalPendingRevenue={totalPendingRevenue}
        totalReceivedRevenue={totalReceivedRevenue}
        formatAmount={formatAmount}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card
          className="border-0"
          style={{
            borderRadius: "14px",
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <Table
            columns={columns}
            dataSource={bookings}
            loading={loading}
            rowKey="_id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total, range) => (
                <span className="text-slate-600 text-sm">
                  Showing {range[0]}-{range[1]} of {total} bookings
                </span>
              ),
              pageSizeOptions: ["10", "20", "50"],
            }}
            onChange={handleTableChange}
            scroll={{ x: 1320 }}
            className="custom-table"
          />
        </Card>
      </motion.div>
    </div>
  );
};

export default ClientBookingsListTab;
