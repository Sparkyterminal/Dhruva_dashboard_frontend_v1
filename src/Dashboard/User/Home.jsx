import React from "react";
import {
  BadgeCheck,
  CalendarDays,
  CalendarRange,
  FilePlus2,
  Hourglass,
  ListChecks,
  Store,
  Trophy,
} from "lucide-react";
import RoleHome from "../../Components/RoleHome";
import ViewRequirements from "./ViewRequirements";
import UserWiseCalendarPanel from "../../Components/userwisecalendar/UserWiseCalendarPanel";

const NAV_ITEMS = [
  { label: "Add Requirement", route: "/user/sendrequest", icon: FilePlus2 },
  { label: "Confirmed Events", route: "/user/confirmed-events", icon: BadgeCheck },
  { label: "In Progress Events", route: "/user/inprogress-events", icon: Hourglass },
  { label: "Checklists", route: "/user/checklists", icon: ListChecks },
  { label: "View Vendors", route: "/user/viewvendors", icon: Store },
  { label: "LeaderBoard", route: "/user/leaderboard", icon: Trophy },
  { label: "Lead Calendar", route: "/user/client-leads", icon: CalendarDays },
  { label: "Bookings Calendar", route: "/user/confirmed-events", icon: CalendarRange },
];

const TABS = [
  { key: "calendar", label: "Calendar", content: <UserWiseCalendarPanel />, framed: false },
  { key: "dashboard", label: "Dashboard", content: <ViewRequirements /> },
];

const Home = () => (
  <RoleHome navItems={NAV_ITEMS} tabs={TABS} defaultTab="calendar" />
);

export default Home;
