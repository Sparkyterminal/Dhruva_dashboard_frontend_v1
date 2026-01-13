/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { logout } from "../../reducers/users";
// import ViewRequirements from "./ViewRequirements";
import logouticon from "../../assets/userlogout.json";
import welcome from "../../assets/userwelcome.json";
import audience from "../../assets/Target Audience.json";
import password from "../../assets/passworduser.json";
import rainbow from "../../assets/Rainbow.json";
import ViewRequirements from "../User/ViewRequirements";

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

const MarketHome = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);

  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
          <div className="glass-header overflow-visible flex flex-col lg:flex-row justify-between items-center gap-6 px-4 py-4 md:px-10 md:py-8 mb-8 slide-in-top">
            {/* Left Section - Welcome & Time */}
            <div className="flex-1 w-full lg:w-auto mb-4 lg:mb-0">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-2xl md:text-3xl lg:text-4xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 flex items-center gap-3"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 w-full px-2">
              {/* Add Requirement Button */}
              <motion.div
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
                className="w-full"
              >
                <motion.button
                  onClick={() => navigate("/user/sendrequest")}
                  className="w-full justify-center font-bold text-sm md:text-base tracking-wide relative cursor-pointer transition-all duration-300 px-3 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-orange-50 hover:to-orange-100"
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

              {/* Client Bookings Button */}
              <motion.div
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
                className="w-full"
              >
                <motion.button
                  onClick={() => navigate("/user/viewclient")}
                  className="w-full justify-center font-bold text-sm md:text-base tracking-wide relative cursor-pointer transition-all duration-300 px-3 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100"
                  variants={{
                    hover: {
                      color: "#e11d48",
                      scale: 1.05,
                    },
                  }}
                  style={{
                    color: "#f43f5e",
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Client Bookings
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

              {/* Add Event Button */}
              <motion.div
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
                className="w-full"
              >
                <motion.button
                  onClick={() => navigate("/user/viewevents")}
                  className="w-full justify-center font-bold text-sm md:text-base tracking-wide relative cursor-pointer transition-all duration-300 px-3 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 hover:from-indigo-100 hover:to-sky-100"
                  variants={{
                    hover: {
                      color: "#0ea5e9",
                      scale: 1.05,
                    },
                  }}
                  style={{
                    color: "#0369a1",
                  }}
                  aria-label="Add Event"
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
                    Events Masterdata
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

              {/* Venue Masterdata Button */}
              <motion.div
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
                className="w-full"
              >
                <motion.button
                  onClick={() => navigate("/user/viewvenue")}
                  className="w-full justify-center font-bold text-sm md:text-base tracking-wide relative cursor-pointer transition-all duration-300 px-3 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-indigo-50 to-emerald-50 hover:from-indigo-100 hover:to-emerald-100"
                  variants={{
                    hover: {
                      color: "#059669",
                      scale: 1.05,
                    },
                  }}
                  style={{
                    color: "#059669",
                  }}
                  aria-label="Venue Masterdata"
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
                        d="M3 10h18M3 6h18M3 14h18M3 18h18"
                      />
                    </svg>
                    Venue Masterdata
                  </span>
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                    initial={{ scaleX: 0 }}
                    variants={{
                      hover: { scaleX: 1 },
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </motion.div>

              {/* Events Calendar Button */}
              {/* <motion.div whileHover="hover" whileTap={{ scale: 0.95 }} className="w-full">
                <motion.button
                  onClick={() => navigate("/user/eventcalender")}
                  className="w-full justify-center font-bold text-sm md:text-base tracking-wide relative cursor-pointer transition-all duration-300 px-3 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 hover:from-sky-100 hover:to-indigo-100"
                  variants={{
                    hover: {
                      color: "#0ea5e9",
                      scale: 1.05,
                    },
                  }}
                  style={{
                    color: "#0369a1",
                  }}
                  aria-label="Events Calendar"
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
                        d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Events Calendar
                  </span>
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                    initial={{ scaleX: 0 }}
                    variants={{
                      hover: { scaleX: 1 },
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </motion.div> */}

              {/* View Vendors Button */}
              <motion.div
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
                className="w-full"
              >
                <motion.button
                  onClick={() => navigate("/user/viewvendors")}
                  className="w-full justify-center font-bold text-base md:text-lg tracking-wide relative cursor-pointer transition-all duration-300 px-5 py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-sky-50 hover:to-sky-100"
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

              {/* Checklists Button */}
              <motion.div
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
                className="w-full"
              >
                <motion.button
                  onClick={() => navigate("/user/checklists")}
                  className="w-full justify-center font-bold text-base md:text-lg tracking-wide relative cursor-pointer transition-all duration-300 px-5 py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100"
                  variants={{
                    hover: {
                      color: "#059669",
                      scale: 1.05,
                    },
                  }}
                  style={{
                    color: "#10b981",
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    Checklists
                  </span>
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
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
            <div className="flex-1 w-full lg:w-auto flex justify-center lg:justify-end mt-3 lg:mt-0">
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
                    className="z-10 absolute right-0 lg:right-0 top-14 lg:top-24 bg-white rounded-2xl shadow-2xl py-2 w-56 z-50 border border-gray-100 overflow-hidden"
                  >
                    <motion.button
                      whileHover={{ backgroundColor: "#f3f4f6", x: 5 }}
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/user/changepassword");
                      }}
                      className="w-full text-left px-5 py-3 transition-all duration-200 text-gray-700 font-semibold flex items-center gap-3 cursor-pointer"
                    >
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <Lottie
                          animationData={password}
                          loop={true}
                          className="w-full h-full"
                        />
                      </div>
                      <span className="text-sm md:text-base">
                        Change Password
                      </span>
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
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <Lottie
                          animationData={logouticon}
                          loop={true}
                          className="w-full h-full"
                        />
                      </div>
                      <span className="text-sm md:text-base">Logout</span>
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

export default MarketHome;
