import React from "react";
import { ArrowLeft } from "lucide-react";
import "./PageKit.css";

/** Green page header: back pill, eyebrow, title, subtitle, and an actions slot on the right. */
export const PageHero = ({ eyebrow, title, subtitle, onBack, backLabel = "Back to home", children }) => (
  <header className="pk-hero">
    <div>
      {onBack ? (
        <button type="button" className="pk-back" onClick={onBack}>
          <ArrowLeft size={14} aria-hidden="true" /> {backLabel}
        </button>
      ) : null}
      {eyebrow ? <p className="pk-eyebrow">{eyebrow}</p> : null}
      <h1 className="pk-title">{title}</h1>
      {subtitle ? <p className="pk-sub">{subtitle}</p> : null}
    </div>
    {children ? <div className="pk-hero-actions">{children}</div> : null}
  </header>
);

/** One summary card. tone: "" (green) | "gold" | "red" | "blue". */
export const StatCard = ({ icon, label, value, tone = "" }) => (
  <div className={`pk-stat${tone ? ` is-${tone}` : ""}`}>
    <span className="pk-stat-icon">{icon}</span>
    <div>
      <p className="pk-stat-label">{label}</p>
      <p className="pk-stat-value">{value}</p>
    </div>
  </div>
);

export const StatRow = ({ children }) => (
  <section className="pk-stats" aria-label="Summary">
    {children}
  </section>
);

/** Search box that matches the page kit styling. */
export const SearchBox = ({ icon, value, onChange, placeholder, label = "Search" }) => (
  <label className="pk-search">
    {icon}
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label}
    />
  </label>
);

/** Segmented filter. options: { value, label, count? }[] */
export const Segmented = ({ options, value, onChange, label }) => (
  <div className="pk-seg" role="group" aria-label={label}>
    {options.map((o) => (
      <button
        key={String(o.value)}
        type="button"
        aria-pressed={value === o.value}
        onClick={() => onChange(o.value)}
      >
        {o.label}
        {o.count != null ? <span className="count">{o.count}</span> : null}
      </button>
    ))}
  </div>
);

export const EmptyState = ({ icon, title, hint }) => (
  <div className="pk-empty">
    {icon ? <span className="ring">{icon}</span> : null}
    <strong>{title}</strong>
    {hint ? <span>{hint}</span> : null}
  </div>
);
