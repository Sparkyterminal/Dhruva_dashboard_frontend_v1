import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { House, KeyRound, LogOut, Menu, X } from "lucide-react";
import { ROLES } from "../../config/config";
import { logout } from "../../reducers/users";
import { getNavItems, groupNavItems } from "../../config/roleNav";
import "../RoleHome/RoleHome.css";
import "./AppMenu.css";

const DOCK_QUERY = "(min-width: 1024px)";

const matchesDock = () =>
  typeof window !== "undefined" && window.matchMedia(DOCK_QUERY).matches;

/**
 * Site-wide navigation. A big hamburger sits at the top-left of every page; it opens a
 * green drawer that floats above the page. On the home page (desktop) the drawer starts
 * open and docked beside the content. The X closes it and leaves just the hamburger.
 * Rendered once, outside the routes, so every page gets it.
 */
const AppMenu = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const user = useSelector((state) => state.user.value);

  const visible =
    Boolean(user?.is_logged_in && user?.access_token) &&
    user?.role !== ROLES.ADMIN &&
    pathname !== "/login";
  const isHome = pathname === "/user";

  const [wide, setWide] = useState(matchesDock);
  const [open, setOpen] = useState(isHome && matchesDock());
  const panelRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia(DOCK_QUERY);
    const onChange = (e) => setWide(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Home opens the menu by default; every other page starts with it closed.
  useEffect(() => {
    setOpen(isHome && matchesDock());
  }, [pathname, isHome]);

  const docked = visible && open && isHome && wide;
  const overlay = visible && open && !docked;

  // Tell the page layout how much room the menu takes (see AppMenu.css).
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("am-has-menu", visible);
    root.classList.toggle("am-docked", docked);
    return () => root.classList.remove("am-has-menu", "am-docked");
  }, [visible, docked]);

  useEffect(() => {
    if (!overlay) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay]);

  if (!visible) return null;

  const sections = groupNavItems(getNavItems(user));

  const handleSignOut = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          className="am-burger"
          aria-label="Open menu"
          aria-expanded="false"
          onClick={() => setOpen(true)}
        >
          <Menu size={26} strokeWidth={2.2} aria-hidden="true" />
        </button>
      )}

      {overlay && <div className="am-mask" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside
        ref={panelRef}
        tabIndex={-1}
        className={`am-panel${open ? " is-open" : ""}${docked ? " is-docked" : ""}`}
        aria-label="Main menu"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="am-panel-head">
          <span className="am-panel-title">Menu</span>
          <button type="button" className="am-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X size={22} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        <div className="rh-rail-inner am-panel-body">
          <nav aria-label="Main">
            <ul className="rh-nav">
              <li>
                <NavLink to="/user" end className="rh-link">
                  <House aria-hidden="true" />
                  Home
                </NavLink>
              </li>
            </ul>
            {sections.map((section) => (
              <div className="am-section" key={section.title}>
                <h3 className="am-heading">{section.title}</h3>
                <ul className="rh-nav">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.route + item.label}>
                        <NavLink to={item.route} className="rh-link">
                          <Icon aria-hidden="true" />
                          {item.label}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="rh-user">
            <h3 className="am-heading">Account</h3>
            <button
              type="button"
              className="rh-link rh-link-quiet"
              onClick={() => navigate("/user/changepassword")}
            >
              <KeyRound aria-hidden="true" />
              Change password
            </button>
            <button type="button" className="rh-link rh-link-quiet am-signout" onClick={handleSignOut}>
              <LogOut aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppMenu;
