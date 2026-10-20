import {
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChartColumn,
  ClipboardList,
  FilePlus2,
  Hourglass,
  Layers,
  ListChecks,
  MapPin,
  ReceiptText,
  Store,
  Target,
  Trophy,
  Wallet,
} from "lucide-react";
import { ROLES } from "./config";

const ACCOUNTS_NAV = [
  { label: "Daily Expenses", route: "/user/daily-expenses", icon: Wallet, section: "Accounts & Finance" },
  { label: "Add Requirement", route: "/user/sendrequest", icon: FilePlus2, section: "Requests" },
  { label: "EMI's and Interest", route: "/user/viewbills", icon: ReceiptText, section: "Accounts & Finance" },
  { label: "View Vendors", route: "/user/viewvendors", icon: Store, section: "Master Data" },
  { label: "View Daybook", route: "/user/daybook", icon: BookOpen, section: "Accounts & Finance" },
  { label: "Departments", route: "/user/departments", icon: Building2, section: "Master Data" },
  { label: "Client Bookings", route: "/user/viewclientbookings", icon: CalendarCheck, section: "Bookings & Events" },
  { label: "Checklists", route: "/user/checklists", icon: ListChecks, section: "Bookings & Events" },
  { label: "Budget Report", route: "/user/budgetreport/eventwise", icon: ChartColumn, section: "Accounts & Finance" },
  { label: "Leads Tracker", route: "/user/client-leads", icon: Target, section: "Leads" },
];

const MARKETING_NAV = [
  { label: "Add Requirement", route: "/user/sendrequest", icon: FilePlus2, section: "Requests" },
  { label: "Client Bookings", route: "/user/viewclient", icon: CalendarCheck, section: "Bookings & Events" },
  { label: "Events Masterdata", route: "/user/viewevents", icon: Layers, section: "Master Data" },
  { label: "Venue Masterdata", route: "/user/viewvenue", icon: MapPin, section: "Master Data" },
  { label: "Confirmed Events", route: "/user/confirmed-events", icon: BadgeCheck, section: "Bookings & Events" },
  { label: "In Progress Events", route: "/user/inprogress-events", icon: Hourglass, section: "Bookings & Events" },
  { label: "Track Leads", route: "/user/client-leads", icon: Target, section: "Leads" },
  { label: "View Vendors", route: "/user/viewvendors", icon: Store, section: "Master Data" },
  { label: "Checklists", route: "/user/checklists", icon: ListChecks, section: "Bookings & Events" },
  { label: "Budget Report", route: "/user/budgetreport/eventwise", icon: ChartColumn, section: "Accounts & Finance" },
];

const DEPARTMENT_NAV = [
  { label: "Add Requirement", route: "/user/sendrequest", icon: FilePlus2, section: "Requests" },
  { label: "Confirmed Events", route: "/user/confirmed-events", icon: BadgeCheck, section: "Bookings & Events" },
  { label: "In Progress Events", route: "/user/inprogress-events", icon: Hourglass, section: "Bookings & Events" },
  { label: "Checklists", route: "/user/checklists", icon: ListChecks, section: "Bookings & Events" },
  { label: "View Vendors", route: "/user/viewvendors", icon: Store, section: "Master Data" },
  { label: "LeaderBoard", route: "/user/leaderboard", icon: Trophy, section: "Bookings & Events" },
  { label: "Lead Calendar", route: "/user/client-leads", icon: CalendarDays, section: "Bookings & Events" },
  { label: "Bookings Calendar", route: "/user/confirmed-events", icon: CalendarRange, section: "Bookings & Events" },
];

const OWNER_NAV = [
  { label: "Daily Expense", route: "/user/daily-expenses", icon: Wallet, section: "Accounts & Finance" },
  { label: "Requirements", route: "/user/allrequirements", icon: ClipboardList, section: "Requests" },
  { label: "Daybook", route: "/user/daybook", icon: BookOpen, section: "Accounts & Finance" },
  { label: "Vendors", route: "/user/viewvendors", icon: Store, section: "Master Data" },
  { label: "Client Bookings", route: "/user/viewclientbookings", icon: CalendarCheck, section: "Bookings & Events" },
  { label: "Bills", route: "/user/viewbills", icon: ReceiptText, section: "Accounts & Finance" },
  { label: "Checklists", route: "/user/checklists", icon: ListChecks, section: "Bookings & Events" },
  { label: "Departments", route: "/user/departments", icon: Building2, section: "Master Data" },
  { label: "Budget Report", route: "/user/budgetreport/eventwise", icon: ChartColumn, section: "Accounts & Finance" },
  { label: "Leads Tracker", route: "/user/client-leads", icon: Target, section: "Leads" },
];

const APPROVER_NAV = [
  { label: "Daily Expense", route: "/user/daily-expenses", icon: Wallet, section: "Accounts & Finance" },
  { label: "EMI's and Interest", route: "/user/viewbills", icon: ReceiptText, section: "Accounts & Finance" },
  { label: "View Vendors", route: "/user/viewvendors", icon: Store, section: "Master Data" },
  { label: "View Daybook", route: "/user/daybook", icon: BookOpen, section: "Accounts & Finance" },
  { label: "Departments", route: "/user/departments", icon: Building2, section: "Master Data" },
  { label: "Client Bookings", route: "/user/viewclientbookings", icon: CalendarCheck, section: "Bookings & Events" },
  { label: "Budget Report", route: "/user/budgetreport/eventwise", icon: ChartColumn, section: "Accounts & Finance" },
  { label: "Leads Tracker", route: "/user/client-leads", icon: Target, section: "Leads" },
];

const CA_NAV = [
  { label: "Daily Expenses", route: "/user/daily-expenses", icon: Wallet, section: "Accounts & Finance" },
  { label: "EMI's and Interest", route: "/user/viewbills", icon: ReceiptText, section: "Accounts & Finance" },
  { label: "View Vendors", route: "/user/viewvendors", icon: Store, section: "Master Data" },
  { label: "View Daybook", route: "/user/daybook", icon: BookOpen, section: "Accounts & Finance" },
  { label: "Departments", route: "/user/departments", icon: Building2, section: "Master Data" },
  { label: "Client Bookings", route: "/user/viewclientbookings", icon: CalendarCheck, section: "Bookings & Events" },
  { label: "Budget Report", route: "/user/budgetreport/eventwise", icon: ChartColumn, section: "Accounts & Finance" },
];

/** Headings of the site menu, in display order. Home sits above them; Account sits below. */
export const NAV_SECTIONS = [
  "Requests",
  "Bookings & Events",
  "Leads",
  "Accounts & Finance",
  "Master Data",
];

/** [{ title, items }] for the sections this user actually has links in (empty ones are dropped). */
export const groupNavItems = (items) =>
  NAV_SECTIONS.map((title) => ({ title, items: items.filter((i) => i.section === title) })).filter(
    (g) => g.items.length > 0,
  );

/**
 * Menu links for the signed-in user. Mirrors the role precedence in App.jsx so the
 * site-wide menu always lists the same links as that role's home screen.
 */
export const getNavItems = (user) => {
  const dept = user?.departments?.[0]?.name;
  if (dept === "ACCOUNTS") return ACCOUNTS_NAV;
  if (dept === "MARKETING") return MARKETING_NAV;
  switch (user?.role) {
    case ROLES.DEPARTMENT:
      return DEPARTMENT_NAV;
    case ROLES.OWNER:
      return OWNER_NAV;
    case ROLES.APPROVER:
      return APPROVER_NAV;
    case ROLES.CA:
      return CA_NAV;
    default:
      return [];
  }
};
