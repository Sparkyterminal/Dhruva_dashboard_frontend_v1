import React, { useEffect, useMemo, useState } from "react";
import { toast } from "@/Components/AdminKit/toast";
import {
  AmountField,
  DateField,
  Dialog,
  FormActions,
  SelectField,
  TextAreaField,
  TextField,
} from "@/Components/FormKit";
import BillUploader from "./BillUploader";
import { CheckField, FieldRow, HintBox, ReimbursementBox } from "./EverydayParts";
import { createExpense, updateExpense } from "./everydayApi";
import { DEFAULT_GRADE, evaluateEntry, formatMoney, istDay, limitFor, subtractDays } from "./everydayRules";
import { serverNow } from "./serverClock";

const blank = () => ({
  categoryId: "",
  expenseDate: istDay(serverNow()),
  amount: "",
  units: "",
  dutyEndTime: "",
  companyProvided: false,
  approvedBy: "",
  note: "",
  bills: [],
});

const fromRecord = (r, mode) => ({
  categoryId: r.categoryId ?? "",
  expenseDate: mode === "copy" ? istDay(serverNow()) : String(r.expenseDate || "").slice(0, 10),
  amount: r.amount ?? "",
  units: r.units ?? "",
  dutyEndTime: r.dutyEndTime ?? "",
  companyProvided: Boolean(r.companyProvided),
  approvedBy: r.priorApproval?.approvedBy ?? "",
  note: r.note ?? "",
  bills: Array.isArray(r.bills) ? r.bills : [],
});

const groupLabel = (c) => (c.group ? `${c.group} · ${c.name}` : c.name);

/** How the limit reads in the hint under the category ("Limit ₹3,000 per night for Junior Staff"). */
const limitHint = (category, grade) => {
  if (category.calcType === "PER_UNIT") return `${formatMoney(category.rate)} per ${category.unitLabel || "unit"}`;
  const limit = limitFor(category, grade);
  if (limit == null) return null;
  const per = category.calcType === "CAPPED_PER_UNIT" ? ` per ${category.unitLabel || "unit"}` : category.maxClaimsPerDay === 1 ? " per day" : "";
  return `Limit ${formatMoney(limit)}${per}`;
};

/**
 * Add / edit / copy an expense. `existing` = the person's loaded expenses, used for the one-claim-per-day
 * rule and the duplicate warning (the server checks both again).
 */
