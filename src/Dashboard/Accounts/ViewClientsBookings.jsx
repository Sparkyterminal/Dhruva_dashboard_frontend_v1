// /* eslint-disable no-unused-vars */
// import axios from "axios";
// import React, { useEffect, useState } from "react";
// import { API_BASE_URL } from "../../../config";
// import { message, Modal, DatePicker, Input, Pagination } from "antd";
// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import dayjs from "dayjs";
// import { useSelector } from "react-redux";

// const customStyles = `
//   .glass-card {
//     background: rgba(255, 255, 255, 0.75);
//     border-radius: 1.5rem;
//     box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
//     backdrop-filter: blur(20px);
//     -webkit-backdrop-filter: blur(20px);
//     border: 1px solid rgba(255, 255, 255, 0.35);
//   }

//   .gradient-card {
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     border-radius: 1rem;
//     padding: 1.5rem;
//     color: white;
//   }

//   @keyframes float {
//     0%, 100% { transform: translateY(0px); }
//     50% { transform: translateY(-10px); }
//   }

//   .float-animation {
//     animation: float 3s ease-in-out infinite;
//   }

//   .modal-content .ant-modal-content {
//     border-radius: 1.5rem;
//     overflow: hidden;
//   }

//   .modal-content .ant-modal-header {
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     border-bottom: none;
//     padding: 1.5rem;
//   }

//   .modal-content .ant-modal-title {
//     color: white;
//     font-size: 1.5rem;
//     font-weight: 600;
//   }

//   .modal-content .ant-modal-close {
//     color: white;
//   }

//   .modal-content .ant-modal-close:hover {
//     color: rgba(255, 255, 255, 0.8);
//   }

//   .ant-input:focus, .ant-picker:focus, .ant-picker-focused {
//     border-color: #667eea;
//     box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
//   }
// `;

// const ViewClientsBookings = () => {
//   const navigate = useNavigate();
//   const [events, setEvents] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalEvents, setTotalEvents] = useState(0);
//   const [limit] = useState(10);
//   const user = useSelector((state) => state.user.value);
//   console.log("user",user);
  
//   const config = {
//     headers: { Authorization: user?.access_token },
//   };

//   // Modal states
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [editingAdvances, setEditingAdvances] = useState([]);
//   const [savingAdvance, setSavingAdvance] = useState(null);

//   const fetchRequirementsData = async (page = 1) => {
//     setLoading(true);
//     try {
//       const res = await axios.get(`${API_BASE_URL}events?page=${page}&limit=${limit}`);
//       console.log("view inflow", res.data);
      
//       setEvents(res.data.events || []);
//       setTotalPages(res.data.totalPages || 1);
//       setTotalEvents(res.data.totalEvents || 0);
//       setCurrentPage(res.data.page || 1);
//     } catch (err) {
//       message.error("Failed to fetch client bookings");
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchRequirementsData(currentPage);
//   }, []);

//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//     fetchRequirementsData(page);
//   };

//   const openEditModal = (event) => {
//     setSelectedEvent(event);
//     // Initialize editing advances with current values
//     setEditingAdvances(
//       event.advances.map((adv) => ({
//         advanceNumber: adv.advanceNumber,
//         expectedAmount: adv.expectedAmount,
//         receivedAmount: adv.receivedAmount || "",
//         receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : null,
//       }))
//     );
//     setIsModalVisible(true);
//   };

//   const closeModal = () => {
//     setIsModalVisible(false);
//     setSelectedEvent(null);
//     setEditingAdvances([]);
//     setSavingAdvance(null);
//   };

//   const handleAdvanceChange = (index, field, value) => {
//     const updated = [...editingAdvances];
//     updated[index][field] = value;
//     setEditingAdvances(updated);
//   };

//   const saveAdvance = async (advanceNumber) => {
//     const advance = editingAdvances.find((adv) => adv.advanceNumber === advanceNumber);
    
//     if (!advance.receivedAmount || !advance.receivedDate) {
//       message.warning("Please fill both received amount and received date");
//       return;
//     }

//     setSavingAdvance(advanceNumber);
//     try {
//       await axios.patch(
//         `${API_BASE_URL}events/${selectedEvent._id}/advances/${advanceNumber}`,
//         {
//           receivedAmount: parseFloat(advance.receivedAmount),
//           receivedDate: advance.receivedDate.toISOString(),
//           userId: user?.id,
//         },config
//       );
      
//       message.success(`Advance ${advanceNumber} updated successfully`);
      
