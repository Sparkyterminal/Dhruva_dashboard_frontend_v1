import React from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const PRESETS = [
  { key: "today", label: "Today", range: () => [dayjs(), dayjs()] },
  {
    key: "yesterday",
    label: "Yesterday",
    range: () => [dayjs().subtract(1, "day"), dayjs().subtract(1, "day")],
  },
  { key: "week", label: "Last 7 days", range: () => [dayjs().subtract(6, "day"), dayjs()] },
  { key: "month", label: "This month", range: () => [dayjs().startOf("month"), dayjs()] },
];

const sameRange = (value, range) =>
  value?.[0]?.isSame?.(range[0], "day") && value?.[1]?.isSame?.(range[1], "day");

/**
 * value: [startDayjs, endDayjs] (Dayjs objects)
 * Quick presets plus a custom range picker.
 */
const DaybookDateSelector = ({ value, onChange, cutoffDate }) => (
  <div className="db-controls-left">
    <div className="db-presets" role="group" aria-label="Quick range">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          aria-pressed={sameRange(value, p.range())}
          onClick={() => onChange?.(p.range())}
        >
          {p.label}
        </button>
      ))}
    </div>
    <RangePicker
      value={value}
      onChange={(d) => onChange?.(d)}
      disabledDate={(current) =>
        cutoffDate ? current && current.isBefore(dayjs(cutoffDate), "day") : false
      }
      format="DD MMM YYYY"
      size="large"
      allowEmpty={[false, false]}
    />
  </div>
);

export default DaybookDateSelector;
