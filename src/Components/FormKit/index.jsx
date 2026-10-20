import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Eye, EyeOff, X } from "lucide-react";
import "./FormKit.css";

/** Label + control + inline error. Used by every field below. */
const FieldShell = ({ id, label, required, error, hint, labelAction, children }) => (
  <div className={`fk-field${error ? " has-error" : ""}`}>
    {label ? (
      <div className="fk-label-row">
        <label className="fk-label" htmlFor={id}>
          {label}
          {required ? <span className="fk-req" aria-hidden="true"> *</span> : null}
        </label>
        {labelAction || null}
      </div>
    ) : null}
    {children}
    {error ? (
      <p className="fk-error" role="alert">
        {error}
      </p>
    ) : hint ? (
      <p className="fk-hint">{hint}</p>
    ) : null}
  </div>
);

export const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  hint,
  disabled,
  autoFocus,
  maxLength,
  type = "text",
  name,
}) => {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <input
        id={id}
        name={name}
        className="fk-input"
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
      />
    </FieldShell>
  );
};

/**
 * Searchable dropdown. options: { value, label }[]. Keyboard: arrows, Enter, Escape.
 * Typing filters the list; clicking outside closes it.
 */
export const SelectField = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  required,
  error,
  hint,
  disabled,
  loading,
  labelAction,
  onSearch,
  onOpen,
  allowClear,
  emptyText = "No matches",
}) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    if (onSearch) return options; // the parent filters on the server
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => String(o.label).toLowerCase().includes(q)) : options;
  }, [options, query, onSearch]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (opt) => {
    onChange(opt.value);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && filtered[active]) {
      e.preventDefault();
      choose(filtered[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint} labelAction={labelAction}>
      <div className="fk-select" ref={rootRef}>
        <input
          id={id}
          className="fk-input fk-select-input"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          placeholder={loading ? "Loading…" : selected ? selected.label : placeholder}
          value={open ? query : selected ? selected.label : ""}
          onFocus={() => {
            setOpen(true);
            setActive(Math.max(0, filtered.findIndex((o) => o.value === value)));
            onOpen?.();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
            onSearch?.(e.target.value);
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
        {allowClear && selected && !disabled ? (
          <button
            type="button"
            className="fk-select-clear"
            aria-label="Clear selection"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange("");
              setQuery("");
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
        <ChevronDown size={16} className="fk-select-caret" aria-hidden="true" />
        {open && (
          <ul className="fk-menu" id={`${id}-list`} role="listbox" ref={listRef}>
            {filtered.length === 0 ? (
              <li className="fk-menu-empty">{loading ? "Loading…" : emptyText}</li>
            ) : (
              filtered.map((o, i) => (
                <li
                  key={String(o.value)}
                  role="option"
                  aria-selected={o.value === value}
                  className={`fk-option${i === active ? " is-active" : ""}${o.value === value ? " is-selected" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(o);
                  }}
                >
                  <span>{o.label}</span>
                  {o.value === value ? <Check size={15} aria-hidden="true" /> : null}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </FieldShell>
  );
};

/** Cancel + primary action, right aligned. */
export const FormActions = ({
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  busy,
  busyLabel = "Saving…",
  disabled,
  onSubmit,
}) => (
  <div className="fk-actions">
    {onCancel ? (
      <button type="button" className="fk-btn" onClick={onCancel} disabled={busy}>
        {cancelLabel}
      </button>
    ) : null}
    <button
      type={onSubmit ? "button" : "submit"}
      className="fk-btn is-primary"
      onClick={onSubmit}
      disabled={busy || disabled}
    >
      {busy ? busyLabel : submitLabel}
    </button>
  </div>
);

/** Centered dialog with a dimmed backdrop. Closes on Escape or backdrop click. */
export const Dialog = ({ open, onClose, title, width = 460, children }) => {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fk-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        className="fk-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ maxWidth: width }}
      >
        <header className="fk-dialog-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="fk-close" aria-label="Close" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="fk-dialog-body">{children}</div>
      </div>
    </div>
  );
};

/** White card for full-page forms. */
export const FormCard = ({ children, onSubmit, width = 560 }) => (
  <form className="fk-card" style={{ maxWidth: width }} onSubmit={onSubmit} noValidate>
    {children}
  </form>
);

/** Text field with a show/hide toggle. */
export const PasswordField = ({ label, value, onChange, placeholder, required, error, hint, disabled }) => {
  const id = useId();
  const [shown, setShown] = useState(false);
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <div className="fk-password">
        <input
          id={id}
          className="fk-input"
          type={shown ? "text" : "password"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="new-password"
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className="fk-password-toggle"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
        >
          {shown ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
    </FieldShell>
  );
};

/** Pick several options; chosen ones show as removable chips. `value` is an array of option values. */
export const MultiSelectField = ({
  label,
  value = [],
  onChange,
  options = [],
  placeholder = "Select",
  required,
  error,
  hint,
  disabled,
  loading,
}) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const chosen = options.filter((o) => value.includes(o.value));
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => String(o.label).toLowerCase().includes(q)) : options;
  }, [options, query]);

  const toggle = (v) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <div className="fk-select" ref={rootRef}>
        <div
          className={`fk-input fk-multi${open ? " is-open" : ""}${disabled ? " is-disabled" : ""}`}
          onClick={() => !disabled && setOpen(true)}
        >
          {chosen.map((o) => (
            <span key={String(o.value)} className="fk-chip">
              {o.label}
              <button
                type="button"
                aria-label={`Remove ${o.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(o.value);
                }}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            id={id}
            className="fk-multi-input"
            value={query}
            disabled={disabled}
            placeholder={chosen.length ? "" : loading ? "Loading…" : placeholder}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !query && chosen.length) toggle(chosen[chosen.length - 1].value);
              if (e.key === "Escape") setOpen(false);
            }}
            autoComplete="off"
          />
        </div>
        <ChevronDown size={16} className="fk-select-caret" aria-hidden="true" />
        {open && (
          <ul className="fk-menu" role="listbox" aria-multiselectable="true">
            {shown.length === 0 ? (
              <li className="fk-menu-empty">{loading ? "Loading…" : "No matches"}</li>
            ) : (
              shown.map((o) => {
                const on = value.includes(o.value);
                return (
                  <li
                    key={String(o.value)}
                    role="option"
                    aria-selected={on}
                    className={`fk-option${on ? " is-selected" : ""}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggle(o.value);
                    }}
                  >
                    <span>{o.label}</span>
                    {on ? <Check size={15} aria-hidden="true" /> : null}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    </FieldShell>
  );
};

/** Multi-line text. */
export const TextAreaField = ({ label, value, onChange, placeholder, required, error, hint, disabled, rows = 3, maxLength }) => {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <textarea
        id={id}
        className="fk-input fk-textarea"
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
      />
    </FieldShell>
  );
};

/** Native date picker. value / onChange use "YYYY-MM-DD" (empty string when unset). */
export const DateField = ({ label, value, onChange, required, error, hint, disabled, min }) => {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <input
        id={id}
        className="fk-input"
        type="date"
        value={value ?? ""}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={Boolean(error)}
      />
    </FieldShell>
  );
};

/** Rupee amount with Indian digit grouping. value is a number or "" . */
export const AmountField = ({ label, value, onChange, placeholder, required, error, hint, disabled }) => {
  const id = useId();
  const grouped = (n) => {
    if (n === "" || n == null) return "";
    const [int, frac] = String(n).split(".");
    const last3 = int.slice(-3);
    const rest = int.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return (rest ? rest + "," : "") + last3 + (frac !== undefined ? "." + frac : "");
  };
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <div className="fk-amount">
        <span className="fk-amount-sign" aria-hidden="true">₹</span>
        <input
          id={id}
          className="fk-input"
          inputMode="decimal"
          value={grouped(value)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.]/g, "");
            const parts = raw.split(".");
            const clean = parts.length > 1 ? parts[0] + "." + parts.slice(1).join("").slice(0, 2) : parts[0];
            onChange(clean === "" ? "" : clean);
          }}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
        />
      </div>
    </FieldShell>
  );
};

/** A few big buttons to choose one value. options: { value, label, tone? ("red" | "gold" | "green") }[] */
export const ChoiceField = ({ label, value, onChange, options, required, error, hint }) => {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <div className="fk-choices" role="radiogroup" aria-labelledby={id}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={`fk-choice${o.tone ? ` is-${o.tone}` : ""}${value === o.value ? " is-on" : ""}`}
            onClick={() => onChange(o.value)}
          >
            {o.tone ? <i aria-hidden="true" /> : null}
            {o.label}
          </button>
        ))}
      </div>
    </FieldShell>
  );
};

/** Link-style button for the label row, e.g. "+ Add vendor". */
export const LabelAction = ({ onClick, children }) => (
  <button type="button" className="fk-label-action" onClick={onClick}>
    {children}
  </button>
);

/** Right-hand slide-in panel for add / edit forms. Closes on Escape or backdrop click. */
export const Drawer = ({ open, onClose, title, subtitle, width = 520, children }) => {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fk-drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <aside className="fk-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId} style={{ width }}>
        <header className="fk-drawer-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="fk-close" aria-label="Close" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="fk-drawer-body">{children}</div>
      </aside>
    </div>
  );
};
