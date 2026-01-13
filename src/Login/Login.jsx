import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import { API_BASE_URL, ROLES } from "../../config";
import { login } from "../reducers/users";

export default function Login() {
  const [email_id, setemail_id] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const apiPayload = { email_id, password };
      const response = await axios.post(
        `${API_BASE_URL}user/login`,
        apiPayload
      );
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
      setError(err.response?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        backgroundColor: "#E0D085",
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl shadow-2xl transform transition-transform duration-500 ease-in-out hover:scale-[1.02]"
          style={{
            backgroundColor: "#0C3253",
            border: "2px solid rgba(224, 208, 133, 0.3)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Header Section */}
          <div className="px-8 pt-8 pb-6 text-center text-white">
            {/* <div className="mb-6">
              <div className="mx-auto h-32 w-32 flex items-center justify-center">
                
                <img
                  src="/assets/dhruvalogo.png"
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div> */}
            <h1
              className="text-4xl font-bold mb-2"
              style={{ letterSpacing: "0.5px" }}
            >
              Members Only
            </h1>
            <p className="text-base animate-fadeIn opacity-90">
              Sign in to your account
            </p>
          </div>

          {/* Form */}
          <form className="px-8 pb-8" onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* email_id */}
              <div>
                <label
                  htmlFor="email_id"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#E0D085" }}
                >
                  Email Address
                </label>
                <input
                  id="email_id"
                  type="email"
                  required
                  autoComplete="email"
                  value={email_id}
                  onChange={(e) => setemail_id(e.target.value)}
                  placeholder="Enter your Email Address"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "rgba(224, 208, 133, 0.1)",
                    border: "1.5px solid rgba(224, 208, 133, 0.3)",
                    borderRadius: "12px",
                    color: "#ffffff",
                    outline: "none",
                    transition:
                      "border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease",
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#E0D085";
                    e.target.style.boxShadow =
                      "0 0 12px rgba(224, 208, 133, 0.4)";
                    e.target.style.backgroundColor =
                      "rgba(224, 208, 133, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(224, 208, 133, 0.3)";
                    e.target.style.boxShadow = "none";
                    e.target.style.backgroundColor = "rgba(224, 208, 133, 0.1)";
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#E0D085" }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{
                      width: "100%",
                      padding: "0.75rem 3rem 0.75rem 1rem",
                      backgroundColor: "rgba(224, 208, 133, 0.1)",
                      border: "1.5px solid rgba(224, 208, 133, 0.3)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      outline: "none",
                      transition:
                        "border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease",
                      fontFamily: "'Cormorant Garamond', serif",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#E0D085";
                      e.target.style.boxShadow =
                        "0 0 12px rgba(224, 208, 133, 0.4)";
                      e.target.style.backgroundColor =
                        "rgba(224, 208, 133, 0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(224, 208, 133, 0.3)";
                      e.target.style.boxShadow = "none";
                      e.target.style.backgroundColor =
                        "rgba(224, 208, 133, 0.1)";
                    }}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    style={{ color: "#E0D085" }}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <p
                  className="text-sm"
                  style={{ color: "#ff6b6b", animation: "fadeIn 0.5s ease" }}
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: "#E0D085",
                  color: "#0C3253",
                  fontWeight: "600",
                  padding: "0.85rem",
                  borderRadius: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition:
                    "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
                  boxShadow: loading
                    ? "none"
                    : "0 4px 12px rgba(224, 208, 133, 0.3)",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.05rem",
                  letterSpacing: "0.5px",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 16px rgba(224, 208, 133, 0.4)";
                    e.currentTarget.style.backgroundColor = "#ead994";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(224, 208, 133, 0.3)";
                    e.currentTarget.style.backgroundColor = "#E0D085";
                  }
                }}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Text */}
        <div className="text-center mt-8">
          <p className="text-xs" style={{ color: "#0C3253", opacity: 0.8 }}>
            Protected by advanced security measures
          </p>
        </div>

        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap');
            
            @keyframes fadeIn {
              from {opacity: 0;}
              to {opacity: 1;}
            }
            .animate-fadeIn {
              animation: fadeIn 0.8s ease forwards;
            }
            
            ::placeholder {
              color: rgba(224, 208, 133, 0.5);
              font-family: 'Cormorant Garamond', serif;
            }
          `}
        </style>
      </div>
    </div>
  );
}
