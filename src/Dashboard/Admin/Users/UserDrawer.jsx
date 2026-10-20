import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axiosClient from "@/api/axiosClient";
import {
  Drawer,
  FormActions,
  MultiSelectField,
  PasswordField,
  SelectField,
  TextField,
} from "@/Components/FormKit";
import { toast } from "@/Components/AdminKit/toast";

const ROLES_ADD = ["OWNER", "APPROVER", "DEPARTMENT", "CA"];
const ROLES_EDIT = ["DEPARTMENT", "OWNER", "APPROVER", "ADMIN", "CA"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = {
  first_name: "",
  last_name: "",
  role: "",
  designation: "",
  department_id: [],
  email: "",
  password: "",
  mobile: "",
};

/** Add (no `userId`) or edit a user in a side drawer. */
const UserDrawer = ({ open, userId, onClose, onSaved }) => {
  const user = useSelector((state) => state.user.value);
  const config = { headers: { Authorization: user?.access_token } };
  const editing = Boolean(userId);

  const [departments, setDepartments] = useState([]);
  const [fetchingDepartments, setFetchingDepartments] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  // Departments for the picker (the add form and edit form used different endpoints before; kept).
  useEffect(() => {
    if (!open) return;
    (async () => {
      setFetchingDepartments(true);
      try {
        if (editing) {
          const res = await axiosClient.get(`department`, config);
          setDepartments(res.data.items || []);
        } else {
          const res = await axiosClient.get(`department/all`, config);
          setDepartments(res.data.departments || []);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch departments");
      } finally {
        setFetchingDepartments(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  // Reset, or load the user being edited.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (!editing) {
      setValues(EMPTY);
      return;
    }
    (async () => {
      setFetchingUser(true);
      try {
        const res = await axiosClient.get(`user/${userId}`, config);
        const data = res.data.data;
        setValues({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email_data?.email_id || "",
          mobile: data.phone_data?.phone_number || "",
          role: data.role || "",
          designation: data.designation || "",
          department_id: data.department?.department?.map((dep) => dep.id) || [],
          password: "",
        });
      } catch {
        toast.error("Failed to fetch user details.");
      } finally {
        setFetchingUser(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const set = (key) => (v) => {
    setValues((p) => ({ ...p, [key]: v }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!values.first_name.trim()) e.first_name = "Please enter first name";
    if (!values.last_name.trim()) e.last_name = "Please enter last name";
    if (!values.role) e.role = "Please select a role";
    if (!values.designation.trim()) e.designation = "Please enter designation";
    if (values.role === "DEPARTMENT" && values.department_id.length === 0)
      e.department_id = "Please select department(s)";
    if (!values.email.trim()) e.email = "Please enter email";
    else if (!EMAIL_RE.test(values.email.trim())) e.email = "Please enter a valid email";
    if (!editing && !values.password) e.password = "Please enter password";
    if (!values.mobile.trim()) e.mobile = "Please enter mobile number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email_data: { email_id: values.email.trim() },
        phone_data: { phone_number: values.mobile.trim() },
        role: values.role,
        designation: values.designation.trim(),
        department: values.department_id, // department id(s)
      };
      if (values.password) payload.password = values.password;

      const res = editing
        ? await axiosClient.patch(`user/${userId}`, payload, config)
        : await axiosClient.post(`user`, payload, config);
      if (res.status === 200 || res.status === 201) {
        toast.success(editing ? "User updated successfully" : "User added successfully");
        onSaved?.();
        onClose?.();
      }
    } catch (error) {
      console.error(error);
      toast.error(editing ? "Failed to update user" : "Failed to add user");
    } finally {
      setLoading(false);
    }
  };

  const busy = fetchingDepartments || fetchingUser;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Edit user" : "Add user"}
      subtitle={
        editing
          ? "Change their details, role or departments. Leave the password empty to keep it."
          : "Create a sign-in with a role and, for department users, their departments."
      }
      width={540}
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="adm-grid">
          <TextField label="First name" required disabled={busy} value={values.first_name} onChange={set("first_name")} placeholder="Enter first name" error={errors.first_name} />
          <TextField label="Last name" required disabled={busy} value={values.last_name} onChange={set("last_name")} placeholder="Enter last name" error={errors.last_name} />
          <SelectField
            label="Role"
            required
            disabled={busy}
            value={values.role}
            onChange={set("role")}
            options={(editing ? ROLES_EDIT : ROLES_ADD).map((r) => ({ value: r, label: r }))}
            placeholder="Select role"
            error={errors.role}
          />
          <TextField label="Designation" required disabled={busy} value={values.designation} onChange={set("designation")} placeholder="Enter designation" error={errors.designation} />
          {values.role === "DEPARTMENT" && (
            <MultiSelectField
              label="Departments"
              required
              disabled={busy}
              value={values.department_id}
              onChange={set("department_id")}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="Select department(s)"
              loading={fetchingDepartments}
              error={errors.department_id}
            />
          )}
          <TextField label="Email" required type="email" disabled={busy} value={values.email} onChange={set("email")} placeholder="name@company.com" error={errors.email} />
          <TextField label="Mobile" required disabled={busy} value={values.mobile} onChange={set("mobile")} placeholder="Enter mobile number" maxLength={15} error={errors.mobile} />
          <PasswordField
            label={editing ? "New password" : "Password"}
            required={!editing}
            disabled={busy}
            value={values.password}
            onChange={set("password")}
            placeholder={editing ? "Enter new password" : "Enter password"}
            hint={editing ? "Leave blank to keep the current password" : undefined}
            error={errors.password}
          />
        </div>
        <FormActions
          onCancel={onClose}
          submitLabel={editing ? "Save changes" : "Add user"}
          busy={loading}
          disabled={busy}
        />
      </form>
    </Drawer>
  );
};

export default UserDrawer;
