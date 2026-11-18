import React, { useEffect, useState } from "react";
import { toast } from "@/Components/AdminKit/toast";
import { AmountField, Dialog, FormActions, SelectField, TextAreaField, TextField } from "@/Components/FormKit";
import { CheckField, FieldRow, HintBox } from "./EverydayParts";
import { createCategory, updateCategory } from "./everydayApi";
import { CALC_TYPES, GRADES, GRADE_KEYS } from "./everydayRules";

const CALC_OPTIONS = Object.entries(CALC_TYPES).map(([value, label]) => ({ value, label }));
const UNIT_OPTIONS = ["km", "night", "day", "hour", "piece"].map((u) => ({ value: u, label: u }));

const blank = () => ({
  group: "",
  name: "",
  calcType: "ACTUAL",
  unitLabel: "",
  rate: "",
  cap: "",
  capByGrade: Object.fromEntries(GRADE_KEYS.map((g) => [g, ""])),
  requiresBill: true,
  maxClaimsPerDay: "",
  afterTime: "",
  companyProvidedZero: false,
  approvalAbove: "",
  guidance: "",
  sortOrder: "",
  active: true,
});

const fromCategory = (c) => ({
  ...blank(),
  group: c.group ?? "",
  name: c.name ?? "",
  calcType: c.calcType ?? "ACTUAL",
  unitLabel: c.unitLabel ?? "",
  rate: c.rate ?? "",
  cap: c.cap ?? "",
  capByGrade: Object.fromEntries(GRADE_KEYS.map((g) => [g, c.capByGrade?.[g] ?? ""])),
  requiresBill: c.requiresBill !== false,
  maxClaimsPerDay: c.maxClaimsPerDay ?? "",
  afterTime: c.afterTime ?? "",
  companyProvidedZero: Boolean(c.companyProvidedZero),
  approvalAbove: c.approvalAbove ?? "",
  guidance: c.guidance ?? "",
  sortOrder: c.sortOrder ?? "",
  active: c.active !== false,
});

const n = (v) => (v === "" || v == null ? null : Number(v));

const validate = (v) => {
  const e = {};
  if (!v.group.trim()) e.group = "Enter the group (for example Food, Local travel)";
  if (!v.name.trim()) e.name = "Enter the category name";
  const perUnit = v.calcType === "PER_UNIT" || v.calcType === "CAPPED_PER_UNIT";
  if (perUnit && !v.unitLabel) e.unitLabel = "Choose the unit";
  if (v.calcType === "PER_UNIT" && !(n(v.rate) > 0)) e.rate = "Enter the rate";
  if (v.calcType === "FIXED_MAX" && !(n(v.cap) > 0)) e.cap = "Enter the maximum";
  if (v.calcType === "CAPPED_PER_UNIT") {
    const grades = GRADE_KEYS.map((g) => n(v.capByGrade[g]));
    const allGrades = grades.every((x) => x > 0);
    if (!(n(v.cap) > 0) && !allGrades) e.cap = "Enter the limit, or a limit for every grade";
  }
  if (v.afterTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v.afterTime)) e.afterTime = "Use a time like 21:00";
  return e;
};

