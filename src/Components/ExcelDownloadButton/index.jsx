import React, { useState } from "react";
import { Button, message } from "antd";
import { FileExcelOutlined } from "@ant-design/icons";

/**
 * "Download Excel" button with a loading state and error toast.
 * `onDownload` is async and does the actual export; it should return `false`
 * (after showing its own message) when there was nothing to export.
 */
const ExcelDownloadButton = ({
  onDownload,
  label = "Download Excel",
  size = "large",
  disabled = false,
  style,
  className,
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onDownload();
    } catch (err) {
      console.error(err);
      message.error("Failed to generate the Excel file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      icon={<FileExcelOutlined />}
      loading={loading}
      disabled={disabled}
      onClick={handleClick}
      size={size}
      className={className}
      style={{ borderRadius: 10, ...style }}
    >
      {label}
    </Button>
  );
};

export default ExcelDownloadButton;
