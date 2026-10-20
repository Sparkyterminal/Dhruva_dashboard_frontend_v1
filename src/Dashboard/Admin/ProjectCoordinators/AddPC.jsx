import React, { useState } from "react";
import axiosClient from "@/api/axiosClient";
import { useNavigate } from "react-router-dom";
import { FormActions, FormCard, TextField } from "@/Components/FormKit";
import { toast } from "@/Components/AdminKit/toast";
import { PageHero } from "@/Components/PageKit";

/** Add-coordinator form. Inside a dialog (onCancel given) or as its own page. */
const AddPC = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const standalone = !onCancel;
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!name.trim()) {
      setError("Please enter coordinator name");
      return;
    }
    setLoading(true);
    try {
      await axiosClient.post(`coordinators`, { name: name.trim() });
      toast.success("Coordinator added successfully");
      setName("");
      setError("");
      onSuccess?.();
    } catch (err) {
      console.error("AddPC error:", err);
      toast.error("Failed to add coordinator");
    } finally {
      setLoading(false);
    }
  };

  const fields = (
    <>
      <TextField
        label="Coordinator name"
        required
        autoFocus
        value={name}
        onChange={(v) => {
          setName(v);
          if (error) setError("");
        }}
        placeholder="Enter coordinator name"
        error={error}
      />
      <FormActions
        onCancel={standalone ? () => navigate("/dashboard/viewprojectcoordinator") : onCancel}
        submitLabel="Add coordinator"
        busy={loading}
      />
    </>
  );

  if (!standalone) {
    return (
      <form onSubmit={handleSubmit} noValidate>
        {fields}
      </form>
    );
  }

  return (
    <div className="pk-wrap" style={{ maxWidth: 620 }}>
      <PageHero
        eyebrow="Admin"
        title="Add project coordinator"
        subtitle="A coordinator that can be assigned to bookings and leads."
        onBack={() => navigate("/dashboard/viewprojectcoordinator")}
        backLabel="Back to coordinators"
      />
      <FormCard onSubmit={handleSubmit} width={560}>
        {fields}
      </FormCard>
    </div>
  );
};

export default AddPC;
