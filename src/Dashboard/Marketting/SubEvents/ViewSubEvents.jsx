import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../../config";
import { message, Table, Button, Card, Modal, Input, Popconfirm, Space, Typography, Spin } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const ViewSubEvents = ({ compact }) => {
  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const config = { headers: { Authorization: user?.access_token } };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}event-types`, config);
      const payload = res.data;
      let list = [];

      if (Array.isArray(payload)) {
        list = payload;
      } else if (Array.isArray(payload.eventTypes)) {
        list = payload.eventTypes;
      } else if (Array.isArray(payload.events)) {
        list = payload.events;
      } else if (Array.isArray(payload.types)) {
        list = payload.types;
      } else if (Array.isArray(payload.data)) {
        list = payload.data;
      } else if (payload && typeof payload === 'object') {
        // Try to extract array-like values or object values that look like items
        const candidates = ['eventTypes', 'events', 'types', 'data'];
        for (const key of candidates) {
          if (Array.isArray(payload[key])) {
            list = payload[key];
            break;
          }
        }

        if (!list.length) {
          const vals = Object.values(payload).filter((v) => v && (v.name || v.eventName));
          if (vals.length) list = vals;
        }
      }

      if (!Array.isArray(list)) list = [];
      if (list.length === 0) console.debug('event-types payload shape:', payload);

      setItems(list);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch sub events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
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
      await axios.patch(`${API_BASE_URL}event-types/${editingId}`, { name: editingName.trim() }, config);
      message.success("Sub event updated");
      setEditModalVisible(false);
      fetchItems();
    } catch (err) {
      console.error(err);
      message.error("Failed to update sub event");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}event-types/${id}`, config);
      message.success("Sub event deleted");
      fetchItems();
    } catch (err) {
      console.error(err);
      message.error("Failed to delete sub event");
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
      title: "Event",
      dataIndex: "event",
      key: "event",
      render: (_, record) => (
        <span className="text-sm text-gray-600">
          {record.event?.name || record.eventName || record.eventId || '-'}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="default" onClick={() => openEditModal(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure you want to delete this sub event?"
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
    <div className={compact ? undefined : "min-h-[60vh]"}>
      <Card 
        className="rounded-2xl shadow-md" 
        bodyStyle={{ padding: 20 }} 
        title={<Title level={4} className="!mb-0">Sub Events</Title>} 
        extra={<Button type="primary" onClick={() => navigate("/user/addsubevent")}>Add Sub Events</Button>}
      >
        {loading ? (
          <div className="text-center py-12"><Spin /></div>
        ) : (
          <Table 
            columns={columns} 
            dataSource={items.map((i) => ({ ...i, key: i.id || i._id }))} 
            pagination={{ pageSize: 8 }} 
          />
        )}
      </Card>

      <Modal 
        title="Edit Sub Event" 
        open={editModalVisible} 
        onOk={handleEditSave} 
        onCancel={() => setEditModalVisible(false)} 
        okButtonProps={{ loading: editLoading }}
      >
        <Input 
          value={editingName} 
          onChange={(e) => setEditingName(e.target.value)} 
          placeholder="Sub event name" 
        />
      </Modal>
    </div>
  );
};

export default ViewSubEvents;