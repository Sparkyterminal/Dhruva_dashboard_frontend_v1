import React from "react";
import { Segmented } from "@/Components/PageKit";
import { DateField, MultiSelectField, SelectField } from "@/Components/FormKit";
import "./EmployeeStats.css";

const PRESETS = [
  { value: "month", label: "This month" },
  { value: "quarter", label: "Last 3 months" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom" },
];

const BASES = [
  { value: "booked", label: "Booking date" },
  { value: "event", label: "Event date" },
];

/**
 * One filter row above everything it scopes. Nothing is hardcoded: the departments and employees come from
 * the server (`meta`), the date limits from `meta.today` and `meta.dataFrom`.
 */
const FilterBar = ({ meta, state, onChange, rangeError }) => {
  const employees = (meta?.employees || []).filter(
    (e) => !state.department || (e.departments || []).includes(state.department),
  );

  return (
    <section className="es-filters" aria-label="Filters">
      <div className="es-filter-row">
        <div className="es-filter-block">
          <span className="es-filter-label">Period</span>
          <Segmented label="Period" options={PRESETS} value={state.preset} onChange={(preset) => onChange({ preset })} />
        </div>
        <div className="es-filter-block">
          <span className="es-filter-label">Count a booking by its</span>
          <Segmented label="Count by" options={BASES} value={state.dateBasis} onChange={(dateBasis) => onChange({ dateBasis })} />
        </div>
      </div>

      <div className="es-filter-grid">
        {state.preset === "custom" ? (
          <>
            <DateField label="From" value={state.from} min={meta?.dataFrom} onChange={(from) => onChange({ from })} error={rangeError} />
            <DateField label="To" value={state.to} min={state.from || meta?.dataFrom} onChange={(to) => onChange({ to })} />
          </>
        ) : null}
        <SelectField
          label="Department"
          value={state.department}
          onChange={(department) => onChange({ department: department || "", userIds: [] })}
          options={(meta?.departments || []).map((d) => ({ value: d, label: d }))}
          placeholder="All departments"
          allowClear
        />
        <MultiSelectField
          label="Employees"
          value={state.userIds}
          onChange={(userIds) => onChange({ userIds })}
          options={employees.map((e) => ({ value: e.userId, label: e.name }))}
          placeholder="Everyone"
        />
      </div>
    </section>
  );
};

export default FilterBar;
