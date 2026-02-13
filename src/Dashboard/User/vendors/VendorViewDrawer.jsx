import React, { useState } from "react";
import { Drawer, Tabs, Button } from "antd";
import { FilePdfOutlined, FileWordOutlined } from "@ant-design/icons";
import ViewVendorDetailsContent from "./ViewVendorDetailsContent";
import VendorEventsTab from "./VendorEventsTab";

const TAB_KEYS = {
  DETAILS: "details",
  EVENTS: "events",
};

/**
 * Drawer shown when user clicks the eye icon on a vendor.
 * Two tabs: View details | Events vendor was part in.
 */
const VendorViewDrawer = ({
  open,
  onClose,
  vendor,
  isMobile,
  config,
  onExportPdf,
  onExportDocx,
}) => {
  const [activeTab, setActiveTab] = useState(TAB_KEYS.DETAILS);
  const vendorId = vendor?._id || vendor?.id;

  return (
    <Drawer
      title={vendor ? `Vendor - ${vendor.name}` : "Vendor Details"}
      placement="right"
      width={isMobile ? "100%" : 560}
      onClose={onClose}
      open={open}
      bodyStyle={{
        paddingTop: 8,
        paddingBottom: 24,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      footer={
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Close</Button>
          {vendor && onExportPdf && (
            <Button
              icon={<FilePdfOutlined />}
              onClick={() => onExportPdf(vendor)}
              style={{
                background: "#e74c3c",
                color: "#fff",
                border: "none",
              }}
            >
              Export PDF
            </Button>
          )}
          {vendor && onExportDocx && (
            <Button
              icon={<FileWordOutlined />}
              onClick={() => onExportDocx(vendor)}
              style={{
                background: "#2980b9",
                color: "#fff",
                border: "none",
              }}
            >
              Export DOCX
            </Button>
          )}
        </div>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: TAB_KEYS.DETAILS,
            label: "View details",
            children: (
              <div
                style={{
                  maxHeight: isMobile ? "60vh" : "65vh",
                  overflowY: "auto",
                }}
              >
                <ViewVendorDetailsContent vendor={vendor} isMobile={isMobile} />
              </div>
            ),
          },
          {
            key: TAB_KEYS.EVENTS,
            label: "Events vendor was part in",
            children: (
              <div
                style={{
                  maxHeight: isMobile ? "60vh" : "65vh",
                  overflowY: "auto",
                }}
              >
                <VendorEventsTab vendorId={vendorId} config={config} />
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default VendorViewDrawer;
