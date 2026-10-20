import React, { useState } from "react";
import axiosClient from "@/api/axiosClient";
import { message } from "antd";
import { useSelector } from "react-redux";
import { FormActions, TextField } from "@/Components/FormKit";

/** Add-venue form, used inside a dialog. */
const AddVenue = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.user.value);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!name.trim()) {
      setError("Please enter a venue name");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: user?.access_token ? `Bearer ${user.access_token}` : undefined,
        },
      };

      await axiosClient.post(`venue`, { name: name.trim() }, config);

      message.success("Venue added");
      setName("");
      onSuccess?.();
    } catch (err) {
      console.error("AddVenue error:", err);
      message.error("Failed to add venue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField
        label="Venue name"
        required
        autoFocus
        value={name}
        onChange={(v) => {
          setName(v);
          if (error) setError("");
        }}
        placeholder="e.g. Grand Palace"
        error={error}
      />
      <FormActions onCancel={onCancel} submitLabel="Add venue" busy={loading} />
    </form>
  );
};

export default AddVenue;
