import React, { useState } from "react";
import { Button, Space, message } from "antd";
import { FilePdfOutlined, FileWordOutlined } from "@ant-design/icons";
import {
  buildBookingsQueryParams,
  fetchAllMyEventsPages,
} from "../clientBookingsUtils";
import { buildBookingsReport } from "./bookingsReport";
import { exportBookingsPdf } from "./exportBookingsPdf";
import { exportBookingsWord } from "./exportBookingsWord";

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

/**
 * Downloads the Bookings list as PDF or Word. Exports the whole result set for
 * the active status tab and filters (not just the visible page), using the
 * existing GET /events endpoint — no backend changes.
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
      const report = buildBookingsReport(events, {
        statusTab: listStatusTab,
        filterLines: describeFilters({
          filterEventName,
          filterVenueId,
          filterDateRange,
          venueOptions,
        }),
      });
      await (kind === "pdf" ? exportBookingsPdf(report) : exportBookingsWord(report));
    } catch (err) {
      console.error(err);
      message.error(`Failed to generate ${kind === "pdf" ? "PDF" : "Word"} file`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Space wrap>
      <Button
        icon={<FileWordOutlined />}
        loading={busy === "word"}
        disabled={busy !== null && busy !== "word"}
        onClick={() => run("word")}
        size="large"
        style={{ borderRadius: 10 }}
      >
        Download Word
      </Button>
      <Button
        icon={<FilePdfOutlined />}
        loading={busy === "pdf"}
        disabled={busy !== null && busy !== "pdf"}
        onClick={() => run("pdf")}
        size="large"
        style={{ borderRadius: 10 }}
      >
        Download PDF
      </Button>
    </Space>
  );
};

export default ExportBookingsButtons;
