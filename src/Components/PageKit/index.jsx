import React, { useEffect, useId, useRef } from "react";
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

/**
 * Tab bar that scrolls sideways when the tabs do not fit (no "..." menu), by touch, scrollbar,
 * trackpad or mouse wheel. items: { key, label, children }[]. A pane stays mounted once opened,
 * so its state survives switching tabs. Keyboard: arrow keys, Home and End.
 */
export const ScrollTabs = ({ items, activeKey, onChange, className = "", ariaLabel = "Sections" }) => {
  const baseId = useId();
  const navRef = useRef(null);
  const opened = useRef(new Set());
  opened.current.add(activeKey);

  // Keep the active tab fully inside the visible part of the bar.
  useEffect(() => {
    const nav = navRef.current;
    const tab = nav?.querySelector('[aria-selected="true"]');
    if (!nav || !tab) return;
    const left = tab.offsetLeft - nav.offsetLeft;
    if (left < nav.scrollLeft) nav.scrollLeft = left - 14;
    else if (left + tab.offsetWidth > nav.scrollLeft + nav.clientWidth) {
      nav.scrollLeft = left + tab.offsetWidth - nav.clientWidth + 14;
    }
  }, [activeKey]);

  // A normal (vertical) mouse wheel over the bar scrolls it sideways.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = nav.scrollWidth - nav.clientWidth;
      const canScroll = e.deltaY > 0 ? nav.scrollLeft < max : nav.scrollLeft > 0;
      if (max <= 0 || !canScroll) return;
      e.preventDefault();
      nav.scrollLeft += e.deltaY;
    };
    nav.addEventListener("wheel", onWheel, { passive: false });
    return () => nav.removeEventListener("wheel", onWheel);
  }, []);

  const onKeyDown = (e) => {
    const index = items.findIndex((it) => it.key === activeKey);
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(items[next].key);
    navRef.current?.querySelectorAll('[role="tab"]')[next]?.focus();
  };

  return (
    <div className={`pk-tabs ${className}`.trim()}>
      <div className="pk-tabs-nav" role="tablist" aria-label={ariaLabel} ref={navRef} onKeyDown={onKeyDown}>
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            role="tab"
            id={`${baseId}-tab-${it.key}`}
            aria-selected={it.key === activeKey}
            aria-controls={`${baseId}-pane-${it.key}`}
            tabIndex={it.key === activeKey ? 0 : -1}
            className="pk-tabs-tab"
            onClick={() => onChange(it.key)}
          >
            {it.label}
          </button>
        ))}
      </div>
      {items
        .filter((it) => opened.current.has(it.key))
        .map((it) => (
          <div
            key={it.key}
            role="tabpanel"
            id={`${baseId}-pane-${it.key}`}
            aria-labelledby={`${baseId}-tab-${it.key}`}
            className="pk-tabs-pane"
            hidden={it.key !== activeKey}
          >
            {it.children}
          </div>
        ))}
    </div>
  );
};
