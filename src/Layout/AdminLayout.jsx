/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Layout, Menu, Button } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  PlusCircleOutlined,
  EyeOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../reducers/users";

const { Header, Sider, Content } = Layout;

// Updated classic white and dark forest green theme
const WHITE = "#ffffff";
const DARK_FOREST_GREEN = "#0b3d0b"; // dark forest green color
const TEXT_DARK = DARK_FOREST_GREEN;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);
  const borderRadiusLG = 8;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // Get user role from redux (adjust according to your state shape)
  const role = useSelector((state) => state.user.value.role || "USER");

  //   useEffect(() => {
  //     // Set selected menu item based on current route
  //     const currentPath = location.pathname;
  //     setSelectedKeys([currentPath]);

  //     // Auto-open parent menu based on route
  //     if (
  //       currentPath.includes("/addmembership") ||
  //       currentPath.includes("/viewmembership") ||
  //       currentPath.includes("/membershipusers")
  //     ) {
  //       setOpenKeys(["Membership"]);
  //     } else if (currentPath.includes("/workshop")) {
  //       setOpenKeys(["workshops"]);
  //     } else if (currentPath.includes("/classtype")) {
  //       setOpenKeys(["ClassTypes"]);
  //     } else if (currentPath.includes("/coach")) {
  //       setOpenKeys(["AddCoach"]);
  //     } else if (
  //       currentPath.includes("/contactform") ||
  //       currentPath.includes("/enquireform")
  //     ) {
  //       setOpenKeys(["ViewForms"]);
  //     } else if (
  //       currentPath.includes("/viewdemousers") ||
  //       currentPath.includes("/viewallusers")
  //     ) {
  //       setOpenKeys(["ViewUsers"]);
  //     }
  //   }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  // Sidebar menu items for ADMIN
  const adminMenuItems = [
    {
      key: "Users",
      icon: <AppstoreOutlined style={{ color: DARK_FOREST_GREEN }} />,
      label: <span style={{ color: TEXT_DARK }}>Users</span>,
      children: [
        {
          key: "/dashboard/adduser",
          icon: <PlusCircleOutlined style={{ color: DARK_FOREST_GREEN }} />,
          label: <span style={{ color: TEXT_DARK }}>Add Users</span>,
        },
        {
          key: "/dashboard/viewuser",
          icon: <EyeOutlined style={{ color: DARK_FOREST_GREEN }} />,
          label: <span style={{ color: TEXT_DARK }}>View Users</span>,
        },
      ],
    },
    {
      key: "Departments",
      icon: <AppstoreOutlined style={{ color: DARK_FOREST_GREEN }} />,
      label: <span style={{ color: TEXT_DARK }}>Departments</span>,
      children: [
        {
          key: "/dashboard/adddepartment",
          icon: <PlusCircleOutlined style={{ color: DARK_FOREST_GREEN }} />,
          label: <span style={{ color: TEXT_DARK }}>Add Department</span>,
        },
        {
          key: "/dashboard/viewdepartment",
          icon: <EyeOutlined style={{ color: DARK_FOREST_GREEN }} />,
          label: <span style={{ color: TEXT_DARK }}>View Departments</span>,
        },
      ],
    },
    {
      key: "Meetings",
      icon: <AppstoreOutlined style={{ color: DARK_FOREST_GREEN }} />,
      label: <span style={{ color: TEXT_DARK }}>Meetings</span>,
      children: [
        {
          key: "/dashboard/addmeeting",
          icon: <PlusCircleOutlined style={{ color: DARK_FOREST_GREEN }} />,
          label: <span style={{ color: TEXT_DARK }}>Add Meetings</span>,
        },
        {
          key: "/dashboard/viewmeetings",
          icon: <EyeOutlined style={{ color: DARK_FOREST_GREEN }} />,
          label: <span style={{ color: TEXT_DARK }}>View Meetings</span>,
        },
      ],
    },
  ];

  // Sidebar menu items for USER
  const userMenuItems = [
    {
      key: "/dashboard/getuserinfo",
      icon: <UserOutlined style={{ color: DARK_FOREST_GREEN }} />,
      label: <span style={{ color: TEXT_DARK }}>Get User Info</span>,
    },
  ];

  // Flatten menu items for Menu component
  const getMenuItems = (items) =>
    items.map((item) =>
      item.children
        ? {
            ...item,
            children: item.children.map((child) => ({
              ...child,
              onClick: child.onClick,
            })),
          }
        : {
            ...item,
            onClick: item.onClick,
          }
    );

  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  return (
    <Layout
      style={{ minHeight: "100vh", background: WHITE, fontFamily: "glancyr" }}
    >
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={280}
        collapsedWidth={130}
        style={{
          background: WHITE,
          // background: 'linear-gradient(to bottom right, #f5f3ff, #fce7f3, #dbeafe)',
          boxShadow: "2px 0 8px rgba(11, 61, 11, 0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 0 8px 0",
            marginBottom: 8,
          }}
        >
          <img
            src="/assets/dhruvalogo.png"
            alt="Logo"
            style={{ height: 100, width: 100, marginBottom: 8 }}
          />
          <span
            style={{
              color: DARK_FOREST_GREEN,
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: 1,
              textAlign: "center",
            }}
          >
            {role === "ADMIN" ? "Admin" : "User"}
          </span>
        </div>

        <Menu
          theme="light"
          mode="inline"
          inlineIndent={12}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          style={{
            background: WHITE,
            color: TEXT_DARK,
            fontWeight: 600,
            fontSize: 16,
            fontFamily: "glancyr",
          }}
          items={getMenuItems(
            role === "ADMIN" ? adminMenuItems : userMenuItems
          )}
          onClick={({ key }) => {
            if (key.startsWith("/dashboard")) {
              navigate(key);
            }
          }}
        />

        {/* Add custom CSS for text wrapping */}
        <style>{`
          .ant-menu-title-content {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .ant-menu-item, .ant-menu-submenu-title {
            overflow: hidden;
          }
          .ant-menu-submenu .ant-menu-item .ant-menu-title-content {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .ant-menu-inline .ant-menu-item {
            overflow: hidden;
          }
        `}</style>
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            // background: 'linear-gradient(to bottom right, #f5f3ff, #fce7f3, #dbeafe)',
            background: WHITE,
            boxShadow: "0 2px 8px rgba(11, 61, 11, 0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 64,
            position: "relative",
            fontFamily: "glancyr",
          }}
        >
          {/* Collapse Button on Left */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "20px",
              width: 56,
              height: 56,
              marginLeft: 8,
              color: TEXT_DARK,
            }}
          />

          {/* Center Title */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontFamily: "glancyr",
                fontSize: 28,
                color: TEXT_DARK,
                letterSpacing: 1,
                fontWeight: 600,
              }}
            >
              Admin Dashboard
            </span>
          </div>

          {/* Logout on Right */}
          <Button
            type="danger" // Change the logout button to Danger type
            onClick={handleLogout}
            icon={<LogoutOutlined />}
            style={{
              fontWeight: "bold",
              marginRight: 16,
              fontFamily: "glancyr",
              color: WHITE,
              borderColor: "red",
              backgroundColor: "red",
            }}
          >
            Logout
          </Button>
        </Header>

        <Content
          style={{
            margin: "32px 16px",
            padding: 32,
            minHeight: 320,
            // background: 'linear-gradient(to bottom right, #f5f3ff, #fce7f3, #dbeafe)',
            background: WHITE,
            borderRadius: borderRadiusLG,
            boxShadow: "0 2px 16px rgba(11, 61, 11, 0.06)",
            fontFamily: "glancyr",
          }}
        >
          <div>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
