import axiosClient from "@/api/axiosClient";
import React, { useEffect, useMemo, useState } from "react";
import { message, Table, Popconfirm } from "antd";
import { CalendarHeart, Layers, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Dialog, FormActions, TextField } from "@/Components/FormKit";
import { EmptyState, PageHero, SearchBox, StatCard, StatRow } from "@/Components/PageKit";

const ViewEvents = () => {
  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const config = { headers: { Authorization: user?.access_token } };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`event-names`, config);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      await axiosClient.patch(`event-names/${editingId}`, { name: editingName.trim() }, config);
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
      await axiosClient.delete(`event-names/${id}`, config);
      message.success("Event deleted");
      fetchEvents();
    } catch (err) {
      console.error(err);
      message.error("Failed to delete event");
    }
  };

  const list = useMemo(() => (Array.isArray(events) ? events : []), [events]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? list.filter((e) => String(e.name || "").toLowerCase().includes(q)) : list;
  }, [list, search]);

  const columns = [
    { title: "#", key: "sl", width: 70, render: (_, __, index) => index + 1 },
    {
      title: "Event name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <div className="pk-who">
          <span className="pk-avatar is-soft" aria-hidden="true">
            <CalendarHeart size={18} />
          </span>
          <div style={{ minWidth: 0 }}>
            <strong>{text}</strong>
          </div>
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 190,
      align: "right",
      render: (_, record) => (
        <div className="pk-actions">
          <button type="button" className="pk-btn is-solid" onClick={() => openEditModal(record)}>
            <Pencil size={13} aria-hidden="true" /> Edit
          </button>
          <Popconfirm
            title="Are you sure you want to delete this event?"
            onConfirm={() => handleDelete(record.id || record._id)}
            okText="Yes"
            cancelText="No"
          >
            <button type="button" className="pk-btn is-danger is-icon" aria-label="Delete event">
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Masterdata"
          title="Event names"
          subtitle="The kinds of events you can book, such as Wedding or Reception."
          onBack={() => navigate("/user")}
        >
          <button type="button" className="pk-cta is-ghost" onClick={() => navigate("/user/viewsubevents")}>
            <Layers size={16} aria-hidden="true" /> Sub events
          </button>
          <button type="button" className="pk-cta" onClick={() => navigate("/user/addevent")}>
            <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add event name
          </button>
        </PageHero>

        <StatRow>
          <StatCard icon={<CalendarHeart size={21} aria-hidden="true" />} label="Total event names" value={list.length} />
        </StatRow>

        <section className="pk-panel">
          <div className="pk-toolbar">
            <div className="pk-toolbar-left">
              <SearchBox
                icon={<Search size={16} aria-hidden="true" />}
                value={search}
                onChange={setSearch}
                placeholder="Search event names"
                label="Search event names"
              />
            </div>
          </div>
          <Table
            className="pk-table"
            columns={columns}
            dataSource={visible.map((e) => ({ ...e, key: e.id || e._id }))}
            loading={loading}
            pagination={{ pageSize: 8, showTotal: (t) => `${t} event names` }}
            locale={{
              emptyText: loading ? null : (
                <EmptyState
                  icon={<CalendarHeart size={26} aria-hidden="true" />}
                  title={search ? "No event names match your search" : "No event names yet"}
                  hint={search ? undefined : "Use “Add event name” to create the first one."}
                />
              ),
            }}
          />
        </section>
      </div>

      <Dialog open={editModalVisible} onClose={() => setEditModalVisible(false)} title="Edit event name" width={440}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEditSave();
          }}
          noValidate
        >
          <TextField
            label="Event name"
            required
            autoFocus
            value={editingName}
            onChange={setEditingName}
            placeholder="Event name"
          />
          <FormActions onCancel={() => setEditModalVisible(false)} submitLabel="Save" busy={editLoading} />
        </form>
      </Dialog>
    </div>
  );
};

export default ViewEvents;
