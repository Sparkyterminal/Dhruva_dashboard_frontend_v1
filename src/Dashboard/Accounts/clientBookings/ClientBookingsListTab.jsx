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
} from "@ant-design/icons";
import { motion } from "framer-motion";
import {
  getEventName,
  formatDate,
  formatAmount,
  getTotalPayable,
  getTotalAgreedAmount,
  getTotalExpectedAdvances,
  getTotalReceivedAdvances,
} from "./clientBookingsUtils";
import ClientBookingsFilters from "./ClientBookingsFilters";
import ClientBookingsStatsCards from "./ClientBookingsStatsCards";

const { Text } = Typography;

const buildColumns = (eventConfirmationTab, formatDateFn, formatAmountFn, getEventNameFn, getTotalAgreedFn, getTotalExpectedFn, getTotalReceivedFn, onViewDetails) => [
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
  ...(eventConfirmationTab === "InProgress" || eventConfirmationTab === "Cancelled"
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
    title: "Agreed Amount",
    key: "agreedAmount",
    width: 130,
    align: "right",
    render: (_, record) => (
      <Text strong className="text-slate-800">
        {formatAmountFn(getTotalAgreedFn(record))}
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
  eventNameOptions,
  eventConfirmationTab,
  setFilterEventName,
  setFilterDateRange,
  setEventConfirmationTab,
  pagination,
  handleTableChange,
  showEventDetailsDrawer,
}) => {
  const filteredBookings = bookings.filter(
    (booking) => booking.eventConfirmation === eventConfirmationTab,
  );
  const totalBookings = filteredBookings.length;
  const totalPayableRevenue = filteredBookings.reduce(
    (acc, curr) => acc + getTotalPayable(curr),
    0,
  );
  const totalReceivedRevenue = filteredBookings.reduce(
    (acc, curr) => acc + getTotalReceivedAdvances(curr),
    0,
  );
  const totalPendingRevenue = filteredBookings.reduce((acc, curr) => {
    const expected = getTotalExpectedAdvances(curr);
    const received = getTotalReceivedAdvances(curr);
    return acc + (expected - received);
  }, 0);

  const columns = buildColumns(
    eventConfirmationTab,
    formatDate,
    formatAmount,
    getEventName,
    getTotalAgreedAmount,
    getTotalExpectedAdvances,
    getTotalReceivedAdvances,
    showEventDetailsDrawer,
  );

  return (
    <div className="space-y-6">
      <ClientBookingsFilters
        filterEventName={filterEventName}
        filterDateRange={filterDateRange}
        eventNameOptions={eventNameOptions}
        onEventNameChange={setFilterEventName}
        onDateRangeChange={setFilterDateRange}
        onClear={() => {
          setFilterEventName(undefined);
          setFilterDateRange(null);
        }}
      />

      <Tabs
        activeKey={eventConfirmationTab}
        onChange={setEventConfirmationTab}
        items={[
          {
            key: "InProgress",
            label: (
              <span>
                <ClockCircleOutlined /> InProgress (
                {bookings.filter((b) => b.eventConfirmation === "InProgress").length})
              </span>
            ),
          },
          {
            key: "Confirmed Event",
            label: (
              <span>
                <CheckCircleOutlined /> Confirmed Event (
                {bookings.filter((b) => b.eventConfirmation === "Confirmed Event").length})
              </span>
            ),
          },
          {
            key: "Cancelled",
            label: (
              <span>
                ❌ Cancelled (
                {bookings.filter((b) => b.eventConfirmation === "Cancelled").length})
              </span>
            ),
          },
        ]}
      />

      <ClientBookingsStatsCards
        totalBookings={totalBookings}
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
            dataSource={filteredBookings}
            loading={loading}
            rowKey="_id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: filteredBookings.length,
              showSizeChanger: true,
              showTotal: (total, range) => (
                <span className="text-slate-600 text-sm">
                  Showing {range[0]}-{range[1]} of {total} bookings
                </span>
              ),
              pageSizeOptions: ["10", "20", "50"],
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            className="custom-table"
          />
        </Card>
      </motion.div>
    </div>
  );
};

export default ClientBookingsListTab;
