import { GRADES, GRADE_KEYS, formatMoney } from "./everydayRules";

/** One line saying how a category is reimbursed ("₹5 per km", "Actual, up to ₹600 per day"). */
export const describeRule = (c) => {
  const unit = c.unitLabel || "unit";
  switch (c.calcType) {
    case "PER_UNIT":
      return `${formatMoney(c.rate)} per ${unit}`;
    case "CAPPED_PER_UNIT":
      if (c.capByGrade) {
        const parts = GRADE_KEYS.filter((g) => c.capByGrade[g] > 0).map((g) => `${GRADES[g]} ${formatMoney(c.capByGrade[g])}`);
        return `Actual, up to a limit per ${unit}: ${parts.join(" · ")}`;
      }
      return `Actual, up to ${formatMoney(c.cap)} per ${unit}`;
    case "FIXED_MAX":
      return `Actual, up to ${formatMoney(c.cap)}${c.maxClaimsPerDay === 1 ? " per day" : " per claim"}`;
    default:
      return c.cap > 0 ? `Actual, up to ${formatMoney(c.cap)}` : "Actual amount";
  }
};

/** Short condition tags shown next to a category. */
export const conditionTags = (c) => {
  const tags = [];
  tags.push(c.requiresBill ? "Bill required" : "Bill optional");
  if (c.afterTime) tags.push(`Only if duty ends after ${c.afterTime}`);
  if (c.maxClaimsPerDay) tags.push(`${c.maxClaimsPerDay} claim per day`);
  if (c.companyProvidedZero) tags.push("Nothing if arranged by company");
  if (c.approvalAbove) tags.push(`Prior approval above ${formatMoney(c.approvalAbove)}`);
  return tags;
};

/** Policy section 12: shown on the Rate card so nobody tries to claim these. */
export const NOT_REIMBURSABLE = [
  "Personal purchases",
  "Alcohol and tobacco products",
  "Traffic fines and penalties",
  "Personal entertainment",
  "Expenses of family members or friends",
  "Unauthorized expenses",
  "Vehicle services",
  "Loss of personal belongings",
  "Hotel minibar, alcohol, laundry, spa, personal guest or entertainment charges",
];

/** Groups categories for display, keeping the order they come in. */
export const groupCategories = (categories) => {
  const map = new Map();
  [...categories]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .forEach((c) => {
      const key = c.group || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    });
  return [...map.entries()].map(([group, items]) => ({ group, items }));
};
