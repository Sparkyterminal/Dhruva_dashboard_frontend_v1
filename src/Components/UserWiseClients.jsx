/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback } from "react";
import {
  Trophy,
  Users,
  Award,
  Medal,
  X,
  Calendar,
  User as UserIcon,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { message, Drawer } from "antd";
import { useSelector } from "react-redux";

const UserWiseClients = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserEvents, setSelectedUserEvents] = useState([]);
  const user = useSelector((state) => state.user.value);

  const fetchRequirementsData = useCallback(async () => {
    if (!user?.access_token) {
      message.error("Authentication required. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}events`);

      let eventsData = [];
      if (res.data) {
        if (Array.isArray(res.data.events)) {
          eventsData = res.data.events;
        } else if (Array.isArray(res.data.data)) {
          eventsData = res.data.data;
        } else if (Array.isArray(res.data)) {
          eventsData = res.data;
        }
      }

      eventsData = eventsData.filter((event) => {
        return event && event._id && event.eventName;
      });

      setEvents(eventsData);

      if (eventsData.length === 0) {
        message.info("No events found");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      if (err.response?.status === 401) {
        message.error("Session expired. Please login again.");
      } else if (err.response?.status === 403) {
        message.error("You don't have permission to view events.");
      } else if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error("Failed to fetch events. Please try again later.");
      }
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.access_token]);

  useEffect(() => {
    fetchRequirementsData();
  }, [fetchRequirementsData]);

  const formatText = (v) => {
    try {
      if (v === null || v === undefined) return "";
      if (typeof v === "string" || typeof v === "number") return String(v);
      if (Array.isArray(v)) return v.map((x) => formatText(x)).join(", ");
      if (typeof v === "object") {
        if (v.name) return String(v.name);
        if (v.title) return String(v.title);
        if (v.label) return String(v.label);
        try {
          return JSON.stringify(v);
        } catch {
          return String(v);
        }
      }
      return String(v);
    } catch {
      return "";
    }
  };

  const getUserStats = () => {
    const userMap = new Map();

    events.forEach((event) => {
      if (event.createdBy) {
        const userId = event.createdBy.id;
        const firstName = formatText(event.createdBy.first_name) || "Unknown";
        const lastName = formatText(event.createdBy.last_name) || "";

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            id: userId,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`.trim(),
            events: [],
            eventCount: 0,
          });
        }

        const userStats = userMap.get(userId);
        userStats.events.push(event);
        userStats.eventCount = userStats.events.length;
      }
    });

    const sortedUsers = Array.from(userMap.values()).sort(
      (a, b) => b.eventCount - a.eventCount,
    );

    return sortedUsers;
  };

  const handleUserClick = (userData) => {
    setSelectedUser(userData);
    setSelectedUserEvents(userData.events);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setSelectedUser(null);
    setSelectedUserEvents([]);
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-500">{index + 1}</span>
          </div>
        );
    }
  };

  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600";
      case 1:
        return "bg-gradient-to-r from-gray-300 to-gray-500";
      case 2:
        return "bg-gradient-to-r from-amber-400 to-amber-600";
      default:
        return "bg-gradient-to-r from-blue-500 to-purple-600";
    }
  };

  const userStats = getUserStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="p-4 rounded-xl shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800">
                  Events Leaderboard
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Top performers ranked by event count
                </p>
              </div>
            </div>
            <div className="text-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg">
              <div className="text-3xl font-bold">{userStats.length}</div>
              <div className="text-sm opacity-90">Total Users</div>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        {/* {userStats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {userStats.slice(0, 3).map((userData, index) => {
              const positions = [
                { order: 1, scale: "md:scale-110 md:-mt-4" },
                { order: 0, scale: "" },
                { order: 2, scale: "" },
              ];
              const actualIndex = positions[index].order;
              const actualUser = userStats[actualIndex];

              return (
                <div
                  key={actualUser.id}
                  className={`${positions[index].scale} transition-all duration-300`}
                  style={{ order: positions[index].order }}
                >
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
                    <div
                      className={`${getRankBadge(actualIndex)} p-6 text-center`}
                    >
                      <div className="flex justify-center mb-3">
                        {getRankIcon(actualIndex)}
                      </div>
                      <div className="text-white text-lg font-bold">
                        Rank #{actualIndex + 1}
                      </div>
                    </div>
                    <div className="p-6 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
                        <UserIcon className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {actualUser.fullName}
                      </h3>
                      <button
                        onClick={() => handleUserClick(actualUser)}
                        className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        <span className="text-3xl font-bold">
                          {actualUser.eventCount}
                        </span>
                        <div className="text-sm opacity-90 mt-1">
                          Events Created
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )} */}

        {/* Leaderboard Table */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">
                Complete Rankings
              </h2>
            </div>
          </div>

          {userStats.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      User Name
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Events Booked
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userStats.map((userData, index) => (
                    <tr
                      key={userData.id}
                      className="hover:bg-purple-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {getRankIcon(index)}
                          {index < 3 && (
                            <span className="px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                              TOP {index + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow">
                            <UserIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {userData.firstName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {userData.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center justify-center px-4 py-2 rounded-full text-lg font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
                          {userData.eventCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleUserClick(userData)}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
                        >
                          <Calendar className="w-4 h-4" />
                          View Events
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold">{selectedUser?.fullName}</div>
              <div className="text-sm text-gray-500 font-normal">
                {selectedUserEvents.length} Events Booked
              </div>
            </div>
          </div>
        }
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        width={600}
        closeIcon={<X className="w-5 h-5" />}
      >
        {selectedUserEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No events found</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">
                  {selectedUserEvents.length}
                </div>
                <div className="text-sm opacity-90">Total Events</div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      Event Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      Client Name
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedUserEvents.map((event, index) => (
                    <tr
                      key={event._id}
                      className="hover:bg-purple-50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-white text-sm font-bold">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-800">
                            {formatText(event.eventName)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-pink-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            {formatText(event.clientName) || "N/A"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default UserWiseClients;
