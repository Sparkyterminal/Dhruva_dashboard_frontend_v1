import React from "react";
import { useNavigate } from "react-router-dom";
import CalendarClients from "../Components/CalendarClients";
import { PageHero } from "@/Components/PageKit";

const CalenderPage = () => {
  const navigate = useNavigate();

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Events"
          title="Confirmed Events Calendar"
          subtitle="Every confirmed event, by date and venue."
          onBack={() => navigate(-1)}
          backLabel="Back"
        />
        <section className="pk-panel" style={{ padding: 20 }}>
          <CalendarClients />
        </section>
      </div>
    </div>
  );
};

export default CalenderPage;
