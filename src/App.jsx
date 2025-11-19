import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Routes, Route, Navigate } from "react-router-dom";
import { ROLES } from "../config";
import verifyToken from "./verifyToken";

// Pages & Components
import Login from "./Login/Login";
import LoadingPage from "./Pages/LoadingPage";
import AdminLayout from "./Layout/AdminLayout";

// Admin
import AddUsers from "./Dashboard/Admin/Users/AddUsers";
import EditUsers from "./Dashboard/Admin/Users/EditUsers";
import ViewUsers from "./Dashboard/Admin/Users/ViewUsers";
import AddDepartment from "./Dashboard/Admin/Departments/AddDepartment";
import EditDepartments from "./Dashboard/Admin/Departments/EditDepartments";
import ViewDepartment from "./Dashboard/Admin/Departments/ViewDepartment";
import AddMeetings from "./Dashboard/Admin/Meetings/AddMeetings";
import EditMeetings from "./Dashboard/Admin/Meetings/EditMeetings";
import ViewMeetings from "./Dashboard/Admin/Meetings/ViewMeetings";

// User / Department
import Home from "./Dashboard/User/Home";
import ViewRequirements from "./Dashboard/User/ViewRequirements";
import AddRequirements from "./Dashboard/User/AddRequirements";
import AddVendor from "./Dashboard/User/vendors/AddVendor";

// Owner
import HomeOwner from "./Dashboard/Owner/Home";
import Departments from "./Dashboard/Owner/Departments";
import Meetings from "./Dashboard/Owner/Meetings";
import AllRequirementsTable from "./Dashboard/Owner/AllRequirementsTable";
import DepartmentsTable from "./Dashboard/Owner/DepartmentsTable";

// Approver
import ApproverHome from "./Dashboard/Approver/ApproverHome";

// Accounts
import AccountsHome from "./Dashboard/Accounts/AccountsHome";
import ViewVendor from "./Dashboard/User/vendors/ViewVendor";
import MarketHome from "./Dashboard/Marketting/MarketHome";
import EditVendor from "./Dashboard/User/vendors/EditVendor";
import AddInflow from "./Dashboard/Marketting/AddInflow";
import EditInflow from "./Dashboard/Marketting/EditInflow";
import ViewInflow from "./Dashboard/Marketting/ViewInflow";
import ChangePassword from "./Login/ChangePassword";
import AddBill from "./Dashboard/Accounts/Bills/AddBill";
import EditBill from "./Dashboard/Accounts/Bills/EditBill";
import ViewBill from "./Dashboard/Accounts/Bills/ViewBill";
import ViewClientsBookings from "./Dashboard/Accounts/ViewClientsBookings";
import Departmentwise from "./Dashboard/Accounts/Departmentwise";
import PlayBook from "./Dashboard/Accounts/PlayBook";
import ViewVendors from "./Dashboard/Accounts/ViewVendors";
import ViewChecklist from "./Components/ViewChecklist";
import EditChecklist from "./Components/EditChecklist";
import AddChecklist from "./Components/AddChecklist";

