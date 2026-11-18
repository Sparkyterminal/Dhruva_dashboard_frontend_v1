import React, { useState } from "react";
import { Pencil, Plus, Power } from "lucide-react";
import { toast } from "@/Components/AdminKit/toast";
import { TextField } from "@/Components/FormKit";
import CategoryDialog from "./CategoryDialog";
import { conditionTags, describeRule, groupCategories } from "./categoryText";
import { saveSettings, updateCategory } from "./everydayApi";
import "./Everyday.css";

/** Management sets the categories, the standard rates and the claim rules here. */
const CategoriesTab = ({ categories, me, authHeaders, onChanged }) => {
  const [dialog, setDialog] = useState({ open: false, category: null });
  const [rules, setRules] = useState(() => ({
    claimWindowDays: me?.settings?.claimWindowDays ?? 7,
    maxBillFiles: me?.settings?.maxBillFiles ?? 5,
    maxBillSizeMB: me?.settings?.maxBillSizeMB ?? 10,
  }));
  const [savingRules, setSavingRules] = useState(false);

  const groups = groupCategories(categories);
  const groupNames = groups.map((g) => g.group);

  const toggleActive = async (c) => {
    try {
      await updateCategory({ id: c._id, payload: { ...c, active: !c.active }, authHeaders });
      toast.success(c.active ? `${c.name} switched off` : `${c.name} switched on`);
      onChanged();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not change the category");
    }
  };

  const saveRules = async (e) => {
    e.preventDefault();
    const payload = {
      claimWindowDays: Number(rules.claimWindowDays),
      maxBillFiles: Number(rules.maxBillFiles),
      maxBillSizeMB: Number(rules.maxBillSizeMB),
    };
    if (Object.values(payload).some((v) => !Number.isInteger(v) || v < 1)) return toast.error("Enter whole numbers, 1 or more");
    setSavingRules(true);
    try {
      await saveSettings({ payload, authHeaders });
      toast.success("Rules saved");
      onChanged();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save the rules");
    } finally {
      setSavingRules(false);
    }
  };

  return (
    <div className="ee-tab">
      <div className="ee-toolbar">
        <p className="ee-muted">These are the standard rates everyone is paid by. Changes apply to new expenses only.</p>
        <button type="button" className="ee-add" onClick={() => setDialog({ open: true, category: null })}>
          <Plus size={16} strokeWidth={2.4} aria-hidden="true" /> Add category
        </button>
      </div>

      <div className="ee-rate-grid">
        {groups.map(({ group, items }) => (
          <section key={group} className="ee-rate">
            <h3>{group}</h3>
            {items.map((c) => (
              <div key={c._id} className={`ee-rate-row${c.active === false ? " is-off" : ""}`}>
                <div>
                  <strong>
                    {c.name}
                    {c.active === false ? <span className="ee-off">Off</span> : null}
                  </strong>
                  <span>{describeRule(c)}</span>
                  <div className="ee-tags">
                    {conditionTags(c).map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className="ee-row-actions">
                  <button type="button" aria-label={`Edit ${c.name}`} onClick={() => setDialog({ open: true, category: c })}>
                    <Pencil size={14} aria-hidden="true" /> Edit
                  </button>
                  <button type="button" aria-label={`${c.active === false ? "Switch on" : "Switch off"} ${c.name}`} onClick={() => toggleActive(c)}>
                    <Power size={14} aria-hidden="true" /> {c.active === false ? "Switch on" : "Switch off"}
                  </button>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>

      <form className="ee-rate ee-settings" onSubmit={saveRules} noValidate>
        <h3>Rules for everyone</h3>
        <div className="ee-settings-grid">
          <TextField label="Days back an expense can be added" type="number" value={rules.claimWindowDays} onChange={(v) => setRules((r) => ({ ...r, claimWindowDays: v }))} />
          <TextField label="Bill files per expense" type="number" value={rules.maxBillFiles} onChange={(v) => setRules((r) => ({ ...r, maxBillFiles: v }))} />
          <TextField label="Largest PDF (MB)" type="number" value={rules.maxBillSizeMB} onChange={(v) => setRules((r) => ({ ...r, maxBillSizeMB: v }))} />
        </div>
        <button type="submit" className="ee-add" disabled={savingRules}>
          {savingRules ? "Saving…" : "Save rules"}
        </button>
      </form>

      <CategoryDialog
        open={dialog.open}
        category={dialog.category}
        groups={groupNames}
        authHeaders={authHeaders}
        onClose={() => setDialog({ open: false, category: null })}
        onSaved={(wasEdit) => {
          setDialog({ open: false, category: null });
          toast.success(wasEdit ? "Category updated" : "Category added");
          onChanged();
        }}
      />
    </div>
  );
};

export default CategoriesTab;
