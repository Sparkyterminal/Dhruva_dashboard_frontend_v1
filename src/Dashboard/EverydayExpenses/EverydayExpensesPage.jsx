import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Wallet } from "lucide-react";
import { EmptyState, PageHero, ScrollTabs } from "@/Components/PageKit";
import { Toaster } from "@/Components/AdminKit";
import { isExpenseReviewer } from "@/utils/expenseAccess";
import CategoriesTab from "./CategoriesTab";
import MyExpensesTab from "./MyExpensesTab";
import OverviewTab from "./OverviewTab";
import PeopleTab from "./PeopleTab";
import RateCardTab from "./RateCardTab";
import { fetchCategories, fetchMe } from "./everydayApi";
import "./Everyday.css";

/**
 * Everyday Expenses for every role except Admin: add what you spent with the bill, see what you will be
 * repaid. CA, Approver, Owner and HR also get Overview, Categories & rates and People & grades.
 */
const EverydayExpensesPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const authHeaders = useMemo(() => ({ headers: { Authorization: user?.access_token } }), [user?.access_token]);

  const [me, setMe] = useState(null);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [tab, setTab] = useState("mine");

  const guessReviewer = isExpenseReviewer(user);
  // The tabs show when the app's own rule OR the server says reviewer. The server still decides what each call is allowed to do,
  // so a mismatch shows up as a clear notice (below) instead of the tabs silently disappearing.
  const reviewer = guessReviewer || me?.isReviewer === true;
  const serverDisagrees = guessReviewer && me?.isReviewer === false;

  const load = useCallback(async () => {
    try {
      const [profile, list] = await Promise.all([
        fetchMe({ authHeaders }),
        fetchCategories({ includeInactive: guessReviewer, authHeaders }),
      ]);
      setMe(profile);
      setCategories(list?.categories || []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [authHeaders, guessReviewer]);

  useEffect(() => {
    load();
  }, [load]);

  const tabs = useMemo(() => {
    const items = [
      { key: "mine", label: "My expenses", children: <MyExpensesTab categories={categories} me={me} authHeaders={authHeaders} /> },
      { key: "rates", label: "Rate card", children: <RateCardTab categories={categories} me={me} /> },
    ];
    if (reviewer) {
      items.push(
        { key: "overview", label: "Overview", children: <OverviewTab categories={categories} me={me} authHeaders={authHeaders} /> },
        { key: "categories", label: "Categories & rates", children: <CategoriesTab categories={categories} me={me} authHeaders={authHeaders} onChanged={load} /> },
        { key: "people", label: "People & grades", children: <PeopleTab authHeaders={authHeaders} /> },
      );
    }
    return items;
  }, [categories, me, authHeaders, reviewer, load]);

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Expenses"
          title="Everyday Expenses"
          subtitle="Add what you spent for work and attach the bill. You are repaid up to the standard rates."
          onBack={() => navigate("/user")}
        />

        <section className="pk-panel ee-tabs">
          {status === "loading" ? (
            <div className="ee-tab" style={{ padding: 20 }}>
              <div className="ee-skeleton" aria-hidden="true">
                <i /> <i /> <i />
              </div>
            </div>
          ) : status === "error" ? (
            <div style={{ padding: 20 }}>
              <EmptyState
                icon={<Wallet size={24} aria-hidden="true" />}
                title="Could not open Everyday Expenses"
                hint="Check your connection and try again."
              />
              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  className="ee-add"
                  onClick={() => {
                    setStatus("loading");
                    load();
                  }}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <>
              {serverDisagrees ? (
                <p className="ee-notice" role="status">
                  <strong>Reviewer access is not switched on at the server for your account yet.</strong> The Overview,
                  Categories &amp; rates and People &amp; grades tabs are shown, but they will show errors until the backend
                  treats your department as a reviewer (CA, Approver, Owner and the HR DEPARTMENT).
                </p>
              ) : null}
              <ScrollTabs items={tabs} activeKey={tab} onChange={setTab} ariaLabel="Everyday Expenses sections" />
            </>
          )}
        </section>
      </div>
      <Toaster />
    </div>
  );
};

export default EverydayExpensesPage;
