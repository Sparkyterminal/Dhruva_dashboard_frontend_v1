import React from "react";
import {
  BadgeCheck,
  CalendarCheck,
  ChartColumn,
  FilePlus2,
  Hourglass,
  Layers,
  ListChecks,
  MapPin,
  Store,
  Target,
} from "lucide-react";
import RoleHome from "../../Components/RoleHome";
import ViewRequirements from "../User/ViewRequirements";
import UserWiseCalendarPanel from "../../Components/userwisecalendar/UserWiseCalendarPanel";

const NAV_ITEMS = [
  { label: "Add Requirement", route: "/user/sendrequest", icon: FilePlus2 },
  { label: "Client Bookings", route: "/user/viewclient", icon: CalendarCheck },
  { label: "Events Masterdata", route: "/user/viewevents", icon: Layers },
  { label: "Venue Masterdata", route: "/user/viewvenue", icon: MapPin },
  { label: "Confirmed Events", route: "/user/confirmed-events", icon: BadgeCheck },
  { label: "In Progress Events", route: "/user/inprogress-events", icon: Hourglass },
  { label: "Track Leads", route: "/user/client-leads", icon: Target },
  { label: "View Vendors", route: "/user/viewvendors", icon: Store },
  { label: "Checklists", route: "/user/checklists", icon: ListChecks },
  { label: "Budget Report", route: "/user/budgetreport/eventwise", icon: ChartColumn },
];

const TABS = [
  { key: "calendar", label: "Calendar", content: <UserWiseCalendarPanel />, framed: false },
  { key: "dashboard", label: "Dashboard", content: <ViewRequirements /> },
];

const MarketHome = () => (
  <RoleHome navItems={NAV_ITEMS} tabs={TABS} defaultTab="calendar" />
);

export default MarketHome;
