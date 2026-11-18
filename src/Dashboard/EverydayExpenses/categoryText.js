import {
  Bed,
  Bike,
  Bus,
  CalendarCheck,
  CalendarDays,
  Car,
  Moon,
  Plane,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Tag,
  UtensilsCrossed,
  UserX,
} from "lucide-react";
import { GRADES, GRADE_KEYS, DEFAULT_GRADE, formatMoney, limitFor } from "./everydayRules";

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

/** Short condition tags (plain text, used on the Categories & rates tab). */
export const conditionTags = (c) => {
  const tags = [];
  tags.push(c.requiresBill ? "Bill required" : "Bill optional");
  if (c.afterTime) tags.push(`Only if duty ends after ${c.afterTime}`);
  if (c.maxClaimsPerDay) tags.push(`${c.maxClaimsPerDay} claim per day`);
  if (c.companyProvidedZero) tags.push("Nothing if arranged by company");
  if (c.approvalAbove) tags.push(`Prior approval above ${formatMoney(c.approvalAbove)}`);
  return tags;
};

/** The same conditions with an icon each, for the Rate card. */
export const conditionChips = (c) => {
  const chips = [{ Icon: Receipt, text: c.requiresBill ? "Bill required" : "Bill optional" }];
  if (c.afterTime) chips.push({ Icon: Moon, text: `Duty must end after ${c.afterTime}` });
  if (c.maxClaimsPerDay) chips.push({ Icon: CalendarCheck, text: `${c.maxClaimsPerDay} claim per day` });
  if (c.companyProvidedZero) chips.push({ Icon: UserX, text: "Nothing if arranged by company" });
  if (c.approvalAbove) chips.push({ Icon: ShieldCheck, text: `Prior approval above ${formatMoney(c.approvalAbove)}` });
  return chips;
};

/**
 * The big number shown for a category: { value, unit, note }.
 * For limits that depend on grade it shows the viewer's own grade.
 */
export const headline = (c, grade = DEFAULT_GRADE) => {
  const unit = c.unitLabel || "unit";
  switch (c.calcType) {
    case "PER_UNIT":
      return { value: formatMoney(c.rate), unit: `per ${unit}`, note: null };
    case "CAPPED_PER_UNIT": {
      // A limit that differs by grade is shown as a range; people find their own grade in the list below it.
      const caps = c.capByGrade ? GRADE_KEYS.map((g) => c.capByGrade[g]).filter((v) => v > 0) : [];
      const low = Math.min(...caps);
      const high = Math.max(...caps);
      if (caps.length > 1 && low !== high) {
        return { value: `${formatMoney(low)} – ${formatMoney(high)}`, unit: `max per ${unit}, by grade`, note: null, range: true };
      }
      const limit = limitFor(c, grade);
      return {
        value: limit != null ? formatMoney(limit) : "Actual",
        unit: limit != null ? `max per ${unit}` : "what you spent",
        note: null,
      };
    }
    case "FIXED_MAX":
      return { value: formatMoney(c.cap), unit: c.maxClaimsPerDay === 1 ? "max per day" : "max per claim", note: null };
    default:
      return c.cap > 0
        ? { value: formatMoney(c.cap), unit: "max", note: null }
        : { value: "Actual", unit: "what you spent", note: null };
  }
};

/** Grades with their limit for categories that have one per grade ([] otherwise). */
export const gradeLimits = (c) =>
  c.capByGrade ? GRADE_KEYS.filter((g) => c.capByGrade[g] > 0).map((g) => ({ grade: g, label: GRADES[g], amount: c.capByGrade[g] })) : [];

// Colours stay inside the brand family (greens, gold, warm clay). `dark` is for text, `tint` for backgrounds.
const PALETTE = [
  { accent: "#b5562b", dark: "#8f3f1c", tint: "#fbece5" }, // clay
  { accent: "#2f8a4b", dark: "#1f6a38", tint: "#e6f3ea" }, // leaf
  { accent: "#c4a747", dark: "#7a6220", tint: "#fbf6e3" }, // gold
  { accent: "#17542a", dark: "#0b3d0b", tint: "#e4eee6" }, // forest
  { accent: "#7a8f3a", dark: "#55672a", tint: "#eff3e2" }, // olive
  { accent: "#d08b2a", dark: "#8a5a10", tint: "#fcf0dc" }, // amber
];

const GROUP_LOOK = {
  Food: { Icon: UtensilsCrossed, color: PALETTE[0] },
  "Local travel": { Icon: Bus, color: PALETTE[1] },
  Mileage: { Icon: Bike, color: PALETTE[2] },
  Outstation: { Icon: Plane, color: PALETTE[3] },
  Accommodation: { Icon: Bed, color: PALETTE[4] },
  "Daily allowance": { Icon: CalendarDays, color: PALETTE[5] },
  "Event purchases": { Icon: ShoppingBag, color: PALETTE[0] },
};
const FALLBACK_ICONS = [Car, Tag];

/** Icon and colours for a group; groups management adds later get a stable colour of their own. */
export const groupLook = (group) => {
  if (GROUP_LOOK[group]) return GROUP_LOOK[group];
  const hash = [...String(group)].reduce((t, ch) => t + ch.charCodeAt(0), 0);
  return { Icon: FALLBACK_ICONS[hash % FALLBACK_ICONS.length], color: PALETTE[hash % PALETTE.length] };
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