//       // Refresh data
//       await fetchRequirementsData(currentPage);
      
//       // Update modal with fresh data
//       const updatedEvent = events.find((e) => e._id === selectedEvent._id);
//       if (updatedEvent) {
//         setSelectedEvent(updatedEvent);
//         setEditingAdvances(
//           updatedEvent.advances.map((adv) => ({
//             advanceNumber: adv.advanceNumber,
//             expectedAmount: adv.expectedAmount,
//             receivedAmount: adv.receivedAmount || "",
//             receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : null,
//           }))
//         );
//       }
//     } catch (err) {
//       message.error("Failed to update advance");
//       console.error(err);
//     } finally {
//       setSavingAdvance(null);
//     }
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString("en-IN", {
//       day: "numeric",
//       month: "short",
//       year: "numeric",
//     });
//   };

//   const formatCurrency = (amount) => {
//     return `₹${amount.toLocaleString("en-IN")}`;
//   };

//   return (
//     <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative font-[cormoreg]">
//       <style>{customStyles}</style>

//       {/* Animated Gradient Background */}
//       <div
//         className="absolute inset-0 z-0 pointer-events-none opacity-40"
//         style={{
//           backgroundImage:
//             `radial-gradient(circle at 15% 85%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),` +
//             `radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),` +
//             `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`,
//         }}
//       />

//       <div className="relative z-10 px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
//         {/* Header Section */}
//         <motion.div
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           className="flex items-center justify-between mb-8"
//         >
//           <motion.button
//             whileHover={{ scale: 1.05, x: -5 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={() => navigate("/user")}
//             className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-semibold text-indigo-600"
//           >
//             <svg
//               className="w-5 h-5"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M15 19l-7-7 7-7"
//               />
//             </svg>
//             Back
//           </motion.button>

//           <motion.h1
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ delay: 0.2, duration: 0.5 }}
//             className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
//           >
//             Client Bookings
//           </motion.h1>

//           <div className="w-24" />
//         </motion.div>

//         {/* Stats Card */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3, duration: 0.5 }}
//           className="gradient-card mb-8"
//         >
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-white/80 text-sm font-medium mb-1">Total Bookings</p>
//               <p className="text-4xl font-bold">{totalEvents}</p>
//             </div>
//             <div className="float-animation">
//               <svg
//                 className="w-16 h-16 text-white/30"
//                 fill="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//               </svg>
//             </div>
//           </div>
//         </motion.div>

//         {/* Events List */}
//         <div className="space-y-4">
//           {loading ? (
//             <div className="glass-card p-8 text-center">
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
//               <p className="mt-4 text-gray-600 font-semibold">Loading bookings...</p>
//             </div>
//           ) : events.length === 0 ? (
//             <div className="glass-card p-8 text-center">
//               <p className="text-gray-600 font-semibold text-lg">No bookings found</p>
//             </div>
//           ) : (
//             events.map((event, index) => (
//               <motion.div
//                 key={event._id}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: index * 0.1, duration: 0.5 }}
//                 className="glass-card p-6"
//               >
//                 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
//                   {/* Event Details */}
//                   <div className="flex-1 space-y-3">
//                     <div>
//                       <h3 className="text-2xl font-bold text-gray-800 mb-1">
//                         {event.clientName}
//                       </h3>
//                       <div className="flex flex-wrap items-center gap-4 text-gray-600">
//                         <div className="flex items-center gap-2">
//                           <svg
//                             className="w-5 h-5 text-indigo-500"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//                             />
//                           </svg>
//                           <span className="font-semibold">{formatDate(event.eventDate)}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <svg
//                             className="w-5 h-5 text-purple-500"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
//                             />
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
//                             />
//                           </svg>
//                           <span className="font-semibold">{event.venueLocation}</span>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 inline-block">
//                       <p className="text-sm text-gray-600 mb-1">Agreed Amount</p>
//                       <p className="text-2xl font-bold text-indigo-600">
//                         {formatCurrency(event.agreedAmount)}
//                       </p>
//                     </div>

