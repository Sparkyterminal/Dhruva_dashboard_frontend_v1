import React from "react";
import { Table } from "antd";
import { CalendarDays, Eye, Heart, Phone, Users } from "lucide-react";
import { Segmented } from "@/Components/PageKit";
import {
  getEventName,
  formatDate,
  formatAmount,
  capitalizeFirstLetter,
  getTotalPayable,
  getTotalExpectedAdvances,
  getBookingReceivedAmount,
  getTabLabelBookingCount,
} from "./clientBookingsUtils";
import ClientBookingsFilters from "./ClientBookingsFilters";
import ClientBookingsStatsCards from "./ClientBookingsStatsCards";
import BudgetReportListCell from "../budgetreport/BudgetReportListCell";
import ExportBookingsButtons from "./export/ExportBookingsButtons";
import "@/Components/PageKit/PageKit.css";
import "./Bookings.css";

const CONFIRMATION_TONE = {
  "Confirmed Event": "",
  InProgress: "is-gold",
  "Almost Booked": "is-blue",
  Cancelled: "is-red",
  Pending: "is-blue",
};

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
    title: "Booked by",
    key: "bookedBy",
    width: 130,
    render: (_, record) => {
      const bookedByFirst =
        record?.bookedBy?.first_name ?? record?.bookedBy?.firstName ?? null;
      const createdByFirst =
        record?.createdBy?.first_name ?? record?.createdBy?.firstName ?? null;

      const raw = bookedByFirst ?? createdByFirst;
      const firstName =
        typeof raw === "string" ? raw.trim().split(/\s+/)[0] : null;

      return <strong style={{ fontWeight: 600 }}>{firstName ? capitalizeFirstLetter(firstName) : "-"}</strong>;
    },
  },
  {
    title: "Status",
    dataIndex: "eventConfirmation",
    key: "eventConfirmation",
    width: 150,
    render: (status) => (
      <span className={`pk-pill ${CONFIRMATION_TONE[status] ?? "is-grey"}`}>{status || "N/A"}</span>
    ),
  },
  {
    title: "Event",
    dataIndex: "eventName",
    key: "eventName",
    width: 140,
    render: (text) => <span className="bk-event">{getEventNameFn(text)}</span>,
  },
  ...(["inprogress", "almostbooked", "cancelled"].includes(listStatusTab)
    ? [
        {
          title: "Next meeting",
          key: "meetingDate",
          width: 150,
          render: (_, record) => (
            <span className="bk-line">
              <CalendarDays size={14} aria-hidden="true" />
              {record.meetingDate ? formatDateFn(record.meetingDate) : <em>Not set</em>}
            </span>
          ),
        },
      ]
    : []),
  {
    title: "Client",
    key: "clientDetails",
    width: 220,
    render: (_, record) => (
      <div className="pk-who bk-client">
        <span className="pk-avatar is-soft" aria-hidden="true">
          {String(record.clientName || "?").trim().charAt(0).toUpperCase()}
        </span>
        <div style={{ minWidth: 0 }}>
          <strong className="bk-wrap">{record.clientName}</strong>
          {record.brideName && record.groomName && (
            <span className="bk-wrap bk-heart">
              <Heart size={12} aria-hidden="true" /> {record.brideName} &amp; {record.groomName}
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    title: "Contact",
    key: "contact",
    width: 150,
    render: (_, record) => (
      <div className="bk-stack">
        <span className="bk-line">
          <Phone size={13} aria-hidden="true" /> {record.contactNumber}
        </span>
        {record.altContactNumber && record.altContactNumber !== record.contactNumber && (
          <span className="bk-line is-muted">
            <Phone size={13} aria-hidden="true" /> {record.altContactNumber}
          </span>
        )}
      </div>
    ),
  },
  {
    title: "Leads",
    key: "leads",
    width: 150,
    render: (_, record) => (
      <div className="bk-stack">
        {record.lead1 && (
          <span className="bk-line">
            <Users size={13} aria-hidden="true" />
            {typeof record.lead1 === "string" ? record.lead1 : record.lead1?.name || "N/A"}
          </span>
        )}
        {record.lead2 && (
          <span className="bk-line">
            <Users size={13} aria-hidden="true" />
            {typeof record.lead2 === "string" ? record.lead2 : record.lead2?.name || "N/A"}
          </span>
        )}
        {!record.lead1 && !record.lead2 && <span className="pk-muted">No leads</span>}
      </div>
    ),
  },
  {
    title: "Booked amount",
    key: "bookedAmount",
    width: 140,
    align: "right",
    render: (_, record) => (
      <span className="pk-money">{formatAmountFn(getTotalBookedFn(record))}</span>
    ),
  },
  {
    title: "Payment",
    key: "paymentStatus",
    width: 200,
    render: (_, record) => {
      const booked = getTotalBookedFn(record);
      // Always use local received helper (complete weddings must not trust
      // advanceTotals.totalReceivedAmount — it double-counts across eventTypes).
      const received = getTotalReceivedFn(record);
      const balance = Math.max(booked - received, 0);
      const percentage =
        booked > 0 ? Math.min(Math.round((received / booked) * 100), 100) : 0;
      return (
        <div className="bk-pay">
          <div className="bk-pay-row">
            <span>Received</span>
            <strong className="is-green">{formatAmountFn(received)}</strong>
          </div>
          <div className="bk-pay-row">
            <span>Balance</span>
            <strong className="is-red">{formatAmountFn(balance)}</strong>
          </div>
          <div className="bk-bar" aria-hidden="true">
            <i style={{ width: `${percentage}%` }} />
          </div>
          <span className="bk-pay-pct">{percentage}% collected</span>
        </div>
      );
    },
  },
  {
    title: "Budget report",
    key: "budgetReport",
    width: 150,
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
    title: "",
    key: "eventTypes",
    width: 120,
    align: "right",
    fixed: "right",
    render: (_, record) => (
      <button type="button" className="pk-btn is-solid" onClick={() => onViewDetails(record)}>
        <Eye size={14} aria-hidden="true" /> View ({record.eventTypes?.length || 0})
      </button>
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
  cutoffDate,
}) => {
  const totalsByStatus = bookingsSummary?.totalsByStatus;
  const tabCount = (key) => getTabLabelBookingCount(totalsByStatus, key) ?? undefined;

  const totalPayableRevenue = bookings.reduce(
    (acc, curr) => acc + getTotalPayable(curr),
    0,
  );
  const totalReceivedRevenue = bookings.reduce(
    (acc, curr) => acc + getBookingReceivedAmount(curr),
    0,
  );
  const totalPendingRevenue = bookings.reduce((acc, curr) => {
    const expected = getTotalExpectedAdvances(curr);
    const received = getBookingReceivedAmount(curr);
    return acc + (expected - received);
  }, 0);

  const columns = buildColumns(
    listStatusTab,
    formatDate,
    formatAmount,
    getEventName,
    getTotalPayable,
    getTotalExpectedAdvances,
    getBookingReceivedAmount,
    showEventDetailsDrawer,
    onViewBudgetReport,
    accessToken,
    onBookingsMutated,
  );

  return (
    <div className="bk-list">
      <div className="bk-list-head">
        <Segmented
          label="Booking status"
          value={listStatusTab}
          onChange={onListStatusTabChange}
          options={[
            { value: "all", label: "All", count: tabCount("all") },
            { value: "confirmed", label: "Confirmed", count: tabCount("confirmed") },
            { value: "inprogress", label: "In progress", count: tabCount("inprogress") },
            { value: "almostbooked", label: "Almost booked", count: tabCount("almostbooked") },
            { value: "cancelled", label: "Cancelled", count: tabCount("cancelled") },
          ]}
        />
        <ExportBookingsButtons
          listStatusTab={listStatusTab}
          filterEventName={filterEventName}
          filterVenueId={filterVenueId}
          filterDateRange={filterDateRange}
          venueOptions={venueOptions}
          accessToken={accessToken}
          cutoffDate={cutoffDate}
        />
      </div>

      <ClientBookingsFilters
        filterEventName={filterEventName}
        filterDateRange={filterDateRange}
        filterVenueId={filterVenueId}
        eventNameOptions={eventNameOptions}
        venueOptions={venueOptions}
        onEventNameChange={setFilterEventName}
        onDateRangeChange={setFilterDateRange}
        onVenueChange={setFilterVenueId}
        cutoffDate={cutoffDate}
        onClear={() => {
          setFilterEventName(undefined);
          setFilterDateRange(null);
          setFilterVenueId?.(undefined);
        }}
      />

      <ClientBookingsStatsCards
        summary={bookingsSummary}
        statusKey={listStatusTab}
        totalPayableRevenue={totalPayableRevenue}
        totalPendingRevenue={totalPendingRevenue}
        totalReceivedRevenue={totalReceivedRevenue}
        formatAmount={formatAmount}
      />

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
          showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} bookings`,
          pageSizeOptions: ["10", "20", "50"],
        }}
        onChange={handleTableChange}
        scroll={{ x: 1500 }}
        className="pk-table bk-table"
      />
    </div>
  );
};

export default ClientBookingsListTab;
