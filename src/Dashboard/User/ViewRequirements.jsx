/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Card,
  Table,
  Tabs,
  Row,
  Col,
  Statistic,
  Tag,
  message,
  Pagination,
} from "antd";
// Removed Ant Design icons imports, replaced by Lottie anims
import Lottie from "lottie-react";
import axios from "axios";
import dayjs from "dayjs";
import { API_BASE_URL } from "../../../config";
import totalrequest from "../../assets/totaluser.json";
import pendingrequest from "../../assets/pendinguser.json";
import completedrequest from "../../assets/successuser.json";
import {
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  FlagOutlined,
} from "@ant-design/icons";

const iconStyle = { width: 40, height: 40 };

const ViewRequirements = () => {
  const user = useSelector((state) => state.user.value);

  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeTab, setActiveTab] = useState("cards");

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const fetchRequirementsData = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}request/my-requests?page=${page}`,
        config
      );
      setRequirements(res.data.items || []);
      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
      setTotalItems(res.data.totalItems);
    } catch (err) {
      message.error("Failed to fetch requirements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementsData();
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchRequirementsData(page);
  };

  // Filter for cards: only show PENDING status requirements
  const pendingRequirements = requirements.filter(
    (req) => req.status === "PENDING"
  );

  // Calculate stats only for pending requirements (for cards)
  const totalAmount = pendingRequirements.reduce(
    (sum, req) => sum + req.amount,
    0
  );
  const totalCount = pendingRequirements.length;
  const pendingCount = totalCount; // Same as filtered count
  // confirmedCount is for complete list but cards do not show it

  const confirmedCount = requirements.filter(
    (req) => req.status === "COMPLETED"
  ).length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "red";
      case "MEDIUM":
        return "orange";
      case "LOW":
        return "green";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "orange";
      case "CONFIRMED":
        return "blue";
      case "COMPLETED":
        return "green";
      case "REJECTED":
        return "red";
      default:
        return "default";
    }
  };

  const getRowClassName = (record) => {
    const today = dayjs().startOf("day");
    const dueDate = dayjs(record.due_date).startOf("day");
    if (dueDate.isBefore(today)) {
      return "requirement-row-overdue";
    }
    if (record.status == "REJECTED") {
      return "requirement-row-rejected";
    }
    if (record.status == "COMPLETED") {
      return "requirement-row-resolved";
    }
    if (record.status === "PENDING") {
      return "requirement-row-pending";
    }
    return "";
  };

  const columns = [
  {
    title: "Sl. No",
    dataIndex: "slNo",
    key: "slNo",
    render: (_text, _record, index) => (currentPage - 1) * 10 + index + 1,
    width: 80,
  },
  {
    title: "Purpose",
    dataIndex: "purpose",
    key: "purpose",
  },
  {
    title: "Amount",
    dataIndex: "amount",
    key: "amount",
    render: (amount) => `₹${amount.toLocaleString()}`,
  },
  {
    title: "Priority",
    dataIndex: "priority",
    key: "priority",
    render: (priority) => (
      <Tag color={getPriorityColor(priority)}>{priority}</Tag>
    ),
  },
  {
    title: "Planned Amount",
    dataIndex: "planned_amount",
    key: "planned_amount",
    render: (amount) => `₹${amount.toLocaleString()}`,
  },
  {
    title: "Amount Paid",
    dataIndex: "amount_paid",
    key: "amount_paid",
    render: (amount) => `₹${amount.toLocaleString()}`,
  },
  {
    title: "Transaction In",
    dataIndex: "transation_in",
    key: "transation_in",
  },
  {
    title: "Vendor",
    dataIndex: "vendor",
    key: "vendor",
    render: (vendor) =>
      vendor ? <Tag color="geekblue">{vendor}</Tag> : <span>No Vendor</span>,
  },
];

  const CardView = () => (
    <div>
      <Row gutter={[16, 16]}>
        {pendingRequirements.map((req) => (
          <Col xs={24} sm={12} lg={8} key={req.id}>
            <Card
              hoverable
              className={`h-full ${getRowClassName(req)} border-l-4 ${
                req.priority === "HIGH"
                  ? "border-l-red-500"
                  : req.priority === "MEDIUM"
                  ? "border-l-orange-500"
                  : "border-l-green-500"
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-cormorant text-xl font-bold text-black line-clamp-2">
                    {req.purpose}
                  </h3>
                  <Tag color={getStatusColor(req.status)}>{req.status}</Tag>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-black flex items-center gap-2">
                      <DollarOutlined />
                      <span className="font-cormorant font-semibold text-lg">
                        Amount:
                      </span>
                    </span>
                    <span className="font-semibold text-black">
                      ₹{req.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-black flex items-center gap-2">
                      <FlagOutlined />
                      <span className="font-cormorant font-semibold text-lg">
                        Priority:
                      </span>
                    </span>
                    <Tag color={getPriorityColor(req.priority)}>
                      {req.priority}
                    </Tag>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-black flex items-center gap-2">
                      <CalendarOutlined />
                      <span className="font-cormorant font-semibold text-lg">
                        Transaction In:
                      </span>
                    </span>
                    <span className="text-black">{req.transation_in}</span>
                  </div>
                </div>

                {req.department && (
                  <div className="pt-2 border-t">
                    <span className="text-xs text-black">
                      Department: {req.department.name}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="flex justify-center mt-6">
        <Pagination
          current={currentPage}
          total={totalItems}
          pageSize={10}
          onChange={handlePageChange}
          showSizeChanger={false}
          showTotal={(total) => `Total ${total} items`}
        />
      </div>
    </div>
  );

  // Replacing the icons with Lottie animations in the statistics cards below

  const ListView = () => (
    <div>
      <Table
        dataSource={requirements}
        columns={columns}
        loading={loading}
        rowKey="id"
        rowClassName={getRowClassName}
        pagination={false}
        scroll={{ x: 800 }}
      />

      <div className="flex justify-center mt-6">
        <Pagination
          current={currentPage}
          total={totalItems}
          pageSize={10}
          onChange={handlePageChange}
          showSizeChanger={false}
          showTotal={(total) => `Total ${total} items`}
        />
      </div>
    </div>
  );

  const tabItems = [
    {
      key: "cards",
      label: (
        <span className="font-cormorant text-base">
          <DollarOutlined /> Cards
        </span>
      ),
      children: <CardView />,
    },
    {
      key: "list",
      label: (
        <span className="font-cormorant text-base">
          <ClockCircleOutlined /> List
        </span>
      ),
      children: <ListView />,
    },
  ];

  return (
    <div className="p-4 md:p-6 min-h-screen font-cormorant">
      <h1 className="text-3xl md:text-4xl font-bold text-black mb-6">
        Dashboard
      </h1>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card className="shadow-md" style={{ backgroundColor: "#e6f7ff" }}>
            <Statistic
              title={
                <span className="font-cormorant text-xl font-medium">
                  Total Request
                </span>
              }
              value={totalCount}
              valueStyle={{
                color: "#1890ff",
                fontFamily: "Cormorant Garamond",
              }}
              prefix={
                <Lottie
                  animationData={totalrequest}
                  loop={true}
                  style={iconStyle}
                />
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="shadow-md" style={{ backgroundColor: "#fffbe6" }}>
            <Statistic
              title={
                <span className="font-cormorant text-xl font-medium">
                  Pending Requests
                </span>
              }
              value={pendingCount}
              valueStyle={{
                color: "#faad14",
                fontFamily: "Cormorant Garamond",
              }}
              prefix={
                <Lottie
                  animationData={pendingrequest}
                  loop={true}
                  style={iconStyle}
                />
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="shadow-md" style={{ backgroundColor: "#f6ffed" }}>
            <Statistic
              title={
                <span className="font-cormorant text-xl font-medium">
                  Confirmed Requests
                </span>
              }
              value={confirmedCount}
              valueStyle={{
                color: "#52c41a",
                fontFamily: "Cormorant Garamond",
              }}
              prefix={
                <Lottie
                  animationData={completedrequest}
                  loop={true}
                  style={iconStyle}
                />
              }
            />
          </Card>
        </Col>
      </Row>

      <Card className="shadow-md">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');

        .font-cormorant {
          font-family: 'Cormorant Garamond', serif;
        }

        .requirement-row-overdue {
          background: #ffe5e8 !important;
        }
        .requirement-row-pending {
          background: #fff9e5 !important;
        }
        .requirement-row-resolved {
          background: #e6ffe6 !important;
        }
        .requirement-row-rejected {
          background: #ffe5e5 !important;
        }  

        .ant-card-hoverable:hover {
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }

        .ant-statistic-title {
          font-size: 16px;
          color: #000000 !important;
        }

        .ant-statistic-content-value {
          font-size: 28px;
          color: #000000 !important;
        }

        .text-gray-600,
        .text-gray-500,
        .text-gray-800 {
          color: #000000 !important;
        }
      `}</style>
    </div>
  );
};

export default ViewRequirements;