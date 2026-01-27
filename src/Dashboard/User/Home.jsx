/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { logout } from "../../reducers/users";
import ViewRequirements from "./ViewRequirements";
import logouticon from "../../assets/userlogout.json";
import welcome from "../../assets/userwelcome.json";
import audience from "../../assets/Target Audience.json";
import password from "../../assets/passworduser.json";
import rainbow from "../../assets/Rainbow.json";

// Email arrays for conditional rendering
const CONFIRMED_EVENTS_EMAILS = [
  "dtiwari@gmail.com",
  "hemu.jamu86@gmail.com",
  "mallesh@gmail.com",
  "muzamilprod@gmail.com",
  "approvershivakumar@gmail.com",
  "sushmawbd@gmail.com",
  "varshabellave@gmail.com",
  "acchr@gmail.com",
  "rishi@gmail.com",
  "manish@gmail.com",
  "ashwath@gmail.com",
  "kumarv@gmail.com",
  "varshashyleshcustomerteam@gmail.com",
  "sirishavcustomerteam@gmail.com",
];

const INPROGRESS_EVENTS_EMAILS = [
  "hemu.jamu86@gmail.com",
  "varshabellave@gmail.com",
  "hr@gmail.com",
  "rishi@gmail.com",
  "manish@gmail.com",
  "kumarv@gmail.com",
  "varshashyleshcustomerteam@gmail.com",
  "sirishavcustomerteam@gmail.com",
];

