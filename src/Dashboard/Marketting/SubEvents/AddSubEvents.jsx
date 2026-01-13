import React, { useEffect, useState } from "react";
import { Typography, Select, Input, Button, message } from "antd";
import { useSelector } from "react-redux";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const AddSubEvents = () => {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [event, setevent] = useState("");
  const [subEventName, setSubEventName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();
  const config = { headers: { Authorization: user?.access_token } };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await axios.get(`${API_BASE_URL}event-names`, config);
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
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event) return message.error("Please select an event");
    if (!subEventName || !subEventName.trim())
      return message.error("Please enter sub event name");

    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE_URL}event-types`,
        { event, name: subEventName.trim() },
        config
      );
      message.success("Sub event created successfully");
      // navigate(-1);
    } catch (err) {
      console.error(err);
      message.error("Failed to create sub event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setevent("");
    setSubEventName("");
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
          Add Sub Event
        </Title>
      </div>

      {/* Card-like container */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event dropdown */}
            <div className="space-y-2">
              <Text strong>Select event</Text>
              <Select
                showSearch
                optionFilterProp="label"
                filterOption={(input, option) =>
                  String(option?.label || "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={events.map((ev) => ({
                  label: ev.name,
                  value: ev.id || ev._id,
                }))}
                value={event || undefined}
                onChange={(val) => setevent(val)}
                placeholder={
                  loadingEvents ? "Loading events..." : "Select an event"
                }
                loading={loadingEvents}
                allowClear
                className="w-full"
              />
            </div>

            {/* Sub event name input */}
            <div className="space-y-2">
              <Text strong>Sub event name</Text>
              <Input
                value={subEventName}
                onChange={(e) => setSubEventName(e.target.value)}
                placeholder="Enter sub event name"
                size="large"
                className="w-full"
              />
            </div>

            {/* Actions */}
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
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSubEvents;
