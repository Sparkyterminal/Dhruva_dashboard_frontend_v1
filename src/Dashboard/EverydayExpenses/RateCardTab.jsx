import React from "react";
import { Ban, Clock, FileCheck2 } from "lucide-react";
import { GRADES } from "./everydayRules";
import { NOT_REIMBURSABLE, conditionTags, describeRule, groupCategories } from "./categoryText";
import "./Everyday.css";

/** What the company reimburses, in plain words. Read-only for everyone; reviewers edit it in "Categories & rates". */
const RateCardTab = ({ categories, me }) => {
  const groups = groupCategories(categories.filter((c) => c.active !== false));
  const claimDays = me?.settings?.claimWindowDays ?? 7;

  return (
    <div className="ee-tab">
      <div className="ee-rules">
        <div>
          <Clock size={18} aria-hidden="true" />
          <p>
            <strong>Add it the same day.</strong> You can edit or delete an expense until 12:00 am tonight. After
            that it is locked for good. You can add expenses from the last {claimDays} days.
          </p>
        </div>
        <div>
          <FileCheck2 size={18} aria-hidden="true" />
          <p>
            <strong>Attach the bill.</strong> Claims without a bill can be rejected. Your grade:{" "}
            <b>{GRADES[me?.grade] || GRADES.JUNIOR_STAFF}</b>.
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="ee-muted">No categories have been set up yet.</p>
      ) : (
        <div className="ee-rate-grid">
          {groups.map(({ group, items }) => (
            <section key={group} className="ee-rate">
              <h3>{group}</h3>
              {items.map((c) => (
                <div key={c._id} className="ee-rate-row">
                  <div>
                    <strong>{c.name}</strong>
                    <span>{describeRule(c)}</span>
                    {c.guidance ? <em>{c.guidance}</em> : null}
                  </div>
                  <div className="ee-tags">
                    {conditionTags(c).map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      <section className="ee-rate ee-no">
        <h3>
          <Ban size={16} aria-hidden="true" /> Not reimbursed
        </h3>
        <ul>
          {NOT_REIMBURSABLE.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default RateCardTab;
