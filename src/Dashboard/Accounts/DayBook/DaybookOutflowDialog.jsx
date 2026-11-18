import React, { useEffect, useState } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import {
  AmountField,
  ChoiceField,
  DateField,
  Dialog,
  FormActions,
  SelectField,
  TextAreaField,
} from "@/Components/FormKit";
import { createOutflow, fetchVendors, updateOutflow } from "./daybookApi";
import { ACCOUNT_NAMES, RECEIVED_IN_OPTIONS } from "./daybookConfig";
import { actualPaid, validateOutflow } from "./daybookMath";
import { FieldRow, Readout } from "./DaybookDialogParts";

const accountOptions = ACCOUNT_NAMES.map((a) => ({ value: a, label: a }));

const blank = () => ({
  vendorId: "",
  paidDate: dayjs().format("YYYY-MM-DD"),
  paidFrom: "CASH",
  accountName: "",
  amountPaid: "",
  tdsAmount: "",
  gstAmount: "",
  note: "",
});

const fromRecord = (r) => ({
  vendorId: r.vendor?._id ?? r.vendorId ?? "",
  paidDate: r.paidDate ? String(r.paidDate).slice(0, 10) : "",
  paidFrom: r.paidFrom ?? "CASH",
  accountName: r.accountName ?? "",
  amountPaid: r.amountPaid ?? "",
  tdsAmount: r.tdsAmount || "",
  gstAmount: r.gstAmount || "",
  note: r.note ?? "",
});

const vendorLabel = (v) =>
  [v.vendor_code && String(v.vendor_code).toUpperCase(), v.name].filter(Boolean).join(" · ") ||
  "Unnamed vendor";

const DaybookOutflowDialog = ({ open, mode, initialValues, authHeaders, onClose, onSaved }) => {
  const isEdit = mode === "edit";
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  const set = (key) => (value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  useEffect(() => {
    if (!open) return undefined;
    setValues(isEdit && initialValues ? fromRecord(initialValues) : blank());
    setErrors({});
    let cancelled = false;
    (async () => {
      setVendorsLoading(true);
      try {
        const list = await fetchVendors({ authHeaders });
        if (!cancelled) setVendors(list);
      } catch {
        message.error("Failed to fetch vendors");
      } finally {
        if (!cancelled) setVendorsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, initialValues]);

  const vendorOptions = vendors.map((v) => ({ value: v._id, label: vendorLabel(v) }));
  const savedVendor = initialValues?.vendor;
  if (
    savedVendor?._id &&
    values.vendorId === savedVendor._id &&
    !vendorOptions.some((o) => o.value === savedVendor._id)
  ) {
    vendorOptions.unshift({ value: savedVendor._id, label: vendorLabel(savedVendor) });
  }

  const isAccount = values.paidFrom === "ACCOUNT";
  const actual = actualPaid(values);

  const submit = async (e) => {
    e?.preventDefault();
    const found = validateOutflow(values);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    const payload = {
      vendorId: values.vendorId,
      paidDate: values.paidDate,
      paidFrom: values.paidFrom,
      accountName: isAccount ? values.accountName : null,
      amountPaid: Number(values.amountPaid),
      tdsAmount: Number(values.tdsAmount) || 0,
      gstAmount: Number(values.gstAmount) || 0,
      note: values.note.trim(),
    };
    setSaving(true);
    try {
      if (isEdit) {
        await updateOutflow({ id: initialValues?._id ?? initialValues?.id, payload, authHeaders });
      } else {
        await createOutflow({ payload, authHeaders });
      }
      onSaved?.(mode);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save outflow");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Edit outflow" : "Add outflow"} width={560}>
      <form onSubmit={submit} noValidate>
        <SelectField
          label="Vendor"
          value={values.vendorId}
          onChange={set("vendorId")}
          options={vendorOptions}
          placeholder={vendorsLoading ? "Loading vendors…" : "Select vendor"}
          loading={vendorsLoading}
          error={errors.vendorId}
          emptyText="No vendors found"
          required
        />
        <DateField label="Paid on" value={values.paidDate} onChange={set("paidDate")} error={errors.paidDate} required />
        <ChoiceField label="Paid from" value={values.paidFrom} onChange={set("paidFrom")} options={RECEIVED_IN_OPTIONS} required />
        {isAccount ? (
          <SelectField label="Account" value={values.accountName} onChange={set("accountName")} options={accountOptions} placeholder="Select account" error={errors.accountName} required />
        ) : null}
        <AmountField label="Amount paid" value={values.amountPaid} onChange={set("amountPaid")} error={errors.amountPaid} required />
        <FieldRow>
          <AmountField label="TDS deducted" value={values.tdsAmount} onChange={set("tdsAmount")} error={errors.tdsAmount} />
          <AmountField label="GST (if any)" value={values.gstAmount} onChange={set("gstAmount")} error={errors.gstAmount} />
        </FieldRow>
        <Readout label="Actual amount paid" value={actual} formula="Amount paid − TDS + GST" tone="out" />
        <TextAreaField label="Note (optional)" value={values.note} onChange={set("note")} rows={2} />
        <FormActions onCancel={onClose} submitLabel={isEdit ? "Update" : "Add outflow"} busy={saving} />
      </form>
    </Dialog>
  );
};

export default DaybookOutflowDialog;
