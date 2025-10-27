/* eslint-disable no-unused-vars */
import React from "react";
import { motion } from "motion/react";
import { Clock } from "lucide-react";
import Lottie from "lottie-react";
import clockanimation from "../../assets/clock.json";
import accounts from "../../assets/accounts.json";
import bookings from "../../assets/bookings.json";
import designteam from "../../assets/designteam.json";
import lunch from "../../assets/lunch.json";
import office from "../../assets/office.json";
import onlinemeet from "../../assets/onlinemeet.json";
import outsidemeeting from "../../assets/outsidemeeting.json";
import tender from "../../assets/tender.json";

// Mapping meeting titles to respective Lottie animations
const lottieMap = {
  Accounts: accounts,
  "Design Team": designteam,
  BOOKINGS: bookings,
  "Any meetings For Out Side": outsidemeeting,
  LUNCH: lunch,
  "Tenders and Documentation": tender,
  "Visiting Offices": office,
  "New Design team Meeting": designteam,
  "Software Online Meeting": onlinemeet,
};

const Meetings = () => {
  const meetingData = [
    {
      id: 1,
      time: "10:00 AM - 11:00 AM",
      title: "Accounts",
      items: [
        "Cheque",
        "EMIS/Yesterday/Today/Tomorrow",
        "Invoices",
        "TDS Deduction/Payable",
        "Vendors Payable",
        "Collection From Client",
        "Budget Report",
        "Vendor Finalization",
        "Others",
      ],
      color: "#ECFAE5",
    },
    {
      id: 2,
      time: "11:00 AM - 11:30 AM",
      title: "Design Team",
      items: ["Present Works", "Future works"],
      color: "#FFEDF3",
    },
    {
      id: 3,
      time: "11:30 AM - 12:00 PM",
      title: "BOOKINGS",
      items: ["Varsha", "Rishi", "Shazia"],
      color: "#ECF9FF",
    },
    {
      id: 4,
      time: "12:00 PM - 1:00 PM",
      title: "Any meetings For Out Side",
      items: [],
      color: "#F5EFFF",
    },
    {
      id: 5,
      time: "1:00 PM - 2:00 PM",
      title: "LUNCH",
      items: [],
      color: "#FFFBEB",
    },
    {
      id: 6,
      time: "2:00 PM - 2:30 PM",
      title: "Tenders and Documentation",
      items: [],
      color: "#FFE5D4",
    },
    {
      id: 7,
      time: "2:30 PM - 8:00 PM",
      title: "Visiting Offices",
      items: [],
      color: "#FFEFEF",
    },
    {
      id: 8,
      time: "8:00 PM - 10:00 PM",
      title: "New Design team Meeting",
      items: [],
      color: "#FFE2E2",
    },
    {
      id: 9,
      time: "10:00 PM - 11:00 PM",
      title: "Software Online Meeting",
      items: [],
      color: "#F8F9FE",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, scale: 0.8 },
    show: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-[cormoreg]">
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 text-center">
          Daily Schedule
        </h1>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
      >
        {meetingData.map((meeting) => {
          const lottieAnim = lottieMap[meeting.title] || clockanimation; // fallback to clockanimation
          return (
            <motion.div
              key={meeting.id}
              variants={item}
              whileHover={{ y: -8 }}
              className="group"
            >
              <div
                className="h-full rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                style={{ backgroundColor: meeting.color }}
              >
                <div className="p-6 h-full flex flex-col">
                  {/* Lottie Icon */}
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center overflow-hidden">
                      <Lottie animationData={lottieAnim} loop={true} />
                    </div>
                  </div>

                  {/* Time - with static clock icon */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <Lottie
                        animationData={clockanimation}
                        loop={true}
                        style={{ width: 20, height: 20 }}
                      />
                    </div>
                    <span className="text-base font-semibold text-gray-700">
                      {meeting.time}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                    {meeting.title}
                  </h3>

                  {/* Items List */}
                  {meeting.items.length > 0 && (
                    <div className="flex-1 space-y-2">
                      {meeting.items.map((taskItem, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-700 mt-2 flex-shrink-0"></div>
                          <span className="text-base font-semibold text-gray-800 leading-relaxed">
                            {taskItem}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Uncomment if you want a message for empty agenda */}
                  {/* {meeting.items.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-gray-600 text-sm italic">
                        No specific agenda
                      </span>
                    </div>
                  )} */}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Meetings;