//                     {/* Advances Display */}
//                     <div className="space-y-2">
//                       <p className="text-sm font-semibold text-gray-700">Advances:</p>
//                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
//                         {event.advances.map((advance) => (
//                           <div
//                             key={advance.advanceNumber}
//                             className={`border-2 rounded-lg p-3 ${
//                               advance.receivedAmount > 0
//                                 ? "border-green-300 bg-green-50"
//                                 : "border-gray-200 bg-gray-50"
//                             }`}
//                           >
//                             <div className="flex items-center justify-between mb-1">
//                               <span className="text-xs font-bold text-gray-600">
//                                 Advance #{advance.advanceNumber}
//                               </span>
//                               {advance.receivedAmount > 0 && (
//                                 <svg
//                                   className="w-4 h-4 text-green-600"
//                                   fill="currentColor"
//                                   viewBox="0 0 20 20"
//                                 >
//                                   <path
//                                     fillRule="evenodd"
//                                     d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                                     clipRule="evenodd"
//                                   />
//                                 </svg>
//                               )}
//                             </div>
//                             <p className="text-sm font-semibold text-gray-700">
//                               Expected: {formatCurrency(advance.expectedAmount)}
//                             </p>
//                             {advance.receivedAmount > 0 ? (
//                               <>
//                                 <p className="text-sm font-bold text-green-700">
//                                   Received: {formatCurrency(advance.receivedAmount)}
//                                 </p>
//                                 <p className="text-xs text-gray-600">
//                                   {formatDate(advance.receivedDate)}
//                                 </p>
//                               </>
//                             ) : (
//                               <p className="text-xs text-red-600 font-semibold">Pending</p>
//                             )}
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Edit Button */}
//                   <div className="flex lg:flex-col gap-2">
//                     <motion.button
//                       whileHover={{ scale: 1.05 }}
//                       whileTap={{ scale: 0.95 }}
//                       onClick={() => openEditModal(event)}
//                       className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
//                     >
//                       <svg
//                         className="w-5 h-5"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
//                         />
//                       </svg>
//                       Edit Advances
//                     </motion.button>
//                   </div>
//                 </div>
//               </motion.div>
//             ))
//           )}
//         </div>

//         {/* Pagination */}
//         {!loading && totalPages > 1 && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.5, duration: 0.5 }}
//             className="mt-8 flex justify-center"
//           >
//             <Pagination
//               current={currentPage}
//               total={totalEvents}
//               pageSize={limit}
//               onChange={handlePageChange}
//               showSizeChanger={false}
//               showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} bookings`}
//               className="font-[cormoreg]"
//             />
//           </motion.div>
//         )}
//       </div>

//       {/* Edit Advances Modal */}
//       <Modal
//         title={`Edit Advances - ${selectedEvent?.clientName}`}
//         open={isModalVisible}
//         onCancel={closeModal}
//         footer={null}
//         width={700}
//         className="modal-content"
//       >
//         <div className="space-y-6 mt-6">
//           {editingAdvances.map((advance, index) => (
//             <div
//               key={advance.advanceNumber}
//               className="border-2 border-indigo-100 rounded-xl p-5 bg-gradient-to-br from-indigo-50/50 to-purple-50/50"
//             >
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-bold text-indigo-900">
//                   Advance #{advance.advanceNumber}
//                 </h3>
//                 <span className="px-3 py-1 bg-white rounded-lg text-sm font-semibold text-gray-700">
//                   Expected: {formatCurrency(advance.expectedAmount)}
//                 </span>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Received Amount
//                   </label>
//                   <Input
//                     type="number"
//                     placeholder="Enter received amount"
//                     value={advance.receivedAmount}
//                     onChange={(e) =>
//                       handleAdvanceChange(index, "receivedAmount", e.target.value)
//                     }
//                     prefix="₹"
//                     size="large"
//                     className="font-[cormoreg]"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Received Date
//                   </label>
//                   <DatePicker
//                     value={advance.receivedDate}
//                     onChange={(date) =>
//                       handleAdvanceChange(index, "receivedDate", date)
//                     }
//                     format="DD-MM-YYYY"
//                     size="large"
//                     className="w-full font-[cormoreg]"
//                     placeholder="Select date"
//                   />
//                 </div>
//               </div>

//               <motion.button
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.98 }}
//                 onClick={() => saveAdvance(advance.advanceNumber)}
//                 disabled={savingAdvance === advance.advanceNumber}
//                 className={`w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 ${
//                   savingAdvance === advance.advanceNumber
//                     ? "opacity-50 cursor-not-allowed"
//                     : ""
//                 }`}
//               >
//                 {savingAdvance === advance.advanceNumber ? (
//                   <span className="flex items-center justify-center gap-2">
//                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
//                     Saving...
//                   </span>
//                 ) : (
//                   <span className="flex items-center justify-center gap-2">
//                     <svg
//                       className="w-5 h-5"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M5 13l4 4L19 7"
//                       />
//                     </svg>
//                     Save Advance #{advance.advanceNumber}
//                   </span>
//                 )}
//               </motion.button>
//             </div>
//           ))}
//         </div>
//       </Modal>
//     </div>
//   );
// };

