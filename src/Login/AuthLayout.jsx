import React from "react";
import BrandMark from "../Components/BrandMark";
import "./AuthLayout.css";

/** Brand panel + form panel used by sign-in and change-password. */
const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="auth-shell">
    <aside className="auth-brand">
      <div className="auth-brand-mark">
        <BrandMark markSize={64} wordSize={46} />
      </div>
      <p className="auth-tagline">Bookings, events and accounts, in one place.</p>
      <div className="auth-garland" aria-hidden="true" />
    </aside>

    <main className="auth-panel">
      <div className="auth-card">
        <h1 className="auth-title">{title}</h1>
        {subtitle ? <p className="auth-sub">{subtitle}</p> : null}
        {children}
        {footer ? <p className="auth-foot">{footer}</p> : null}
      </div>
    </main>
  </div>
);

export default AuthLayout;
