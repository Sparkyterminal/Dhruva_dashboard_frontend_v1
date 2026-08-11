import React from "react";
import ViewLeads from "../../Marketting/ClientLeadsTrack/ViewLeads";

/**
 * Read-only Leads tab for Accounts Client Bookings.
 * Same filters + summary cards as marketing Track Leads, without Excel / add / edit / delete.
 */
const ClientBookingsLeadsTab = () => (
  <ViewLeads readOnly embedded />
);

export default ClientBookingsLeadsTab;
