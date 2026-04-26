import React, { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Badge,
  Button,
  Calendar,
  Card,
  Col,
  Empty,
  Form,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import { API_BASE_URL } from "../../../config";

const { Text, Title } = Typography;
const { TextArea } = Input;

const CATEGORY_OPTIONS = [
  { label: "TODO LIST", value: "TODO_LIST", color: "blue" },
  { label: "PROBLEM RESOLVES", value: "PROBLEM_RESOLVES", color: "orange" },
  {
    label: "GENERAL MEETING NOTES",
    value: "GENERAL_MEETING_NOTES",
    color: "purple",
  },
];

const categoryMeta = CATEGORY_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item;
  return acc;
}, {});

const formatDateLabel = (value) => dayjs(value).format("DD MMM YYYY");
const getKeyFromDate = (value) => dayjs(value).format("YYYY-MM-DD");

const UserWiseCalendarPanel = () => {
  const user = useSelector((state) => state.user.value);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [calendarValue, setCalendarValue] = useState(dayjs());
  const [form] = Form.useForm();

  const config = useMemo(
    () => ({
      headers: { Authorization: user?.access_token },
    }),
    [user?.access_token],
  );

  const fetchEntries = useCallback(async () => {
    if (!user?.access_token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}personal-calendar`, config);
      const list = res?.data?.items ?? res?.data?.data ?? res?.data ?? [];
      setEntries(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(error);
      message.error("Failed to load calendar entries");
    } finally {
      setLoading(false);
    }
  }, [config, user?.access_token]);

  React.useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const entriesByDay = useMemo(() => {
    return entries.reduce((acc, item) => {
      const key = getKeyFromDate(item?.startAt);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [entries]);

  const selectedDayEntries = useMemo(() => {
    const key = getKeyFromDate(selectedDate);
    return entriesByDay[key] || [];
  }, [entriesByDay, selectedDate]);

  const stats = useMemo(() => {
    const countByCategory = entries.reduce((acc, item) => {
      const key = item?.category || "UNKNOWN";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return {
      total: entries.length,
      todo: countByCategory.TODO_LIST || 0,
      problemResolves: countByCategory.PROBLEM_RESOLVES || 0,
      meetingNotes: countByCategory.GENERAL_MEETING_NOTES || 0,
    };
  }, [entries]);

  const resetFormState = () => {
    form.resetFields();
  };

  const openCreateForDate = (dateValue) => {
    setSelectedDate(dayjs(dateValue));
    setDateModalOpen(true);
    resetFormState();
  };

  const onDateSelect = (value, info) => {
    if (info?.source !== "date") return;
    openCreateForDate(value);
  };

  const handleSave = async (values) => {
    const description = values.description?.trim();
    if (!description) {
      message.warning("Please enter description");
      return;
    }

    const payload = {
      category: values.category,
      description,
      title:
        description.length > 60 ? `${description.slice(0, 60)}...` : description,
      startAt: selectedDate.startOf("day").add(9, "hour").toISOString(),
      endAt: selectedDate.startOf("day").add(10, "hour").toISOString(),
    };

    setSaving(true);
    try {
      await axios.post(`${API_BASE_URL}personal-calendar`, payload, config);
      message.success("Entry added");
      resetFormState();
      await fetchEntries();
      setDateModalOpen(false);
    } catch (error) {
      console.error(error);
      message.error("Failed to add entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}personal-calendar/${id}`, config);
      message.success("Entry deleted");
      await fetchEntries();
    } catch (error) {
      console.error(error);
      message.error("Failed to delete entry");
    }
  };

  const cellRender = (value) => {
    const key = getKeyFromDate(value);
    const dayItems = entriesByDay[key] || [];
    if (!dayItems.length) return null;
    return (
      <ul className="m-0 p-0 list-none">
        {dayItems.slice(0, 2).map((item) => {
          const meta = categoryMeta[item?.category] || {};
          return (
            <li key={item?._id || item?.id} className="truncate">
              <Badge
                color={meta.color || "geekblue"}
                text={
                  <span style={{ fontSize: 11 }}>
                    {item?.title || item?.description || "Note"}
                  </span>
                }
              />
            </li>
          );
        })}
        {dayItems.length > 2 && <li>+{dayItems.length - 2} more</li>}
      </ul>
    );
  };

  const handlePrevMonth = () => {
    setCalendarValue((prev) => dayjs(prev).subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCalendarValue((prev) => dayjs(prev).add(1, "month"));
  };

  const handleToday = () => {
    setCalendarValue(dayjs());
  };

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 16 }}
      className="shadow-sm bg-linear-to-br from-white to-indigo-50/60"
    >
      <div className="flex items-center justify-between mb-4">
        <Title level={4} style={{ margin: 0 }}>
          Personal Calendar
        </Title>
        <Button type="primary" onClick={() => openCreateForDate(dayjs())}>
          Add For Today
        </Button>
      </div>

      <div className="mb-3">
        <Space wrap>
          {CATEGORY_OPTIONS.map((cat) => (
            <Tag key={cat.value} color={cat.color} style={{ borderRadius: 999 }}>
              {cat.label}
            </Tag>
          ))}
        </Space>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Calendar
            fullscreen
            value={calendarValue}
            onPanelChange={(value) => setCalendarValue(value)}
            cellRender={cellRender}
            onSelect={onDateSelect}
            headerRender={({ value, onChange }) => (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm border border-indigo-100">
                <Space>
                  <Button icon={<LeftOutlined />} onClick={handlePrevMonth}>
                    Previous
                  </Button>
                  <Button icon={<RightOutlined />} onClick={handleNextMonth}>
                    Next
                  </Button>
                  <Button type="primary" ghost onClick={handleToday}>
                    Today
                  </Button>
                </Space>
                <Title level={5} style={{ margin: 0 }}>
                  {dayjs(value).format("MMMM YYYY")}
                </Title>
                <Button
                  onClick={() => {
                    const next = dayjs();
                    setCalendarValue(next);
                    onChange(next);
                  }}
                >
                  Current Month
                </Button>
              </div>
            )}
          />

          <div className="mt-6">
            <Title level={5}>Dashboard</Title>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Text type="secondary">Total</Text>
                  <Title level={3} style={{ margin: 0 }}>
                    {stats.total}
                  </Title>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Text type="secondary">TODO LIST</Text>
                  <Title level={3} style={{ margin: 0 }}>
                    {stats.todo}
                  </Title>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Text type="secondary">PROBLEM RESOLVES</Text>
                  <Title level={3} style={{ margin: 0 }}>
                    {stats.problemResolves}
                  </Title>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Text type="secondary">GENERAL MEETING NOTES</Text>
                  <Title level={3} style={{ margin: 0 }}>
                    {stats.meetingNotes}
                  </Title>
                </Card>
              </Col>
            </Row>
          </div>
        </>
      )}

      <Modal
        title={`Entries for ${formatDateLabel(selectedDate)}`}
        open={dateModalOpen}
        onCancel={() => {
          setDateModalOpen(false);
          resetFormState();
        }}
        footer={null}
        width={760}
      >
        <div className="mb-4">
          <Space wrap>
            {CATEGORY_OPTIONS.map((cat) => (
              <Tag color={cat.color} key={cat.value} style={{ borderRadius: 999 }}>
                {cat.label}
              </Tag>
            ))}
          </Space>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select
              placeholder="Select category"
              options={CATEGORY_OPTIONS.map((cat) => ({
                value: cat.value,
                label: (
                  <Space>
                    <Badge color={cat.color} />
                    {cat.label}
                  </Space>
                ),
              }))}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <TextArea
              rows={4}
              placeholder="Write your note here..."
              maxLength={1200}
              showCount
            />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save Entry
            </Button>
          </Space>
        </Form>

        <div className="mt-6">
          <Title level={5}>Saved on this date</Title>
          {selectedDayEntries.length ? (
            <List
              dataSource={selectedDayEntries}
              renderItem={(item) => {
                const id = item?._id || item?.id;
                const meta = categoryMeta[item?.category] || {};
                return (
                  <List.Item
                    actions={[
                      <Popconfirm
                        key="delete"
                        title="Delete this entry?"
                        onConfirm={() => handleDelete(id)}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                      >
                        <Button danger type="link">
                          Delete
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color={meta.color || "default"}>
                            {meta.label || item?.category || "Category"}
                          </Tag>
                          <Text>{item?.title || "Note"}</Text>
                        </Space>
                      }
                      description={item?.description || "-"}
                    />
                  </List.Item>
                );
              }}
            />
          ) : (
            <Empty description="No entries for this date yet" />
          )}
        </div>
      </Modal>
    </Card>
  );
};

export default UserWiseCalendarPanel;
