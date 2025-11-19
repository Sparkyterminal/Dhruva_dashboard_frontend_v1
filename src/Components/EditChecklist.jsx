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
  const [points, setPoints] = useState(['']);
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
      setHeading(data.heading);
      setPoints(data.points);
      setDepartmentId(data.department.id);
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
    setPoints([...points, '']);
  };

  const removePoint = (index) => {
    const newPoints = points.filter((_, i) => i !== index);
    setPoints(newPoints.length === 0 ? [''] : newPoints);
  };

  const updatePoint = (index, value) => {
    const newPoints = [...points];
    newPoints[index] = value;
    setPoints(newPoints);
  };

  const handleSubmit = async () => {
    // Validation
    if (!heading.trim()) {
      message.error('Please enter a heading');
      return;
    }

    const validPoints = points.filter(p => p.trim() !== '');
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
      <div className="max-w-3xl mx-auto">
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

          {/* Checklist Points */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-3 text-indigo-700">
              Checklist Points <span className="text-pink-500">*</span>
            </label>
            
            {points.map((point, index) => (
              <div key={index} className="flex gap-3 mb-3 items-start slide-in-top" style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
                <span className="text-indigo-600 font-medium pt-3 min-w-6">
                  {index + 1}.
                </span>
                <textarea
                  placeholder="Enter checklist point"
                  value={point}
                  onChange={(e) => updatePoint(index, e.target.value)}
                  rows={2}
                  className="flex-1 px-4 py-3 text-base bg-white/60 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-y transition-all duration-300"
                />
                <button
                  onClick={() => removePoint(index)}
                  className="p-3 text-pink-500 hover:bg-pink-50 rounded-xl transition-all duration-300"
                  disabled={points.length === 1}
                >
                  <Trash2 size={18} />
                </button>
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
