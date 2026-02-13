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
  DollarSign,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { message, Drawer, Tabs, Card, Tag, Typography, Table } from "antd";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

const { Text, Title } = Typography;

const UserWiseClients = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserEvents, setSelectedUserEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("mostBooked");
  const user = useSelector((state) => state.user.value);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const fetchRequirementsData = useCallback(async () => {
    if (!user?.access_token) {
      message.error("Authentication required. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}events`, config);

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

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const getEventName = (eventName) => {
    if (typeof eventName === "string") return eventName;
    return eventName?.name || "N/A";
  };

  // Same logic as ViewClientsBookings: complete = first event type only, separate = sum all
  const isCompletePaymentEvent = (event) => {
    const eventNameStr = getEventName(event.eventName);
    return (
      eventNameStr === "Wedding" && event.advancePaymentType === "complete"
    );
  };

  // Calculate total agreed amount for an event (matches List View drawer breakdown)
  const getTotalAgreedAmount = (event) => {
    if (!event.eventTypes || event.eventTypes.length === 0) return 0;

    if (isCompletePaymentEvent(event)) {
      // Complete: use only first event type (represents whole package)
      return event.eventTypes[0]?.agreedAmount || 0;
    }
    // Separate: sum all event types
    return event.eventTypes.reduce((sum, et) => {
      return sum + (et.agreedAmount || 0);
    }, 0);
  };

  // Get user stats for Most Booked tab
  const getUserStatsMostBooked = () => {
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
            inProgress: 0,
            confirmed: 0,
            cancelled: 0,
            total: 0,
          });
        }

        const userStats = userMap.get(userId);
        userStats.events.push(event);
        userStats.total = userStats.events.length;

        // Count by status
        const status = event.eventConfirmation;
        if (status === "InProgress") {
          userStats.inProgress++;
        } else if (status === "Confirmed Event") {
          userStats.confirmed++;
        } else if (status === "Cancelled") {
          userStats.cancelled++;
        }
      }
    });

    const sortedUsers = Array.from(userMap.values()).sort(
      (a, b) => b.total - a.total,
    );

    return sortedUsers;
  };

  // Get user stats for Most Amount Booked tab (only confirmed events)
  const getUserStatsMostAmount = () => {
    const userMap = new Map();

    events.forEach((event) => {
      // Only include confirmed events
      if (event.eventConfirmation === "Confirmed Event" && event.createdBy) {
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
            totalAmount: 0,
          });
        }

        const userStats = userMap.get(userId);
        const agreedAmount = getTotalAgreedAmount(event);
        userStats.events.push({
          ...event,
          agreedAmount,
        });
        userStats.totalAmount += agreedAmount;
      }
    });

    const sortedUsers = Array.from(userMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount,
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

  const userStatsMostBooked = getUserStatsMostBooked();
  const userStatsMostAmount = getUserStatsMostAmount();

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

  const mostBookedColumns = [
    {
      title: "Rank",
      key: "rank",
      width: 100,
      render: (_, __, index) => (
        <div className="flex items-center gap-3">
          {getRankIcon(index)}
          {index < 3 && (
            <Tag
              color={
                index === 0
                  ? "gold"
                  : index === 1
                    ? "default"
                    : "orange"
              }
              className="text-xs font-bold"
            >
              TOP {index + 1}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "User Name",
      key: "userName",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">
              {record.firstName}
            </div>
            <div className="text-sm text-gray-500">{record.lastName}</div>
          </div>
        </div>
      ),
    },
    {
      title: "InProgress",
      key: "inProgress",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Tag color="orange" className="text-sm font-semibold">
          {record.inProgress}
        </Tag>
      ),
    },
    {
      title: "Confirmed",
      key: "confirmed",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Tag color="green" className="text-sm font-semibold">
          {record.confirmed}
        </Tag>
      ),
    },
    {
      title: "Cancelled",
      key: "cancelled",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Tag color="red" className="text-sm font-semibold">
          {record.cancelled}
        </Tag>
      ),
    },
    {
      title: "Total Booked",
      key: "total",
      align: "center",
      width: 130,
      render: (_, record) => (
        <span className="inline-flex items-center justify-center px-4 py-2 rounded-full text-lg font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
          {record.total}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 150,
      render: (_, record) => (
        <button
          onClick={() => handleUserClick(record)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
        >
          <Calendar className="w-4 h-4" />
          View Details
        </button>
      ),
    },
  ];

  const mostAmountColumns = [
    {
      title: "Rank",
      key: "rank",
      width: 100,
      render: (_, __, index) => (
        <div className="flex items-center gap-3">
          {getRankIcon(index)}
          {index < 3 && (
            <Tag
              color={
                index === 0
                  ? "gold"
                  : index === 1
                    ? "default"
                    : "orange"
              }
              className="text-xs font-bold"
            >
              TOP {index + 1}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "User Name",
      key: "userName",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center shadow">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">
              {record.firstName}
            </div>
            <div className="text-sm text-gray-500">{record.lastName}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Total Amount",
      key: "totalAmount",
      align: "right",
      width: 180,
      render: (_, record) => (
        <span className="inline-flex items-center justify-center px-4 py-2 rounded-full text-lg font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700">
          {formatAmount(record.totalAmount)}
        </span>
      ),
    },
    {
      title: "Events Count",
      key: "eventsCount",
      align: "center",
      width: 130,
      render: (_, record) => (
        <Tag color="blue" className="text-sm font-semibold">
          {record.events.length}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 150,
      render: (_, record) => (
        <button
          onClick={() => handleUserClick(record)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
        >
          <TrendingUp className="w-4 h-4" />
          View Details
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card
            className="border-0 shadow-sm mb-6"
            style={{
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(10px)",
            }}
            bodyStyle={{ padding: "24px" }}
          >
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
                  <Title level={2} className="!mb-0 !text-2xl md:!text-3xl">
                    Events Leaderboard
                  </Title>
                  <Text className="text-gray-600 mt-2 text-base block">
                    Top performers ranked by bookings and revenue
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Card
          className="border-0 shadow-sm"
          style={{
            borderRadius: "16px",
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(10px)",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "mostBooked",
                label: (
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Most Booked
                  </span>
                ),
                children: (
                  <div>
                    {userStatsMostBooked.length === 0 ? (
                      <div className="text-center py-16">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <Text className="text-gray-500 text-lg">
                          No bookings found
                        </Text>
                      </div>
                    ) : (
                      <Table
                        columns={mostBookedColumns}
                        dataSource={userStatsMostBooked}
                        rowKey="id"
                        pagination={{
                          pageSize: 10,
                          showSizeChanger: true,
                          showTotal: (total) => (
                            <span className="text-slate-600 text-sm">
                              Total {total} users
                            </span>
                          ),
                        }}
                        className="modern-table"
                      />
                    )}
                  </div>
                ),
              },
              {
                key: "mostAmount",
                label: (
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Most Amount Booked
                  </span>
                ),
                children: (
                  <div>
                    {userStatsMostAmount.length === 0 ? (
                      <div className="text-center py-16">
                        <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <Text className="text-gray-500 text-lg">
                          No confirmed events found
                        </Text>
                      </div>
                    ) : (
                      <Table
                        columns={mostAmountColumns}
                        dataSource={userStatsMostAmount}
                        rowKey="id"
                        pagination={{
                          pageSize: 10,
                          showSizeChanger: true,
                          showTotal: (total) => (
                            <span className="text-slate-600 text-sm">
                              Total {total} users
                            </span>
                          ),
                        }}
                        className="modern-table"
                      />
                    )}
                  </div>
                ),
              },
            ]}
            size="large"
          />
        </Card>
      </div>

      {/* Drawer for Event Details */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold">{selectedUser?.fullName}</div>
              <div className="text-sm text-gray-500 font-normal">
                {activeTab === "mostBooked"
                  ? `${selectedUserEvents.length} Events`
                  : `${formatAmount(selectedUser?.totalAmount || 0)} Total`}
              </div>
            </div>
          </div>
        }
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        width={700}
        closeIcon={<X className="w-5 h-5" />}
      >
        {selectedUserEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <Text className="text-gray-500">No events found</Text>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === "mostBooked" ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card
                    className="border-0 text-center"
                    style={{
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                    }}
                    bodyStyle={{ padding: "16px" }}
                  >
                    <Text className="text-xs text-gray-600 block mb-1">
                      InProgress
                    </Text>
                    <Text className="text-2xl font-bold text-orange-700">
                      {selectedUser?.inProgress || 0}
                    </Text>
                  </Card>
                  <Card
                    className="border-0 text-center"
                    style={{
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                    }}
                    bodyStyle={{ padding: "16px" }}
                  >
                    <Text className="text-xs text-gray-600 block mb-1">
                      Confirmed
                    </Text>
                    <Text className="text-2xl font-bold text-green-700">
                      {selectedUser?.confirmed || 0}
                    </Text>
                  </Card>
                  <Card
                    className="border-0 text-center"
                    style={{
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                    }}
                    bodyStyle={{ padding: "16px" }}
                  >
                    <Text className="text-xs text-gray-600 block mb-1">
                      Cancelled
                    </Text>
                    <Text className="text-2xl font-bold text-red-700">
                      {selectedUser?.cancelled || 0}
                    </Text>
                  </Card>
                </div>

                {/* Events List */}
                <Table
                  dataSource={selectedUserEvents}
                  rowKey="_id"
                  pagination={false}
                  columns={[
                    {
                      title: "#",
                      key: "index",
                      width: 60,
                      render: (_, __, index) => (
                        <Tag color="blue">{index + 1}</Tag>
                      ),
                    },
                    {
                      title: "Event Name",
                      key: "eventName",
                      render: (_, record) => (
                        <Text strong>{getEventName(record.eventName)}</Text>
                      ),
                    },
                    {
                      title: "Client Name",
                      key: "clientName",
                      render: (_, record) => (
                        <Text>{formatText(record.clientName) || "N/A"}</Text>
                      ),
                    },
                    {
                      title: "Status",
                      key: "status",
                      width: 120,
                      render: (_, record) => {
                        const status = record.eventConfirmation;
                        const colorMap = {
                          "Confirmed Event": "green",
                          InProgress: "orange",
                          Cancelled: "red",
                        };
                        return (
                          <Tag color={colorMap[status] || "default"}>
                            {status}
                          </Tag>
                        );
                      },
                    },
                  ]}
                  size="small"
                />
              </>
            ) : (
              <>
                {/* Summary Card */}
                <Card
                  className="border-0 text-center mb-6"
                  style={{
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                  }}
                  bodyStyle={{ padding: "24px" }}
                >
                  <Text className="text-sm text-gray-600 block mb-2">
                    Total Amount Booked
                  </Text>
                  <Text className="text-3xl font-bold text-green-700">
                    {formatAmount(selectedUser?.totalAmount || 0)}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-2 block">
                    {selectedUserEvents.length} Confirmed Events
                  </Text>
                </Card>

                {/* Events Breakdown */}
                <Table
                  dataSource={selectedUserEvents}
                  rowKey="_id"
                  pagination={false}
                  columns={[
                    {
                      title: "#",
                      key: "index",
                      width: 60,
                      render: (_, __, index) => (
                        <Tag color="green">{index + 1}</Tag>
                      ),
                    },
                    {
                      title: "Event Name",
                      key: "eventName",
                      render: (_, record) => (
                        <Text strong>{getEventName(record.eventName)}</Text>
                      ),
                    },
                    {
                      title: "Client Name",
                      key: "clientName",
                      render: (_, record) => (
                        <Text>{formatText(record.clientName) || "N/A"}</Text>
                      ),
                    },
                    {
                      title: "Agreed Amount",
                      key: "agreedAmount",
                      align: "right",
                      width: 150,
                      render: (_, record) => (
                        <Text strong className="text-green-600">
                          {formatAmount(record.agreedAmount || 0)}
                        </Text>
                      ),
                    },
                  ]}
                  size="small"
                />
              </>
            )}
          </div>
        )}
      </Drawer>

      <style>{`
        .modern-table .ant-table-thead > tr > th {
          background: #f8fafc;
          font-weight: 600;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
          padding: 16px;
        }

        .modern-table .ant-table-tbody > tr {
          transition: all 0.2s ease;
        }

        .modern-table .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }

        .modern-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
          padding: 16px;
        }

        .ant-tabs-tab {
          border-radius: 8px 8px 0 0;
          padding: 12px 20px;
          font-weight: 500;
        }

        .ant-tabs-tab-active {
          background: #f8fafc;
        }

        .ant-tabs-ink-bar {
          height: 3px;
          border-radius: 3px 3px 0 0;
        }
      `}</style>
    </div>
  );
};

export default UserWiseClients;
