import React from "react";
import RoleHome from "../../Components/RoleHome";
import ViewRequirements from "../User/ViewRequirements";
import UserWiseCalendarPanel from "../../Components/userwisecalendar/UserWiseCalendarPanel";

const TABS = [
  { key: "calendar", label: "Calendar", content: <UserWiseCalendarPanel />, framed: false },
  { key: "dashboard", label: "Dashboard", content: <ViewRequirements /> },
];

const MarketHome = () => (
  <RoleHome tabs={TABS} defaultTab="calendar" />
);

export default MarketHome;
