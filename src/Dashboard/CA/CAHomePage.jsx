import React from "react";
import RoleHome from "../../Components/RoleHome";
import CARequirementsTable from "./CARequirementsTable";
import AdvanceCalendarClients from "../../Components/AdvanceCalenderClients";
import UserWiseCalendarPanel from "../../Components/userwisecalendar/UserWiseCalendarPanel";

const TABS = [
  { key: "requests", label: "Dashboard", content: <CARequirementsTable /> },
  { key: "calendar", label: "Calendar", content: <UserWiseCalendarPanel />, framed: false },
  { key: "advanceCalendar", label: "Advance Calendar", content: <AdvanceCalendarClients /> },
];

const CAHomePage = () => (
  <RoleHome tabs={TABS} defaultTab="calendar" />
);

export default CAHomePage;
