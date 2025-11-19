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
// import RequirementsTableAc from "./RequirementsTableAc";
import RequirementTableApprover from "./RequirementTableApprover";

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

const ApproverHome = () => {
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

  // const navButtons = [
  //   {
  //     label: "Bills",
  //     route: "/approver/viewbills",
  //     icon: (
  //       <svg
  //         className="w-5 h-5"
  //         fill="none"
  //         stroke="currentColor"
  //         viewBox="0 0 24 24"
  //       >
  //         <path
  //           strokeLinecap="round"
  //           strokeLinejoin="round"
  //           strokeWidth={2}
  //           d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
  //         />
  //       </svg>
  //     ),
  //   },
  //   {
  //     label: "View Playbook",
  //     route: "/approver/playbook",
  //     icon: (
  //       <svg
  //         className="w-5 h-5"
  //         fill="none"
  //         stroke="currentColor"
  //         viewBox="0 0 24 24"
  //       >
  //         <path
  //           strokeLinecap="round"
  //           strokeLinejoin="round"
  //           strokeWidth={2}
  //           d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
  //         />
  //       </svg>
  //     ),
  //   },
  //   {
  //     label: "Departments",
  //     route: "/approver/departments",
  //     icon: (
  //       <svg
  //         className="w-5 h-5"
  //         fill="none"
  //         stroke="currentColor"
  //         viewBox="0 0 24 24"
  //       >
  //         <path
  //           strokeLinecap="round"
  //           strokeLinejoin="round"
  //           strokeWidth={2}
  //           d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
  //         />
  //       </svg>
  //     ),
  //   },
  //   {
  //     label: "Client Bookings",
  //     route: "/approver/viewclientbookings",
  //     icon: (
  //       <svg
  //         className="w-5 h-5"
  //         fill="none"
  //         stroke="currentColor"
  //         viewBox="0 0 24 24"
  //       >
  //         <path
  //           strokeLinecap="round"
  //           strokeLinejoin="round"
  //           strokeWidth={2}
  //           d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
  //         />
  //       </svg>
  //     ),
  //   },
  // ];

    const navButtons = [
    {
      label: "EMI's and Interest",
      route: "/approver/viewbills",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      label: "View Vendors",
      route: "/approver/viewvendors",
      icon: (
        <svg
          className="w-5 h-5"
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
      ),
    },
    {
      label: "View Playbook",
      route: "/approver/playbook",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      label: "Departments",
      route: "/approver/departments",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      label: "Client Bookings",
      route: "/approver/viewclientbookings",
      icon: (
        <svg
          className="w-5 h-5"
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
      ),
    },
  ];

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
          <div className="glass-header flex flex-col gap-6 px-4 py-6 md:px-10 md:py-8 mb-8 slide-in-top">
            {/* Top Row - Welcome & Avatar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Left Section - Welcome & Time */}
              <div className="flex-1 w-full">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 flex items-center gap-3"
                >
                  <Lottie
                    animationData={welcome}
                    loop={true}
                    className="w-10 h-10 md:w-12 md:h-12"
                  />
                  Hi {user?.name || "User"}!
                </motion.h1>

                <div className="flex flex-row items-center gap-3 text-black flex-wrap">
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
                      className="w-10 h-10 md:w-12 md:h-12"
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

              {/* Right Section - Avatar/Menu Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  onClick={() => setShowDropdown(!showDropdown)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full cursor-pointer flex items-center justify-center shadow-lg avatar-glow transition-all duration-300 hover:shadow-xl p-2"
                >
                  <Lottie
                    animationData={audience}
                    loop={true}
                    className="w-full h-full"
                  />
                </motion.button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-20 md:top-24 bg-white rounded-2xl shadow-2xl py-2 w-56 z-50 border border-gray-100 overflow-hidden"
                  >
                    <motion.button
                      whileHover={{ backgroundColor: "#f3f4f6", x: 5 }}
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/approver/changepassword");
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

            {/* Bottom Row - Navigation Buttons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
              {navButtons.map((button, index) => (
                <motion.button
                  key={button.label}
                  onClick={() => navigate(button.route)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.4 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="min-w-0 font-semibold text-base md:text-lg tracking-wide cursor-pointer transition-all duration-300 px-4 py-3 md:px-6 md:py-3.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-600 hover:text-indigo-700 shadow-sm hover:shadow-md"
                >
                  <span className="flex items-center justify-center gap-2">
                    {button.icon}
                    <span className="truncate">{button.label}</span>
                  </span>
                </motion.button>
              ))}
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
            <RequirementTableApprover />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ApproverHome;