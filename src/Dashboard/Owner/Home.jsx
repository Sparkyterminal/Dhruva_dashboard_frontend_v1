/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Dropdown } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { logout } from "../../reducers/users";
import Meetings from "./Meetings";
import Lottie from "lottie-react";
import requirementsAnimation from "../../assets/requirements.json";
import logouticon from "../../assets/logout.json";
import profile from "../../assets/Profile.json";
import eye from "../../assets/Eye.json";

// CSS for Glassmorphism and Focus Animation
const customStyles = `
  .glass-header {
    background: rgba(255,255,255,0.7);
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(31,38,135,0.10);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(255,255,255,0.30);
  }
  @keyframes focus-in-expand {
    0% {
      letter-spacing: -0.5em;
      filter: blur(12px);
      opacity: 0;
    }
    100% {
      letter-spacing: normal;
      filter: blur(0px);
      opacity: 1;
    }
  }
  .focus-in-expand-normal {
    animation: focus-in-expand 0.8s cubic-bezier(0.250,0.460,0.450,0.940) 0s 1 normal both;
  }
`;

const HomeOwner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const handleChangePassword = () => {
    navigate("/owner/changepassword");
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

  // Navigation menu items
  const navigationMenus = [
    {
      label: "Requirements",
      route: "/owner/allrequirements",
      animation: requirementsAnimation,
    },
    {
      label: "Daybook",
      route: "/owner/daybook",
      animation: requirementsAnimation, // Replace with playbook animation
    },
    {
      label: "Vendors",
      route: "/owner/viewvendors",
      animation: requirementsAnimation, // Replace with Vendors animation
    },
    {
      label: "Client Bookings",
      route: "/owner/viewclientbookings",
      animation: requirementsAnimation, // Replace with bookings animation
    },
    {
      label: "Bills",
      route: "/owner/viewbills",
      animation: requirementsAnimation, // Replace with bills animation
    },
    {
      label: "Checklists",
      route: "/owner/checklists",
      animation: requirementsAnimation, // Replace with bills animation
    },
    {
      label: "Departments",
      route: "/owner/departments",
      animation: requirementsAnimation, // Replace with departments animation
    },
  ];

  const menuItems = [
    {
      key: "change-password",
      label: (
        <div
          className="flex items-center gap-2 px-2 py-1"
          onClick={handleChangePassword}
        >
          <Lottie
            animationData={eye}
            style={{ width: 22, height: 22, marginRight: 2 }}
            loop={true}
            autoplay={true}
          />
          <span>Change Password</span>
        </div>
      ),
    },
    {
      key: "logout",
      label: (
        <div
          className="flex items-center gap-2 px-2 py-1 text-red-600 cursor-pointer"
          onClick={handleLogout}
        >
          <Lottie
            animationData={logouticon}
            style={{ width: 22, height: 22, marginRight: 2 }}
            loop={true}
            autoplay={true}
          />
          <span>Logout</span>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#fff9f5] relative font-[cormoreg]">
      {/* Add custom styles to page head once */}
      <style>{customStyles}</style>
      {/* Gradient Bg Layer */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            `radial-gradient(circle at 20% 80%, rgba(255,220,190,0.3) 0%, transparent 50%),` +
            `radial-gradient(circle at 80% 20%, rgba(255,245,238,0.35) 0%, transparent 50%),` +
            `radial-gradient(circle at 40% 40%, rgba(255,210,180,0.15) 0%, transparent 50%)`,
        }}
      />
      <div className="relative z-10 px-2 pt-4 md:px-6 md:pt-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl w-full mx-auto"
        >
          {/* Glassmorphism Header */}
          <div className="glass-header flex flex-col gap-6 px-5 py-6 md:p-10 mb-8 focus-in-expand-normal shadow-lg">
            {/* Top Row: Welcome & User Profile */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              {/* Left Welcome */}
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                    Welcome Mr. Dhruva
                  </h1>
                  <div className="text-gray-600 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6">
                    <motion.div
                      className="text-lg md:text-xl font-semibold"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut",
                      }}
                    >
                      {formatTime(currentTime)}
                    </motion.div>
                    <div className="text-sm md:text-base text-gray-700 font-medium">
                      {formatDate(currentTime)}
                    </div>
                  </div>
                </div>
                {/* Elephant Image */}
                {/* <motion.div
                  className="hidden sm:block"
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut",
                  }}
                >
                  <img
                    src="assets/dhruvalogo-removed.png"
                    alt="Elephant"
                    className="w-16 h-16 md:w-20 md:h-20"
                  />
                </motion.div> */}
              </div>
              {/* User actions */}
              <motion.div className="flex items-center gap-4 shrink-0">
                <Dropdown
                  menu={{ items: menuItems }}
                  trigger={["click"]}
                  placement="bottomRight"
                >
                  <div className="cursor-pointer flex items-center justify-center">
                    <Lottie
                      animationData={profile}
                      style={{ width: 56, height: 56, borderRadius: "50%" }}
                      loop={true}
                      autoplay={true}
                    />
                  </div>
                </Dropdown>
              </motion.div>
            </div>

            {/* Bottom Row: Navigation Menu */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8 pt-4 border-t border-gray-200">
              {navigationMenus.map((menu, index) => (
                <motion.div
                  key={index}
                  className="shrink-0 select-none"
                  whileHover="hover"
                  whileTap={{ scale: 0.96 }}
                >
                  <motion.a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(menu.route);
                    }}
                    className="font-semibold text-base md:text-lg tracking-wide relative cursor-pointer transition-all duration-200"
                    initial={false}
                    variants={{
                      hover: {
                        color: "#ff7300",
                        textDecoration: "underline",
                        textUnderlineOffset: 5,
                        letterSpacing: "0.1em",
                      },
                    }}
                    style={{
                      color: "#000000",
                      textDecoration: "none",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Lottie
                        animationData={menu.animation}
                        style={{ width: 20, height: 20, marginBottom: 2 }}
                        loop={true}
                        autoplay={true}
                      />
                      {menu.label}
                    </span>
                  </motion.a>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
        {/* Below Header: Meetings */}
        <div className="max-w-8xl w-full mx-auto mt-4">
          <Meetings />
        </div>
      </div>
    </div>
  );
};

export default HomeOwner;
