/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Button, Dropdown, Avatar } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Lock,
  User,
  Users,
  ClipboardList,
  Calendar,
} from "lucide-react";
import { motion } from "motion/react";
import { logout } from "../../reducers/users";

const HomeOwner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // import logout action from reducers/users
  // lazy import to avoid circular issues if any; adjust path if needed

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    try {
      dispatch(logout());
    } catch (e) {
      // fallback: if logout isn't a function or dispatch fails, still navigate
      // console.warn(e);
    }
    navigate("/login");
  };

  const handleChangePassword = () => {
    navigate("/owner/change-password");
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const menuItems = [
    {
      key: "change-password",
      label: (
        <div
          className="flex items-center gap-2 px-2 py-1"
          onClick={handleChangePassword}
        >
          <Lock size={16} />
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
          <LogOut size={16} />
          <span>Logout</span>
        </div>
      ),
    },
  ];

  const dashboardItems = [
    {
      title: "Meetings",
      icon: Calendar,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      description: "Schedule and manage meetings",
      path: "/owner/meetings",
    },
    {
      title: "Departments",
      icon: Users,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      description: "Manage departments and teams",
      path: "/owner/departments",
    },
    {
      title: "Requirements",
      icon: ClipboardList,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50",
      description: "View all requirements",
      path: "/owner/allrequirements",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6 font-[cormoreg]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header Section */}
        <motion.div
          className="mb-8 md:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* Left Side - Welcome Section */}
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-3">
                Welcome Mr. Dhruva
              </h1>
              <div className="text-gray-600">
                <motion.div
                  className="text-xl md:text-2xl font-semibold mb-1"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  }}
                >
                  {formatTime(currentTime)}
                </motion.div>
                <div className="text-sm md:text-base">
                  {formatDate(currentTime)}
                </div>
              </div>
            </div>

            {/* Right Side - User Actions */}
            <motion.div
              className="flex items-center gap-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Dropdown
                menu={{ items: menuItems }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <div className="cursor-pointer">
                  <Avatar
                    size={56}
                    icon={<User size={20} />}
                    className="bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg hover:shadow-xl transition-shadow"
                  />
                </div>
              </Dropdown>
            </motion.div>
          </div>
        </motion.div>

        {/* Grid Dashboard Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {dashboardItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                onClick={() => navigate(item.path)}
                className="cursor-pointer group"
              >
                <div
                  className={`relative bg-gradient-to-br ${item.bgGradient} rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden h-full`}
                >
                  {/* Gradient overlay on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  ></div>

                  <div className="relative p-6 md:p-8 flex flex-col h-full">
                    {/* Icon */}
                    <motion.div
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-5 shadow-md`}
                      whileHover={{
                        rotate: [0, -10, 10, -10, 0],
                        transition: { duration: 0.5 },
                      }}
                    >
                      <IconComponent
                        className="w-6 h-6 md:w-7 md:h-7 text-white"
                        strokeWidth={2}
                      />
                    </motion.div>

                    {/* Content */}
                    <div className="grow">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 transition-all">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-base md:text-lg">
                        {item.description}
                      </p>
                    </div>

                    {/* Hover indicator */}
                    <motion.div
                      className="mt-4 flex items-center gap-2 text-gray-700 font-semibold"
                      initial={{ x: -10, opacity: 0 }}
                      whileHover={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-sm">View Details</span>
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        →
                      </motion.span>
                    </motion.div>
                  </div>

                  {/* Decorative gradient corner */}
                  <div
                    className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${item.gradient} opacity-10 rounded-bl-full`}
                  ></div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Meetings Section Placeholder */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {/* <Meeting /> component will be rendered here */}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomeOwner;