const App = () => {
  const [auth, setAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const user = useSelector((state) => state.user.value);

  // Role Checks
  const isAdmin = ROLES.ADMIN === user?.role;
  const isDepartment = ROLES.DEPARTMENT === user?.role;
  const isOwner = ROLES.OWNER === user?.role;
  const isApprover = ROLES.APPROVER === user?.role;
  const isMarketing = user?.departments?.[0]?.name === "MARKETING";
  const isAccounts = user?.departments?.[0]?.name === "ACCOUNTS";

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
    <Routes>
      {/* 🔒 Not Logged In → Only Login route */}
      {!auth ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          {/* 🧭 ADMIN ROUTES */}
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
                <Route path="*" element={<Navigate to="viewuser" replace />} />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}

          {/* 🧾 ACCOUNTS ROUTES (priority before DEPARTMENT) */}
          {isAccounts ? (
            <>
              <Route path="/user" element={<AccountsHome />} />
              <Route path="/user/departments" element={<Departments />} />
              <Route path="/user/departments/:id" element={<Departmentwise />} />
              <Route path="/user/changepassword" element={<ChangePassword />} />
              <Route path="/user/playbook" element={<PlayBook />} />
              <Route path="/user/viewvendors" element={<ViewVendors />} />
              <Route path="/user/viewclientbookings" element={<ViewClientsBookings />} />
              <Route path="/user/addbill" element={<AddBill />} />
              <Route path="/user/editbill/:id" element={<EditBill />} />
              <Route path="/user/viewbills" element={<ViewBill />} />
              <Route path="/user/meetings" element={<Meetings />} />
              <Route
                path="/user/allrequirements"
                element={<AllRequirementsTable />}
              />
              <Route
                path="/user/departments/:id"
                element={<DepartmentsTable />}
              />
              <Route
                path="/user"
                element={<Navigate to="/user" replace />}
              />
              <Route path="*" element={<Navigate to="/user" replace />} />
            </>
          ) : isMarketing ? (
            /* 📢 MARKETING ROUTES */
            <>
              <Route path="/user" element={<MarketHome />} />
              <Route path="/user/viewrequests" element={<ViewRequirements />} />
              <Route path="/user/sendrequest" element={<AddRequirements />} />
              <Route path="/user/addclient" element={<AddInflow />} />
              <Route path="/user/editclient/:id" element={<EditInflow />} />
              <Route path="/user/viewclient" element={<ViewInflow />} />
               <Route path="/user/addvendor" element={<AddVendor />} />
              <Route path="/user/viewvendors" element={<ViewVendor />} />
              <Route path="/user/editvendor/:id" element={<EditVendor />} />
              <Route path="/user/changepassword" element={<ChangePassword />} />
              <Route path="/user/checklists" element={<ViewChecklist />} />
              <Route path="/user/addchecklists" element={<AddChecklist />} />
              <Route path="/user/editchecklists/:id" element={<EditChecklist />} />
              <Route path="/" element={<Navigate to="/user" replace />} />
              <Route path="*" element={<Navigate to="/user" replace />} />
            </>
          ) : isDepartment ? (
            /* 🧩 OTHER DEPARTMENT ROUTES */
            <>
              <Route path="/user" element={<Home />} />
              <Route path="/user/viewrequests" element={<ViewRequirements />} />
              <Route path="/user/addvendor" element={<AddVendor />} />
              <Route path="/user/viewvendors" element={<ViewVendor />} />
              <Route path="/user/editvendor/:id" element={<EditVendor />} />
              <Route path="/user/sendrequest" element={<AddRequirements />} />
              <Route path="/user/changepassword" element={<ChangePassword />} />
              <Route path="/" element={<Navigate to="/user" replace />} />
              <Route path="*" element={<Navigate to="/user" replace />} />
            </>
          ) : isOwner ? (
            /* 👑 OWNER ROUTES */
            <>
              <Route path="/owner" element={<HomeOwner />} />
              <Route path="/owner/departments" element={<Departments />} />
              <Route path="/owner/departments/:id" element={<Departmentwise />} />
              <Route path="/owner/changepassword" element={<ChangePassword />} />
              <Route path="/owner/playbook" element={<PlayBook />} />
              <Route path="/owner/viewvendors" element={<ViewVendors />} />
              <Route path="/owner/viewclientbookings" element={<ViewClientsBookings />} />
              <Route path="/owner/addbill" element={<AddBill />} />
              <Route path="/owner/editbill/:id" element={<EditBill />} />
              <Route path="/owner/viewbills" element={<ViewBill />} />
              <Route path="/owner/meetings" element={<Meetings />} />
              <Route
                path="/owner/allrequirements"
                element={<AllRequirementsTable />}
              />
              
              <Route path="*" element={<Navigate to="/owner" replace />} />
            </>
          ) : isApprover ? (
            /* ✅ APPROVER ROUTES */
            <>
              <Route path="/approver/home" element={<ApproverHome />} />
              <Route path="/approver/departments" element={<Departments />} />
              <Route path="/approver/departments/:id" element={<Departmentwise />} />
              <Route path="/approver/changepassword" element={<ChangePassword />} />
              <Route path="/approver/playbook" element={<PlayBook />} />
              <Route path="/approver/viewvendors" element={<ViewVendors />} />
              <Route path="/approver/viewclientbookings" element={<ViewClientsBookings />} />
              <Route path="/approver/addbill" element={<AddBill />} />
              <Route path="/approver/editbill/:id" element={<EditBill />} />
              <Route path="/approver/viewbills" element={<ViewBill />} />
              <Route
                path="/approver/allrequirements"
                element={<AllRequirementsTable />}
              />
              
              <Route
                path="*"
                element={<Navigate to="/approver/home" replace />}
              />
            </>
          ) : (
            /* 🚫 Fallback */
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </>
      )}
    </Routes>
  );
};

export default App;
