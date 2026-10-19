import React from "react";
import {
  BookOpen,
  Building2,
  CalendarCheck,
  ChartColumn,
  ReceiptText,
  Store,
  Wallet,
} from "lucide-react";
import RoleHome from "../../Components/RoleHome";
import CARequirementsTable from "./CARequirementsTable";
import AdvanceCalendarClients from "../../Components/AdvanceCalenderClients";
import UserWiseCalendarPanel from "../../Components/userwisecalendar/UserWiseCalendarPanel";

const NAV_ITEMS = [
  { label: "Daily Expenses", route: "/user/daily-expenses", icon: Wallet },
  { label: "EMI's and Interest", route: "/user/viewbills", icon: ReceiptText },
  { label: "View Vendors", route: "/user/viewvendors", icon: Store },
  { label: "View Daybook", route: "/user/daybook", icon: BookOpen },
  { label: "Departments", route: "/user/departments", icon: Building2 },
  { label: "Client Bookings", route: "/user/viewclientbookings", icon: CalendarCheck },
  { label: "Budget Report", route: "/user/budgetreport/eventwise", icon: ChartColumn },
];

const TABS = [
  { key: "requests", label: "Dashboard", content: <CARequirementsTable /> },
  { key: "calendar", label: "Calendar", content: <UserWiseCalendarPanel />, framed: false },
  { key: "advanceCalendar", label: "Advance Calendar", content: <AdvanceCalendarClients /> },
];

const CAHomePage = () => (
  <RoleHome navItems={NAV_ITEMS} tabs={TABS} defaultTab="calendar" />
);

export default CAHomePage;
