import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  message,
} from "antd";
import dayjs from "dayjs";
import { createInflow, fetchEventsMinimal, updateInflow } from "./daybookApi";

const { Option } = Select;

const ACCOUNT_NAME_OPTIONS = [
  "Dhruva Kumar H P-HDFC bank-5540",

  "Skyblue -HDFC-5540",
  "Skyblue -ICICI-1458",
  "Monica",
  "Cash",
];

const toYMD = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value?.format === "function") return value.format("YYYY-MM-DD");
  return String(value);
};

const DaybookInflowModal = ({
  open,
  mode,
  initialValues,
  authHeaders,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const isEdit = mode === "edit";

  const accountOptions = useMemo(() => ACCOUNT_NAME_OPTIONS, []);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const eventsSearchTimeout = useRef(null);

  const selectedEventReference = initialValues?.eventReference;
  const hasSelectedEvent =
    selectedEventReference &&
    (events || []).some((ev) => (ev?._id ?? ev?.id) === selectedEventReference);

  const fetchEvents = async (query = "") => {
    if (!open) return;
    setEventsLoading(true);
    try {
      const data = await fetchEventsMinimal({ query, authHeaders });
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      message.error("Failed to fetch events");
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: initialValues?.name ?? "",
      receivedDate: initialValues?.receivedDate
        ? dayjs(initialValues.receivedDate)
        : null,
      receivedIn: initialValues?.receivedIn ?? "CASH",
      accountName: initialValues?.accountName ?? undefined,
      amountReceived: initialValues?.amountReceived ?? undefined,
      receivedBy: initialValues?.receivedBy ?? "",
      eventReference: initialValues?.eventReference ?? undefined,
      note: initialValues?.note ?? undefined,
    });

    // Load initial events list for dropdown.
    fetchEvents("");

    return () => {
      if (eventsSearchTimeout.current) {
        clearTimeout(eventsSearchTimeout.current);
      }
    };
  }, [open, form, initialValues]);

  const handleEventSearch = (value) => {
    if (eventsSearchTimeout.current) {
      clearTimeout(eventsSearchTimeout.current);
    }
    eventsSearchTimeout.current = setTimeout(() => {
      fetchEvents(String(value || "").trim());
    }, 300);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values?.name,
        receivedDate: toYMD(values?.receivedDate),
        receivedIn: values?.receivedIn,
        accountName:
          values?.receivedIn === "ACCOUNT" ? values?.accountName : undefined,
        amountReceived: values?.amountReceived,
        receivedBy: values?.receivedBy,
        eventReference: values?.eventReference || undefined,
        note: values?.note || "",
      };

      if (isEdit) {
        const id = initialValues?._id ?? initialValues?.id;
        await updateInflow({ id, payload, authHeaders });
      } else {
        await createInflow({ payload, authHeaders });
      }

      Modal.destroyAll();
      onSuccess?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      message.error("Failed to save inflow");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Edit Inflow" : "Add Inflow"}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          receivedIn: "CASH",
        }}
      >
        <Form.Item
          name="name"
          label="Inflow Name"
          rules={[{ required: true, message: "Please enter inflow name" }]}
        >
          <Input placeholder="e.g. Rent Received" size="large" />
        </Form.Item>

        <Form.Item
          name="receivedDate"
          label="Received Date"
          rules={[{ required: true, message: "Please select received date" }]}
        >
          <DatePicker style={{ width: "100%" }} size="large" />
        </Form.Item>

        <Form.Item
          name="receivedIn"
          label="Received In"
          rules={[{ required: true, message: "Please select cash or account" }]}
        >
          <Select size="large">
            <Option value="CASH">CASH</Option>
            <Option value="ACCOUNT">ACCOUNT</Option>
          </Select>
        </Form.Item>

        <Form.Item
          shouldUpdate={(prev, curr) => prev?.receivedIn !== curr?.receivedIn}
          noStyle
        >
          {({ getFieldValue }) =>
            getFieldValue("receivedIn") === "ACCOUNT" ? (
              <Form.Item
                name="accountName"
                label="Account Name"
                rules={[
                  { required: true, message: "Please select account name" },
                ]}
              >
                <Select showSearch size="large" optionFilterProp="children">
                  {accountOptions.map((a) => (
                    <Option key={a} value={a}>
                      {a}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            ) : null
          }
        </Form.Item>

        <Form.Item
          name="amountReceived"
          label="Amount Received"
          rules={[
            { required: true, message: "Please enter amount received" },
            {
              type: "number",
              min: 0,
              message: "Amount must be 0 or greater",
            },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            size="large"
            min={0}
            precision={2}
          />
        </Form.Item>

        <Form.Item
          name="receivedBy"
          label="Received By (Person)"
          rules={[{ required: true, message: "Please enter received by" }]}
        >
          <Input placeholder="Person name" size="large" />
        </Form.Item>

        <Form.Item name="eventReference" label="Event Reference (optional)">
          <Select
            showSearch
            filterOption={false}
            onSearch={handleEventSearch}
            onFocus={() => fetchEvents("")}
            placeholder={
              eventsLoading ? "Loading events..." : "Search event or client"
            }
            size="large"
            allowClear
            loading={eventsLoading}
            notFoundContent={eventsLoading ? "Loading..." : "No events found"}
          >
            {(events || []).map((ev) => {
              const eventName =
                typeof ev?.eventName === "string"
                  ? ev.eventName
                  : ev?.eventName?.name || ev?.name || ev?.title || "Untitled";
              const clientName = ev?.client?.clientName || ev?.clientName || "";
              const value = ev?._id || ev?.id;

              const slugify = (s) =>
                String(s || "")
                  .trim()
                  .toLowerCase()
                  .replace(/\s+/g, "-");

              // Keep spaces inside event name (for display), only lowercase.
              const formatEventName = (s) =>
                String(s || "")
                  .trim()
                  .toLowerCase();

              const statusRaw =
                ev.eventConfirmation ||
                ev.status ||
                ev.client?.eventConfirmation ||
                "";
              const statusKey =
                statusRaw === "Confirmed Event"
                  ? "confirmed"
                  : statusRaw === "InProgress"
                    ? "inprogress"
                    : statusRaw === "Cancelled" || statusRaw === "Canceled"
                      ? "cancelled"
                      : slugify(statusRaw) || "unknown";

              return (
                <Select.Option key={value} value={value}>
                  {`${statusKey}-${formatEventName(eventName)}-${slugify(clientName)}`}
                </Select.Option>
              );
            })}
            {selectedEventReference && !hasSelectedEvent ? (
              <Select.Option value={selectedEventReference}>
                {selectedEventReference}
              </Select.Option>
            ) : null}
          </Select>
        </Form.Item>

        <Form.Item name="note" label="Note (optional)">
          <Input.TextArea rows={3} placeholder="Add note (optional)" />
        </Form.Item>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Button onClick={onCancel} size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            size="large"
          >
            {isEdit ? "Update" : "Add"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default DaybookInflowModal;
