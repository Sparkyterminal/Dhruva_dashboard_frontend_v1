import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { ConfirmDialog, DataTable, PersonCell } from "@/Components/AdminKit";
import { toast } from "@/Components/AdminKit/toast";
import { Dialog, FormActions, TextField } from "@/Components/FormKit";
import { EmptyState, PageHero, SearchBox, StatCard, StatRow } from "@/Components/PageKit";
import AddPC from "./AddPC";

const ViewPC = () => {
  const user = useSelector((state) => state.user.value);
  const config = {
    headers: {
      Authorization: user?.access_token ? `Bearer ${user.access_token}` : undefined,
      "Content-Type": "application/json",
    },
  };

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPCs = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`coordinators`);
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.items)
          ? raw.items
          : Array.isArray(raw.data)
            ? raw.data
            : Array.isArray(raw.coordinators)
              ? raw.coordinators
              : [];
      setData(list);
    } catch (err) {
      console.error("fetchPCs error:", err);
      toast.error("Failed to load coordinators");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPCs();
  }, []);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`coordinators/${toDelete.id}`, config);
      toast.success("Coordinator deleted");
      setToDelete(null);
      fetchPCs();
    } catch (err) {
      console.error("delete error:", err);
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (record) => {
    setEditing(record);
    setEditName(record.name || "");
    setEditError("");
  };

  const handleUpdate = async (e) => {
    e?.preventDefault?.();
    if (!editName.trim()) {
      setEditError("Name is required");
      return;
    }
    setSaving(true);
    try {
      await axiosClient.patch(`coordinators/${editing.id}`, { name: editName.trim() }, config);
      toast.success("Coordinator updated");
      setEditing(null);
      fetchPCs();
    } catch (err) {
      console.error("update error:", err);
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? data.filter((c) => String(c.name || "").toLowerCase().includes(q)) : data;
  }, [data, search]);

  const pageRows = visible.slice((page - 1) * pageSize, page * pageSize);

  const columns = [
    { key: "sl", title: "#", width: 70, render: (_, index) => index + 1 },
    { key: "name", title: "Coordinator", render: (r) => <PersonCell name={r.name} /> },
    {
      key: "actions",
      title: "",
      align: "right",
      width: 190,
      render: (r) => (
        <div className="pk-actions">
          <button type="button" className="pk-btn is-solid" onClick={() => openEdit(r)}>
            <Pencil size={13} aria-hidden="true" /> Edit
          </button>
          <button
            type="button"
            className="pk-btn is-danger is-icon"
            aria-label={`Delete ${r.name}`}
            onClick={() => setToDelete(r)}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="pk-wrap" style={{ maxWidth: 900 }}>
      <PageHero
        eyebrow="Admin"
        title="Project coordinators"
        subtitle="The coordinators that can be assigned to bookings and leads."
      >
        <button type="button" className="pk-cta" onClick={() => setAddOpen(true)}>
          <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add coordinator
        </button>
      </PageHero>

      <StatRow>
        <StatCard icon={<UserRound size={21} aria-hidden="true" />} label="Total coordinators" value={data.length} />
      </StatRow>

      <section className="pk-panel">
        <div className="pk-toolbar">
          <div className="pk-toolbar-left">
            <SearchBox
              icon={<Search size={16} aria-hidden="true" />}
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search coordinators"
              label="Search coordinators"
            />
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={pageRows}
          rowKey="id"
          loading={loading}
          pagination={{ page, pageSize, total: visible.length }}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          empty={
            <EmptyState
              icon={<UserRound size={26} aria-hidden="true" />}
              title={search ? "No coordinators match your search" : "No coordinators yet"}
              hint={search ? undefined : "Use “Add coordinator” to create the first one."}
            />
          }
        />
      </section>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add coordinator" width={440}>
        <AddPC
          onSuccess={() => {
            setAddOpen(false);
            fetchPCs();
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Dialog>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit coordinator" width={440}>
        <form onSubmit={handleUpdate} noValidate>
          <TextField
            label="Name"
            required
            autoFocus
            value={editName}
            onChange={(v) => {
              setEditName(v);
              if (editError) setEditError("");
            }}
            placeholder="Enter coordinator name"
            error={editError}
          />
          <FormActions onCancel={() => setEditing(null)} submitLabel="Update" busy={saving} />
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete coordinator"
        message={`Delete ${toDelete?.name || "this coordinator"}? This cannot be undone.`}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default ViewPC;