const ExpenseDialog = ({ open, mode, record, categories, me, existing, authHeaders, onClose, onSaved, onLocked }) => {
  const isEdit = mode === "edit";
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(record && (mode === "edit" || mode === "copy") ? fromRecord(record, mode) : blank());
    setErrors({});
    setUploading(false);
  }, [open, mode, record]);

  const set = (key) => (value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const grade = me?.grade || DEFAULT_GRADE;
  const category = categories.find((c) => c._id === values.categoryId) || null;
  const today = istDay(serverNow());
  const windowDays = me?.settings?.claimWindowDays ?? 7;
  const earliest = subtractDays(today, windowDays);

  const sameDayOthers = useMemo(
    () =>
      (existing || []).filter(
        (x) =>
          x.categoryId === values.categoryId &&
          String(x.expenseDate).slice(0, 10) === values.expenseDate &&
          x.status !== "REJECTED" &&
          x._id !== (isEdit ? record?._id : null),
      ),
    [existing, values.categoryId, values.expenseDate, isEdit, record],
  );

  const entry = {
    amount: values.amount,
    units: values.units,
    dutyEndTime: values.dutyEndTime,
    companyProvided: values.companyProvided,
    priorApproval: { approvedBy: values.approvedBy },
  };
  const result = evaluateEntry({
    category,
    grade,
    entry,
    billCount: values.bills.length,
    otherClaimsSameDay: sameDayOthers.length,
  });

  const providedBlocksAll = Boolean(category?.companyProvidedZero && values.companyProvided);

  const isDuplicate =
    category &&
    sameDayOthers.some((x) =>
      category.calcType === "PER_UNIT" ? Number(x.units) === Number(values.units) : Number(x.amount) === Number(values.amount),
    ) &&
    (Number(values.amount) > 0 || Number(values.units) > 0);

  // Where the first error is shown: only fields the person has not touched yet are not flagged early.
  const dateError =
    !values.expenseDate
      ? "Select the date of the expense"
      : values.expenseDate > today
        ? "The date cannot be in the future"
        : values.expenseDate < earliest
          ? `Expenses older than ${windowDays} days cannot be added`
          : null;

  const submit = async (e) => {
    e?.preventDefault();
    const found = { ...result.errors };
    if (dateError) found.expenseDate = dateError;
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    const payload = {
      categoryId: values.categoryId,
      expenseDate: values.expenseDate,
      amount: category.calcType === "PER_UNIT" || (providedBlocksAll && values.amount === "") ? null : Number(values.amount),
      units:
        ["PER_UNIT", "CAPPED_PER_UNIT"].includes(category.calcType) && !(providedBlocksAll && values.units === "")
          ? Number(values.units)
          : null,
      dutyEndTime: category.afterTime ? values.dutyEndTime : null,
      companyProvided: Boolean(category.companyProvidedZero && values.companyProvided),
      priorApproval:
        category.approvalAbove && Number(values.amount) > category.approvalAbove
          ? { approvedBy: values.approvedBy.trim() }
          : null,
      note: values.note.trim(),
      bills: values.bills,
    };
    setSaving(true);
    try {
      if (isEdit) await updateExpense({ id: record._id, payload, authHeaders });
      else await createExpense({ payload, authHeaders });
      onSaved?.(mode);
    } catch (err) {
      const data = err?.response?.data;
      if (err?.response?.status === 409 && data?.code === "LOCKED") {
        toast.error("This expense is now locked and can no longer be changed.");
        onLocked?.();
      } else {
        if (data?.fields) setErrors(data.fields);
        toast.error(data?.message || "Could not save the expense. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const needsApproval = category?.approvalAbove && Number(values.amount) > category.approvalAbove;
  const title = isEdit ? "Edit expense" : mode === "copy" ? "Add again (copy)" : "Add expense";
  const unit = category?.unitLabel || "unit";

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} title={title} width={600}>
      <form onSubmit={submit} noValidate>
        <SelectField
          label="Category"
          value={values.categoryId}
          onChange={set("categoryId")}
          options={categories.map((c) => ({ value: c._id, label: groupLabel(c) }))}
          placeholder="Select a category"
          error={errors.categoryId}
          required
        />
        {category ? (
          <>
            {limitHint(category, grade) ? <HintBox>{limitHint(category, grade)}</HintBox> : null}
            {category.guidance ? <HintBox tone="soft">{category.guidance}</HintBox> : null}
          </>
        ) : null}

        <DateField
          label="Date of expense"
          value={values.expenseDate}
          onChange={set("expenseDate")}
          min={earliest}
          error={errors.expenseDate || (values.expenseDate ? dateError : null)}
          hint={`Today or up to ${windowDays} days back`}
          required
        />

        {category ? (
          <>
            {category.companyProvidedZero ? (
              <CheckField checked={values.companyProvided} onChange={set("companyProvided")}>
                This was arranged by the company, venue or client (nothing is payable)
              </CheckField>
            ) : null}

            {!providedBlocksAll ? (
              <>
                {category.afterTime ? (
                  <TextField
                    label={`Time your duty ended (after ${category.afterTime})`}
                    type="time"
                    value={values.dutyEndTime}
                    onChange={set("dutyEndTime")}
                    error={errors.dutyEndTime}
                    required
                  />
                ) : null}

                {category.calcType === "PER_UNIT" ? (
                  <TextField
                    label={`Distance (${unit})`}
                    type="number"
                    value={values.units}
                    onChange={set("units")}
                    error={errors.units}
                    placeholder="e.g. 12.5"
                    required
                  />
                ) : (
                  <FieldRow>
                    <AmountField
                      label="Amount you spent"
                      value={values.amount}
                      onChange={set("amount")}
                      error={errors.amount}
                      required
                    />
                    {category.calcType === "CAPPED_PER_UNIT" ? (
                      <TextField
                        label={`Number of ${unit}s`}
                        type="number"
                        value={values.units}
                        onChange={set("units")}
                        error={errors.units}
                        required
                      />
                    ) : null}
                  </FieldRow>
                )}

                {needsApproval ? (
                  <TextField
                    label={`Prior approval by (needed above ${formatMoney(category.approvalAbove)})`}
                    value={values.approvedBy}
                    onChange={set("approvedBy")}
                    error={errors.priorApproval}
                    placeholder="Name of the person who approved it"
                    required
                  />
                ) : null}
              </>
            ) : null}

            <ReimbursementBox
              amount={result.reimbursable}
              reason={result.cappedBy || (providedBlocksAll ? "Arranged by company/venue/client" : null)}
              muted={!result.valid && !providedBlocksAll}
            />
            {isDuplicate ? (
              <HintBox tone="warn">You already added the same amount in this category on this date. Add it again only if it is a different expense.</HintBox>
            ) : null}

            {!providedBlocksAll ? (
              <div className="ee-field">
                <span className="fk-label">
                  Bill{category.requiresBill ? <span className="fk-req"> *</span> : " (optional)"}
                </span>
                <BillUploader
                  bills={values.bills}
                  onAdd={(bill) => {
                    setValues((v) => ({ ...v, bills: [...v.bills, bill] }));
                    setErrors((er) => (er.bills ? { ...er, bills: undefined } : er));
                  }}
                  onRemove={(key) => setValues((v) => ({ ...v, bills: v.bills.filter((b) => b.key !== key) }))}
                  settings={me?.settings}
                  authHeaders={authHeaders}
                  error={errors.bills}
                  onBusyChange={setUploading}
                />
              </div>
            ) : null}

            <TextAreaField label="Note (optional)" value={values.note} onChange={set("note")} rows={2} placeholder="Where and why (e.g. venue to office, Sharma wedding)" />
          </>
        ) : null}

        <FormActions
          onCancel={onClose}
          submitLabel={isEdit ? "Save changes" : "Add expense"}
          busy={saving}
          disabled={!category || uploading}
        />
        {uploading ? <p className="ee-saving-note">Waiting for the bill to finish uploading…</p> : null}
      </form>
    </Dialog>
  );
};

export default ExpenseDialog;
