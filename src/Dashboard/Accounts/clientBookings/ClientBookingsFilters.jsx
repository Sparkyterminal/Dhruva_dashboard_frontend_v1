import React from "react";
import { Card, Row, Col, Button, Select, DatePicker, Typography } from "antd";

const { Text } = Typography;
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
}) => (
  <Card
    className="border-0"
    style={{
      borderRadius: "14px",
      background: "white",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}
    bodyStyle={{ padding: "16px 24px" }}
  >
    <Row gutter={[16, 12]} align="middle">
      <Col xs={24} sm={8} md={6}>
        <Text strong className="text-slate-600 text-sm block mb-1">
          Event Name
        </Text>
        <Select
          allowClear
          placeholder="All events"
          value={filterEventName ?? undefined}
          onChange={onEventNameChange}
          options={eventNameOptions}
          style={{ width: "100%" }}
          size="large"
        />
      </Col>
      <Col xs={24} sm={8} md={6}>
        <Text strong className="text-slate-600 text-sm block mb-1">
          Venue
        </Text>
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
      </Col>
      <Col xs={24} sm={12} md={10}>
        <Text strong className="text-slate-600 text-sm block mb-1">
          Date Range
        </Text>
        <RangePicker
          value={filterDateRange}
          onChange={onDateRangeChange}
          format="DD-MM-YYYY"
          style={{ width: "100%" }}
          size="large"
          placeholder={["Start date", "End date"]}
        />
      </Col>
      <Col xs={24} sm={4} md={4}>
        <Button size="large" onClick={onClear} style={{ marginTop: 30 }}>
          Clear filters
        </Button>
      </Col>
    </Row>
  </Card>
);

export default ClientBookingsFilters;
