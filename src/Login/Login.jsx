import React, { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import axiosClient from "@/api/axiosClient";
import { ROLES } from "@/config/config";
import { login } from "../reducers/users";
import AuthLayout from "./AuthLayout";

export default function Login() {
  const [email_id, setemail_id] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const apiPayload = { email_id, password };
      const response = await axiosClient.post(`user/login`, apiPayload);
      if (response.status === 200) {
        const { access_token, user_id, name, email_id, role } =
          response.data.data;
        dispatch(
          login({
            id: user_id,
            name,
            role,
            email_id,
            access_token,
            is_logged_in: true,
            departments: response.data.data.departments || [],
            dataCutoffDate: response.data.data.dataCutoffDate ?? null,
          })
        );
        if (role === ROLES.ADMIN) {
          navigate("/dashboard");
        } else if (role === ROLES.USER) {
          navigate("/userdashboard");
        } else {
          navigate("/"); // default fallback
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Sign in to your account"
      footer="Protected by advanced security measures"
    >
      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="email_id" className="auth-label">
            Email address
          </label>
          <input
            id="email_id"
            type="email"
            required
            autoComplete="email"
            value={email_id}
            onChange={(e) => setemail_id(e.target.value)}
            placeholder="name@company.com"
            className="auth-input"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password" className="auth-label">
            Password
          </label>
          <div className="auth-password">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="auth-input"
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </div>

        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
