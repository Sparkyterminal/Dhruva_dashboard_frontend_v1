import { isExpenseReviewer } from "@/utils/expenseAccess";

/**
 * Who may open Employee Statistics: CA, Approver, Owner and the HR department (matched by department
 * name, never by e-mail). It reuses the reviewer rule today but has its own name so the two can
 * differ later. The backend applies the same rule (docs/api/employee-stats/EMPLOYEE_STATS_BACKEND.md);
 * this only decides what the screen and the menu show.
 */
export const canViewEmployeeStats = (user) => isExpenseReviewer(user);
