import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useMatch, useNavigate } from "react-router-dom";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { ConfirmDialog, DataTable, PersonCell } from "@/Components/AdminKit";
import { toast } from "@/Components/AdminKit/toast";
import { EmptyState, PageHero, StatCard, StatRow } from "@/Components/PageKit";
import DepartmentDrawer from "./DepartmentDrawer";

const ViewDepartment = () => {
  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();
  // The add / edit drawer is driven by the URL, so links like /dashboard/adddepartment still work.
  const addMatch = useMatch("/dashboard/adddepartment");
  const editMatch = useMatch("/dashboard/editdepartment/:id");
  const drawerOpen = Boolean(addMatch || editMatch);
  const editId = editMatch?.params?.id;
  const config = { headers: { Authorization: user?.access_token } };

  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDepartmentData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`department?page=${page}&limit=${pageSize}`, config);
      setDepartments(res.data.items || []);
      setPagination({ page, pageSize, total: res.data.totalItems || 0 });
    } catch {
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`department/${toDelete.id}`, config);
      toast.success("Department deleted successfully");
      setToDelete(null);
      fetchDepartmentData(pagination.page, pagination.pageSize);
    } catch {
      toast.error("Failed to delete department");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: "slno", title: "#", width: 70, render: (_, index) => index + 1 },
    { key: "name", title: "Department", render: (r) => <PersonCell name={r.name} /> },
    {
      key: "actions",
      title: "",
      align: "right",
      width: 190,
      render: (r) => (
        <div className="pk-actions">
          <button type="button" className="pk-btn is-solid" onClick={() => navigate(`/dashboard/editdepartment/${r.id}`)}>
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
      <PageHero eyebrow="Admin" title="Departments" subtitle="The departments requests and users belong to.">
        <button type="button" className="pk-cta" onClick={() => navigate("/dashboard/adddepartment")}>
          <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add department
        </button>
      </PageHero>

      <StatRow>
        <StatCard icon={<Building2 size={21} aria-hidden="true" />} label="Total departments" value={pagination.total} />
      </StatRow>

      <section className="pk-panel">
        <DataTable
          columns={columns}
          rows={departments}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchDepartmentData(p, pagination.pageSize)}
          onPageSizeChange={(n) => fetchDepartmentData(1, n)}
          empty={<EmptyState icon={<Building2 size={26} aria-hidden="true" />} title="No departments yet" hint="Use “Add department” to create the first one." />}
        />
      </section>

      <DepartmentDrawer
        open={drawerOpen}
        departmentId={editId}
        onClose={() => navigate("/dashboard/viewdepartment")}
        onSaved={() => fetchDepartmentData(pagination.page, pagination.pageSize)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete department"
        message={`Are you sure you want to delete ${toDelete?.name || "this department"}? This cannot be undone.`}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default ViewDepartment;
