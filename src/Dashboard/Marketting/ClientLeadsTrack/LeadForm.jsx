import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Form,
  Select,
  Input,
  InputNumber,
  Button,
  DatePicker,
  Switch,
} from "antd";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { API_BASE_URL } from "../../../../config";

const { TextArea } = Input;

const STATUS_OPTIONS = [
  { value: "Inprogress", label: "Inprogress" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Cancelled", label: "Cancelled" },
];

function getCoordinatorLabel(c) {
  if (!c) return "";
  const full = [c.first_name ?? c.firstName, c.last_name ?? c.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return c.name || full || c.email || String(c._id ?? c.id ?? "");
}

/**
 * Reusable form for Add/Edit Client Lead.
 * initialValues: { status, clientDetails, eventTypeDetails, notes, assignedTo,
 *   startDate, endDate, estimatedBudget, convertedByMarketing, convertedAt }
 */
const LeadForm = ({
  initialValues,
  onSubmit,
  submitLabel = "Submit",
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [notes, setNotes] = useState("");
  const [coordinators, setCoordinators] = useState([]);
  const [coordinatorsLoading, setCoordinatorsLoading] = useState(false);
  const user = useSelector((state) => state.user.value);

  useEffect(() => {
    const fetchCoordinators = async () => {
      if (!user?.access_token) return;
      setCoordinatorsLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}coordinators`, {
          headers: { Authorization: user.access_token },
        });
        const raw = res.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.coordinators)
            ? raw.coordinators
            : Array.isArray(raw?.items)
              ? raw.items
              : Array.isArray(raw?.data)
                ? raw.data
                : [];
        setCoordinators(list);
      } catch {
        setCoordinators([]);
      } finally {
        setCoordinatorsLoading(false);
      }
    };
    fetchCoordinators();
  }, [user?.access_token]);

  useEffect(() => {
    if (initialValues?.notes) {
      setNotes(initialValues.notes || "");
    } else if (!initialValues) {
      setNotes("");
    }
  }, [initialValues?.notes]);

  useEffect(() => {
    if (initialValues) {
      const assignedTo =
        initialValues.assignedTo?._id ??
        initialValues.assignedTo?.id ??
        initialValues.assignedTo;
      form.setFieldsValue({
        status: initialValues.status,
        clientDetails: initialValues.clientDetails,
        eventTypeDetails: initialValues.eventTypeDetails,
        assignedTo: assignedTo || undefined,
        startDate: initialValues.startDate
          ? dayjs(initialValues.startDate)
          : undefined,
        endDate: initialValues.endDate
          ? dayjs(initialValues.endDate)
          : undefined,
        estimatedBudget:
          initialValues.estimatedBudget != null
            ? Number(initialValues.estimatedBudget)
            : undefined,
        convertedByMarketing: Boolean(initialValues.convertedByMarketing),
      });
    }
  }, [initialValues, form]);

  const handleFinish = (values) => {
    const wasConverted = Boolean(initialValues?.convertedByMarketing);
    const isConverted = Boolean(values.convertedByMarketing);

    const payload = {
      ...values,
      notes: notes || "",
      assignedTo: values.assignedTo || undefined,
      startDate: values.startDate
        ? dayjs(values.startDate).format("YYYY-MM-DD")
        : undefined,
      endDate: values.endDate
        ? dayjs(values.endDate).format("YYYY-MM-DD")
        : undefined,
      estimatedBudget:
        values.estimatedBudget != null && values.estimatedBudget !== ""
          ? Number(values.estimatedBudget)
          : 0,
      convertedByMarketing: isConverted,
    };

    if (isConverted) {
      payload.convertedAt =
        !wasConverted || !initialValues?.convertedAt
          ? new Date().toISOString()
          : initialValues.convertedAt;
    } else {
      payload.convertedAt = null;
    }

    if (!payload.assignedTo) delete payload.assignedTo;
    if (!payload.startDate) delete payload.startDate;
    if (!payload.endDate) delete payload.endDate;
    onSubmit?.(payload);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        status: initialValues?.status,
        clientDetails: initialValues?.clientDetails ?? "",
        eventTypeDetails: initialValues?.eventTypeDetails ?? "",
        assignedTo:
          initialValues?.assignedTo?._id ??
          initialValues?.assignedTo?.id ??
          initialValues?.assignedTo ??
          undefined,
        startDate: initialValues?.startDate
          ? dayjs(initialValues.startDate)
          : undefined,
        endDate: initialValues?.endDate
          ? dayjs(initialValues.endDate)
          : undefined,
        estimatedBudget:
          initialValues?.estimatedBudget != null
            ? Number(initialValues.estimatedBudget)
            : undefined,
        convertedByMarketing: Boolean(initialValues?.convertedByMarketing),
      }}
    >
      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: true, message: "Select status" }]}
      >
        <Select
          placeholder="Select status"
          options={STATUS_OPTIONS}
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item name="assignedTo" label="Assign to">
        <Select
          placeholder="Select project coordinator"
          allowClear
          loading={coordinatorsLoading}
          showSearch
          optionFilterProp="label"
          options={coordinators.map((c) => ({
            value: c._id ?? c.id,
            label: getCoordinatorLabel(c),
          }))}
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item name="startDate" label="Start date">
        <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
      </Form.Item>

      <Form.Item name="endDate" label="End date">
        <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
      </Form.Item>

      <Form.Item
        name="estimatedBudget"
        label="Estimated budget"
        rules={[
          { required: true, message: "Enter estimated budget" },
          {
            type: "number",
            min: 0,
            message: "Budget must be 0 or more",
          },
        ]}
      >
        <InputNumber
          style={{ width: "100%" }}
          min={0}
          step={1000}
          precision={0}
          formatter={(value) =>
            value != null && value !== ""
              ? `₹ ${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
              : ""
          }
          parser={(value) => String(value || "").replace(/₹\s?|(,*)/g, "")}
          placeholder="e.g. 500000"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="convertedByMarketing"
        label="Lead Successfully Converted By Marketing Team"
        valuePropName="checked"
        extra="When checked, this budget moves to the Successfully Converted card (not Estimated), so it is not double-counted with Client Bookings."
      >
        <Switch checkedChildren="Yes" unCheckedChildren="No" />
      </Form.Item>

      <Form.Item
        name="clientDetails"
        label="Client details"
        rules={[{ required: true, message: "Enter client details" }]}
      >
        <TextArea rows={4} placeholder="Client details" />
      </Form.Item>

      <Form.Item
        name="eventTypeDetails"
        label="Event type details"
        rules={[{ required: true, message: "Enter event type details" }]}
      >
        <TextArea rows={3} placeholder="Event type details" />
      </Form.Item>

      <Form.Item label="Notes" style={{ marginBottom: 16 }}>
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter notes (unlimited characters)"
          rows={6}
          showCount
          maxLength={undefined}
          style={{ resize: "vertical" }}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {submitLabel}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LeadForm;
export { STATUS_OPTIONS };
