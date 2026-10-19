import React from "react";
import {
  BookOpen,
  Building2,
  CalendarCheck,
  ChartColumn,
  ClipboardList,
  ListChecks,
  ReceiptText,
  Store,
  Target,
  Wallet,
} from "lucide-react";
import RoleHome from "../../Components/RoleHome";
import UserWiseCalendarPanel from "../../Components/userwisecalendar/UserWiseCalendarPanel";

const NAV_ITEMS = [
  { label: "Daily Expense", route: "/user/daily-expenses", icon: Wallet },
  { label: "Requirements", route: "/user/allrequirements", icon: ClipboardList },
  { label: "Daybook", route: "/user/daybook", icon: BookOpen },
  { label: "Vendors", route: "/user/viewvendors", icon: Store },
  { label: "Client Bookings", route: "/user/viewclientbookings", icon: CalendarCheck },
  { label: "Bills", route: "/user/viewbills", icon: ReceiptText },
  { label: "Checklists", route: "/user/checklists", icon: ListChecks },
  { label: "Departments", route: "/user/departments", icon: Building2 },
  { label: "Budget Report", route: "/user/budgetreport/eventwise", icon: ChartColumn },
  { label: "Leads Tracker", route: "/user/client-leads", icon: Target },
];

const TABS = [
  { key: "calendar", label: "Personal Calendar", content: <UserWiseCalendarPanel />, framed: false },
];

const HomeOwner = () => <RoleHome navItems={NAV_ITEMS} tabs={TABS} />;

export default HomeOwner;
