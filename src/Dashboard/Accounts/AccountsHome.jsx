import React from "react";
import {
  BookOpen,
  Building2,
  CalendarCheck,
  ChartColumn,
  FilePlus2,
  ListChecks,
  ReceiptText,
  Store,
  Target,
  Wallet,
} from "lucide-react";
import RoleHome from "../../Components/RoleHome";
import RequirementsTableAc from "./RequirementsTableAc";
import AdvanceCalendarClients from "../../Components/AdvanceCalenderClients";
import UserWiseCalendarPanel from "../../Components/userwisecalendar/UserWiseCalendarPanel";

const NAV_ITEMS = [
  { label: "Daily Expenses", route: "/user/daily-expenses", icon: Wallet },
  { label: "Add Requirement", route: "/user/sendrequest", icon: FilePlus2 },
  { label: "EMI's and Interest", route: "/user/viewbills", icon: ReceiptText },
  { label: "View Vendors", route: "/user/viewvendors", icon: Store },
  { label: "View Daybook", route: "/user/daybook", icon: BookOpen },
  { label: "Departments", route: "/user/departments", icon: Building2 },
  { label: "Client Bookings", route: "/user/viewclientbookings", icon: CalendarCheck },
  { label: "Checklists", route: "/user/checklists", icon: ListChecks },
  { label: "Budget Report", route: "/user/budgetreport/eventwise", icon: ChartColumn },
  { label: "Leads Tracker", route: "/user/client-leads", icon: Target },
];

const TABS = [
  { key: "requests", label: "Dashboard", content: <RequirementsTableAc /> },
  { key: "calendar", label: "Calendar", content: <UserWiseCalendarPanel />, framed: false },
  { key: "advanceCalendar", label: "Advance Calendar", content: <AdvanceCalendarClients /> },
];

const AccountsHome = () => (
  <RoleHome navItems={NAV_ITEMS} tabs={TABS} defaultTab="calendar" />
);

export default AccountsHome;
