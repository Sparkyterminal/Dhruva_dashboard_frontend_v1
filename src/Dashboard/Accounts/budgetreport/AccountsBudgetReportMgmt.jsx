/**
 * LEGACY — AccountsBudgetReportMgmt (accounts allocation editor) is removed from routes.
 * Redirects to the Excel edit workspace for the same id (treated as event id when possible).
 *
 * Old accounts-only grid UI is discontinued in favour of Budget Report Excel.
 */
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Spin } from "antd";

const AccountsBudgetReportMgmt = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      navigate(`/user/budgetreport/edit/${id}`, { replace: true });
    } else {
      navigate("/user/budgetreport/eventwise", { replace: true });
    }
  }, [id, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Spin tip="Redirecting to Excel editor…" />
    </div>
  );
};

export default AccountsBudgetReportMgmt;
