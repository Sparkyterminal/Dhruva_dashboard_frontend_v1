import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SearchBox } from "@/Components/PageKit";
import { toast } from "@/Components/AdminKit/toast";
import { fetchPeople, saveGrades } from "./everydayApi";
import { DEFAULT_GRADE, GRADES, GRADE_KEYS } from "./everydayRules";
import "./Everyday.css";

/** Management gives each person a grade. It decides their hotel limit and travel class. */
const PeopleTab = ({ authHeaders }) => {
  const [people, setPeople] = useState([]);
  const [changes, setChanges] = useState({}); // userId -> new grade
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setPeople((await fetchPeople({ authHeaders }))?.people || []);
      setChanges({});
    } catch {
      toast.error("Could not load the list of people");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? people.filter((p) => `${p.name} ${(p.departments || []).join(" ")}`.toLowerCase().includes(q)) : people;
  }, [people, query]);

  const dirty = Object.keys(changes).length;

  const save = async () => {
    setSaving(true);
    try {
      await saveGrades({ grades: Object.entries(changes).map(([userId, grade]) => ({ userId, grade })), authHeaders });
      toast.success(`${dirty} grade${dirty === 1 ? "" : "s"} saved`);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save the grades");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ee-tab">
      <div className="ee-toolbar">
        <SearchBox icon={<Search size={16} aria-hidden="true" />} value={query} onChange={setQuery} placeholder="Search by name or department" />
        <button type="button" className="ee-add" disabled={dirty === 0 || saving} onClick={save}>
          {saving ? "Saving…" : dirty ? `Save ${dirty} change${dirty === 1 ? "" : "s"}` : "Save changes"}
        </button>
      </div>
      <p className="ee-muted">Anyone without a grade is treated as Junior Staff.</p>

      <div className="ee-scroll">
        <table className="ee-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="ee-muted">
                  Loading…
                </td>
              </tr>
            ) : shown.length === 0 ? (
              <tr>
                <td colSpan={3} className="ee-muted">
                  No people found.
                </td>
              </tr>
            ) : (
              shown.map((p) => {
                const value = changes[p.userId] ?? p.grade ?? DEFAULT_GRADE;
                return (
                  <tr key={p.userId} className={changes[p.userId] ? "is-changed" : ""}>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td>{(p.departments || []).join(", ") || p.role || "-"}</td>
                    <td>
                      <select
                        className="fk-input ee-select"
                        aria-label={`Grade for ${p.name}`}
                        value={value}
                        onChange={(e) =>
                          setChanges((c) => {
                            const next = { ...c };
                            if (e.target.value === (p.grade ?? DEFAULT_GRADE)) delete next[p.userId];
                            else next[p.userId] = e.target.value;
                            return next;
                          })
                        }
                      >
                        {GRADE_KEYS.map((g) => (
                          <option key={g} value={g}>
                            {GRADES[g]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PeopleTab;
