import React from "react";
import { Select, DatePicker } from "antd";
import { X } from "lucide-react";
import dayjs from "dayjs";
import "./Bookings.css";

const { RangePicker } = DatePicker;

const ClientBookingsFilters = ({
  filterEventName,
  filterDateRange,
  filterVenueId,
  eventNameOptions,
  venueOptions,
  onEventNameChange,
  onDateRangeChange,
  onVenueChange,
  onClear,
  cutoffDate,
}) => {
  const hasFilter = Boolean(
    filterEventName || filterVenueId || (filterDateRange?.[0] && filterDateRange?.[1]),
  );
  return (
    <div className="bk-filters">
      <div className="bk-field">
        <label>Event name</label>
        <Select
          allowClear
          placeholder="All events"
          value={filterEventName ?? undefined}
          onChange={onEventNameChange}
          options={eventNameOptions}
          style={{ width: "100%" }}
          size="large"
        />
      </div>
      <div className="bk-field">
        <label>Venue</label>
        <Select
          allowClear
          showSearch
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(String(input ?? "").toLowerCase())
          }
          placeholder="All venues"
          value={filterVenueId ?? undefined}
          onChange={onVenueChange}
          options={venueOptions}
          style={{ width: "100%" }}
          size="large"
        />
      </div>
      <div className="bk-field bk-field-wide">
        <label>Date range</label>
        <RangePicker
          value={filterDateRange}
          onChange={onDateRangeChange}
          disabledDate={(current) =>
            cutoffDate ? current && current.isBefore(dayjs(cutoffDate), "day") : false
          }
          format="DD-MM-YYYY"
          style={{ width: "100%" }}
          size="large"
          placeholder={["Start date", "End date"]}
        />
      </div>
      <button type="button" className="pk-btn bk-clear" onClick={onClear} disabled={!hasFilter}>
        <X size={14} aria-hidden="true" /> Clear filters
      </button>
    </div>
  );
};

export default ClientBookingsFilters;