/** Add / edit one category and its rule. Categories are never deleted: switch them off instead. */
const CategoryDialog = ({ open, category, groups, authHeaders, onClose, onSaved }) => {
  const isEdit = Boolean(category);
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(category ? fromCategory(category) : blank());
    setErrors({});
  }, [open, category]);

  const set = (key) => (value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };
  const setGradeCap = (g) => (value) => setValues((v) => ({ ...v, capByGrade: { ...v.capByGrade, [g]: value } }));

  const t = values.calcType;
  const perUnit = t === "PER_UNIT" || t === "CAPPED_PER_UNIT";
  const hasGradeCaps = GRADE_KEYS.some((g) => n(values.capByGrade[g]) > 0);

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    if (Object.keys(found).length) return setErrors(found);
    const payload = {
      group: values.group.trim(),
      name: values.name.trim(),
      calcType: t,
      unitLabel: perUnit ? values.unitLabel : null,
      rate: t === "PER_UNIT" ? n(values.rate) : null,
      cap: t === "PER_UNIT" ? null : n(values.cap),
      capByGrade:
        t === "CAPPED_PER_UNIT" && hasGradeCaps
          ? Object.fromEntries(GRADE_KEYS.map((g) => [g, n(values.capByGrade[g])]))
          : null,
      requiresBill: values.requiresBill,
      maxClaimsPerDay: n(values.maxClaimsPerDay),
      afterTime: values.afterTime || null,
      companyProvidedZero: values.companyProvidedZero,
      approvalAbove: n(values.approvalAbove),
      guidance: values.guidance.trim(),
      sortOrder: n(values.sortOrder) ?? 0,
      active: values.active,
    };
    setSaving(true);
    try {
      if (isEdit) await updateCategory({ id: category._id, payload, authHeaders });
      else await createCategory({ payload, authHeaders });
      onSaved(isEdit);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.fields) setErrors(data.fields);
      toast.error(data?.message || "Could not save the category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} title={isEdit ? "Edit category" : "Add category"} width={620}>
      <form onSubmit={submit} noValidate>
        <FieldRow>
          <SelectField
            label="Group"
            value={values.group}
            onChange={set("group")}
            options={groups.map((g) => ({ value: g, label: g }))}
            placeholder="Pick or type below"
            error={errors.group}
            required
          />
          <TextField label="Or a new group" value={groups.includes(values.group) ? "" : values.group} onChange={set("group")} placeholder="e.g. Communication" />
        </FieldRow>
        <TextField label="Category name" value={values.name} onChange={set("name")} error={errors.name} required />
        <SelectField label="How it is reimbursed" value={values.calcType} onChange={set("calcType")} options={CALC_OPTIONS} required />

        {perUnit ? (
          <SelectField label="Unit" value={values.unitLabel} onChange={set("unitLabel")} options={UNIT_OPTIONS} placeholder="Select unit" error={errors.unitLabel} required />
        ) : null}
        {t === "PER_UNIT" ? (
          <AmountField label={`Rate per ${values.unitLabel || "unit"}`} value={values.rate} onChange={set("rate")} error={errors.rate} required />
        ) : (
          <AmountField
            label={t === "CAPPED_PER_UNIT" ? `Limit per ${values.unitLabel || "unit"} (same for everyone)` : t === "FIXED_MAX" ? "Maximum per claim" : "Maximum (optional)"}
            value={values.cap}
            onChange={set("cap")}
            error={errors.cap}
            required={t === "FIXED_MAX"}
          />
        )}
        {t === "CAPPED_PER_UNIT" ? (
          <>
            <HintBox tone="soft">Different limit for each grade? Fill these in. They replace the limit above for that grade.</HintBox>
            <FieldRow>
              {GRADE_KEYS.slice(0, 2).map((g) => (
                <AmountField key={g} label={GRADES[g]} value={values.capByGrade[g]} onChange={setGradeCap(g)} />
              ))}
            </FieldRow>
            <FieldRow>
              {GRADE_KEYS.slice(2).map((g) => (
                <AmountField key={g} label={GRADES[g]} value={values.capByGrade[g]} onChange={setGradeCap(g)} />
              ))}
            </FieldRow>
          </>
        ) : null}

        <CheckField checked={values.requiresBill} onChange={set("requiresBill")}>
          A bill must be attached
        </CheckField>
        <CheckField checked={values.companyProvidedZero} onChange={set("companyProvidedZero")}>
          Nothing is payable if the company, venue or client arranged it (shows a tick box)
        </CheckField>
        <FieldRow>
          <TextField label="Claims allowed per day (optional)" type="number" value={values.maxClaimsPerDay} onChange={set("maxClaimsPerDay")} />
          <TextField label="Only if duty ends after (optional)" type="time" value={values.afterTime} onChange={set("afterTime")} error={errors.afterTime} />
        </FieldRow>
        <AmountField label="Needs prior approval above (optional)" value={values.approvalAbove} onChange={set("approvalAbove")} />
        <TextAreaField label="Guidance shown to staff (optional)" value={values.guidance} onChange={set("guidance")} rows={2} />
        <FieldRow>
          <TextField label="Order in the list" type="number" value={values.sortOrder} onChange={set("sortOrder")} />
        </FieldRow>
        {isEdit ? (
          <CheckField checked={values.active} onChange={set("active")}>
            Active (staff can pick it)
          </CheckField>
        ) : null}
        <HintBox tone="soft">New rates apply to expenses added from now on. Expenses already saved keep the amount they were calculated with.</HintBox>
        <FormActions onCancel={onClose} submitLabel={isEdit ? "Save changes" : "Add category"} busy={saving} />
      </form>
    </Dialog>
  );
};

export default CategoryDialog;
