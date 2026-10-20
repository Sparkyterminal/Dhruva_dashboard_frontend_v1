import React from "react";
import RoleHome from "../../Components/RoleHome";
import RequirementsTableAc from "./RequirementsTableAc";
import AdvanceCalendarClients from "../../Components/AdvanceCalenderClients";
import UserWiseCalendarPanel from "../../Components/userwisecalendar/UserWiseCalendarPanel";

const TABS = [
  { key: "requests", label: "Dashboard", content: <RequirementsTableAc /> },
  { key: "calendar", label: "Calendar", content: <UserWiseCalendarPanel />, framed: false },
  { key: "advanceCalendar", label: "Advance Calendar", content: <AdvanceCalendarClients /> },
];

const AccountsHome = () => (
  <RoleHome tabs={TABS} defaultTab="calendar" />
);

export default AccountsHome;