// CSS for Glassmorphism and Animations
const customStyles = `
  .glass-header {
    background: rgba(255, 255, 255, 0.75);
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.35);
  }

  @keyframes slide-in-top {
    0% {
      transform: translateY(-50px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .slide-in-top {
    animation: slide-in-top 0.6s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
  }

  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
    }
    50% {
      box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);
    }
  }

  .avatar-glow {
    animation: glow 3s ease-in-out infinite;
  }
`;

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);

  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Check if user email is in the allowed lists
  const userEmail = user?.email_id?.toLowerCase() || "";
  const showConfirmedEvents = CONFIRMED_EVENTS_EMAILS.includes(userEmail);
  const showInProgressEvents = INPROGRESS_EVENTS_EMAILS.includes(userEmail);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative font-[cormoreg]">
      {/* Add custom styles */}
      <style>{customStyles}</style>

      {/* Animated Gradient Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            `radial-gradient(circle at 15% 85%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),` +
            `radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),` +
            `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 px-3 pt-4 md:px-8 md:pt-8">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-7xl w-full mx-auto"
        >
          {/* Glassmorphism Header */}
          <div className="glass-header flex flex-col lg:flex-row justify-between items-center gap-6 px-6 py-6 md:px-10 md:py-8 mb-8 slide-in-top">
            {/* Left Section - Welcome & Time */}
            <div className="flex-1 w-full lg:w-auto">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 flex items-center gap-3"
              >
                <Lottie
                  animationData={welcome}
                  loop={true}
                  className="w-12 h-12 md:w-14 md:h-14"
                />
                Hi {user?.name || "User"}!
              </motion.h1>

              <div className="flex flex-row items-center gap-3 text-black flex-wrap sm:flex-nowrap">
                <motion.div
                  className="shrink-0"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "easeInOut",
                  }}
                >
                  <Lottie
                    animationData={rainbow}
                    loop={true}
                    className="w-12 h-12 md:w-14 md:h-14"
                  />
                </motion.div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 font-medium">
                  <div className="text-base md:text-lg text-black font-semibold whitespace-nowrap">
                    {formatTime(currentDateTime)}
                  </div>
                  <div className="text-sm md:text-base text-black font-semibold whitespace-nowrap">
                    {formatDate(currentDateTime)}
                  </div>
                </div>
              </div>
            </div>

            {/* Center Section - Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 shrink-0">
              {/* Add Requirement Button */}
              <motion.div whileHover="hover" whileTap={{ scale: 0.95 }}>
                <motion.button
                  onClick={() => navigate("/user/sendrequest")}
                  className="font-bold text-base md:text-lg tracking-wide relative cursor-pointer transition-all duration-300 px-5 py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-orange-50 hover:to-orange-100"
                  variants={{
                    hover: {
                      color: "#ff7300",
                      scale: 1.05,
                    },
                  }}
                  style={{
                    color: "#4f46e5",
                  }}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Requirement
                  </span>
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                    initial={{ scaleX: 0 }}
                    variants={{
                      hover: { scaleX: 1 },
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </motion.div>

              {/* Confirmed Event Calendar Button - Conditional */}
              {showConfirmedEvents && (
                <motion.div whileHover="hover" whileTap={{ scale: 0.95 }}>
                  <motion.button
                    onClick={() => navigate("/user/confirmed-events")}
                    className="font-bold text-base md:text-lg tracking-wide relative cursor-pointer transition-all duration-300 px-5 py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-green-50 hover:to-green-100"
                    variants={{
                      hover: {
                        color: "#059669",
                        scale: 1.05,
                      },
                    }}
                    style={{
                      color: "#0d9488",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 md:w-5 md:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Confirmed Events
                    </span>
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
                      initial={{ scaleX: 0 }}
                      variants={{
                        hover: { scaleX: 1 },
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </motion.div>
              )}

              {/* In Progress Event Calendar Button - Conditional */}
              {showInProgressEvents && (
                <motion.div whileHover="hover" whileTap={{ scale: 0.95 }}>
                  <motion.button
                    onClick={() => navigate("/user/inprogress-events")}
                    className="font-bold text-base md:text-lg tracking-wide relative cursor-pointer transition-all duration-300 px-5 py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-50 hover:to-rose-100"
                    variants={{
                      hover: {
                        color: "#be123c",
                        scale: 1.05,
                      },
                    }}
                    style={{
                      color: "#e11d48",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 md:w-5 md:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      In Progress Events
                    </span>
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500"
                      initial={{ scaleX: 0 }}
                      variants={{
                        hover: { scaleX: 1 },
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </motion.div>
              )}

              {/* Checklists Button */}
              <motion.div whileHover="hover" whileTap={{ scale: 0.95 }}>
                <motion.button
                  onClick={() => navigate("/user/checklists")}
                  className="font-bold text-base md:text-lg tracking-wide relative cursor-pointer transition-all duration-300 px-5 py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-50 hover:to-amber-100"
                  variants={{
                    hover: {
                      color: "#b45309",
                      scale: 1.05,
                    },
                  }}
                  style={{
                    color: "#c2410c",
                  }}
                  aria-label="Checklists"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7 8h10M7 16h10"
                      />
                    </svg>
                    Checklists
                  </span>
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"
                    initial={{ scaleX: 0 }}
                    variants={{
                      hover: { scaleX: 1 },
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </motion.div>

              {/* View Vendors Button */}
              <motion.div whileHover="hover" whileTap={{ scale: 0.95 }}>
                <motion.button
                  onClick={() => navigate("/user/viewvendors")}
                  className="font-bold text-base md:text-lg tracking-wide relative cursor-pointer transition-all duration-300 px-5 py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-sky-50 hover:to-sky-100"
                  variants={{
                    hover: {
                      color: "#0284c7",
                      scale: 1.05,
                    },
                  }}
                  style={{
                    color: "#0891b2",
                  }}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    View Vendors
                  </span>
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500"
                    initial={{ scaleX: 0 }}
                    variants={{
                      hover: { scaleX: 1 },
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </motion.div>
            </div>

            {/* Right Section - Avatar/Menu Dropdown */}
            <div className="flex-1 w-full lg:w-auto flex justify-center lg:justify-end">
              <div className="relative" ref={dropdownRef}>
                {/* Desktop - Audience Icon */}
                <motion.button
                  onClick={() => setShowDropdown(!showDropdown)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden lg:flex w-20 h-20 rounded-full cursor-pointer items-center justify-center shadow-lg avatar-glow transition-all duration-300 hover:shadow-xl p-2"
                >
                  <Lottie
                    animationData={audience}
                    loop={true}
                    className="w-full h-full"
                  />
                </motion.button>

                {/* Mobile - Menu Icon */}
                <motion.button
                  onClick={() => setShowDropdown(!showDropdown)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="lg:hidden w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <Lottie
                    animationData={audience}
                    loop={true}
                    className="w-10 h-10"
                  />
                </motion.button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-16 md:top-20 bg-white rounded-2xl shadow-2xl py-2 w-56 z-50 border border-gray-100 overflow-hidden"
                  >
                    <motion.button
                      whileHover={{ backgroundColor: "#f3f4f6", x: 5 }}
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/user/changepassword");
                      }}
                      className="w-full text-left px-5 py-3 transition-all duration-200 text-gray-700 font-semibold flex items-center gap-3 cursor-pointer"
                    >
                      <div className="w-8 h-8 flex items-center justify-center">
                        <Lottie
                          animationData={password}
                          loop={true}
                          className="w-full h-full"
                        />
                      </div>
                      Change Password
                    </motion.button>

                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-1" />

                    <motion.button
                      whileHover={{ backgroundColor: "#fef2f2", x: 5 }}
                      onClick={() => {
                        setShowDropdown(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-5 py-3 transition-all duration-200 text-red-600 font-semibold flex items-center gap-3 cursor-pointer"
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <Lottie
                          animationData={logouticon}
                          loop={true}
                          className="w-full h-full"
                        />
                      </div>
                      Logout
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content - ViewRequirements Component */}
        <div className="max-w-7xl w-full mx-auto mt-6 md:mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <ViewRequirements />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Home;
