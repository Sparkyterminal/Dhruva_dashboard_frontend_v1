import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message, Table, Modal, Drawer } from "antd";
import {
  Eye,
  FileDown,
  FileText,
  Layers,
  ListChecks,
  ListTree,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  EmptyState,
  PageHero,
  SearchBox,
  StatCard,
  StatRow,
} from "@/Components/PageKit";
import axiosClient from "@/api/axiosClient";
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
      const res = await axiosClient.get(
        `checklist?page=${page}&search=${search}`,
        config
      );
      setChecklists(res.data.items || []);
      setPagination((prev) => ({
        ...prev,
        current: res.data.currentPage,
        total: res.data.totalItems,
      }));
    } catch {
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
      await axiosClient.delete(`checklist/${id}`, config);
      message.success("Checklist deleted successfully");
      fetchChecklistData(pagination.current, searchText);
    } catch {
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
            body { font-family: 'Montserrat', sans-serif; padding: 20px; }
            h1 { color: #226a36; margin-bottom: 10px; }
            h2 { color: #226a36; margin-top: 30px; margin-bottom: 15px; font-size: 16px; }
            .metadata { margin-bottom: 20px; font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #226a36; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f4f8f4; }
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
      title: "Checklist",
      dataIndex: "heading",
      key: "heading",
      render: (text, record) => (
        <div className="pk-who">
          <span className="pk-avatar is-soft" aria-hidden="true">
            <ListChecks size={19} />
          </span>
          <div style={{ minWidth: 0 }}>
            <strong>{text || "—"}</strong>
            <span>
              {Array.isArray(record.subHeadings) ? record.subHeadings.length : 0} sub-heading
              {Array.isArray(record.subHeadings) && record.subHeadings.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Event reference",
      dataIndex: "eventReference",
      key: "eventReference",
      width: 220,
      render: (text) =>
        text ? <span className="pk-pill is-gold">{text}</span> : <span className="pk-muted">—</span>,
    },
    {
      title: "",
      key: "actions",
      width: 380,
      align: "right",
      render: (_, record) => (
        <div className="pk-actions">
          <button type="button" className="pk-btn" onClick={() => exportToPDF(record)} title="Export to PDF">
            <FileDown size={14} aria-hidden="true" /> PDF
          </button>
          <button type="button" className="pk-btn" onClick={() => exportToDOCX(record)} title="Export to Word">
            <FileText size={14} aria-hidden="true" /> Word
          </button>
          <button type="button" className="pk-btn" onClick={() => handleViewDetails(record)}>
            <Eye size={14} aria-hidden="true" /> View
          </button>
          <button
            type="button"
            className="pk-btn is-solid"
            onClick={() => navigate(getEditChecklistPath(record.id))}
          >
            <Pencil size={13} aria-hidden="true" /> Edit
          </button>
          <button
            type="button"
            className="pk-btn is-danger is-icon"
            aria-label="Delete checklist"
            onClick={() =>
              Modal.confirm({
                title: "Delete checklist",
                content: "Are you sure you want to delete this checklist?",
                okText: "Delete",
                okType: "danger",
                onOk: () => handleDelete(record.id),
              })
            }
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  const subCount = checklists.reduce(
    (sum, c) => sum + (Array.isArray(c.subHeadings) ? c.subHeadings.length : 0),
    0,
  );

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Events"
          title="Checklist Management"
          subtitle="Build, review and export the item checklists used for events."
          onBack={() => navigate(-1)}
          backLabel="Back"
        >
          <button type="button" className="pk-cta" onClick={() => navigate(getAddChecklistPath())}>
            <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add checklist
          </button>
        </PageHero>

        <StatRow>
          <StatCard icon={<ListChecks size={21} aria-hidden="true" />} label="Total checklists" value={pagination.total} />
          <StatCard tone="gold" icon={<Layers size={21} aria-hidden="true" />} label="Shown on this page" value={checklists.length} />
          <StatCard tone="blue" icon={<ListTree size={21} aria-hidden="true" />} label="Sub-headings on this page" value={subCount} />
        </StatRow>

        <section className="pk-panel">
          <div className="pk-toolbar">
            <div className="pk-toolbar-left">
              <SearchBox
                icon={<Search size={16} aria-hidden="true" />}
                value={searchText}
                onChange={setSearchText}
                placeholder="Search checklists"
                label="Search checklists"
              />
            </div>
          </div>

          <Table
            className="pk-table"
            columns={columns}
            dataSource={checklists}
            loading={loading}
            pagination={{ ...pagination, showSizeChanger: false, showTotal: (total) => `Total ${total} checklists` }}
            onChange={handleTableChange}
            rowKey="id"
            scroll={{ x: 820 }}
            locale={{
              emptyText: loading ? null : (
                <EmptyState
                  icon={<ListChecks size={26} aria-hidden="true" />}
                  title={searchText ? "No checklists match your search" : "No checklists yet"}
                  hint={searchText ? "Try a different search." : "Use “Add checklist” to create the first one."}
                />
              ),
            }}
          />
        </section>
      </div>

      <Drawer
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        width="min(960px, 94%)"
        destroyOnHidden
        title={selectedRecord?.heading || "Checklist"}
        extra={
          selectedRecord ? (
            <div className="pk-actions">
              <button type="button" className="pk-btn" onClick={() => exportToPDF(selectedRecord)}>
                <FileDown size={14} aria-hidden="true" /> PDF
              </button>
              <button type="button" className="pk-btn" onClick={() => exportToDOCX(selectedRecord)}>
                <FileText size={14} aria-hidden="true" /> Word
              </button>
            </div>
          ) : null
        }
      >
        {selectedRecord && (
          <div>
            {selectedRecord.eventReference && (
              <p style={{ margin: "0 0 18px" }}>
                <span className="pk-pill is-gold">Event reference: {selectedRecord.eventReference}</span>
              </p>
            )}

            {Array.isArray(selectedRecord.subHeadings) &&
            selectedRecord.subHeadings.some((s) => Array.isArray(s.checklists) && s.checklists.length) ? (
              selectedRecord.subHeadings.map((subHeading, subIndex) => {
                if (!Array.isArray(subHeading.checklists) || subHeading.checklists.length === 0) {
                  return null;
                }
                return (
                  <div key={subIndex} style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 600, color: "var(--brand)" }}>
                      {subIndex + 1}. {subHeading.subHeadingName}
                    </h3>
                    <div className="pk-panel">
                      <Table
                        className="pk-table"
                        columns={getChecklistColumns()}
                        dataSource={subHeading.checklists}
                        pagination={false}
                        rowKey={(_, index) => `sub-${subIndex}-check-${index}`}
                        scroll={{ x: "max-content" }}
                        size="small"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={<ListChecks size={26} aria-hidden="true" />}
                title="No checklist items available"
              />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ViewChecklist;
