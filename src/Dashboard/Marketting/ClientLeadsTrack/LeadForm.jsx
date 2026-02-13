import React, { useState, useEffect } from "react";
import { Form, Select, Input, Button, Card, DatePicker, Space } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { TextArea } = Input;
const STATUS_OPTIONS = [
  { value: "Inprogress", label: "Inprogress" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Cancelled", label: "Cancelled" },
];

/**
 * Reusable form for Add/Edit Client Lead.
 * initialValues: { status, clientDetails, eventTypeDetails, meetings: [{ date, notes }] }
 */
const LeadForm = ({ initialValues, onSubmit, submitLabel = "Submit", loading = false }) => {
  const [form] = Form.useForm();
  const [meetings, setMeetings] = useState([{ date: null, notes: "" }]);

  useEffect(() => {
    if (initialValues?.meetings?.length) {
      setMeetings(
        initialValues.meetings.map((m) => ({
          date: m.date ? dayjs(m.date) : null,
          notes: m.notes || "",
        }))
      );
    } else if (!initialValues) {
      setMeetings([{ date: null, notes: "" }]);
    }
  }, [initialValues?.meetings]);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        status: initialValues.status,
        clientDetails: initialValues.clientDetails,
        eventTypeDetails: initialValues.eventTypeDetails,
      });
    }
  }, [initialValues, form]);

  const addMeeting = () => {
    setMeetings((prev) => [...prev, { date: null, notes: "" }]);
  };

  const removeMeeting = (index) => {
    setMeetings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinish = (values) => {
    const payload = {
      ...values,
      meetings: meetings.map((m) => ({
        date: m.date ? m.date.toISOString() : null,
        notes: m.notes || "",
      })).filter((m) => m.date || m.notes),
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

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 600 }}>Meeting dates & notes</span>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addMeeting} size="small">
            Add meeting
          </Button>
        </div>
        {meetings.map((meeting, index) => (
          <Card
            key={index}
            size="small"
            style={{ marginBottom: 8 }}
            extra={
              meetings.length > 1 ? (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeMeeting(index)}
                />
              ) : null
            }
          >
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              <DatePicker
                value={meeting.date}
                onChange={(d) =>
                  setMeetings((prev) =>
                    prev.map((m, i) => (i === index ? { ...m, date: d } : m))
                  )
                }
                style={{ width: "100%" }}
                placeholder="Meeting date"
              />
              <Input.TextArea
                value={meeting.notes}
                onChange={(e) =>
                  setMeetings((prev) =>
                    prev.map((m, i) =>
                      i === index ? { ...m, notes: e.target.value } : m
                    )
                  )
                }
                placeholder="Notes"
                rows={2}
              />
            </Space>
          </Card>
        ))}
      </div>

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
