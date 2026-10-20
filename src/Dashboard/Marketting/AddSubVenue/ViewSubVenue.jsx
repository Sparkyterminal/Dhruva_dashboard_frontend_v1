import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { Table, message, Popconfirm } from "antd";
import { Layers, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Dialog, FormActions, SelectField, TextField } from "@/Components/FormKit";
import { EmptyState, PageHero, SearchBox, StatCard, StatRow } from "@/Components/PageKit";

const ViewSubVenue = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [newVenue, setNewVenue] = useState("");
  const [newName, setNewName] = useState("");
  const [errors, setErrors] = useState({});

  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();

  const config = {
    headers: {
      Authorization: user?.access_token ? `Bearer ${user.access_token}` : undefined,
      "Content-Type": "application/json",
    },
  };

  const fetchVenues = async () => {
    setVenuesLoading(true);
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
      setVenues(list);
    } catch (err) {
      console.error("fetchVenues error:", err);
      message.error("Failed to load venues");
    } finally {
      setVenuesLoading(false);
    }
  };

  const fetchSubVenues = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`sub-venue-location`, config);
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.subVenueLocations)
          ? raw.subVenueLocations
          : Array.isArray(raw.items)
            ? raw.items
            : Array.isArray(raw.data)
              ? raw.data
              : [];
      setData(list);
    } catch (err) {
      console.error("fetchSubVenues error:", err);
      message.error("Failed to load sub venues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubVenues();
    fetchVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeAdd = () => {
    setAddDrawerOpen(false);
    setNewVenue("");
    setNewName("");
    setErrors({});
  };

  const handleAddSubVenue = async (e) => {
    e?.preventDefault?.();
    const next = {};
    if (!newVenue) next.venue = "Please select a venue";
    if (!newName.trim()) next.name = "Please enter a sub venue name";
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      setSaving(true);
      await axiosClient.post(`sub-venue-location`, { venue: newVenue, name: newName.trim() }, config);
      message.success("Sub venue created successfully");
      closeAdd();
      fetchSubVenues();
    } catch (err) {
      console.error("create sub venue error:", err);
      message.error(err.response?.data?.message || "Failed to create sub venue");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`sub-venue-location/${id}`, config);
      message.success("Sub venue deleted successfully");
      fetchSubVenues();
    } catch (err) {
      console.error("delete sub venue error:", err);
      message.error("Delete failed");
    }
  };

  const handleEdit = (record) => navigate(`/user/editsubvenue/${record.id}`);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (s) =>
        String(s.name || "").toLowerCase().includes(q) ||
        String(s.venue?.name || "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const columns = [
    { title: "#", width: 70, render: (_, __, index) => index + 1 },
    {
      title: "Sub venue",
      dataIndex: "name",
      render: (name, record) => (
        <div className="pk-who">
          <span className="pk-avatar is-soft" aria-hidden="true">
            <Layers size={18} />
          </span>
          <div style={{ minWidth: 0 }}>
            <strong>{name}</strong>
            <span>{record.venue?.name || "No venue"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Venue",
      dataIndex: ["venue", "name"],
      render: (venueName) =>
        venueName ? <span className="pk-pill">{venueName}</span> : <span className="pk-muted">-</span>,
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
          <Popconfirm title="Delete this sub venue?" onConfirm={() => handleDelete(record.id)}>
            <button type="button" className="pk-btn is-danger is-icon" aria-label="Delete sub venue">
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
          title="Sub venues"
          subtitle="Halls and areas inside each venue."
          onBack={() => navigate("/user/viewvenue")}
          backLabel="Back to venues"
        >
          <button type="button" className="pk-cta" onClick={() => setAddDrawerOpen(true)}>
            <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add sub venue
          </button>
        </PageHero>

        <StatRow>
          <StatCard icon={<Layers size={21} aria-hidden="true" />} label="Total sub venues" value={data.length} />
          <StatCard tone="gold" icon={<Layers size={21} aria-hidden="true" />} label="Venues" value={venues.length} />
        </StatRow>

        <section className="pk-panel">
          <div className="pk-toolbar">
            <div className="pk-toolbar-left">
              <SearchBox
                icon={<Search size={16} aria-hidden="true" />}
                value={search}
                onChange={setSearch}
                placeholder="Search sub venue or venue"
                label="Search sub venues"
              />
            </div>
          </div>
          <Table
            className="pk-table"
            rowKey="id"
            columns={columns}
            dataSource={visible}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t) => `${t} sub venues`,
            }}
            locale={{
              emptyText: loading ? null : (
                <EmptyState
                  icon={<Layers size={26} aria-hidden="true" />}
                  title={search ? "No sub venues match your search" : "No sub venues yet"}
                  hint={search ? undefined : "Use “Add sub venue” to create the first one."}
                />
              ),
            }}
          />
        </section>
      </div>

      <Dialog open={addDrawerOpen} onClose={closeAdd} title="Add sub venue" width={480}>
        <form onSubmit={handleAddSubVenue} noValidate>
          <SelectField
            label="Venue"
            required
            value={newVenue}
            onChange={(v) => {
              setNewVenue(v);
              setErrors((p) => ({ ...p, venue: "" }));
            }}
            options={venues.map((v) => ({ value: v.id, label: v.name }))}
            placeholder="Select venue"
            loading={venuesLoading}
            error={errors.venue}
          />
          <TextField
            label="Sub venue name"
            required
            value={newName}
            onChange={(v) => {
              setNewName(v);
              setErrors((p) => ({ ...p, name: "" }));
            }}
            placeholder="Enter sub venue name"
            error={errors.name}
          />
          <FormActions onCancel={closeAdd} submitLabel="Add sub venue" busy={saving} />
        </form>
      </Dialog>
    </div>
  );
};

export default ViewSubVenue;
