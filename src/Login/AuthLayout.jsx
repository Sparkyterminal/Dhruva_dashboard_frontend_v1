import React from "react";
import { CalendarCheck, ShieldCheck, Wallet } from "lucide-react";
import "./AuthLayout.css";

const POINTS = [
  { icon: CalendarCheck, title: "Bookings & events", text: "Every enquiry, booking and calendar in one view." },
  { icon: Wallet, title: "Accounts", text: "Payments, advances, expenses and reports kept in step." },
  { icon: ShieldCheck, title: "Role based access", text: "Everyone sees only the work that is theirs." },
];

/** Brand panel + form panel used by sign-in and change-password. */
const AuthLayout = ({ title, subtitle, icon: Icon, children, footer }) => (
  <div className="auth-shell">
    <aside className="auth-brand">
      <span className="auth-ring is-a" aria-hidden="true" />
      <span className="auth-ring is-b" aria-hidden="true" />

      <div className="auth-brand-inner">
        <p className="auth-eyebrow">Welcome</p>
        <p className="auth-tagline">Bookings, events and accounts, in one place.</p>

        <ul className="auth-points">
          {POINTS.map((point) => (
            <li key={point.title}>
              <span className="auth-point-icon">
                <point.icon size={18} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <strong>{point.title}</strong>
                <span>{point.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="auth-garland" aria-hidden="true" />
    </aside>

    <main className="auth-panel">
      <div className="auth-card">
        {Icon ? (
          <span className="auth-badge">
            <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
          </span>
        ) : null}
        <h1 className="auth-title">{title}</h1>
        {subtitle ? <p className="auth-sub">{subtitle}</p> : null}
        {children}
        {footer ? <p className="auth-foot">{footer}</p> : null}
      </div>
    </main>
  </div>
);

export default AuthLayout;
