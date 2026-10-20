import React from "react";
import RoleHome from "../../Components/RoleHome";
import UserWiseCalendarPanel from "../../Components/userwisecalendar/UserWiseCalendarPanel";

const TABS = [
  { key: "calendar", label: "Personal Calendar", content: <UserWiseCalendarPanel />, framed: false },
];

const HomeOwner = () => <RoleHome tabs={TABS} />;

export default HomeOwner;
