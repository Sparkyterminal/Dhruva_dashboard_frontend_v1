import React, { useState } from "react";
import { Button, Space, message } from "antd";
import {
  FileExcelOutlined,
  FilePdfOutlined,
  FileWordOutlined,
} from "@ant-design/icons";
import {
  buildBookingsQueryParams,
  fetchAllMyEventsPages,
} from "../clientBookingsUtils";
import { buildBookingsReport } from "./bookingsReport";
import { exportBookingsPdf } from "./exportBookingsPdf";
import { exportBookingsWord } from "./exportBookingsWord";
import { downloadBookingsExcel } from "./bookingsExcel";

const describeFilters = ({ filterEventName, filterVenueId, filterDateRange, venueOptions }) => {
  const parts = [];
  if (filterEventName) parts.push(`Event: ${filterEventName}`);
  if (filterVenueId) {
    const venue = venueOptions?.find((o) => o.value === filterVenueId);
    parts.push(`Venue: ${venue?.label ?? "Selected venue"}`);
  }
  // Only a range the user picked is described; the default data floor is not.
  if (filterDateRange?.[0] && filterDateRange?.[1]) {
    parts.push(
      `Dates: ${filterDateRange[0].format("DD MMM YYYY")} - ${filterDateRange[1].format("DD MMM YYYY")}`,
    );
  }
  return parts.length ? [parts.join("   |   ")] : [];
};

const FORMATS = {
  excel: { label: "Excel", run: downloadBookingsExcel, build: false },
  word: { label: "Word", run: exportBookingsWord, build: true },
  pdf: { label: "PDF", run: exportBookingsPdf, build: true },
};

/**
 * Downloads the Bookings list as Excel, Word or PDF. Exports the whole result
 * set for the active status tab and filters (not just the visible page), using
 * the existing GET /events endpoint — no backend changes.
 */
const ExportBookingsButtons = ({
  listStatusTab,
  filterEventName,
  filterVenueId,
  filterDateRange,
  venueOptions,
  accessToken,
  cutoffDate,
}) => {
  const [busy, setBusy] = useState(null);

  const run = async (kind) => {
    setBusy(kind);
    try {
      const params = {
        ...buildBookingsQueryParams({
          listStatusTab,
          filterEventName,
          filterVenueId,
          filterDateRange,
          cutoffDate,
        }),
        limit: 100,
      };
      const events = await fetchAllMyEventsPages(
        { Authorization: accessToken },
        params,
      );
      if (events.length === 0) {
        message.info("No bookings to download for the current view");
        return;
      }
      const ctx = {
        statusTab: listStatusTab,
        filterLines: describeFilters({
          filterEventName,
          filterVenueId,
          filterDateRange,
          venueOptions,
        }),
      };
      const { run: generate, build } = FORMATS[kind];
      await generate(build ? buildBookingsReport(events, ctx) : events, ctx);
    } catch (err) {
      console.error(err);
      message.error(`Failed to generate ${FORMATS[kind].label} file`);
    } finally {
      setBusy(null);
    }
  };

  const button = (kind, icon) => (
    <Button
      icon={icon}
      loading={busy === kind}
      disabled={busy !== null && busy !== kind}
      onClick={() => run(kind)}
      size="large"
      style={{ borderRadius: 10 }}
    >
      Download {FORMATS[kind].label}
    </Button>
  );

  return (
    <Space wrap>
      {button("excel", <FileExcelOutlined />)}
      {button("word", <FileWordOutlined />)}
      {button("pdf", <FilePdfOutlined />)}
    </Space>
  );
};

export default ExportBookingsButtons;
