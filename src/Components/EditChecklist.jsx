/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { message } from "antd";
import { useSelector } from "react-redux";
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

// Custom styles for glassmorphism and animations
const customStyles = `
  .glass-card {
    background: rgba(255, 255, 255, 0.75);
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.35);
  }

  .slide-in-top {
    animation: slide-in-top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  }

  @keyframes slide-in-top {
    0% {
      transform: translateY(-50px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .gradient-text {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const EditChecklist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [heading, setHeading] = useState('');
  const [eventReference, setEventReference] = useState('');
  const emptyChecklistPoint = {
    checklistPoint: '',
    units: '',
    length: '',
    breadth: '',
    depth: '',
    quantity: '',
    numbers: '',
    rate: '',
  };
  const [points, setPoints] = useState([ { ...emptyChecklistPoint } ]);
  const [departmentId, setDepartmentId] = useState('');

  const config = {
    headers: {
      Authorization: user?.access_token,
    },
  };

  const fetchChecklistData = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}checklist/${id}`,
        config
      );
      const { data } = res.data;
      setHeading(data.heading || '');
      setEventReference(data.eventReference || '');
      // Ensure points are objects with expected keys
      const fetchedPoints = Array.isArray(data.points) && data.points.length > 0
        ? data.points.map(p => ({
            checklistPoint: p.checklistPoint ?? '',
            units: p.units ?? '',
            length: p.length ?? '',
            breadth: p.breadth ?? '',
            depth: p.depth ?? '',
            quantity: p.quantity ?? '',
            numbers: p.numbers ?? '',
            rate: p.rate ?? '',
          }))
        : [ { ...emptyChecklistPoint } ];
      setPoints(fetchedPoints);
      setDepartmentId(data.department?.id || '');
    } catch (err) {
      message.error("Failed to fetch checklist");
      navigate(-1);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklistData();
  }, [id]);

  const addPoint = () => {
    setPoints([...points, { ...emptyChecklistPoint }]);
  };

  const removePoint = (index) => {
    const newPoints = points.filter((_, i) => i !== index);
    setPoints(newPoints.length === 0 ? [ { ...emptyChecklistPoint } ] : newPoints);
  };

  const updatePoint = (index, field, value) => {
    const newPoints = [...points];
    newPoints[index] = { ...newPoints[index], [field]: value };
    setPoints(newPoints);
  };

  const handleSubmit = async () => {
    // Validation
    if (!heading.trim()) {
      message.error('Please enter a heading');
      return;
    }

    const validPoints = points.filter(p => p.checklistPoint && p.checklistPoint.trim() !== '');
    if (validPoints.length === 0) {
      message.error('Please add at least one checklist point');
      return;
    }

    if (!departmentId) {
      message.error('Department ID not found');
      return;
    }

    setLoading(true);
    
    const payload = {
      heading: heading.trim(),
      eventReference: eventReference?.trim() || undefined,
      points: validPoints,
      department: departmentId
    };

    try {
      await axios.patch(
        `${API_BASE_URL}checklist/${id}`,
        payload,
        config
      );

      message.success('Checklist updated successfully!');
      navigate(-1);
    } catch (error) {
      message.error('Failed to update checklist');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="text-lg text-indigo-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 p-6">
      <style>{customStyles}</style>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4 slide-in-top">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-xl hover:bg-indigo-50/80 transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={20} className="text-indigo-600" />
            <span className="text-indigo-600 font-medium">Back</span>
          </button>
          <h1 className="text-3xl font-bold gradient-text">Edit Checklist</h1>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 slide-in-top" style={{ animationDelay: '0.1s' }}>
          {/* Heading Field */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-2 text-indigo-700">
              Checklist Heading <span className="text-pink-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Daily Tasks, Shopping List, Project Goals"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="w-full px-4 py-3 text-base bg-white/60 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
            />
          </div>

          {/* Event Reference Field */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-2 text-indigo-700">
              Event Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Event #1234, Project XYZ"
              value={eventReference}
              onChange={(e) => setEventReference(e.target.value)}
              className="w-full px-4 py-3 text-base bg-white/60 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
            />
          </div>

          {/* Checklist Points */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-3 text-indigo-700">
              Checklist Points <span className="text-pink-500">*</span>
            </label>

            {points.map((point, index) => (
              <div
                key={index}
                className="mb-4 p-4 bg-white/70 border border-indigo-100 rounded-xl shadow-sm slide-in-top"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-indigo-600 font-medium text-lg">
                    {index + 1}.
                  </span>
                  <button
                    onClick={() => removePoint(index)}
                    className="p-2 text-pink-500 hover:bg-pink-50 rounded-xl transition-all duration-300"
                    disabled={points.length === 1}
                    title="Remove Point"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Checklist Point (required) */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold mb-1 text-indigo-700">
                      Checklist Point <span className="text-pink-500">*</span>
                    </label>
                    <textarea
                      placeholder="Enter checklist point"
                      value={point.checklistPoint}
                      onChange={(e) => updatePoint(index, 'checklistPoint', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-base bg-white/60 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-y transition-all duration-300"
                    />
                  </div>

                  {/* Units */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-indigo-700">
                      Units
                    </label>
                    <input
                      type="text"
                      placeholder="Units"
                      value={point.units}
                      onChange={(e) => updatePoint(index, 'units', e.target.value)}
                      className="w-full px-3 py-2 text-base bg-white/60 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  {/* Length */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-indigo-700">
                      Length
                    </label>
                    <input
                      type="text"
                      placeholder="Length"
                      value={point.length}
                      onChange={(e) => updatePoint(index, 'length', e.target.value)}
                      className="w-full px-3 py-2 text-base bg-white/60 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  {/* Breadth */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-indigo-700">
                      Breadth
                    </label>
                    <input
                      type="text"
                      placeholder="Breadth"
                      value={point.breadth}
                      onChange={(e) => updatePoint(index, 'breadth', e.target.value)}
                      className="w-full px-3 py-2 text-base bg-white/60 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  {/* Depth */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-indigo-700">
                      Depth
                    </label>
                    <input
                      type="text"
                      placeholder="Depth"
                      value={point.depth}
                      onChange={(e) => updatePoint(index, 'depth', e.target.value)}
                      className="w-full px-3 py-2 text-base bg-white/60 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-indigo-700">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Quantity"
                      value={point.quantity}
                      onChange={(e) => updatePoint(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 text-base bg-white/60 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  {/* Numbers */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-indigo-700">
                      Numbers
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Numbers"
                      value={point.numbers}
                      onChange={(e) => updatePoint(index, 'numbers', e.target.value)}
                      className="w-full px-3 py-2 text-base bg-white/60 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  {/* Rate */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-indigo-700">
                      Rate
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Rate"
                      value={point.rate}
                      onChange={(e) => updatePoint(index, 'rate', e.target.value)}
                      className="w-full px-3 py-2 text-base bg-white/60 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addPoint}
              className="w-full mt-3 px-4 py-3 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-300 flex items-center justify-center gap-2 slide-in-top"
              style={{ animationDelay: `${0.1 + points.length * 0.05}s` }}
            >
              <Plus size={18} />
              <span className="font-medium">Add Point</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full px-6 py-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-300 disabled:to-purple-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl slide-in-top"
            style={{ animationDelay: `${0.1 + (points.length + 1) * 0.05}s` }}
          >
            {loading ? 'Updating...' : 'Update Checklist'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditChecklist;
