import axiosClient from "@/api/axiosClient";
import React, { useEffect, useMemo, useState } from "react";
import { message, Table, Popconfirm } from "antd";
import { Layers, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Dialog, FormActions, TextField } from "@/Components/FormKit";
import { EmptyState, PageHero, SearchBox, StatCard, StatRow } from "@/Components/PageKit";

/** `compact` renders only the panel (for use inside another screen); otherwise a full page. */
const ViewSubEvents = ({ compact }) => {
  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const config = { headers: { Authorization: user?.access_token } };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`event-types`, config);
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
      } else if (payload && typeof payload === "object") {
        // Try to extract array-like values or object values that look like items
        const candidates = ["eventTypes", "events", "types", "data"];
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
      await axiosClient.patch(`event-types/${editingId}`, { name: editingName.trim() }, config);
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
      await axiosClient.delete(`event-types/${id}`, config);
      message.success("Sub event deleted");
      fetchItems();
    } catch (err) {
      console.error(err);
      message.error("Failed to delete sub event");
    }
  };

  const eventOf = (record) => record.event?.name || record.eventName || record.eventId || "";

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        String(i.name || "").toLowerCase().includes(q) ||
        String(i.event?.name || i.eventName || "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const columns = [
    { title: "#", key: "sl", width: 70, render: (_, __, index) => index + 1 },
    {
      title: "Sub event",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="pk-who">
          <span className="pk-avatar is-soft" aria-hidden="true">
            <Layers size={18} />
          </span>
          <div style={{ minWidth: 0 }}>
            <strong>{text}</strong>
            <span>{eventOf(record) || "No event"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Event",
      dataIndex: "event",
      key: "event",
      render: (_, record) =>
        eventOf(record) ? <span className="pk-pill">{eventOf(record)}</span> : <span className="pk-muted">-</span>,
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
            title="Are you sure you want to delete this sub event?"
            onConfirm={() => handleDelete(record.id || record._id)}
            okText="Yes"
            cancelText="No"
          >
            <button type="button" className="pk-btn is-danger is-icon" aria-label="Delete sub event">
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const panel = (
    <section className="pk-panel">
      <div className="pk-toolbar">
        <div className="pk-toolbar-left">
          <SearchBox
            icon={<Search size={16} aria-hidden="true" />}
            value={search}
            onChange={setSearch}
            placeholder="Search sub event or event"
            label="Search sub events"
          />
        </div>
        {compact ? (
          <button type="button" className="pk-btn is-solid" onClick={() => navigate("/user/addsubevent")}>
            <Plus size={14} aria-hidden="true" /> Add sub event
          </button>
        ) : null}
      </div>
      <Table
        className="pk-table"
        columns={columns}
        dataSource={visible.map((i) => ({ ...i, key: i.id || i._id }))}
        loading={loading}
        pagination={{ pageSize: 8, showTotal: (t) => `${t} sub events` }}
        locale={{
          emptyText: loading ? null : (
            <EmptyState
              icon={<Layers size={26} aria-hidden="true" />}
              title={search ? "No sub events match your search" : "No sub events yet"}
              hint={search ? undefined : "Use “Add sub event” to create the first one."}
            />
          ),
        }}
      />
    </section>
  );

  const modal = (
    <Dialog open={editModalVisible} onClose={() => setEditModalVisible(false)} title="Edit sub event" width={440}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEditSave();
          }}
          noValidate
        >
          <TextField
            label="Sub event name"
            required
            autoFocus
            value={editingName}
            onChange={setEditingName}
            placeholder="Sub event name"
          />
          <FormActions onCancel={() => setEditModalVisible(false)} submitLabel="Save" busy={editLoading} />
        </form>
      </Dialog>
  );

  if (compact) {
    return (
      <div>
        {panel}
        {modal}
      </div>
    );
  }

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Masterdata"
          title="Sub events"
          subtitle="The ceremonies that belong to each event, such as Muhurtham or Reception."
          onBack={() => navigate("/user/viewevents")}
          backLabel="Back to event names"
        >
          <button type="button" className="pk-cta" onClick={() => navigate("/user/addsubevent")}>
            <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add sub event
          </button>
        </PageHero>

        <StatRow>
          <StatCard icon={<Layers size={21} aria-hidden="true" />} label="Total sub events" value={items.length} />
        </StatRow>

        {panel}
      </div>
      {modal}
    </div>
  );
};

export default ViewSubEvents;
