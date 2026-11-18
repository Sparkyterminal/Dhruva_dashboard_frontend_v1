import { ROLES } from "@/config/config";

/** Department names whose members are expense reviewers (matched by name, never by e-mail). */
export const HR_DEPARTMENT_NAMES = ["HR", "HR DEPARTMENT"];

const normalise = (name) => String(name || "").trim().replace(/\s+/g, " ").toUpperCase();

/**
 * CA, Approver, Owner and anyone in the HR department can see everyone's Everyday Expenses,
 * set the categories and rates, reject and mark repayments. The backend applies the same rule;
 * this only decides what the screen shows. See docs/api/everyday-expenses/EVERYDAY_EXPENSES_BACKEND.md.
 */
export const isExpenseReviewer = (user) =>
  [ROLES.CA, ROLES.APPROVER, ROLES.OWNER].includes(user?.role) ||
  (user?.departments || []).some((d) => HR_DEPARTMENT_NAMES.includes(normalise(d?.name)));
