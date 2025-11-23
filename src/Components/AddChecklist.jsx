import React, { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { API_BASE_URL } from "../../config";
import { useSelector } from "react-redux";
import axios from "axios";

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

const emptyChecklist = {
  checklistName: "",
  units: "",
  quantity: "",
  length: "",
  breadth: "",
  depth: "",
  rate: "",
};

const emptySubHeading = {
  subHeadingName: "",
  checklists: [{ ...emptyChecklist }],
};

const AddChecklist = () => {
  const [heading, setHeading] = useState("");
  const [eventReference, setEventReference] = useState("");
  const [subHeadings, setSubHeadings] = useState([{ ...emptySubHeading }]);
  const [loading, setLoading] = useState(false);

  const user = useSelector((state) => state.user.value);
  const departmentId = user.departments[0]?.id;

  const config = {
    headers: {
      Authorization: user?.access_token,
    },
  };

  const addSubHeading = () => {
    setSubHeadings([...subHeadings, { ...emptySubHeading }]);
  };

  const removeSubHeading = (index) => {
    const newSubHeadings = subHeadings.filter((_, i) => i !== index);
    setSubHeadings(
      newSubHeadings.length === 0 ? [{ ...emptySubHeading }] : newSubHeadings
    );
  };

  const updateSubHeadingName = (index, value) => {
    const newSubHeadings = [...subHeadings];
    newSubHeadings[index].subHeadingName = value;
    setSubHeadings(newSubHeadings);
  };

  const addChecklist = (subHeadingIndex) => {
    const newSubHeadings = [...subHeadings];
    newSubHeadings[subHeadingIndex].checklists.push({ ...emptyChecklist });
    setSubHeadings(newSubHeadings);
  };

  const removeChecklist = (subHeadingIndex, checklistIndex) => {
    const newSubHeadings = [...subHeadings];
    const checklists = newSubHeadings[subHeadingIndex].checklists.filter(
      (_, i) => i !== checklistIndex
    );
    newSubHeadings[subHeadingIndex].checklists =
      checklists.length === 0 ? [{ ...emptyChecklist }] : checklists;
    setSubHeadings(newSubHeadings);
  };

  const updateChecklist = (subHeadingIndex, checklistIndex, field, value) => {
    const newSubHeadings = [...subHeadings];
    newSubHeadings[subHeadingIndex].checklists[checklistIndex][field] = value;
    setSubHeadings(newSubHeadings);
  };

  const handleSubmit = async () => {
    // Validate heading
    if (!heading.trim()) {
      alert("Please enter a checklist heading");
      return;
    }

    // Validate sub headings
    const validSubHeadings = subHeadings.filter(
      (sh) => sh.subHeadingName.trim() !== ""
    );
    if (validSubHeadings.length === 0) {
      alert("Please add at least one sub heading");
      return;
    }

    // Validate checklists for each sub heading
    for (let i = 0; i < validSubHeadings.length; i++) {
      const validChecklists = validSubHeadings[i].checklists.filter(
        (c) => c.checklistName.trim() !== ""
      );
      if (validChecklists.length === 0) {
        alert(
          `Please add at least one checklist for sub heading "${validSubHeadings[i].subHeadingName}"`
        );
        return;
      }
      validSubHeadings[i].checklists = validChecklists;
    }

    if (!departmentId) {
      alert("Department ID not found");
      return;
    }

    setLoading(true);

    const payload = {
      heading: heading.trim(),
      eventReference: eventReference.trim() || undefined,
      subHeadings: validSubHeadings,
      department: departmentId,
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}checklist`,
        payload,
        config
      );

      if (response.status === 200 || response.status === 201) {
        alert("Checklist added successfully!");
        setHeading("");
        setEventReference("");
        setSubHeadings([{ ...emptySubHeading }]);
      }
    } catch (error) {
      alert("Error submitting checklist");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 p-6">
      <style>{customStyles}</style>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4 slide-in-top">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-xl hover:bg-indigo-50/80 transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={20} className="text-indigo-600" />
            <span className="text-indigo-600 font-medium">Back</span>
          </button>
          <h1 className="text-3xl font-bold gradient-text">Add Checklist</h1>
        </div>

        {/* Form Card */}
        <div
          className="glass-card p-8 slide-in-top"
          style={{ animationDelay: "0.1s" }}
        >
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

          {/* Sub Headings */}
          <div className="mb-6">
            <label className="block text-base font-semibold mb-3 text-indigo-700">
              Sub Headings <span className="text-pink-500">*</span>
            </label>

            {subHeadings.map((subHeading, subHeadingIndex) => (
              <div
                key={subHeadingIndex}
                className="mb-6 p-5 bg-white/80 border-2 border-indigo-200 rounded-xl shadow-md slide-in-top"
                style={{ animationDelay: `${0.1 + subHeadingIndex * 0.05}s` }}
              >
                {/* Sub Heading Header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-indigo-100">
                  <div className="flex-1 mr-4">
                    <label className="block text-sm font-semibold mb-2 text-indigo-700">
                      Sub Heading <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter sub heading name"
                      value={subHeading.subHeadingName}
                      onChange={(e) =>
                        updateSubHeadingName(subHeadingIndex, e.target.value)
                      }
                      className="w-full px-4 py-2 text-base bg-white/60 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <button
                    onClick={() => removeSubHeading(subHeadingIndex)}
                    className="p-2 text-pink-500 hover:bg-pink-50 rounded-xl transition-all duration-300 self-end"
                    disabled={subHeadings.length === 1}
                    title="Remove Sub Heading"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Checklists for this Sub Heading */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-3 text-indigo-700">
                    Checklists <span className="text-pink-500">*</span>
                  </label>

                  {subHeading.checklists.map((checklist, checklistIndex) => (
                    <div
                      key={checklistIndex}
                      className="mb-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl shadow-sm slide-in-top"
                      style={{
                        animationDelay: `${0.1 + checklistIndex * 0.03}s`,
                      }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-indigo-600 font-medium">
                          Checklist {checklistIndex + 1}
                        </span>
                        <button
                          onClick={() =>
                            removeChecklist(subHeadingIndex, checklistIndex)
                          }
                          className="p-2 text-pink-500 hover:bg-pink-50 rounded-xl transition-all duration-300"
                          disabled={subHeading.checklists.length === 1}
                          title="Remove Checklist"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Checklist Name (required) */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-semibold mb-1 text-indigo-700">
                            Checklist Name{" "}
                            <span className="text-pink-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Enter checklist name"
                            value={checklist.checklistName}
                            onChange={(e) =>
                              updateChecklist(
                                subHeadingIndex,
                                checklistIndex,
                                "checklistName",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 text-base bg-white/60 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
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
                            value={checklist.units}
                            onChange={(e) =>
                              updateChecklist(
                                subHeadingIndex,
                                checklistIndex,
                                "units",
                                e.target.value
                              )
                            }
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
                            value={checklist.quantity}
                            onChange={(e) =>
                              updateChecklist(
                                subHeadingIndex,
                                checklistIndex,
                                "quantity",
                                e.target.value
                              )
                            }
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
                            value={checklist.length}
                            onChange={(e) =>
                              updateChecklist(
                                subHeadingIndex,
                                checklistIndex,
                                "length",
                                e.target.value
                              )
                            }
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
                            value={checklist.breadth}
                            onChange={(e) =>
                              updateChecklist(
                                subHeadingIndex,
                                checklistIndex,
                                "breadth",
                                e.target.value
                              )
                            }
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
                            value={checklist.depth}
                            onChange={(e) =>
                              updateChecklist(
                                subHeadingIndex,
                                checklistIndex,
                                "depth",
                                e.target.value
                              )
                            }
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
                            value={checklist.rate}
                            onChange={(e) =>
                              updateChecklist(
                                subHeadingIndex,
                                checklistIndex,
                                "rate",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 text-base bg-white/60 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addChecklist(subHeadingIndex)}
                    className="w-full mt-3 px-4 py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-300 flex items-center justify-center gap-2 slide-in-top"
                    style={{
                      animationDelay: `${
                        0.1 + subHeading.checklists.length * 0.03
                      }s`,
                    }}
                  >
                    <Plus size={18} />
                    <span className="font-medium">Add Checklist</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addSubHeading}
              className="w-full mt-3 px-4 py-3 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-300 flex items-center justify-center gap-2 slide-in-top"
              style={{
                animationDelay: `${0.1 + subHeadings.length * 0.05}s`,
              }}
            >
              <Plus size={18} />
              <span className="font-medium">Add Sub Heading</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full px-6 py-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-300 disabled:to-purple-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl slide-in-top"
            style={{
              animationDelay: `${0.1 + (subHeadings.length + 1) * 0.05}s`,
            }}
          >
            {loading ? "Submitting..." : "Submit Checklist"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddChecklist;
