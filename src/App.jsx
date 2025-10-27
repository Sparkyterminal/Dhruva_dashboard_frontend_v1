import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Routes, Route, Navigate } from "react-router-dom";
import { ROLES } from "../config";
import verifyToken from "./verifyToken";
import Login from "./Login/Login";
import LoadingPage from "./Pages/LoadingPage";
import AdminLayout from "./Layout/AdminLayout";
import AddUsers from "./Dashboard/Admin/Users/AddUsers";
import EditUsers from "./Dashboard/Admin/Users/EditUsers";
import ViewUsers from "./Dashboard/Admin/Users/ViewUsers";
import AddDepartment from "./Dashboard/Admin/Departments/AddDepartment";
import EditDepartments from "./Dashboard/Admin/Departments/EditDepartments";
import ViewDepartment from "./Dashboard/Admin/Departments/ViewDepartment";
import AddMeetings from "./Dashboard/Admin/Meetings/AddMeetings";
import EditMeetings from "./Dashboard/Admin/Meetings/EditMeetings";
import ViewMeetings from "./Dashboard/Admin/Meetings/ViewMeetings";
import Home from "./Dashboard/User/Home";
import ViewRequirements from "./Dashboard/User/ViewRequirements";
import AddRequirements from "./Dashboard/User/AddRequirements";
import HomeOwner from "./Dashboard/Owner/Home";
import Departments from "./Dashboard/Owner/Departments";
import Meetings from "./Dashboard/Owner/Meetings";
import AllRequirementsTable from "./Dashboard/Owner/AllRequirementsTable";
import DepartmentsTable from "./Dashboard/Owner/DepartmentsTable";

const DepartmentDashboard = () => <h1>Department Dashboard</h1>;
const OwnerDashboard = () => <h1>Owner Dashboard</h1>;

const App = () => {
  const [auth, setAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const user = useSelector((state) => state.user.value);

  const isAdmin = ROLES.ADMIN === user?.role;
  const isDepartment = ROLES.DEPARTMENT === user?.role;
  const isOwner = ROLES.OWNER === user?.role;

  useEffect(() => {
    function checkAuth() {
      try {
        setIsLoading(true);

        if (user?.is_logged_in && user?.access_token) {
          const checkToken = verifyToken(user.access_token);
          setAuth(checkToken?.status === true);
        } else {
          setAuth(false);
        }
      } catch {
        setAuth(false);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [user?.is_logged_in, user?.access_token]);

  if (isLoading || auth === null) {
    return <LoadingPage />;
  }

  return (
    <>
      <Routes>
        {/* NOT AUTHENTICATED → Only Login allowed */}
        {!auth ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            {/* ✅ ADMIN ROUTES */}
            {isAdmin && (
              <>
                <Route path="/dashboard" element={<AdminLayout />}>
                  <Route index element={<Navigate to="viewuser" replace />} />
                  <Route path="adduser" element={<AddUsers />} />
                  <Route path="edituser/:id" element={<EditUsers />} />
                  <Route path="viewuser" element={<ViewUsers />} />
                  <Route path="adddepartment" element={<AddDepartment />} />
                  <Route
                    path="editdepartment/:id"
                    element={<EditDepartments />}
                  />
                  <Route path="viewdepartment" element={<ViewDepartment />} />
                  <Route path="addmeeting" element={<AddMeetings />} />
                  <Route path="editmeeting/:id" element={<EditMeetings />} />
                  <Route path="viewmeetings" element={<ViewMeetings />} />
                  <Route
                    path="*"
                    element={<Navigate to="viewusers" replace />}
                  />
                </Route>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </>
            )}

            {/* ✅ DEPARTMENT ROUTES */}
            {isDepartment && (
              <>
                <Route path="/user" element={<Home />} />
                <Route
                  path="/user/viewrequests"
                  element={<ViewRequirements />}
                />
                <Route path="/user/sendrequest" element={<AddRequirements />} />
                <Route path="/" element={<Navigate to="/user" replace />} />
                <Route path="*" element={<Navigate to="/user" replace />} />
              </>
            )}

            {/* ✅ OWNER ROUTES */}
            {isOwner && (
              <>
                <Route path="/owner" element={<HomeOwner />} />
                <Route path="/owner/departments" element={<Departments />} />
                <Route path="/owner/meetings" element={<Meetings />} />
                <Route
                  path="/owner/allrequirements"
                  element={<AllRequirementsTable />}
                />
                <Route
                  path="/owner/departments/:id"
                  element={<DepartmentsTable />}
                />
                <Route path="*" element={<Navigate to="/owner" replace />} />
              </>
            )}

            {/* Fallback if role doesn't match */}
            {!isAdmin && !isDepartment && !isOwner && (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </>
        )}
      </Routes>
    </>
  );
};

export default App;
