import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { Table, message, Popconfirm } from "antd";
import { MapPin, Pencil, Plus, Search, Trash2, Layers } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { EmptyState, PageHero, SearchBox, StatCard, StatRow } from "@/Components/PageKit";
import { Dialog, FormActions, TextField } from "@/Components/FormKit";
import AddVenue from "./AddVenue";

const ViewVenue = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const user = useSelector((state) => state.user.value);

  const config = {
    headers: {
      Authorization: user?.access_token ? `Bearer ${user.access_token}` : undefined,
      "Content-Type": "application/json",
    },
  };

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`venue`, config);
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.venues)
          ? raw.venues
          : Array.isArray(raw.items)
            ? raw.items
            : Array.isArray(raw.data)
              ? raw.data
              : [];
      setData(list);
    } catch (err) {
      console.error("fetchVenues error:", err);
      message.error("Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`venue/${id}`, config);
      message.success("Venue deleted");
      fetchVenues();
    } catch (err) {
      console.error("delete venue error:", err);
      message.error("Delete failed");
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setEditName(record.name || "");
    setEditError("");
    setEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e?.preventDefault?.();
    if (!editName.trim()) {
      setEditError("Please enter a venue name");
      return;
    }
    setSaving(true);
    try {
      await axiosClient.patch(`venue/${editingRecord.id}`, { name: editName.trim() }, config);
      message.success("Venue updated");
      setEditModalOpen(false);
      setEditingRecord(null);
      fetchVenues();
    } catch (err) {
      console.error("update venue error:", err);
      message.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? data.filter((v) => String(v.name || "").toLowerCase().includes(q)) : data;
  }, [data, search]);

  const columns = [
    { title: "#", width: 70, render: (_, __, index) => index + 1 },
    {
      title: "Venue",
      dataIndex: "name",
      render: (name) => (
        <div className="pk-who">
          <span className="pk-avatar is-soft" aria-hidden="true">
            <MapPin size={18} />
          </span>
          <div style={{ minWidth: 0 }}>
            <strong>{name}</strong>
          </div>
        </div>
      ),
    },
    {
      title: "",
      width: 190,
      align: "right",
      render: (_, record) => (
        <div className="pk-actions">
          <button type="button" className="pk-btn is-solid" onClick={() => handleEdit(record)}>
            <Pencil size={13} aria-hidden="true" /> Edit
          </button>
          <Popconfirm title="Delete this venue?" onConfirm={() => handleDelete(record.id)}>
            <button type="button" className="pk-btn is-danger is-icon" aria-label="Delete venue">
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
          title="Venues"
          subtitle="The venues available when creating a booking."
          onBack={() => navigate("/user")}
        >
          <button type="button" className="pk-cta is-ghost" onClick={() => navigate("/user/viewsubvenue")}>
            <Layers size={16} aria-hidden="true" /> Sub venues
          </button>
          <button type="button" className="pk-cta" onClick={() => setDrawerOpen(true)}>
            <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add venue
          </button>
        </PageHero>

        <StatRow>
          <StatCard icon={<MapPin size={21} aria-hidden="true" />} label="Total venues" value={data.length} />
        </StatRow>

        <section className="pk-panel">
          <div className="pk-toolbar">
            <div className="pk-toolbar-left">
              <SearchBox
                icon={<Search size={16} aria-hidden="true" />}
                value={search}
                onChange={setSearch}
                placeholder="Search venues"
                label="Search venues"
              />
            </div>
          </div>
          <Table
            className="pk-table"
            rowKey="id"
            columns={columns}
            dataSource={visible}
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => `${t} venues` }}
            locale={{
              emptyText: loading ? null : (
                <EmptyState
                  icon={<MapPin size={26} aria-hidden="true" />}
                  title={search ? "No venues match your search" : "No venues yet"}
                  hint={search ? undefined : "Use “Add venue” to create the first one."}
                />
              ),
            }}
          />
        </section>
      </div>

      <Dialog open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add venue" width={440}>
        <AddVenue
          onSuccess={() => {
            setDrawerOpen(false);
            fetchVenues();
          }}
          onCancel={() => setDrawerOpen(false)}
        />
      </Dialog>

      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit venue" width={440}>
        <form onSubmit={handleUpdate} noValidate>
          <TextField
            label="Venue name"
            required
            autoFocus
            value={editName}
            onChange={(v) => {
              setEditName(v);
              if (editError) setEditError("");
            }}
            error={editError}
          />
          <FormActions onCancel={() => setEditModalOpen(false)} submitLabel="Save" busy={saving} />
        </form>
      </Dialog>
    </div>
  );
};

export default ViewVenue;
