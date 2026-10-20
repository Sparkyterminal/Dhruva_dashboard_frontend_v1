import React from "react";
import { useNavigate } from "react-router-dom";
import ProgressCalenderClients from "../Components/ProgressCalenderClients";
import { PageHero } from "@/Components/PageKit";

const InprogressCalendarPage = () => {
  const navigate = useNavigate();

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Events"
          title="In progress, Almost booked & Cancelled Calendar"
          subtitle="Track pending, almost booked and cancelled events, and their meeting dates."
          onBack={() => navigate(-1)}
          backLabel="Back"
        />
        <section className="pk-panel" style={{ padding: 20 }}>
          <ProgressCalenderClients />
        </section>
      </div>
    </div>
  );
};

export default InprogressCalendarPage;