// export default ViewClientsBookings;
/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../config";
import { message, Modal, DatePicker, Input, Badge, Card, Row, Col,InputNumber } from "antd";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
  
  * {
    font-family: 'Cormorant Garamond', serif;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.75);
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.35);
  }

  .venue-card {
    transition: all 0.3s ease;
    cursor: pointer;
    height: 100%;
  }

  .venue-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.15);
  }

  .booking-detail-card {
    transition: all 0.3s ease;
    height: 100%;
  }

  .booking-detail-card:hover {
    box-shadow: 0 8px 16px rgba(0,0,0,0.12);
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .float-animation {
    animation: float 3s ease-in-out infinite;
  }

  .modal-content .ant-modal-content {
    border-radius: 1.5rem;
    overflow: hidden;
  }

  .modal-content .ant-modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-bottom: none;
    padding: 1.5rem;
  }

  .modal-content .ant-modal-title {
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .modal-content .ant-modal-close {
    color: white;
  }

  .modal-content .ant-modal-close:hover {
    color: rgba(255, 255, 255, 0.8);
  }

  .ant-input:focus, .ant-picker:focus, .ant-picker-focused {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }
`;

const ViewClientsBookings = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const user = useSelector((state) => state.user.value);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingAdvances, setEditingAdvances] = useState([]);
  const [savingAdvance, setSavingAdvance] = useState(null);

  const fetchRequirementsData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}events`, config);
      console.log("view inflow", res.data);
      setEvents(res.data.events || res.data || []);
    } catch (err) {
      message.error("Failed to fetch client bookings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementsData();
  }, []);

  // Group bookings by venue with fuzzy matching
  const groupByVenue = (events) => {
    const venueMap = {};

    events.forEach((event) => {
      const venueName = (event.venueLocation || "Unknown Venue").trim();
      const lowerVenue = venueName.toLowerCase();

      // Find similar venue name (fuzzy match)
      let matchedKey = null;
      for (let key in venueMap) {
        const keyLower = key.toLowerCase();
        // Check if venues are similar (contains, or very close)
        if (
          keyLower.includes(lowerVenue) ||
          lowerVenue.includes(keyLower) ||
          keyLower.replace(/\s+/g, "") === lowerVenue.replace(/\s+/g, "")
        ) {
          matchedKey = key;
          break;
        }
      }

      if (matchedKey) {
        venueMap[matchedKey].push(event);
      } else {
        venueMap[venueName] = [event];
      }
    });

    return venueMap;
  };

  const venueGroups = groupByVenue(events);
  const displayData = selectedVenue
    ? venueGroups[selectedVenue] || []
    : Object.entries(venueGroups);

  const openEditModal = (event) => {
    setSelectedEvent(event);
    // Initialize editing advances with current values
    setEditingAdvances(
      event.advances.map((adv) => ({
        advanceNumber: adv.advanceNumber,
        expectedAmount: adv.expectedAmount,
        advanceDate: adv.advanceDate,
        receivedAmount: adv.receivedAmount || "",
        receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : null,
      }))
    );
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedEvent(null);
    setEditingAdvances([]);
    setSavingAdvance(null);
  };

  const handleAdvanceChange = (index, field, value) => {
    const updated = [...editingAdvances];
    updated[index][field] = value;
    setEditingAdvances(updated);
  };

  const saveAdvance = async (advanceNumber) => {
    const advance = editingAdvances.find((adv) => adv.advanceNumber === advanceNumber);

    if (!advance.expectedAmount) {
      message.warning("Expected amount is required");
      return;
    }

    setSavingAdvance(advanceNumber);
    try {
      const payload = {
        expectedAmount: parseFloat(advance.expectedAmount),
        userId: user?.id,
      };

      // Only include received amount and date if both are provided
      if (advance.receivedAmount && advance.receivedDate) {
        payload.receivedAmount = parseFloat(advance.receivedAmount);
        payload.receivedDate = advance.receivedDate.toISOString();
      }

      await axios.patch(
        `${API_BASE_URL}events/${selectedEvent._id}/advances/${advanceNumber}`,
        payload,
        config
      );

      message.success(`Advance ${advanceNumber} updated successfully`);

      // Refresh data
      await fetchRequirementsData();

      // Update modal with fresh data
      const updatedEvent = events.find((e) => e._id === selectedEvent._id);
      if (updatedEvent) {
        setSelectedEvent(updatedEvent);
        setEditingAdvances(
          updatedEvent.advances.map((adv) => ({
            advanceNumber: adv.advanceNumber,
            expectedAmount: adv.expectedAmount,
            advanceDate: adv.advanceDate,
            receivedAmount: adv.receivedAmount || "",
            receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : null,
          }))
        );
      }
    } catch (err) {
      message.error("Failed to update advance");
      console.error(err);
    } finally {
      setSavingAdvance(null);
    }
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format("DD MMM YYYY");
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString("en-IN") || 0}`;
  };


  const calculateBalance = (advances) => {
  const totalExpected = advances.reduce((sum, adv) => sum + (adv.expectedAmount || 0), 0);
  const totalReceived = advances.reduce((sum, adv) => sum + (adv.receivedAmount || 0), 0);
  const balance = totalExpected - totalReceived;
  return balance;
};


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      <style>{customStyles}</style>

      {/* Animated Gradient Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            `radial-gradient(circle at 15% 85%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),` +
            `radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),` +
            `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => (selectedVenue ? setSelectedVenue(null) : navigate("/user"))}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-bold text-indigo-600"
            style={{ fontSize: "18px" }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {selectedVenue ? "Back to Venues" : "Back"}
          </motion.button>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent p-4"
          >
            {selectedVenue || "Wedding Bookings"}
          </motion.h1>

          <div className="w-24" />
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "1rem",
            padding: "1.5rem",
            color: "white",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 font-bold mb-1" style={{ fontSize: "20px" }}>
                {selectedVenue
                  ? `Bookings at ${selectedVenue}`
                  : `Total Bookings across ${Object.keys(venueGroups).length} Venues`}
              </p>
              <p className="font-bold" style={{ fontSize: "42px" }}>
                {selectedVenue ? displayData.length : events.length}
              </p>
            </div>
            <div className="float-animation">
              <svg
                className="w-16 h-16 text-white/30"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="glass-card p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-bold" style={{ fontSize: "20px" }}>
              Loading bookings...
            </p>
          </div>
        ) : !selectedVenue ? (
          // Venue Grid View
          <Row gutter={[24, 24]}>
            {displayData.map(([venueName, venueBookings]) => (
              <Col xs={24} sm={12} md={8} lg={6} key={venueName}>
                <Badge
                  count={venueBookings.length}
                  style={{
                    backgroundColor: "#3b82f6",
                    fontSize: "18px",
                    fontWeight: 700,
                    height: "36px",
                    minWidth: "36px",
                    lineHeight: "36px",
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className="venue-card"
                      hoverable
                      onClick={() => setSelectedVenue(venueName)}
                      style={{
                        borderRadius: "16px",
                        border: "2px solid #e5e7eb",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        width: "100%",
                      }}
                      bodyStyle={{ padding: "32px" }}
                    >
                      <div style={{ textAlign: "center", color: "#fff" }}>
                        <svg
                          style={{ fontSize: "48px", marginBottom: "16px" }}
                          className="w-12 h-12 mx-auto"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <h3
                          style={{
                            fontSize: "26px",
                            fontWeight: 700,
                            color: "#fff",
                            marginBottom: "8px",
                            wordBreak: "break-word",
                          }}
                        >
                          {venueName}
                        </h3>
                        <p
                          style={{
                            fontSize: "18px",
                            color: "rgba(255,255,255,0.9)",
                            fontWeight: 600,
                            margin: 0,
                          }}
                        >
                          {venueBookings.length} Event{venueBookings.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                </Badge>
              </Col>
            ))}
          </Row>
        ) : (
          // Booking Details View
          // <Row gutter={[24, 24]}>
          //   {displayData.map((booking, index) => (
          //     const balance = calculateBalance(booking.advances);
          //     <Col xs={24} lg={12} key={booking._id}>
          //       <motion.div
          //         initial={{ opacity: 0, y: 20 }}
          //         animate={{ opacity: 1, y: 0 }}
          //         transition={{ delay: index * 0.1, duration: 0.5 }}
          //       >
          //         <Card
          //           className="booking-detail-card glass-card"
          //           style={{
          //             borderRadius: "16px",
          //             border: "2px solid #e5e7eb",
          //           }}
          //           bodyStyle={{ padding: "28px" }}
          //         >
          //           {/* Client & Couple Names */}
          //           <div style={{ marginBottom: "24px" }}>
          //             <div
          //               style={{
          //                 display: "flex",
          //                 alignItems: "center",
          //                 gap: "12px",
          //                 marginBottom: "12px",
          //               }}
          //             >
          //               <svg
          //                 style={{ fontSize: "24px", color: "#3b82f6" }}
          //                 className="w-6 h-6"
          //                 fill="currentColor"
          //                 viewBox="0 0 24 24"
          //               >
          //                 <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          //               </svg>
          //               <span
          //                 style={{
          //                   fontSize: "24px",
          //                   fontWeight: 700,
          //                   color: "#1f2937",
          //                 }}
          //               >
          //                 Client: {booking.clientName}
          //               </span>
          //             </div>
          //             <div
          //               style={{
          //                 display: "flex",
          //                 alignItems: "center",
          //                 gap: "12px",
          //                 marginLeft: "36px",
          //               }}
          //             >
          //               <svg
          //                 style={{ fontSize: "24px", color: "#ec4899" }}
          //                 className="w-6 h-6"
          //                 fill="currentColor"
          //                 viewBox="0 0 24 24"
          //               >
          //                 <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          //               </svg>
          //               <span
          //                 style={{
          //                   fontSize: "24px",
          //                   fontWeight: 700,
          //                   color: "#1f2937",
          //                 }}
          //               >
          //                 {booking.brideName} & {booking.groomName}
          //               </span>
          //             </div>
          //           </div>

          //           {/* Event Date & Amount */}
          //           <div style={{ marginBottom: "20px" }}>
          //             <div
          //               style={{
          //                 display: "flex",
          //                 alignItems: "center",
          //                 gap: "12px",
          //                 marginBottom: "8px",
          //               }}
          //             >
          //               <svg
          //                 style={{ fontSize: "20px", color: "#10b981" }}
          //                 className="w-5 h-5"
          //                 fill="currentColor"
          //                 viewBox="0 0 24 24"
          //               >
          //                 <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
          //               </svg>
          //               <span
          //                 style={{
          //                   fontSize: "20px",
          //                   fontWeight: 600,
          //                   color: "#374151",
          //                 }}
          //               >
          //                 Event: {formatDate(booking.eventDate)}
          //               </span>
          //             </div>
          //             <div
          //               style={{
          //                 display: "flex",
          //                 alignItems: "center",
          //                 gap: "12px",
          //               }}
          //             >
          //               <svg
          //                 style={{ fontSize: "20px", color: "#f59e0b" }}
          //                 className="w-5 h-5"
          //                 fill="currentColor"
          //                 viewBox="0 0 24 24"
          //               >
          //                 <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
          //               </svg>
          //               <span
          //                 style={{
          //                   fontSize: "20px",
          //                   fontWeight: 600,
          //                   color: "#374151",
          //                 }}
          //               >
          //                 Agreed Amount: {formatCurrency(booking.agreedAmount)}
          //               </span>
          //             </div>
          //             <div
          //     style={{
          //       marginTop: "8px",
          //       fontSize: "20px",
          //       fontWeight: "600",
          //       color: balance === 0 ? "#10b981" : "#f59e0b",
          //     }}
          //   >
          //     Balance: {balance === 0 ? "No balance" : formatCurrency(balance)}
          //   </div>
          //           </div>
                  

          //           {/* Advances */}
          //           <div
          //             style={{
          //               marginTop: "20px",
          //               paddingTop: "20px",
          //               borderTop: "2px solid #e5e7eb",
          //             }}
          //           >
          //             <h4
          //               style={{
          //                 fontSize: "24px",
          //                 fontWeight: 700,
          //                 color: "#1f2937",
          //                 marginBottom: "16px",
          //               }}
          //             >
          //               Advances ({booking.advances?.length || 0})
          //             </h4>
          //             <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          //               {booking.advances?.map((advance, idx) => (
          //                 <div
          //                   key={idx}
          //                   style={{
          //                     background: "#f9fafb",
          //                     padding: "16px",
          //                     borderRadius: "12px",
          //                     border: "1px solid #e5e7eb",
          //                   }}
          //                 >
          //                   <div
          //                     style={{
          //                       display: "flex",
          //                       justifyContent: "space-between",
          //                       alignItems: "center",
          //                       marginBottom: "8px",
          //                     }}
          //                   >
          //                     <span
          //                       style={{
          //                         fontSize: "20px",
          //                         fontWeight: 700,
          //                         color: "#3b82f6",
          //                         background: "#dbeafe",
          //                         padding: "4px 12px",
          //                         borderRadius: "8px",
          //                       }}
          //                     >
          //                       Advance #{advance.advanceNumber}
          //                     </span>
          //                     <span
          //                       style={{
          //                         fontSize: "18px",
          //                         fontWeight: 600,
          //                         color: "#6b7280",
          //                       }}
          //                     >
          //                       Due: {formatDate(advance.advanceDate)}
          //                     </span>
          //                   </div>
          //                   <div
          //                     style={{
          //                       display: "flex",
          //                       justifyContent: "space-between",
          //                       marginTop: "12px",
          //                     }}
          //                   >
          //                     <div>
          //                       <div
          //                         style={{
          //                           fontSize: "16px",
          //                           color: "#6b7280",
          //                           fontWeight: 600,
          //                         }}
          //                       >
          //                         Expected
          //                       </div>
          //                       <div
          //                         style={{
          //                           fontSize: "22px",
          //                           fontWeight: 700,
          //                           color: "#1f2937",
          //                         }}
          //                       >
          //                         {formatCurrency(advance.expectedAmount)}
          //                       </div>
          //                     </div>
          //                     <div style={{ textAlign: "right" }}>
          //                       <div
          //                         style={{
          //                           fontSize: "16px",
          //                           color: "#6b7280",
          //                           fontWeight: 600,
          //                         }}
          //                       >
          //                         Received
          //                       </div>
          //                       <div
          //                         style={{
          //                           fontSize: "22px",
          //                           fontWeight: 700,
          //                           color:
          //                             advance.receivedAmount > 0 ? "#10b981" : "#ef4444",
          //                         }}
          //                       >
          //                         {formatCurrency(advance.receivedAmount)}
          //                       </div>
          //                     </div>
          //                   </div>
          //                   {advance.receivedDate && (
          //                     <div
          //                       style={{
          //                         marginTop: "8px",
          //                         fontSize: "16px",
          //                         color: "#6b7280",
          //                         fontWeight: 600,
          //                       }}
          //                     >
          //                       Received on: {formatDate(advance.receivedDate)}
          //                     </div>
          //                   )}
          //                 </div>
          //               ))}
          //             </div>
          //           </div>

          //           {/* Edit Button */}
          //           <motion.button
          //             whileHover={{ scale: 1.02 }}
          //             whileTap={{ scale: 0.98 }}
          //             onClick={() => openEditModal(booking)}
          //             style={{
          //               width: "100%",
          //               marginTop: "20px",
          //               padding: "14px",
          //               background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          //               color: "white",
          //               border: "none",
          //               borderRadius: "12px",
          //               fontSize: "20px",
          //               fontWeight: 700,
          //               cursor: "pointer",
          //               display: "flex",
          //               alignItems: "center",
          //               justifyContent: "center",
          //               gap: "8px",
          //             }}
          //           >
          //             <svg
          //               className="w-5 h-5"
          //               fill="none"
          //               stroke="currentColor"
          //               viewBox="0 0 24 24"
          //             >
          //               <path
          //                 strokeLinecap="round"
          //                 strokeLinejoin="round"
          //                 strokeWidth={2}
          //                 d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          //               />
          //             </svg>
          //             Edit Advances
          //           </motion.button>
          //         </Card>
          //       </motion.div>
          //     </Col>
          //   ))}
          // </Row>
          <Row gutter={[24, 24]}>
  {displayData.map((booking, index) => {
    const balance = calculateBalance(booking.advances);
    return (
      <Col xs={24} lg={12} key={booking._id}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <Card
            className="booking-detail-card glass-card"
            style={{
              borderRadius: "16px",
              border: "2px solid #e5e7eb",
            }}
            bodyStyle={{ padding: "28px" }}
          >
            {/* Client & Couple Names */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <svg
                  style={{ fontSize: "24px", color: "#3b82f6" }}
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#1f2937",
                  }}
                >
                  Client: {booking.clientName}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginLeft: "36px",
                }}
              >
                <svg
                  style={{ fontSize: "24px", color: "#ec4899" }}
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#1f2937",
                  }}
                >
                  {booking.brideName} & {booking.groomName}
                </span>
              </div>
            </div>

            {/* Event Date & Amount */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <svg
                  style={{ fontSize: "20px", color: "#10b981" }}
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
                </svg>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Event: {formatDate(booking.eventDate)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <svg
                  style={{ fontSize: "20px", color: "#f59e0b" }}
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                </svg>
                <span
                  style={{ fontSize: "20px", fontWeight: 600, color: "#374151" }}
                >
                  Agreed Amount: {formatCurrency(booking.agreedAmount)}
                </span>
              </div>
            </div>

            {/* Balance */}
            <div
              style={{
                marginTop: "8px",
                fontSize: "20px",
                fontWeight: "600",
                color: balance === 0 ? "#10b981" : "#f59e0b",
              }}
            >
              Balance: {balance === 0 ? "No balance" : formatCurrency(balance)}
            </div>

            {/* Advances */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "20px",
                borderTop: "2px solid #e5e7eb",
              }}
            >
              <h4
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "16px",
                }}
              >
                Advances ({booking.advances?.length || 0})
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {booking.advances?.map((advance, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#f9fafb",
                      padding: "16px",
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "#3b82f6",
                          background: "#dbeafe",
                          padding: "4px 12px",
                          borderRadius: "8px",
                        }}
                      >
                        Advance #{advance.advanceNumber}
                      </span>
                      <span
                        style={{
                          fontSize: "18px",
                          fontWeight: 600,
                          color: "#6b7280",
                        }}
                      >
                        Due: {formatDate(advance.advanceDate)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "12px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "16px",
                            color: "#6b7280",
                            fontWeight: 600,
                          }}
                        >
                          Expected
                        </div>
                        <div
                          style={{
                            fontSize: "22px",
                            fontWeight: 700,
                            color: "#1f2937",
                          }}
                        >
                          {formatCurrency(advance.expectedAmount)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "16px",
                            color: "#6b7280",
                            fontWeight: 600,
                          }}
                        >
                          Received
                        </div>
                        <div
                          style={{
                            fontSize: "22px",
                            fontWeight: 700,
                            color:
                              advance.receivedAmount > 0 ? "#10b981" : "#ef4444",
                          }}
                        >
                          {formatCurrency(advance.receivedAmount)}
                        </div>
                      </div>
                    </div>
                    {advance.receivedDate && (
                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "16px",
                          color: "#6b7280",
                          fontWeight: 600,
                        }}
                      >
                        Received on: {formatDate(advance.receivedDate)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Edit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openEditModal(booking)}
              style={{
                width: "100%",
                marginTop: "20px",
                padding: "14px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "20px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Advances
            </motion.button>
          </Card>
        </motion.div>
      </Col>
    );
  })}
