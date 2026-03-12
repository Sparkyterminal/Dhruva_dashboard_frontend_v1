import React from "react";
import { Card, Row, Col, Statistic, Typography } from "antd";
import { motion } from "framer-motion";

const { Text } = Typography;

const cardStyle = (leftColor) => ({
  borderRadius: "14px",
  background: "white",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  borderLeft: `4px solid ${leftColor}`,
});

const ClientBookingsStatsCards = ({
  totalBookings,
  totalPayableRevenue,
  totalPendingRevenue,
  totalReceivedRevenue,
  formatAmount,
}) => (
  <Row gutter={[16, 16]} className="mb-6" align="stretch">
    <Col xs={24} sm={12} md={6}>
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card
          className="border-0 h-full"
          style={cardStyle("#6366f1")}
          bodyStyle={{ padding: "20px" }}
        >
          <Statistic
            title={
              <Text className="text-slate-500 text-sm font-medium">
                Total Bookings
              </Text>
            }
            value={totalBookings}
            valueStyle={{
              color: "#1e293b",
              fontSize: "28px",
              fontWeight: "700",
              marginTop: "8px",
            }}
          />
        </Card>
      </motion.div>
    </Col>
    <Col xs={24} sm={12} md={6}>
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card
          className="border-0 h-full"
          style={cardStyle("#10b981")}
          bodyStyle={{ padding: "20px" }}
        >
          <Statistic
            title={
              <Text className="text-slate-500 text-sm font-medium">
                Total Payable
              </Text>
            }
            value={totalPayableRevenue}
            valueStyle={{
              color: "#1e293b",
              fontSize: "28px",
              fontWeight: "700",
              marginTop: "8px",
            }}
            formatter={(value) => formatAmount(value)}
          />
        </Card>
      </motion.div>
    </Col>
    <Col xs={24} sm={12} md={6}>
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <Card
          className="border-0 h-full"
          style={cardStyle("#f59e0b")}
          bodyStyle={{ padding: "20px" }}
        >
          <Statistic
            title={
              <Text className="text-slate-500 text-sm font-medium">
                Pending Amount
              </Text>
            }
            value={totalPendingRevenue}
            valueStyle={{
              color: "#1e293b",
              fontSize: "28px",
              fontWeight: "700",
              marginTop: "8px",
            }}
            formatter={(value) => formatAmount(value)}
          />
        </Card>
      </motion.div>
    </Col>
    <Col xs={24} sm={12} md={6}>
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card
          className="border-0 h-full"
          style={cardStyle("#22c55e")}
          bodyStyle={{ padding: "20px" }}
        >
          <Statistic
            title={
              <Text className="text-slate-500 text-sm font-medium">
                Amount Received
              </Text>
            }
            value={totalReceivedRevenue}
            valueStyle={{
              color: "#1e293b",
              fontSize: "28px",
              fontWeight: "700",
              marginTop: "8px",
            }}
            formatter={(value) => formatAmount(value)}
          />
        </Card>
      </motion.div>
    </Col>
  </Row>
);

export default ClientBookingsStatsCards;
