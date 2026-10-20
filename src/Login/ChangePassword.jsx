import React, { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosClient from "@/api/axiosClient";
import { toast } from "@/Components/AdminKit/toast";
import { Toaster } from "@/Components/AdminKit";
import AuthLayout from "./AuthLayout";

const STRENGTH = ["", "Weak", "Fair", "Good", "Strong"];

/** 0-4 from length and character variety. Only a hint; the real rule is "at least 6 characters". */
const strengthOf = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.max(1, Math.min(score, 4));
};

const PasswordInput = ({ id, label, value, onChange, placeholder, error, autoComplete }) => {
  const [shown, setShown] = useState(false);
  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <div className="auth-password">
        <input
          id={id}
          type={shown ? "text" : "password"}
          className="auth-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className="auth-eye"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
        >
          {shown ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
      {error ? <p className="auth-field-error">{error}</p> : null}
    </div>
  );
};

const ChangePassword = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!newPassword) next.newPassword = "Please input your new password";
    else if (newPassword.length < 6) next.newPassword = "Password must be at least 6 characters";
    if (!confirmPassword) next.confirmPassword = "Please confirm your new password";
    else if (confirmPassword !== newPassword) next.confirmPassword = "The two passwords do not match";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await axiosClient.patch(`user/change/password`, { password: newPassword }, config);
      toast.success("Password changed successfully");
      navigate("/user");
    } catch {
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const level = strengthOf(newPassword);

  return (
    <>
      <AuthLayout
        title="Change password"
        subtitle="Choose a new password for your account"
        icon={KeyRound}
      >
        <form onSubmit={onSubmit} noValidate>
          <PasswordInput
            id="newPassword"
            label="New password"
            value={newPassword}
            onChange={(v) => {
              setNewPassword(v);
              if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: "" }));
            }}
            placeholder="Enter new password"
            error={errors.newPassword}
            autoComplete="new-password"
          />
          {newPassword ? (
            <div className="auth-meter" data-level={level} style={{ marginTop: -8, marginBottom: 18 }}>
              <span className="auth-meter-bars" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span>{STRENGTH[level]}</span>
            </div>
          ) : null}

          <PasswordInput
            id="confirmPassword"
            label="Confirm new password"
            value={confirmPassword}
            onChange={(v) => {
              setConfirmPassword(v);
              if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" }));
            }}
            placeholder="Confirm new password"
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? "Saving…" : "Change password"}
          </button>
          <button type="button" className="auth-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </form>
      </AuthLayout>
      <Toaster />
    </>
  );
};

export default ChangePassword;
