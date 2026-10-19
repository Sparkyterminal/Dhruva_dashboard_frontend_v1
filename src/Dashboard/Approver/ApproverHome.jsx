import React from "react";
import {
  BookOpen,
  Building2,
  CalendarCheck,
  ChartColumn,
  ReceiptText,
  Store,
  Target,
  Wallet,
} from "lucide-react";
import RoleHome from "../../Components/RoleHome";
import RequirementTableApprover from "./RequirementTableApprover";
import UserWiseCalendarPanel from "../../Components/userwisecalendar/UserWiseCalendarPanel";

const NAV_ITEMS = [
  { label: "Daily Expense", route: "/user/daily-expenses", icon: Wallet },
  { label: "EMI's and Interest", route: "/user/viewbills", icon: ReceiptText },
  { label: "View Vendors", route: "/user/viewvendors", icon: Store },
  { label: "View Daybook", route: "/user/daybook", icon: BookOpen },
  { label: "Departments", route: "/user/departments", icon: Building2 },
  { label: "Client Bookings", route: "/user/viewclientbookings", icon: CalendarCheck },
  { label: "Budget Report", route: "/user/budgetreport/eventwise", icon: ChartColumn },
  { label: "Leads Tracker", route: "/user/client-leads", icon: Target },
];

const TABS = [
  { key: "calendar", label: "Calendar", content: <UserWiseCalendarPanel />, framed: false },
  { key: "dashboard", label: "Dashboard", content: <RequirementTableApprover /> },
];

const ApproverHome = () => (
  <RoleHome navItems={NAV_ITEMS} tabs={TABS} defaultTab="calendar" />
);

export default ApproverHome;
