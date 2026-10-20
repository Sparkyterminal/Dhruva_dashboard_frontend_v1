import React from "react";
import RoleHome from "../../Components/RoleHome";
import RequirementTableApprover from "./RequirementTableApprover";
import UserWiseCalendarPanel from "../../Components/userwisecalendar/UserWiseCalendarPanel";

const TABS = [
  { key: "calendar", label: "Calendar", content: <UserWiseCalendarPanel />, framed: false },
  { key: "dashboard", label: "Dashboard", content: <RequirementTableApprover /> },
];

const ApproverHome = () => (
  <RoleHome tabs={TABS} defaultTab="calendar" />
);

export default ApproverHome;
