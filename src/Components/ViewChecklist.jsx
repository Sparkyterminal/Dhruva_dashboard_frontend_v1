/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import { message, Table, Button, Input, Card, Space, Modal, Drawer, Typography, Divider } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  EyeOutlined,
  FileWordOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ViewChecklist = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const config = {
    headers: {
      Authorization: user?.access_token,
    },
  };

  const getAddChecklistPath = () => "/user/addchecklists";

  const getEditChecklistPath = (id) => `/user/editchecklists/${id || ""}`;

  const fetchChecklistData = async (page = 1, search = debouncedSearchText) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}checklist?page=${page}&search=${search}`,
        config
      );
      setChecklists(res.data.items || []);
      setPagination((prev) => ({
        ...prev,
        current: res.data.currentPage,
        total: res.data.totalItems,
      }));
    } catch (err) {
      message.error("Failed to fetch checklists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    fetchChecklistData(1, debouncedSearchText);
  }, [debouncedSearchText]);

  const handleTableChange = (pagination) => {
    fetchChecklistData(pagination.current, searchText);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}checklist/${id}`, config);
      message.success("Checklist deleted successfully");
      fetchChecklistData(pagination.current, searchText);
    } catch (err) {
      message.error("Failed to delete checklist");
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const getChecklistColumns = () => {
    const allFields = {
      checklistName: "Checklist Name",
      units: "Units",
      quantity: "Quantity",
      length: "Length",
      breadth: "Breadth",
      depth: "Depth",
      rate: "Rate",
    };

    const columns = [
      {
        title: "#",
        key: "index",
        width: 50,
        render: (_, __, index) => index + 1,
      },
    ];

    Object.keys(allFields).forEach((field) => {
      columns.push({
        title: allFields[field],
        dataIndex: field,
        key: field,
        width: field === "checklistName" ? 200 : 100,
        render: (text) => (text && text.toString().trim() !== "" ? text : "-"),
      });
    });

    return columns;
  };

  const exportToPDF = (record) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text(record.heading, 14, 20);

    let yPosition = 30;
    if (record.eventReference) {
      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.text(`Event Reference: ${record.eventReference}`, 14, yPosition);
      yPosition += 8;
    }

    yPosition += 5;

    if (record.subHeadings && Array.isArray(record.subHeadings)) {
      record.subHeadings.forEach((subHeading, subIndex) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text(`${subIndex + 1}. ${subHeading.subHeadingName}`, 14, yPosition);
        yPosition += 8;

        if (subHeading.checklists && Array.isArray(subHeading.checklists) && subHeading.checklists.length > 0) {
          const allFields = ["checklistName", "units", "quantity", "length", "breadth", "depth", "rate"];
          const fieldLabels = {
            checklistName: "Checklist Name",
            units: "Units",
            quantity: "Quantity",
            length: "Length",
            breadth: "Breadth",
            depth: "Depth",
            rate: "Rate",
          };

          const headers = ["#", ...allFields.map((field) => fieldLabels[field])];
          const tableData = subHeading.checklists.map((checklist, index) => {
            const row = [index + 1];
            allFields.forEach((field) => {
              const value = checklist[field];
              row.push(value && value.toString().trim() !== "" ? value : "-");
            });
            return row;
          });

          autoTable(doc, {
            startY: yPosition,
            head: [headers],
            body: tableData,
            theme: "grid",
            headStyles: { fillColor: [102, 126, 234], fontStyle: "bold", fontSize: 10 },
            bodyStyles: { fontSize: 9 },
            margin: { left: 14, right: 14 },
            didDrawPage: (data) => { yPosition = data.cursor.y + 10; },
          });

          yPosition = doc.lastAutoTable.finalY + 10;
        }
      });
    }

    doc.save(`${record.heading}-checklist.pdf`);
    message.success("PDF exported successfully");
  };

  const exportToDOCX = (record) => {
    const allFields = ["checklistName", "units", "quantity", "length", "breadth", "depth", "rate"];
    const fieldLabels = {
      checklistName: "Checklist Name",
      units: "Units",
      quantity: "Quantity",
      length: "Length",
      breadth: "Breadth",
      depth: "Depth",
      rate: "Rate",
    };

    let htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #667eea; margin-bottom: 10px; }
            h2 { color: #667eea; margin-top: 30px; margin-bottom: 15px; font-size: 16px; }
            .metadata { margin-bottom: 20px; font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #667eea; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8f7ff; }
          </style>
        </head>
        <body>
          <h1>${record.heading}</h1>
          <div class="metadata">
            ${record.eventReference ? `<p><strong>Event Reference:</strong> ${record.eventReference}</p>` : ""}
          </div>
    `;

    if (record.subHeadings && Array.isArray(record.subHeadings)) {
      record.subHeadings.forEach((subHeading, subIndex) => {
        htmlContent += `<h2>${subIndex + 1}. ${subHeading.subHeadingName}</h2>`;

        if (subHeading.checklists && Array.isArray(subHeading.checklists) && subHeading.checklists.length > 0) {
          htmlContent += `<table><thead><tr><th>#</th>`;
          allFields.forEach((field) => { htmlContent += `<th>${fieldLabels[field]}</th>`; });
          htmlContent += `</tr></thead><tbody>`;

          subHeading.checklists.forEach((checklist, index) => {
            htmlContent += `<tr><td>${index + 1}</td>`;
            allFields.forEach((field) => {
              const value = checklist[field];
              htmlContent += `<td>${value && value.toString().trim() !== "" ? value : "-"}</td>`;
            });
            htmlContent += `</tr>`;
          });

          htmlContent += `</tbody></table>`;
        }
      });
    }

    htmlContent += `</body></html>`;

    const blob = new Blob(["\ufeff", htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${record.heading}-checklist.doc`;
    link.click();
    URL.revokeObjectURL(url);
    message.success("DOCX exported successfully");
  };

  const columns = [
    {
      title: "Heading",
      dataIndex: "heading",
      key: "heading",
      render: (text) => <span className="font-bold text-purple-900 text-sm">{text}</span>,
    },
    {
      title: "Event Reference",
      dataIndex: "eventReference",
      key: "eventReference",
      render: (text) => text || "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            title="View Details"
            className="text-purple-500"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(getEditChecklistPath(record.id))}
            title="Edit"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              Modal.confirm({
                title: "Delete Checklist",
                content: "Are you sure you want to delete this checklist?",
                onOk: () => handleDelete(record.id),
              })
            }
            title="Delete"
          />
        </Space>
      ),
    },
    {
      title: "Download",
      key: "download",
      width: 200,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={() => exportToPDF(record)}
            size="small"
            title="Export to PDF"
          >
            PDF
          </Button>
          <Button
            type="primary"
            icon={<FileWordOutlined />}
            onClick={() => exportToDOCX(record)}
            size="small"
            title="Export to DOCX"
          >
            DOCX
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-purple-100">

          {/* Header */}
          <div className="bg-purple-600 px-6 py-5">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              className="bg-white/20 border border-white/30 text-white rounded-lg font-semibold hover:bg-white/30"
              ghost
            >
              Back
            </Button>
            <h1 className="text-white text-3xl font-bold text-center mt-4 tracking-wide">
              Checklist Management
            </h1>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Search + Add */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Input.Search
                placeholder="Search checklists..."
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
                size="large"
                className="flex-1"
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate(getAddChecklistPath())}
                size="large"
              >
                Add Checklist
              </Button>
            </div>

            {/* Table */}
            <Table
              columns={columns}
              dataSource={checklists}
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
              rowKey="id"
              scroll={{ x: "max-content" }}
            />
          </div>
        </div>
      </div>

      {/* Drawer */}
      <Drawer
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        width="90%"
        destroyOnClose
        closable
        zIndex={1000}
      >
        {selectedRecord && (
          <div>
            {/* Drawer Header */}
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <Typography.Title level={3} className="mb-0!">
                  {selectedRecord.heading}
                </Typography.Title>
                {selectedRecord.eventReference && (
                  <Typography.Text type="secondary">
                    Event Reference: {selectedRecord.eventReference}
                  </Typography.Text>
                )}
              </div>
              <Button onClick={() => setModalVisible(false)}>Close</Button>
            </div>

            <Divider />

            {/* Sub headings */}
            {selectedRecord.subHeadings &&
            Array.isArray(selectedRecord.subHeadings) &&
            selectedRecord.subHeadings.length > 0 ? (
              selectedRecord.subHeadings.map((subHeading, subIndex) => {
                if (
                  !subHeading.checklists ||
                  !Array.isArray(subHeading.checklists) ||
                  subHeading.checklists.length === 0
                ) {
                  return null;
                }

                return (
                  <div key={subIndex} className="mb-6">
                    <Typography.Title
                      level={4}
                      className="text-purple-500! mb-3!"
                    >
                      {subIndex + 1}. {subHeading.subHeadingName}
                    </Typography.Title>
                    <Table
                      columns={getChecklistColumns()}
                      dataSource={subHeading.checklists}
                      pagination={false}
                      rowKey={(_, index) => `sub-${subIndex}-check-${index}`}
                      scroll={{ x: "max-content" }}
                      size="small"
                    />
                  </div>
                );
              })
            ) : (
              <Typography.Paragraph>No checklist items available.</Typography.Paragraph>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ViewChecklist;