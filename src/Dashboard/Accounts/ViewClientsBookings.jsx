import axiosClient from "@/api/axiosClient";
import React, { useCallback, useEffect, useState } from "react";
import { message, DatePicker, Typography, Tabs } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import CalendarClients from "../../Components/CalendarClients";
import AdvanceCalendarClients from "../../Components/AdvanceCalenderClients";
import UserWiseClients from "../../Components/UserWiseClients";
import {
  buildBookingsQueryParams,
  getEventName,
  isCompletePaymentWedding,
} from "./clientBookings/clientBookingsUtils";
import ClientBookingsListTab from "./clientBookings/ClientBookingsListTab";
import BalanceSheets from "./clientBookings/BalanceSheets";
import ClientBookingsLeadsTab from "./clientBookings/ClientBookingsLeadsTab";
import InprogressCalendarPage from "../../Pages/InprogressCalendarPage";
import { getEffectiveCutoffDate } from "../../utils/dataCutoff";
import { PageHero } from "@/Components/PageKit";
import EventDetailsDrawer from "./clientBookings/EventDetailsDrawer";
import "./clientBookings/Bookings.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ViewClientsBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingAdvances, setEditingAdvances] = useState([]);
  const [savingAdvance, setSavingAdvance] = useState(null);
  const [editingAdvanceKey, setEditingAdvanceKey] = useState(null); // Track which advance is being edited
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [activeTab, setActiveTab] = useState("list");
  const [listStatusTab, setListStatusTab] = useState("all");
  const [bookingsSummary, setBookingsSummary] = useState(null);
  // List View filters for events API
  const [filterEventName, setFilterEventName] = useState(undefined);
  const [filterDateRange, setFilterDateRange] = useState(null);
  const [eventNameOptions, setEventNameOptions] = useState([]); // populated from initial/data
  const [filterVenueId, setFilterVenueId] = useState(undefined);
  const [venueOptions, setVenueOptions] = useState([]);

  const user = useSelector((state) => state.user.value);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  useEffect(() => {
    let cancelled = false;
    const fetchVenues = async () => {
      try {
        const res = await axiosClient.get(`venue`, config);
        const raw = res.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw.venues)
            ? raw.venues
            : Array.isArray(raw.items)
              ? raw.items
              : Array.isArray(raw.data)
                ? raw.data
                : [];

        if (cancelled) return;
        setVenueOptions(
          (Array.isArray(list) ? list : [])
            .map((v) => ({
              label: v?.name ?? v?.venueName ?? "Unnamed venue",
              value: v?.id ?? v?._id,
            }))
            .filter((o) => o.value)
            .sort((a, b) => String(a.label).localeCompare(String(b.label))),
        );
      } catch {
        if (!cancelled) setVenueOptions([]);
      }
    };

    if (user?.access_token) fetchVenues();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.access_token]);

  const fetchBookingsList = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...buildBookingsQueryParams({
          listStatusTab,
          filterEventName,
          filterVenueId,
          filterDateRange,
          cutoffDate: getEffectiveCutoffDate(user),
        }),
      };

      const res = await axiosClient.get(`events`, {
        ...config,
        params,
      });
      const data = res.data || {};
      const events = Array.isArray(data.events) ? data.events : [];
      setBookings(events);
      // Keep the whole response shape so downstream UI can read `totalsByStatus`
      // (backend sends it at the top-level, not inside `summary`)
      setBookingsSummary(data && typeof data === "object" ? data : null);
      setPagination((prev) => ({
        ...prev,
        current: data.page ?? prev.current,
        pageSize: data.limit ?? prev.pageSize,
        total: data.totalEvents ?? data.total ?? events.length,
      }));
      setEventNameOptions((prev) => {
        const names = new Set(prev.map((o) => o.value));
        events.forEach((b) => {
          const name = getEventName(b.eventName);
          if (name && name !== "N/A") names.add(name);
        });
        return Array.from(names)
          .sort((a, b) => String(a).localeCompare(String(b)))
          .map((n) => ({ label: n, value: n }));
      });
    } catch (err) {
      message.error("Failed to fetch client bookings");
      console.error(err);
      setBookings([]);
      setBookingsSummary(null);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.current,
    pagination.pageSize,
    listStatusTab,
    filterEventName,
    filterVenueId,
    filterDateRange,
    user?.access_token,
  ]);

  useEffect(() => {
    fetchBookingsList();
  }, [fetchBookingsList]);

  const onListStatusTabChange = (key) => {
    setListStatusTab(key);
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleFilterEventNameChange = (value) => {
    setFilterEventName(value);
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleFilterDateRangeChange = (value) => {
    setFilterDateRange(value);
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleFilterVenueChange = (value) => {
    setFilterVenueId(value);
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleTableChange = (paginationConfig) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const showEventDetailsDrawer = (record) => {
    setSelectedEvent(record);
    setEditingAdvanceKey(null); // Reset edit mode when opening drawer
    // Initialize editing advances based on event type
    let advancesToEdit = [];

    if (isCompletePaymentWedding(record)) {
      // Complete wedding: use only first event type advances
      record.eventTypes?.[0]?.advances?.forEach((adv) => {
        advancesToEdit.push({
          advanceNumber: adv.advanceNumber,
          expectedAmount: adv.expectedAmount,
          advanceDate: adv.advanceDate,
          receivedAmount: adv.receivedAmount || "",
          receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : null,
          givenBy: adv.givenBy || "",
          collectedBy: adv.collectedBy || "",
          modeOfPayment: adv.modeOfPayment || "",
          remarks: adv.remarks || "",
          eventTypeIndex: 0,
          eventTypeId: record.eventTypes?.[0]?._id || 0,
        });
      });
    } else {
      // Separate mode or non-wedding: all event types
      record.eventTypes?.forEach((et, etIndex) => {
        et.advances?.forEach((adv) => {
          advancesToEdit.push({
            advanceNumber: adv.advanceNumber,
            expectedAmount: adv.expectedAmount,
            advanceDate: adv.advanceDate,
            receivedAmount: adv.receivedAmount || "",
            receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : null,
            givenBy: adv.givenBy || "",
            collectedBy: adv.collectedBy || "",
            modeOfPayment: adv.modeOfPayment || "",
            remarks: adv.remarks || "",
            eventTypeIndex: etIndex,
            eventTypeId: et._id || etIndex,
          });
        });
      });
    }

    setEditingAdvances(advancesToEdit);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setSelectedEvent(null);
    setEditingAdvances([]);
    setSavingAdvance(null);
    setEditingAdvanceKey(null);
  };

  const handleAdvanceChange = (index, field, value) => {
    const updated = [...editingAdvances];
    updated[index][field] = value;
    setEditingAdvances(updated);
  };

  // Generate unique key for advance (for tracking edit state)
  const getAdvanceKey = (advance) => {
    return `advance-${advance.advanceNumber}-${
      advance.eventTypeIndex ?? "common"
    }`;
  };

  // Start editing an advance
  const startEditingAdvance = (advance) => {
    const key = getAdvanceKey(advance);
    setEditingAdvanceKey(key);
  };

  // Cancel editing an advance
  const cancelEditingAdvance = () => {
    setEditingAdvanceKey(null);
    // Reset the advance data to original values
    if (selectedEvent) {
      showEventDetailsDrawer(selectedEvent);
    }
  };

  const saveAdvance = async (advanceIndex) => {
    const advance = editingAdvances[advanceIndex];

    if (!advance.expectedAmount) {
      message.warning("Expected amount is required");
      return;
    }

    setSavingAdvance(advanceIndex);
    try {
      let endpoint = "";
      let payload = {
        expectedAmount: parseFloat(advance.expectedAmount),
      };

      // Include received amount and date if provided
      if (advance.receivedAmount) {
        payload.receivedAmount = parseFloat(advance.receivedAmount);
      }
      if (advance.receivedDate) {
        payload.receivedDate = advance.receivedDate.toISOString();
      }

      // Include additional fields
      if (advance.givenBy) {
        payload.givenBy = advance.givenBy;
      }
      if (advance.collectedBy) {
        payload.collectedBy = advance.collectedBy;
      }
      if (advance.modeOfPayment) {
        payload.modeOfPayment = advance.modeOfPayment;
      }
      if (advance.remarks) {
        payload.remarks = advance.remarks;
      }

      // Event-specific advances (always use event-types endpoint)
      const eventType = selectedEvent.eventTypes?.[advance.eventTypeIndex];
      if (!eventType) {
        message.error("Event type not found");
        return;
      }
      endpoint = `events/${selectedEvent._id}/event-types/${
        eventType._id || advance.eventTypeId || advance.eventTypeIndex
      }/advances/${advance.advanceNumber}`;

      await axiosClient.patch(endpoint, payload, config);

      message.success(`Advance ${advance.advanceNumber} updated successfully`);

      // Exit edit mode
      setEditingAdvanceKey(null);

      // Refresh table data (use current list-view filters)
      await fetchBookingsList();

      // Fetch updated event data to refresh drawer
      const updatedEventResponse = await axiosClient.get(
        `events/${selectedEvent._id}`,
        config,
      );
      const updatedEvent =
        updatedEventResponse.data.event ||
        updatedEventResponse.data.data ||
        updatedEventResponse.data;
      if (updatedEvent) {
        showEventDetailsDrawer(updatedEvent);
      }
    } catch (err) {
      message.error("Failed to update advance");
      console.error(err);
    } finally {
      setSavingAdvance(null);
    }
  };

  const tabItems = [
    {
      key: "list",
      label: "List View",
      children: (
        <ClientBookingsListTab
          bookings={bookings}
          loading={loading}
          filterEventName={filterEventName}
          filterDateRange={filterDateRange}
          filterVenueId={filterVenueId}
          eventNameOptions={eventNameOptions}
          venueOptions={venueOptions}
          listStatusTab={listStatusTab}
          onListStatusTabChange={onListStatusTabChange}
          setFilterEventName={handleFilterEventNameChange}
          setFilterDateRange={handleFilterDateRangeChange}
          setFilterVenueId={handleFilterVenueChange}
          bookingsSummary={bookingsSummary}
          pagination={pagination}
          handleTableChange={handleTableChange}
          showEventDetailsDrawer={showEventDetailsDrawer}
          accessToken={user?.access_token}
          onBookingsMutated={fetchBookingsList}
          cutoffDate={user?.dataCutoffDate}
        />
      ),
    },
    {
      key: "calendar",
      label: "Confirmed Events Calendar",
      children: <CalendarClients />,
    },
   
    {
      key: "Progresscalendar",
      label: "In progress / Almost booked / Cancelled Calendar",
      children: <InprogressCalendarPage />,
    },
    {
      key: "advanceCalendar",
      label: "Advance Calendar",
      children: <AdvanceCalendarClients />,
    },
    {
      key: "balanceSheet",
      label: "Balance Sheet",
      children: <BalanceSheets />,
    },
    {
      key: "leaderboard",
      label: "LeaderBoard",
      children: <UserWiseClients />,
    },
    {
      key: "leads",
      label: "Leads",
      children: <ClientBookingsLeadsTab />,
    },
  ];

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Bookings"
          title="Bookings Dashboard"
          subtitle="Every client booking, its payments and calendars in one place."
          onBack={() => navigate("/user")}
        />

        <section className="pk-panel">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className="bk-tabs"
          />
        </section>
      </div>

      <EventDetailsDrawer
        open={drawerVisible}
        onClose={closeDrawer}
        event={selectedEvent}
        editing={{
          advances: editingAdvances,
          editingKey: editingAdvanceKey,
          savingIndex: savingAdvance,
          getKey: getAdvanceKey,
          onChange: handleAdvanceChange,
          onStart: startEditingAdvance,
          onCancel: cancelEditingAdvance,
          onSave: saveAdvance,
        }}
      />
    </div>
  );
};

export default ViewClientsBookings;