</Row>

        )}
      </div>

      {/* Edit Advances Modal */}
      <Modal
        title={`Edit Advances - ${selectedEvent?.clientName}`}
        open={isModalVisible}
        onCancel={closeModal}
        footer={null}
        width={700}
        className="modal-content"
      >
        <div className="space-y-6 mt-6">
          {editingAdvances.map((advance, index) => (
            <div
              key={advance.advanceNumber}
              className="border-2 border-indigo-100 rounded-xl p-5 bg-gradient-to-br from-indigo-50/50 to-purple-50/50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-indigo-900">
                  Advance #{advance.advanceNumber}
                </h3>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-600">
                    Due Date: {formatDate(advance.advanceDate)}
                  </div>
                  <div className="px-3 py-1 bg-white rounded-lg text-sm font-semibold text-gray-700 mt-1">
                    Expected: {formatCurrency(advance.expectedAmount)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Received Date
    </label>
    <DatePicker
      value={advance.receivedDate}
      onChange={(date) => handleAdvanceChange(index, "receivedDate", date)}
      format="DD-MM-YYYY"
      size="large"
      className="w-full font-[cormoreg]"
      placeholder="Select date"
    />
  </div>

  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Received Amount
    </label>
    <InputNumber
      value={advance.receivedAmount}
      onChange={(value) => handleAdvanceChange(index, "receivedAmount", value)}
      size="large"
      className="w-full font-[cormoreg]"
      min={0}
      formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
      placeholder="Enter received amount"
    />
  </div>
</div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => saveAdvance(advance.advanceNumber)}
                disabled={savingAdvance === advance.advanceNumber}
                className={`w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 ${
                  savingAdvance === advance.advanceNumber
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {savingAdvance === advance.advanceNumber ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Advance #{advance.advanceNumber}
                  </span>
                )}
              </motion.button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default ViewClientsBookings;