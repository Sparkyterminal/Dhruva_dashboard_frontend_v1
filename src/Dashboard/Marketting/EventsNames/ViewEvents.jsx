import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../../config";
import { message, Table, Button, Card, Modal, Input, Popconfirm, Space, Typography, Spin, Drawer } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ViewSubEvents from "../SubEvents/ViewSubEvents";

const { Title } = Typography;

const ViewEvents = () => {
  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [subDrawerVisible, setSubDrawerVisible] = useState(false);

  const config = { headers: { Authorization: user?.access_token } };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}event-names`, config);
      setEvents(res.data.events || res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openEditModal = (record) => {
    setEditingId(record.id || record._id);
    setEditingName(record.name || "");
    setEditModalVisible(true);
  };

  const handleEditSave = async () => {
    if (!editingName || !editingName.trim()) return message.error("Name cannot be empty");
    setEditLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}event-names/${editingId}`, { name: editingName.trim() }, config);
      message.success("Event updated");
      setEditModalVisible(false);
      fetchEvents();
    } catch (err) {
      console.error(err);
      message.error("Failed to update event");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}event-names/${id}`, config);
      message.success("Event deleted");
      fetchEvents();
    } catch (err) {
      console.error(err);
      message.error("Failed to delete event");
    }
  };

  const columns = [
    {
      title: "Sl. No",
      dataIndex: "sl",
      key: "sl",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-medium text-gray-800">{text}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="default" onClick={() => openEditModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this event?"
            onConfirm={() => handleDelete(record.id || record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-indigo-700 font-semibold"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <Button type="default" onClick={() => setSubDrawerVisible(true)}>View Sub Events</Button>
        <Button type="primary" onClick={() => navigate("/user/addevent")}>Add Event Names</Button>
      </div>

      <Card
        className="rounded-2xl shadow-md"
        bodyStyle={{ padding: 20 }}
        title={<Title level={4} className="!mb-0">Event Names</Title>}
      >
        {loading ? (
          <div className="text-center py-12">
            <Spin />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={events.map((e) => ({ ...e, key: e.id || e._id }))}
            pagination={{ pageSize: 8 }}
          />
        )}
      </Card>

      <Modal title="Edit Event" open={editModalVisible} onOk={handleEditSave} onCancel={() => setEditModalVisible(false)} okButtonProps={{ loading: editLoading }}>
        <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} placeholder="Event name" />
      </Modal>

      {/* Sub Events Drawer */}
      <Drawer title={<span className="font-bold">Sub Events</span>} placement="right" onClose={() => setSubDrawerVisible(false)} open={subDrawerVisible} width="80%" destroyOnClose>
        <ViewSubEvents compact />
      </Drawer>
    </div>
  );
};

export default ViewEvents;

