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
import AddEvent from "./Dashboard/Marketting/EventsNames/AddEvent";
import ChangePassword from "./Login/ChangePassword";
import AddBill from "./Dashboard/Accounts/Bills/AddBill";
import EditBill from "./Dashboard/Accounts/Bills/EditBill";
import ViewBill from "./Dashboard/Accounts/Bills/ViewBill";
import ViewClientsBookings from "./Dashboard/Accounts/ViewClientsBookings";
import Departmentwise from "./Dashboard/Accounts/Departmentwise";
import PlayBook from "./Dashboard/Accounts/playbook";
// import ViewVendors from "./Dashboard/Accounts/ViewVendors";
import ViewChecklist from "./Components/ViewChecklist";
import EditChecklist from "./Components/EditChecklist";
import AddChecklist from "./Components/AddChecklist";
import CalenderPage from "./Pages/CalenderPage";
import EditEvents from "./Dashboard/Marketting/EventsNames/EditEvents";
import ViewEvents from "./Dashboard/Marketting/EventsNames/ViewEvents";
import AddSubEvents from "./Dashboard/Marketting/SubEvents/AddSubEvents";
import EditSubEvent from "./Dashboard/Marketting/SubEvents/EditSubEvent";
import ViewSubEvents from "./Dashboard/Marketting/SubEvents/ViewSubEvents";
import AddPC from "./Dashboard/Admin/ProjectCoordinators/AddPC";
import EditPC from "./Dashboard/Admin/ProjectCoordinators/EditPC";
import ViewPC from "./Dashboard/Admin/ProjectCoordinators/ViewPC";
import AddVenue from "./Dashboard/Marketting/AddVenue/AddVenue";
import ViewVenue from "./Dashboard/Marketting/AddVenue/ViewVenue";
import EditVenue from "./Dashboard/Marketting/AddVenue/EditVenue";
import AddSubVenue from "./Dashboard/Marketting/AddSubVenue/AddSubVenue";
import ViewSubVenue from "./Dashboard/Marketting/AddSubVenue/ViewSubVenue";
import EditSubVenue from "./Dashboard/Marketting/AddSubVenue/EditSubVenue";
import ViewLeads from "./Dashboard/Marketting/ClientLeadsTrack/ViewLeads";
import EditLeads from "./Dashboard/Marketting/ClientLeadsTrack/EditLeads";
import CalendarClients from "./Components/CalendarClients";
import InprogressCalendarPage from "./Pages/InprogressCalendarPage";
import CAHomePage from "./Dashboard/CA/CAHomePage";
import RequirementTableApprover from "./Dashboard/Approver/RequirementTableApprover";
import RequirementsTableAc from "./Dashboard/Accounts/RequirementsTableAc";
import CARequirementsTable from "./Dashboard/CA/CARequirementsTable";
import BudgetReportHome from "./Dashboard/Accounts/budgetreport/BudgetReportHome";
import BudgetReportEventWise from "./Dashboard/Accounts/budgetreport/BudgetReportEventWise";
import EditBudgetReport from "./Dashboard/Accounts/budgetreport/EditBudgetReport";
import AccountsBudgetReportMgmt from "./Dashboard/Accounts/budgetreport/AccountsBudgetReportMgmt";

