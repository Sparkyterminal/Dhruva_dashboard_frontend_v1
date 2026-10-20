import React, { useState } from "react";
import { message } from "antd";
import { useSelector } from "react-redux";
import axiosClient from "@/api/axiosClient";
import { useNavigate } from "react-router-dom";
import { FormActions, FormCard, TextField } from "@/Components/FormKit";
import { PageHero } from "@/Components/PageKit";

/** Add an event name. `inModal` renders just the form (for use inside a dialog). */
const AddEvent = ({ inModal = false, onSuccess, onCancel } = {}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.user.value);
  const config = { headers: { Authorization: user?.access_token } };
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!name || !name.trim()) {
      setError("Please enter an event name");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axiosClient.post(`event-names`, { name: name.trim() }, config);
      message.success("Event created successfully");
      onSuccess?.(res.data);
      if (inModal) {
        onCancel?.();
      } else {
        navigate(-1);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (inModal) onCancel?.();
    else navigate(-1);
  };

  const fields = (
    <>
      <TextField
        label="Event name"
        required
        autoFocus
        value={name}
        onChange={(v) => {
          setName(v);
          if (error) setError("");
        }}
        placeholder="e.g. Wedding"
        error={error}
      />
      <FormActions onCancel={handleCancel} submitLabel="Add event name" busy={loading} />
    </>
  );

  if (inModal) {
    return (
      <form onSubmit={handleSubmit} noValidate>
        {fields}
      </form>
    );
  }

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Masterdata"
          title="Add event name"
          subtitle="A new kind of event that can be booked."
          onBack={() => navigate(-1)}
          backLabel="Back"
        />
        <FormCard onSubmit={handleSubmit} width={520}>
          {fields}
        </FormCard>
      </div>
    </div>
  );
};

export default AddEvent;
