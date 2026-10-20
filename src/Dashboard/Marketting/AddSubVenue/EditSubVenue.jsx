import React, { useEffect, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { message } from "antd";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { FormActions, FormCard, SelectField, TextField } from "@/Components/FormKit";
import { PageHero } from "@/Components/PageKit";

const EditSubVenue = () => {
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [venue, setVenue] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({});

  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();
  const { id } = useParams();

  const config = {
    headers: {
      Authorization: user?.access_token ? `Bearer ${user.access_token}` : undefined,
      "Content-Type": "application/json",
    },
  };

  const fetchVenues = async () => {
    setVenuesLoading(true);
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
      setVenues(list);
    } catch (err) {
      console.error("fetchVenues error:", err);
      message.error("Failed to load venues");
    } finally {
      setVenuesLoading(false);
    }
  };

  const fetchSubVenue = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(`sub-venue-location/${id}`, config);
      const data = res.data.data || res.data;
      setName(data.name || "");
      setVenue(data.venue?.id || data.venue || "");
    } catch (err) {
      console.error("fetchSubVenue error:", err);
      message.error("Failed to load sub venue");
      navigate("/user/viewsubvenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
    fetchSubVenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdate = async (e) => {
    e?.preventDefault?.();
    const next = {};
    if (!venue) next.venue = "Please select a venue";
    if (!name.trim()) next.name = "Please enter a sub venue name";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      setLoading(true);
      await axiosClient.patch(`sub-venue-location/${id}`, { venue, name: name.trim() }, config);
      message.success("Sub venue updated successfully");
      setTimeout(() => navigate("/user/viewsubvenue"), 1000);
    } catch (err) {
      console.error("update sub venue error:", err);
      message.error(err.response?.data?.message || "Failed to update sub venue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Masterdata"
          title="Edit sub venue"
          subtitle="Change the venue it belongs to, or its name."
          onBack={() => navigate("/user/viewsubvenue")}
          backLabel="Back to sub venues"
        />
        <FormCard onSubmit={handleUpdate} width={520}>
          <SelectField
            label="Venue"
            required
            value={venue}
            onChange={(v) => {
              setVenue(v);
              setErrors((p) => ({ ...p, venue: "" }));
            }}
            options={venues.map((v) => ({ value: v.id, label: v.name }))}
            placeholder="Select venue"
            loading={venuesLoading}
            disabled={loading}
            error={errors.venue}
          />
          <TextField
            label="Sub venue name"
            required
            value={name}
            onChange={(v) => {
              setName(v);
              setErrors((p) => ({ ...p, name: "" }));
            }}
            placeholder="Enter sub venue name"
            disabled={loading}
            error={errors.name}
          />
          <FormActions
            onCancel={() => navigate("/user/viewsubvenue")}
            submitLabel="Update sub venue"
            busy={loading}
            busyLabel="Please wait…"
          />
        </FormCard>
      </div>
    </div>
  );
};

export default EditSubVenue;
