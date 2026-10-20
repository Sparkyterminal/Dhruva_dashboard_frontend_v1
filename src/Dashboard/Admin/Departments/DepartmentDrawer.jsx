import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axiosClient from "@/api/axiosClient";
import { Drawer, FormActions, TextField } from "@/Components/FormKit";
import { toast } from "@/Components/AdminKit/toast";

/** Add (no `departmentId`) or rename a department in a side drawer. */
const DepartmentDrawer = ({ open, departmentId, onClose, onSaved }) => {
  const user = useSelector((state) => state.user.value);
  const config = { headers: { Authorization: user?.access_token } };
  const editing = Boolean(departmentId);

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (!editing) {
      setName("");
      return;
    }
    (async () => {
      setFetching(true);
      try {
        const res = await axiosClient.get(`department/${departmentId}`, config);
        setName(String(res.data.data.name || "").toUpperCase());
      } catch {
        toast.error("Failed to fetch department details.");
      } finally {
        setFetching(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, departmentId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter department name");
      return;
    }
    setLoading(true);
    try {
      const res = editing
        ? await axiosClient.patch(`department/${departmentId}`, { name: name.trim() }, config)
        : await axiosClient.post(`department`, { name: name.trim().toUpperCase() }, config);
      if (res.status === 200 || res.status === 201) {
        toast.success(editing ? "Department updated successfully" : "Department added successfully");
        onSaved?.();
        onClose?.();
      }
    } catch (err) {
      console.error(err);
      toast.error(editing ? "Failed to update department" : "Failed to add department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Edit department" : "Add department"}
      subtitle={editing ? "Rename this department." : "Names are saved in capital letters."}
      width={460}
    >
      <form onSubmit={onSubmit} noValidate>
        <TextField
          label="Department name"
          required
          autoFocus
          disabled={fetching}
          value={name}
          onChange={(v) => {
            setName(v);
            if (error) setError("");
          }}
          placeholder={editing ? "Enter department name" : "e.g. MARKETING"}
          error={error}
        />
        <FormActions
          onCancel={onClose}
          submitLabel={editing ? "Save changes" : "Add department"}
          busy={loading}
          disabled={fetching}
        />
      </form>
    </Drawer>
  );
};

export default DepartmentDrawer;
