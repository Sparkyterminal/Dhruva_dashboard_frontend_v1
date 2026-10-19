import React from "react";
import {
  Building2,
  CalendarCheck,
  Clock,
  FileSignature,
  Handshake,
  Landmark,
  PenTool,
  Utensils,
  Video,
} from "lucide-react";

const MEETING_ICONS = {
  Accounts: Landmark,
  "Design Team": PenTool,
  BOOKINGS: CalendarCheck,
  "Any meetings For Out Side": Handshake,
  Lunch: Utensils,
  "Tenders and Documentation": FileSignature,
  "Visiting Offices": Building2,
  "New Design team Meeting": PenTool,
  "Software Online Meeting": Video,
};

const MEETINGS = [
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
  },
  {
    id: 2,
    time: "11:00 AM - 11:30 AM",
    title: "Design Team",
    items: ["Present Works", "Future works"],
  },
  {
    id: 3,
    time: "11:30 AM - 12:00 PM",
    title: "BOOKINGS",
    items: ["Varsha", "Rishi", "Shazia"],
  },
  { id: 4, time: "12:00 PM - 1:00 PM", title: "Any meetings For Out Side", items: [] },
  { id: 5, time: "1:00 PM - 2:00 PM", title: "Lunch", items: [] },
  { id: 6, time: "2:00 PM - 2:30 PM", title: "Tenders and Documentation", items: [] },
  { id: 7, time: "2:30 PM - 8:00 PM", title: "Visiting Offices", items: [] },
  { id: 8, time: "8:00 PM - 10:00 PM", title: "New Design team Meeting", items: [] },
  { id: 9, time: "10:00 PM - 11:00 PM", title: "Software Online Meeting", items: [] },
];

const Meetings = () => (
  <div className="min-h-screen p-4 sm:p-6 lg:p-10">
    <div className="max-w-7xl mx-auto mb-10">
      <h1 className="font-display text-5xl sm:text-6xl text-center">
        Daily Schedule
      </h1>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
      {MEETINGS.map((meeting) => {
        const Icon = MEETING_ICONS[meeting.title] || Clock;
        return (
          <article
            key={meeting.id}
            className="flex h-full flex-col rounded-[14px] border border-slate-200 bg-white p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-forest-900 text-gold-300">
                <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-forest-800">
                <Clock size={16} strokeWidth={1.75} aria-hidden="true" />
                {meeting.time}
              </span>
            </div>

            <h2 className="mb-3 font-display text-3xl leading-tight">
              {meeting.title}
            </h2>

            {meeting.items.length > 0 && (
              <ul className="m-0 flex-1 list-none space-y-2 p-0">
                {meeting.items.map((taskItem) => (
                  <li key={taskItem} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-gold-500" />
                    <span className="text-[15px] text-slate-700">{taskItem}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </div>
  </div>
);

export default Meetings;
