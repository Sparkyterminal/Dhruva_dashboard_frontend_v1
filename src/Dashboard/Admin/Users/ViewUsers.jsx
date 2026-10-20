import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useMatch, useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { ConfirmDialog, DataTable, PersonCell } from "@/Components/AdminKit";
import { toast } from "@/Components/AdminKit/toast";
import { EmptyState, PageHero, StatCard, StatRow } from "@/Components/PageKit";
import UserDrawer from "./UserDrawer";

const ROLE_TONE = { OWNER: "is-gold", APPROVER: "is-blue", CA: "is-blue", ADMIN: "is-red", DEPARTMENT: "" };

const ViewUsers = () => {
  const user = useSelector((state) => state.user.value);
  const config = { headers: { Authorization: user?.access_token } };
  const navigate = useNavigate();
  // The add / edit drawer is driven by the URL, so links like /dashboard/adduser still work.
  const addMatch = useMatch("/dashboard/adduser");
  const editMatch = useMatch("/dashboard/edituser/:id");
  const drawerOpen = Boolean(addMatch || editMatch);
  const editId = editMatch?.params?.id;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUserData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`user?page=${page}&limit=${pageSize}`, config);
      const usersData = res.data.items || [];
      const mapped = usersData.map((u) => ({
        ...u,
        department_name:
          u.department_details && u.department_details.length > 0
            ? u.department_details.map((d) => d.name).join(", ")
            : "-",
      }));
      setUsers(mapped);
      setPagination({ page, pageSize, total: res.data.totalItems || 0 });
    } catch {
      toast.error("Failed to fetch user details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`user/${toDelete.id}`, config);
      toast.success("User deleted successfully");
      setToDelete(null);
      fetchUserData(pagination.page, pagination.pageSize);
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "name",
      title: "User",
      render: (r) => (
        <PersonCell
          name={`${r.first_name || ""} ${r.last_name || ""}`.trim()}
          sub={r.email_data?.email_id}
        />
      ),
    },
    { key: "phone", title: "Mobile", render: (r) => r.phone_data?.phone_number || "-" },
    {
      key: "role",
      title: "Role",
      render: (r) => <span className={`pk-pill ${ROLE_TONE[r.role] ?? "is-grey"}`}>{r.role || "-"}</span>,
    },
    { key: "designation", title: "Designation", render: (r) => r.designation || "-" },
    { key: "department_name", title: "Department", render: (r) => r.department_name || "-" },
    {
      key: "actions",
      title: "",
      align: "right",
      width: 190,
      render: (r) => (
        <div className="pk-actions">
          <button type="button" className="pk-btn is-solid" onClick={() => navigate(`/dashboard/edituser/${r._id}`)}>
            <Pencil size={13} aria-hidden="true" /> Edit
          </button>
          <button
            type="button"
            className="pk-btn is-danger is-icon"
            aria-label={`Delete ${r.first_name || "user"}`}
            onClick={() => setToDelete(r)}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="pk-wrap" style={{ maxWidth: 1180 }}>
      <PageHero
        eyebrow="Admin"
        title="Users"
        subtitle="Everyone who can sign in, with their role and department."
      >
        <button type="button" className="pk-cta" onClick={() => navigate("/dashboard/adduser")}>
          <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add user
        </button>
      </PageHero>

      <StatRow>
        <StatCard icon={<Users size={21} aria-hidden="true" />} label="Total users" value={pagination.total} />
      </StatRow>

      <section className="pk-panel">
        <DataTable
          columns={columns}
          rows={users}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchUserData(p, pagination.pageSize)}
          onPageSizeChange={(n) => fetchUserData(1, n)}
          empty={<EmptyState icon={<Users size={26} aria-hidden="true" />} title="No users yet" hint="Use “Add user” to create the first one." />}
        />
      </section>

      <UserDrawer
        open={drawerOpen}
        userId={editId}
        onClose={() => navigate("/dashboard/viewuser")}
        onSaved={() => fetchUserData(pagination.page, pagination.pageSize)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete user"
        message={`Are you sure you want to delete ${toDelete ? `${toDelete.first_name || ""} ${toDelete.last_name || ""}`.trim() || "this user" : ""}? This cannot be undone.`}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default ViewUsers;
