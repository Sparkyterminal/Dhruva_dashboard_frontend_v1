import React from "react";
import { Card, DatePicker, Col, Row, Typography } from "antd";

const { Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * value: [startDayjs, endDayjs] (Dayjs objects)
 */
const DaybookDateSelector = ({ value, onChange }) => {
  return (
    <Card
      className="border-0 shadow-sm"
      style={{
        borderRadius: "16px",
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(10px)",
      }}
      bodyStyle={{ padding: "18px 20px" }}
    >
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} md={6}>
          <Text className="text-slate-700 font-semibold">
            Select date range
          </Text>
        </Col>
        <Col xs={24} md={10}>
          <RangePicker
            value={value}
            onChange={(d) => onChange?.(d)}
            format="YYYY-MM-DD"
            style={{ width: "100%" }}
            size="large"
            allowEmpty={[false, false]}
          />
        </Col>
        {/* <Col xs={24} md={8}>
          <Text type="secondary">
            Backend day boundary is UTC. This date is sent as `YYYY-MM-DD`.
          </Text>
        </Col> */}
      </Row>
    </Card>
  );
};

export default DaybookDateSelector;

