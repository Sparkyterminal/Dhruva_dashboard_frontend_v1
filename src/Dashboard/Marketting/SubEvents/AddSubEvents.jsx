import React, { useEffect, useState } from "react";
import { message } from "antd";
import { useSelector } from "react-redux";
import axiosClient from "@/api/axiosClient";
import { useNavigate } from "react-router-dom";
import { FormActions, FormCard, SelectField, TextField } from "@/Components/FormKit";
import { PageHero } from "@/Components/PageKit";

const AddSubEvents = () => {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [event, setEvent] = useState("");
  const [subEventName, setSubEventName] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();
  const config = { headers: { Authorization: user?.access_token } };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await axiosClient.get(`event-names`, config);
      setEvents(res.data.events.reverse() || res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch events");
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!event) next.event = "Please select an event";
    if (!subEventName || !subEventName.trim()) next.name = "Please enter a sub event name";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await axiosClient.post(`event-types`, { event, name: subEventName.trim() }, config);
      message.success("Sub event created successfully");
      setSubEventName("");
    } catch (err) {
      console.error(err);
      message.error("Failed to create sub event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEvent("");
    setSubEventName("");
    setErrors({});
  };

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Masterdata"
          title="Add sub event"
          subtitle="A ceremony that belongs to an event, such as Muhurtham or Reception."
          onBack={() => navigate(-1)}
          backLabel="Back"
        />
        <FormCard onSubmit={handleSubmit} width={520}>
          <SelectField
            label="Event"
            required
            value={event}
            onChange={(v) => {
              setEvent(v);
              setErrors((p) => ({ ...p, event: "" }));
            }}
            options={events.map((ev) => ({ label: ev.name, value: ev.id || ev._id }))}
            placeholder="Select an event"
            loading={loadingEvents}
            error={errors.event}
          />
          <TextField
            label="Sub event name"
            required
            value={subEventName}
            onChange={(v) => {
              setSubEventName(v);
              setErrors((p) => ({ ...p, name: "" }));
            }}
            placeholder="e.g. Muhurtham"
            error={errors.name}
          />
          <FormActions
            onCancel={handleCancel}
            cancelLabel="Clear"
            submitLabel="Add sub event"
            busy={submitting}
          />
        </FormCard>
      </div>
    </div>
  );
};

export default AddSubEvents;
