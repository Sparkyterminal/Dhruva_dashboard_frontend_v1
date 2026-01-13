<<<<<<< HEAD
import React, { useState } from "react";
import { Typography, Input, Button, Card, message } from "antd";
import { useSelector } from "react-redux";
import axios from "axios";
// import { API_BASE_URL } from "../../../config";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../../config";

const { Title, Text } = Typography;

const AddEvent = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.user.value);
  const config = { headers: { Authorization: user?.access_token } };
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !name.trim()) return message.error("Please enter an event name");
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}event-names`, { name: name.trim() }, config);
      message.success("Event created successfully");
      navigate(-1);
    } catch (err) {
      console.error(err);
      message.error("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName("");
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar with Back button */}
      <div className="flex items-center gap-3 px-6 pt-4">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
        <Title level={3} className="!mb-0">
          Add Event
        </Title>
      </div>

      {/* Card-like container */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Text strong>Event name</Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter event name"
                size="large"
                className="w-full rounded-lg border border-gray-300"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEvent;
=======
import React, { useState } from "react";
import { Typography, Input, Button, Card, message } from "antd";
import { useSelector } from "react-redux";
import axios from "axios";
// import { API_BASE_URL } from "../../../config";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../../config";

const { Title, Text } = Typography;

const AddEvent = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.user.value);
  const config = { headers: { Authorization: user?.access_token } };
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !name.trim()) return message.error("Please enter an event name");
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}event-names`, { name: name.trim() }, config);
      message.success("Event created successfully");
      navigate(-1);
    } catch (err) {
      console.error(err);
      message.error("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName("");
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar with Back button */}
      <div className="flex items-center gap-3 px-6 pt-4">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
        <Title level={3} className="!mb-0">
          Add Event
        </Title>
      </div>

      {/* Card-like container */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Text strong>Event name</Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter event name"
                size="large"
                className="w-full rounded-lg border border-gray-300"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEvent;
>>>>>>> b102b10a05c3c3d535861fb6f47bfb8852d511c4
