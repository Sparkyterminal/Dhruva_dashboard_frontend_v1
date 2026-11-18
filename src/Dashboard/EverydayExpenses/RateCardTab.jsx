import React from "react";
import { Ban, Clock, FileCheck2, X } from "lucide-react";
import { DEFAULT_GRADE, GRADES, formatMoney } from "./everydayRules";
import { NOT_REIMBURSABLE, conditionChips, gradeLimits, groupCategories, groupLook, headline } from "./categoryText";
import "./Everyday.css";

/** What the company reimburses, in plain words. Read-only for everyone; reviewers edit it in "Categories & rates". */
const RateCardTab = ({ categories, me }) => {
  const groups = groupCategories(categories.filter((c) => c.active !== false));
  const claimDays = me?.settings?.claimWindowDays ?? 7;
  const grade = me?.grade || DEFAULT_GRADE;

  return (
    <div className="ee-tab">
      <div className="ee-rc-intro">
        <div className="ee-rc-note is-time">
          <span className="ee-rc-note-icon">
            <Clock size={22} aria-hidden="true" />
          </span>
          <p>
            <strong>Add it the same day</strong>
            You can edit or delete an expense until <b>12:00 am tonight</b>. After that it is locked. You can add
            expenses from the last {claimDays} days.
          </p>
        </div>
        <div className="ee-rc-note is-bill">
          <span className="ee-rc-note-icon">
            <FileCheck2 size={22} aria-hidden="true" />
          </span>
          <p>
            <strong>Attach the bill</strong>
            Claims without a bill can be rejected. Your grade: <b>{GRADES[grade]}</b>.
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="ee-muted">No categories have been set up yet.</p>
      ) : (
        <div className="ee-rc-grid">
          {groups.map(({ group, items }) => {
            const { Icon, color } = groupLook(group);
            return (
              <section
                key={group}
                className="ee-rc-card"
                style={{ "--accent": color.accent, "--dark": color.dark, "--tint": color.tint }}
              >
                <header>
                  <span className="ee-rc-icon">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h3>{group}</h3>
                  <span className="ee-rc-count">{items.length}</span>
                </header>

                {items.map((c) => {
                  const big = headline(c, grade);
                  const limits = gradeLimits(c);
                  return (
                    <div key={c._id} className="ee-rc-row">
                      <div className="ee-rc-top">
                        <div className="ee-rc-name">
                          <strong>{c.name}</strong>
                          {c.guidance ? <span>{c.guidance}</span> : null}
                        </div>
                        <div className="ee-rc-big">
                          <b className={big.range ? "is-range" : ""}>{big.value}</b>
                          <span>{big.unit}</span>
                        </div>
                      </div>

                      {limits.length > 0 ? (
                        <>
                          <p className="ee-rc-hint">Limit for each grade. Use the one that applies to you.</p>
                          <div className="ee-rc-grades" role="list" aria-label="Limit for each grade">
                            {limits.map((g) => (
                              <div key={g.grade} role="listitem">
                                <span>{g.label}</span>
                                <b>{formatMoney(g.amount)}</b>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : null}

                      <ul className="ee-rc-chips">
                        {conditionChips(c).map((chip) => (
                          <li key={chip.text}>
                            <chip.Icon size={13} aria-hidden="true" /> {chip.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}

      <section className="ee-rc-no">
        <h3>
          <Ban size={20} aria-hidden="true" /> Not reimbursed
        </h3>
        <ul>
          {NOT_REIMBURSABLE.map((t) => (
            <li key={t}>
              <X size={14} aria-hidden="true" /> {t}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default RateCardTab;
