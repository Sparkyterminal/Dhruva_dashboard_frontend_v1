import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Drawer } from "antd";
import { House, KeyRound, LogOut, Menu } from "lucide-react";
import { logout } from "../../reducers/users";
import BrandMark from "../BrandMark";
import { Greeting, LiveClock } from "./LiveClock";
import "./RoleHome.css";

const titleCase = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());

const initialsOf = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

/** Navigation + signed-in user block; rendered in the desktop rail and the mobile drawer. */
const RailContent = ({ navItems, user, onNavigate, onChangePassword, onSignOut }) => {
  const roleLabel = titleCase(user?.departments?.[0]?.name || user?.role || "");
  return (
    <div className="rh-rail-inner">
      <div className="rh-brand">
        <BrandMark />
      </div>

      <nav aria-label="Main">
        <ul className="rh-nav">
          <li>
            <Link to="/user" className="rh-link" aria-current="page" onClick={onNavigate}>
              <House aria-hidden="true" />
              Home
            </Link>
          </li>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.route + item.label}>
                <Link to={item.route} className="rh-link" onClick={onNavigate}>
                  <Icon aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="rh-user">
        <div className="rh-user-card">
          <span className="rh-avatar" aria-hidden="true">
            {initialsOf(user?.name)}
          </span>
          <div className="rh-user-meta">
            <div className="rh-user-name">{user?.name || "User"}</div>
            {roleLabel ? <div className="rh-user-role">{roleLabel}</div> : null}
          </div>
        </div>
        <button type="button" className="rh-link rh-link-quiet" onClick={onChangePassword}>
          <KeyRound aria-hidden="true" />
          Change password
        </button>
        <button type="button" className="rh-link rh-link-quiet" onClick={onSignOut}>
          <LogOut aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );
};

/**
 * Shared home screen for every role: navigation rail, greeting, and a tabbed
 * workspace. Each role supplies its own links and tabs.
 *
 * @param {{ navItems: {label: string, route: string, icon: React.ElementType}[],
 *           tabs: {key: string, label: string, content: React.ReactNode, framed?: boolean}[],
 *           defaultTab?: string }} props
 */
const RoleHome = ({ navItems, tabs, defaultTab }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);
  const [activeKey, setActiveKey] = useState(defaultTab ?? tabs[0]?.key);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const firstName = String(user?.name || "").trim().split(/\s+/)[0] || "there";
  const activeTab = tabs.find((t) => t.key === activeKey) ?? tabs[0];

  const handleSignOut = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };
  const handleChangePassword = () => navigate("/user/changepassword");

  const railProps = {
    navItems,
    user,
    onNavigate: () => setDrawerOpen(false),
    onChangePassword: handleChangePassword,
    onSignOut: handleSignOut,
  };

  const onTabKeyDown = (event, index) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    setActiveKey(next.key);
    document.getElementById(`rh-tab-${next.key}`)?.focus();
  };

  return (
    <div className="rh-shell">
      <header className="rh-topbar">
        <BrandMark markSize={34} wordSize={25} />
        <button
          type="button"
          className="rh-menu-btn"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu aria-hidden="true" size={20} />
        </button>
      </header>

      <aside className="rh-rail">
        <RailContent {...railProps} />
      </aside>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="left"
        width={300}
        closable={false}
        styles={{ body: { padding: 0, background: "var(--brand)" }, header: { display: "none" } }}
      >
        <RailContent {...railProps} />
      </Drawer>

      <main className="rh-main">
        <div className="rh-column">
          <div className="rh-masthead">
            <Greeting name={firstName} />
            <LiveClock />
            <div className="rh-toran" aria-hidden="true" />
          </div>

          {tabs.length > 1 ? (
            <div role="tablist" aria-label="Workspace" className="rh-tabs">
              {tabs.map((tab, index) => (
                <button
                  key={tab.key}
                  id={`rh-tab-${tab.key}`}
                  type="button"
                  role="tab"
                  className="rh-tab"
                  aria-selected={tab.key === activeTab.key}
                  aria-controls="rh-panel"
                  tabIndex={tab.key === activeTab.key ? 0 : -1}
                  onClick={() => setActiveKey(tab.key)}
                  onKeyDown={(e) => onTabKeyDown(e, index)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : (
            <h2 className="rh-workspace-title">{activeTab.label}</h2>
          )}

          <section
            id="rh-panel"
            role={tabs.length > 1 ? "tabpanel" : undefined}
            aria-labelledby={tabs.length > 1 ? `rh-tab-${activeTab.key}` : undefined}
            className={`rh-panel${activeTab.framed === false ? " rh-panel--bare" : ""}`}
          >
            {activeTab.content}
          </section>
        </div>
      </main>
    </div>
  );
};

export default RoleHome;
