import React from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CalendarClients from "../Components/calendarClients";

const CalenderPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-linear-to-tr from-indigo-50 via-white to-purple-50 px-4 sm:px-6 py-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-indigo-700 transition-all duration-200 font-medium group"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
              Event Calendar
            </h1>
          </div> */}

          {/* Spacer for alignment */}
          <div className="w-16 hidden sm:block" />
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
          <CalendarClients />
        </div>

      </div>
    </div>
  );
};

export default CalenderPage;
