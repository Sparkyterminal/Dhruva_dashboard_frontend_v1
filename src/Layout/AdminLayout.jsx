import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Building2,
  ChevronDown,
  Eye,
  LogOut,
  Menu,
  Plus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { logout } from "../reducers/users";
import { Toaster } from "../Components/AdminKit";
import "./AdminLayout.css";

const NAV_SECTIONS = [
  {
    title: "People",
    items: [
      {
        key: "users",
        label: "Users",
        icon: Users,
        children: [
          { to: "/dashboard/viewuser", label: "View users", icon: Eye },
          { to: "/dashboard/adduser", label: "Add user", icon: Plus },
        ],
      },
      { key: "pc", label: "Project coordinators", icon: UserRound, to: "/dashboard/viewprojectcoordinator" },
    ],
  },
  {
    title: "Organisation",
    items: [
      {
        key: "departments",
        label: "Departments",
        icon: Building2,
        children: [
          { to: "/dashboard/viewdepartment", label: "View departments", icon: Eye },
          { to: "/dashboard/adddepartment", label: "Add department", icon: Plus },
        ],
      },
    ],
  },
];

const TITLES = [
  ["/dashboard/viewuser", "Users"],
  ["/dashboard/adduser", "Add user"],
  ["/dashboard/edituser", "Edit user"],
  ["/dashboard/viewdepartment", "Departments"],
  ["/dashboard/adddepartment", "Add department"],
  ["/dashboard/editdepartment", "Edit department"],
  ["/dashboard/viewprojectcoordinator", "Project coordinators"],
  ["/dashboard/addprojectcoordinator", "Add project coordinator"],
  ["/dashboard/editprojectcoordinator", "Edit project coordinator"],
];

const titleFor = (path) => TITLES.find(([p]) => path.startsWith(p))?.[1] || "Admin dashboard";

/** Which submenu group a route belongs to, so the right one starts open. */
const groupOf = (path) => {
  if (/\/(view|add|edit)user/.test(path)) return "users";
  if (/\/(view|add|edit)department/.test(path)) return "departments";
  return null;
};

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);

  const [open, setOpen] = useState(false); // mobile drawer
  const [groups, setGroups] = useState(() => {
    const g = groupOf(location.pathname);
    return g ? [g] : ["users"];
  });

  // Close the mobile menu after navigating; open the group that holds the current page.
  useEffect(() => {
    setOpen(false);
    const g = groupOf(location.pathname);
    if (g) setGroups((prev) => (prev.includes(g) ? prev : [...prev, g]));
  }, [location.pathname]);

  const title = useMemo(() => titleFor(location.pathname), [location.pathname]);

  const toggleGroup = (key) =>
    setGroups((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const nav = (
    <nav aria-label="Admin menu" className="adm-nav">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="adm-section">
          <h2 className="adm-heading-sm">{section.title}</h2>
      {section.items.map((item) => {
        const Icon = item.icon;
        if (!item.children) {
          return (
            <NavLink key={item.key} to={item.to} className="adm-link">
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        }
        const expanded = groups.includes(item.key);
        return (
          <div key={item.key} className="adm-group">
            <button
              type="button"
              className="adm-link adm-group-btn"
              aria-expanded={expanded}
              onClick={() => toggleGroup(item.key)}
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              <span>{item.label}</span>
              <ChevronDown size={16} className={`adm-caret${expanded ? " is-open" : ""}`} aria-hidden="true" />
            </button>
            {expanded && (
              <div className="adm-sub">
                {item.children.map((c) => {
                  const ChildIcon = c.icon;
                  return (
                    <NavLink key={c.to} to={c.to} className="adm-link adm-sublink">
                      <ChildIcon size={15} strokeWidth={1.75} aria-hidden="true" />
                      {c.label}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="adm-shell">
      {open && <div className="adm-mask" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside className={`adm-side${open ? " is-open" : ""}`} aria-label="Sidebar">
        <div className="adm-side-head">
          <span className="adm-side-title">Admin</span>
          <button type="button" className="adm-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {nav}
        <button type="button" className="adm-signout" onClick={handleLogout}>
          <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
          Sign out
        </button>
      </aside>

      <div className="adm-main">
        <header className="adm-top">
          <button type="button" className="adm-burger" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu size={22} aria-hidden="true" />
          </button>
          <h1 className="adm-heading">{title}</h1>
          <span className="adm-user">
            <span className="adm-avatar" aria-hidden="true">
              {String(user?.name || "A").trim().charAt(0).toUpperCase()}
            </span>
            {user?.name}
          </span>
        </header>

        <main className="adm-content">
          <Outlet />
        </main>
      </div>

      <Toaster />
    </div>
  );
};

export default AdminLayout;
