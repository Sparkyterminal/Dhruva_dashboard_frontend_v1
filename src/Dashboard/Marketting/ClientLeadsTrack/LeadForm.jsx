import React, { useState, useEffect } from "react";
import { Form, Select, Input, Button } from "antd";

const { TextArea } = Input;
const STATUS_OPTIONS = [
  { value: "Inprogress", label: "Inprogress" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Cancelled", label: "Cancelled" },
];

/**
 * Reusable form for Add/Edit Client Lead.
 * initialValues: { status, clientDetails, eventTypeDetails, notes: string }
 */
const LeadForm = ({ initialValues, onSubmit, submitLabel = "Submit", loading = false }) => {
  const [form] = Form.useForm();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initialValues?.notes) {
      setNotes(initialValues.notes || "");
    } else if (!initialValues) {
      setNotes("");
    }
  }, [initialValues?.notes]);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        status: initialValues.status,
        clientDetails: initialValues.clientDetails,
        eventTypeDetails: initialValues.eventTypeDetails,
      });
    }
  }, [initialValues, form]);

  const handleFinish = (values) => {
    const payload = {
      ...values,
      notes: notes || "",
    };
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

      <Form.Item
        label="Notes"
        style={{ marginBottom: 16 }}
      >
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