const App = () => {
  const [auth, setAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const user = useSelector((state) => state.user.value);

  // Role Checks
  const isAdmin = ROLES.ADMIN === user?.role;
  const isDepartment = ROLES.DEPARTMENT === user?.role;
  const isOwner = ROLES.OWNER === user?.role;
  const isCA = ROLES.CA === user?.role;
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
                <Route path="addprojectcoordinator" element={<AddPC />} />
                <Route path="editprojectcoordinator/:id" element={<EditPC />} />
                <Route path="viewprojectcoordinator" element={<ViewPC />} />
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
              <Route path="/user/viewrequests" element={<ViewRequirements />} />
              <Route path="/user/sendrequest" element={<AddRequirements />} />
              <Route
                path="/user/departments/:id"
                element={<Departmentwise />}
              />
              <Route path="/user/changepassword" element={<ChangePassword />} />
              <Route path="/user/daybook" element={<PlayBook />} />
              <Route path="/user/addvendor" element={<AddVendor />} />
              <Route path="/user/viewvendors" element={<ViewVendor />} />
              <Route path="/user/editvendor/:id" element={<EditVendor />} />
              <Route
                path="/user/viewclientbookings"
                element={<ViewClientsBookings />}
              />
              <Route path="/user/checklists" element={<ViewChecklist />} />
              <Route path="/user/addchecklists" element={<AddChecklist />} />
              <Route
                path="/user/editchecklists/:id"
                element={<EditChecklist />}
              />
              <Route path="/user/addbill" element={<AddBill />} />
              <Route path="/user/editbill/:id" element={<EditBill />} />
              <Route path="/user/viewbills" element={<ViewBill />} />
              <Route path="/user/meetings" element={<Meetings />} />
              <Route
                path="/user/allrequirements"
                element={<RequirementsTableAc />}
              />
              <Route
                path="/user/departments/:id"
                element={<DepartmentsTable />}
              />
              <Route path="/user/budgetreport" element={<BudgetReportHome />} />
              <Route path="/user/budgetreport/eventwise" element={<BudgetReportEventWise />} />
              <Route path="/user/budgetreport/edit/:id" element={<EditBudgetReport />} />
              <Route path="/user/budgetreport/accounts/:id" element={<AccountsBudgetReportMgmt />} />
              <Route path="/user/client-leads" element={<ViewLeads />} />
              <Route path="/user/client-leads/edit/:id" element={<EditLeads />} />
              <Route path="/user" element={<Navigate to="/user" replace />} />
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
              <Route path="/user/addevent" element={<AddEvent />} />
              <Route path="/user/editevent/:id" element={<EditEvents />} />
              <Route path="/user/viewevents" element={<ViewEvents />} />
              <Route path="/user/addsubevent" element={<AddSubEvents />} />
              <Route path="/user/editsubevent/:id" element={<EditSubEvent />} />
              <Route path="/user/viewsubevents" element={<ViewSubEvents />} />
              <Route path="/user/addvendor" element={<AddVendor />} />
              <Route path="/user/viewvendors" element={<ViewVendor />} />
              <Route path="/user/editvendor/:id" element={<EditVendor />} />
              <Route path="/user/addvenue" element={<AddVenue />} />
              <Route path="/user/viewvenue" element={<ViewVenue />} />
              <Route path="/user/editvenue/:id" element={<EditVenue />} />
              <Route path="/user/addsubvenue" element={<AddSubVenue />} />
              <Route path="/user/viewsubvenue" element={<ViewSubVenue />} />
              <Route path="/user/editsubvenue/:id" element={<EditSubVenue />} />
              <Route path="/user/client-leads" element={<ViewLeads />} />
              <Route path="/user/client-leads/edit/:id" element={<EditLeads />} />
              <Route path="/user/changepassword" element={<ChangePassword />} />
              <Route path="/user/checklists" element={<ViewChecklist />} />
              <Route path="/user/addchecklists" element={<AddChecklist />} />
              <Route
                path="/user/editchecklists/:id"
                element={<EditChecklist />}
              />
              <Route path="/user/confirmed-events" element={<CalenderPage />} />
              <Route
                path="/user/inprogress-events"
                element={<InprogressCalendarPage />}
              />
              <Route path="/user/eventcalender" element={<CalenderPage />} />
              <Route path="/user/budgetreport" element={<BudgetReportHome />} />
              <Route path="/user/budgetreport/eventwise" element={<BudgetReportEventWise />} />
              <Route path="/user/budgetreport/edit/:id" element={<EditBudgetReport />} />
              <Route path="/user/budgetreport/accounts/:id" element={<AccountsBudgetReportMgmt />} />
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
              <Route path="/user/eventcalender" element={<CalenderPage />} />
              <Route path="/user/checklists" element={<ViewChecklist />} />
              <Route path="/user/addchecklists" element={<AddChecklist />} />
              <Route path="/user/confirmed-events" element={<CalenderPage />} />
              <Route
                path="/user/inprogress-events"
                element={<InprogressCalendarPage />}
              />

              <Route
                path="/user/editchecklists/:id"
                element={<EditChecklist />}
              />
              <Route path="/user/budgetreport" element={<BudgetReportHome />} />
              <Route path="/user/budgetreport/eventwise" element={<BudgetReportEventWise />} />
              <Route path="/user/budgetreport/edit/:id" element={<EditBudgetReport />} />
              <Route path="/user/budgetreport/accounts/:id" element={<AccountsBudgetReportMgmt />} />
              <Route path="/" element={<Navigate to="/user" replace />} />
              <Route path="*" element={<Navigate to="/user" replace />} />
            </>
          ) : isOwner ? (
            /* 👑 OWNER ROUTES */
            <>
              <Route path="/user" element={<HomeOwner />} />
              <Route path="/user/departments" element={<Departments />} />
              <Route
                path="/user/departments/:id"
                element={<Departmentwise />}
              />
              <Route
                path="/user/changepassword"
                element={<ChangePassword />}
              />
              <Route path="/user/daybook" element={<PlayBook />} />
              <Route path="/user/addvendor" element={<AddVendor />} />
              <Route path="/user/viewvendors" element={<ViewVendor />} />
              <Route path="/user/editvendor/:id" element={<EditVendor />} />
              <Route
                path="/user/viewclientbookings"
                element={<ViewClientsBookings />}
              />
              <Route path="/user/checklists" element={<ViewChecklist />} />
              <Route path="/user/addchecklists" element={<AddChecklist />} />
              <Route
                path="/user/editchecklists/:id"
                element={<EditChecklist />}
              />
              <Route path="/user/addbill" element={<AddBill />} />
              <Route path="/user/editbill/:id" element={<EditBill />} />
              <Route path="/user/viewbills" element={<ViewBill />} />
              <Route path="/user/meetings" element={<Meetings />} />
              <Route
                path="/user/allrequirements"
                element={<AllRequirementsTable />}
              />
              <Route path="/user/budgetreport" element={<BudgetReportHome />} />
              <Route path="/user/budgetreport/eventwise" element={<BudgetReportEventWise />} />
              <Route path="/user/budgetreport/edit/:id" element={<EditBudgetReport />} />
              <Route path="/user/budgetreport/accounts/:id" element={<AccountsBudgetReportMgmt />} />
              <Route path="/user/client-leads" element={<ViewLeads />} />
              <Route path="/user/client-leads/edit/:id" element={<EditLeads />} />

              <Route path="*" element={<Navigate to="/user" replace />} />
            </>
          ) : isApprover ? (
            /* ✅ APPROVER ROUTES */
            <>
              <Route path="/user" element={<ApproverHome />} />
              <Route path="/user/departments" element={<Departments />} />
              <Route
                path="/user/departments/:id"
                element={<Departmentwise />}
              />
              <Route
                path="/user/changepassword"
                element={<ChangePassword />}
              />
              <Route path="/user/daybook" element={<PlayBook />} />
              <Route path="/user/addvendor" element={<AddVendor />} />
              <Route path="/user/viewvendors" element={<ViewVendor />} />
              <Route path="/user/checklists" element={<ViewChecklist />} />
              <Route
                path="/user/addchecklists"
                element={<AddChecklist />}
              />
              <Route
                path="/user/editchecklists/:id"
                element={<EditChecklist />}
              />
              <Route path="/user/editvendor/:id" element={<EditVendor />} />
              <Route
                path="/user/viewclientbookings"
                element={<ViewClientsBookings />}
              />
              <Route path="/user/addbill" element={<AddBill />} />
              <Route path="/user/editbill/:id" element={<EditBill />} />
              <Route path="/user/viewbills" element={<ViewBill />} />
              <Route
                path="/user/allrequirements"
                element={<RequirementTableApprover />}
              />
              <Route path="/user/budgetreport" element={<BudgetReportHome />} />
              <Route path="/user/budgetreport/eventwise" element={<BudgetReportEventWise />} />
              <Route path="/user/budgetreport/edit/:id" element={<EditBudgetReport />} />
              <Route path="/user/client-leads" element={<ViewLeads />} />
              <Route path="/user/client-leads/edit/:id" element={<EditLeads />} />

              <Route
                path="*"
                element={<Navigate to="/user" replace />}
              />
            </>
          ) : isCA ? (
            <>
              <Route path="/user" element={<CAHomePage />} />
              <Route path="/user/departments" element={<Departments />} />
              <Route
                path="/user/departments/:id"
                element={<Departmentwise />}
              />
              <Route path="/user/changepassword" element={<ChangePassword />} />
              <Route path="/user/daybook" element={<PlayBook />} />
              <Route path="/user/addvendor" element={<AddVendor />} />
              <Route path="/user/viewvendors" element={<ViewVendor />} />
              <Route path="/user/checklists" element={<ViewChecklist />} />
              <Route path="/user/addchecklists" element={<AddChecklist />} />
              <Route
                path="/user/editchecklists/:id"
                element={<EditChecklist />}
              />
              <Route path="/user/editvendor/:id" element={<EditVendor />} />
              <Route
                path="/user/viewclientbookings"
                element={<ViewClientsBookings />}
              />
              <Route path="/user/addbill" element={<AddBill />} />
              <Route path="/user/editbill/:id" element={<EditBill />} />
              <Route path="/user/viewbills" element={<ViewBill />} />
              <Route
                path="/user/allrequirements"
                element={<CARequirementsTable />}
              />
              <Route path="/user/budgetreport" element={<BudgetReportHome />} />
              <Route path="/user/budgetreport/eventwise" element={<BudgetReportEventWise />} />
              <Route path="/user/budgetreport/edit/:id" element={<EditBudgetReport />} />
              <Route path="/user/budgetreport/accounts/:id" element={<AccountsBudgetReportMgmt />} />

              <Route path="*" element={<Navigate to="/user" replace />} />
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
