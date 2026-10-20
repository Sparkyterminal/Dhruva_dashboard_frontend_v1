import { Navigate } from "react-router-dom";

/** Coordinators are renamed from the list (Edit opens a dialog), so this route just goes back there. */
const EditPC = () => <Navigate to="/dashboard/viewprojectcoordinator" replace />;

export default EditPC;
