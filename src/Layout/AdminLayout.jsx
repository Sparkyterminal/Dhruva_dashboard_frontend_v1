import React, { useMemo, useState } from "react";
import { Layout, Menu } from "antd";
import {
  CalendarClock,
  Eye,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  UserRound,
  Users,
  Building2,
} from "lucide-react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../reducers/users";
import BrandMark from "../Components/BrandMark";
import "./AdminLayout.css";

const { Header, Sider, Content } = Layout;

const icon = (glyph) => React.createElement(glyph, { size: 18, strokeWidth: 1.75 });

const ADMIN_MENU_ITEMS = [
  {
    key: "Users",
    icon: icon(Users),
    label: "Users",
    children: [
      { key: "/dashboard/adduser", icon: icon(Plus), label: "Add Users" },
      { key: "/dashboard/viewuser", icon: icon(Eye), label: "View Users" },
    ],
  },
  {
    key: "Departments",
    icon: icon(Building2),
    label: "Departments",
    children: [
      { key: "/dashboard/adddepartment", icon: icon(Plus), label: "Add Department" },
      { key: "/dashboard/viewdepartment", icon: icon(Eye), label: "View Departments" },
    ],
  },
  {
    key: "Meetings",
    icon: icon(CalendarClock),
    label: "Meetings",
    children: [
      { key: "/dashboard/addmeeting", icon: icon(Plus), label: "Add Meetings" },
      { key: "/dashboard/viewmeetings", icon: icon(Eye), label: "View Meetings" },
    ],
  },
  {
    key: "/dashboard/viewprojectcoordinator",
    icon: icon(UserRound),
    label: "View Project Coordinator",
  },
];

const USER_MENU_ITEMS = [
  { key: "/dashboard/getuserinfo", icon: icon(UserRound), label: "Get User Info" },
];

// Which submenu holds a given route, so the right group opens by itself.
const parentOf = (items, path) =>
  items.find((item) => item.children?.some((child) => child.key === path))?.key;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1024);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((state) => state.user.value);
  const role = user.role || "USER";

  const menuItems = role === "ADMIN" ? ADMIN_MENU_ITEMS : USER_MENU_ITEMS;
  const parentKey = useMemo(
    () => parentOf(menuItems, location.pathname),
    [menuItems, location.pathname],
  );
  const [openKeys, setOpenKeys] = useState(parentKey ? [parentKey] : []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <Layout className="admin-shell">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={272}
        collapsedWidth={76}
        className="admin-sider"
      >
        <div className="admin-brand">
          {collapsed ? (
            <img src="/assets/dhruvalogo-removed.png" alt="Dhruva" width={40} height={40} />
          ) : (
            <BrandMark markSize={42} wordSize={28} />
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          inlineIndent={14}
          selectedKeys={[location.pathname]}
          openKeys={collapsed ? undefined : openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
          onClick={({ key }) => {
            if (key.startsWith("/dashboard")) navigate(key);
          }}
        />

        <button type="button" className="admin-signout" onClick={handleLogout}>
          <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
          {collapsed ? <span className="sr-only">Sign out</span> : "Sign out"}
        </button>
      </Sider>

      <Layout>
        <Header className="admin-header">
          <button
            type="button"
            className="admin-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
          <h1 className="admin-title">{role === "ADMIN" ? "Admin dashboard" : "Dashboard"}</h1>
          <span className="admin-user">{user.name}</span>
        </Header>

        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
