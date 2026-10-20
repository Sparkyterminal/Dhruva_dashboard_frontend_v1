import axiosClient from "@/api/axiosClient";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { message, Table, Modal, Dropdown, Spin } from "antd";
import ExcelDownloadButton from "@/Components/ExcelDownloadButton";
import { downloadVendorsExcel } from "./vendorsExcel";
import {
  EyeOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  SearchOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  TeamOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document,
  Paragraph,
  TextRun,
  Table as DocxTable,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  BorderStyle,
  Packer,
} from "docx";
import { saveAs } from "file-saver";
import VendorViewDrawer from "./VendorViewDrawer";
import "./Vendors.css";


const ViewVendor = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);

  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const handleDeleteVendor = async (vendorId) => {
    if (!vendorId) return;
    try {
      await axiosClient.delete(`vendor/${vendorId}`, config);
      message.success("Vendor deleted successfully");
      fetchRequirementsData(categoryFilter);
    } catch (err) {
      message.error("Failed to delete vendor");
      console.error(err);
    }
  };

  const getAddVendorPath = () => "/user/addvendor";

  const getEditVendorPath = (id) => `/user/editvendor/${id || ""}`;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchRequirementsData = async (category = null) => {
    setLoading(true);
    try {
      const url = category
        ? `vendor/all?specify_cat=${category}`
        : `vendor/all`;
      const res = await axiosClient.get(url, config);
      setVendors(res.data.vendors.reverse() || []);
    } catch {
      message.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementsData(categoryFilter);
    // eslint-disable-next-line
  }, [categoryFilter]);

  const exportToPDF = (vendor) => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Vendor Registered Form", 105, 22, { align: "center" });

    // Build table data with only non-empty fields
    const tableData = [];

    // First row: Vendor Code and Vendor Name together
    // if (vendor.vendor_code || vendor.name) {
    //   const combined = `${vendor.vendor_code || ""}${
    //     vendor.vendor_code && vendor.name ? "    " : ""
    //   }${vendor.name || ""}`;
    //   tableData.push(["Vendor Code / Name", combined]);
    // }
    if (vendor.vendor_code)
      tableData.push(["Vendor Code", vendor.vendor_code.toUpperCase()]);
    if (vendor.name) tableData.push(["Vendor Name", vendor.name]);
    // Second row: Company Name
    if (vendor.company_name)
      tableData.push(["Company Name", vendor.company_name]);

    // Then rest of the fields (avoid duplicating fields already added)

    // Permanent Address Section
    const hasPermanentAddress =
      vendor.perm_address_1 ||
      vendor.perm_address_2 ||
      vendor.perm_city ||
      vendor.perm_pin ||
      vendor.perm_state ||
      vendor.perm_country;
    if (hasPermanentAddress) {
      tableData.push(["", ""]);
      tableData.push(["PERMANENT ADDRESS", ""]);
      if (vendor.perm_address_1)
        tableData.push(["Address ", vendor.perm_address_1]);
      if (vendor.perm_address_2)
        tableData.push(["Address ", vendor.perm_address_2]);
      if (vendor.perm_city) tableData.push(["City", vendor.perm_city]);
      if (vendor.perm_pin) tableData.push(["PIN Code", vendor.perm_pin]);
      if (vendor.perm_state) tableData.push(["State", vendor.perm_state]);
      if (vendor.perm_country) tableData.push(["Country", vendor.perm_country]);
    }

    // Temporary Address Section
    const hasTempAddress =
      vendor.temp_address_1 ||
      vendor.temp_city ||
      vendor.temp_pin ||
      vendor.temp_state ||
      vendor.temp_country;
    if (hasTempAddress) {
      tableData.push(["", ""]);
      tableData.push(["TEMPORARY ADDRESS", ""]);
      if (vendor.temp_address_1)
        tableData.push(["Address ", vendor.temp_address_1]);
      if (vendor.temp_city) tableData.push(["City", vendor.temp_city]);
      if (vendor.temp_pin) tableData.push(["PIN Code", vendor.temp_pin]);
      if (vendor.temp_state) tableData.push(["State", vendor.temp_state]);
      if (vendor.temp_country) tableData.push(["Country", vendor.temp_country]);
    }

    // Contact Information
    tableData.push(["", ""]);
    tableData.push(["CONTACT INFORMATION", ""]);
    if (vendor.cont_person)
      tableData.push(["Contact Person", vendor.cont_person]);
    if (vendor.designation) tableData.push(["Designation", vendor.designation]);
    if (vendor.mobile_no) tableData.push(["Contact Number", vendor.mobile_no]);
    if (vendor.alt_mobile_no)
      tableData.push(["Alternate Mobile Number", vendor.alt_mobile_no]);
    if (vendor.email) tableData.push(["E-Mail", vendor.email]);

    // Tax & Registration Details
    const hasTaxDetails = vendor.gst_no || vendor.msmed_no || vendor.pan_no;
    if (hasTaxDetails) {
      tableData.push(["", ""]);
      tableData.push(["TAX & REGISTRATION DETAILS", ""]);
      if (vendor.gst_no) tableData.push(["GST Number", vendor.gst_no]);
      if (vendor.msmed_no) tableData.push(["MSMED Number", vendor.msmed_no]);
      if (vendor.pan_no) tableData.push(["PAN Number", vendor.pan_no]);
      if (vendor.adhar_no) tableData.push(["AADHAR Number", vendor.adhar_no]);
    }

    // Bank Details Section
    const hasBankDetails =
      vendor.bank_name ||
      vendor.bank_address_1 ||
      vendor.bank_address_2 ||
      vendor.bank_pin ||
      vendor.account_number ||
      vendor.ifscode ||
      vendor.branch ||
      vendor.beneficiary_name;
    if (hasBankDetails) {
      tableData.push(["", ""]);
      tableData.push(["BANK DETAILS", ""]);
      if (vendor.bank_name) tableData.push(["Bank Name", vendor.bank_name]);
      if (vendor.beneficiary_name)
        tableData.push(["Beneficiary Name", vendor.beneficiary_name]);
      if (vendor.account_number)
        tableData.push(["Account Number", vendor.account_number]);
      if (vendor.ifscode) tableData.push(["IFSC Code", vendor.ifscode]);
      if (vendor.branch) tableData.push(["Branch", vendor.branch]);
      if (vendor.bank_address_1)
        tableData.push(["Bank Address 1", vendor.bank_address_1]);
      if (vendor.bank_address_2)
        tableData.push(["Bank Address 2", vendor.bank_address_2]);
      if (vendor.bank_pin) tableData.push(["Bank PIN Code", vendor.bank_pin]);
    }

    // Payment Terms
    if (vendor.payment_terms || vendor.tds_details) {
      tableData.push(["", ""]);
      tableData.push(["PAYMENT INFORMATION", ""]);
      if (vendor.payment_terms)
        tableData.push(["Payment Terms", vendor.payment_terms]);
      if (vendor.tds_details)
        tableData.push(["TDS Rate & Section", vendor.tds_details]);
    }

    // Track section header indices for styling
    const sectionHeaders = [];
    tableData.forEach((row, index) => {
      if (row[0] && !row[1] && row[0] !== "") {
        sectionHeaders.push(index);
      }
    });

    autoTable(doc, {
      startY: 35,
      head: [],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 70 },
        1: { cellWidth: 120 },
      },
      didParseCell: function (data) {
        if (sectionHeaders.includes(data.row.index) || data.row.index === 0) {
          data.cell.styles.fillColor = [230, 230, 230];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    // Footer Notes
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 50;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      "*All the columns should be properly filled up. No column should be kept Blank.",
      14,
      finalY,
    );
    doc.text(
      "*All registered certificates should be scanned and attached in system.",
      14,
      finalY + 5,
    );

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Compulsory Documents to be Attached:", 14, finalY + 15);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const docs = [
      "1) Copy of PAN Card",
      "2) Address proof- copy of voter card, Aadhar card, license, passport",
      "3) Copy of GST certificate as applicable",
      "4) Copy of cancelled cheque",
      "5) MSMED form",
    ];

    let yPos = finalY + 20;
    docs.forEach((docItem) => {
      doc.text(docItem, 14, yPos);
      yPos += 5;
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SIGNATURE", 14, yPos + 10);
    doc.line(14, yPos + 15, 80, yPos + 15);

    const safeName = (vendor.name || vendor.vendor_code || "vendor")
      .toString()
      .replace(/\s+/g, "_");
    doc.save(`Vendor_${safeName}_${new Date().getTime()}.pdf`);
    message.success("PDF exported successfully!");
  };

  const exportToWord = async (vendor) => {
    try {
      const tableRows = [];

      // Helper function to create a row
      const createRow = (label, value, isHeader = false) => {
        return new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: label, bold: true, size: 20 }),
                  ],
                }),
              ],
              width: { size: 35, type: WidthType.PERCENTAGE },
              shading: isHeader ? { fill: "E6E6E6" } : undefined,
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: value || "", size: 20 })],
                }),
              ],
              width: { size: 65, type: WidthType.PERCENTAGE },
              shading: isHeader ? { fill: "E6E6E6" } : undefined,
            }),
          ],
        });
      };

      // First row: Vendor Code and Vendor Name
      if (vendor.vendor_code || vendor.name) {
        const combined = `${vendor.vendor_code || ""}${
          vendor.vendor_code && vendor.name ? "    " : ""
        }${vendor.name || ""}`;
        tableRows.push(createRow("Vendor Code / Name", combined));
      }
      // Second row: Company Name
      if (vendor.company_name)
        tableRows.push(createRow("Company Name", vendor.company_name));

      // Basic Information (rest) - avoid duplicating vendor_code/name/company_name
      if (vendor.person_category)
        tableRows.push(createRow("Category of Person", vendor.person_category));
      if (vendor.vendor_type)
        tableRows.push(createRow("Type Of Vendor", vendor.vendor_type));
      if (vendor.refered_by)
        tableRows.push(createRow("Referred By", vendor.refered_by));

      // Permanent Address
      const hasPermanentAddress =
        vendor.perm_address_1 ||
        vendor.perm_address_2 ||
        vendor.perm_city ||
        vendor.perm_pin ||
        vendor.perm_state ||
        vendor.perm_country;
      if (hasPermanentAddress) {
        tableRows.push(createRow("PERMANENT ADDRESS", "", true));
        if (vendor.perm_address_1)
          tableRows.push(createRow("Address ", vendor.perm_address_1));
        if (vendor.perm_address_2)
          tableRows.push(createRow("Address ", vendor.perm_address_2));
        if (vendor.perm_city)
          tableRows.push(createRow("City", vendor.perm_city));
        if (vendor.perm_pin)
          tableRows.push(createRow("PIN Code", vendor.perm_pin));
        if (vendor.perm_state)
          tableRows.push(createRow("State", vendor.perm_state));
        if (vendor.perm_country)
          tableRows.push(createRow("Country", vendor.perm_country));
      }

      // Temporary Address
      const hasTempAddress =
        vendor.temp_address_1 ||
        vendor.temp_city ||
        vendor.temp_pin ||
        vendor.temp_state ||
        vendor.temp_country;
      if (hasTempAddress) {
        tableRows.push(createRow("TEMPORARY ADDRESS", "", true));
        if (vendor.temp_address_1)
          tableRows.push(createRow("Address ", vendor.temp_address_1));
        if (vendor.temp_city)
          tableRows.push(createRow("City", vendor.temp_city));
        if (vendor.temp_pin)
          tableRows.push(createRow("PIN Code", vendor.temp_pin));
        if (vendor.temp_state)
          tableRows.push(createRow("State", vendor.temp_state));
        if (vendor.temp_country)
          tableRows.push(createRow("Country", vendor.temp_country));
      }

      // Contact Information
      tableRows.push(createRow("CONTACT INFORMATION", "", true));
      if (vendor.cont_person)
        tableRows.push(createRow("Contact Person", vendor.cont_person));
      if (vendor.designation)
        tableRows.push(createRow("Designation", vendor.designation));
      if (vendor.mobile_no)
        tableRows.push(createRow("Contact Number", vendor.mobile_no));
      if (vendor.alt_mobile_no)
        tableRows.push(
          createRow("Alternate Mobile Number", vendor.alt_mobile_no),
        );
      if (vendor.email) tableRows.push(createRow("E-Mail", vendor.email));

      // Tax Details
      const hasTaxDetails = vendor.gst_no || vendor.msmed_no || vendor.pan_no;
      if (hasTaxDetails) {
        tableRows.push(createRow("TAX & REGISTRATION DETAILS", "", true));
        if (vendor.gst_no)
          tableRows.push(createRow("GST Number", vendor.gst_no));
        if (vendor.msmed_no)
          tableRows.push(createRow("MSMED Number", vendor.msmed_no));
        if (vendor.pan_no)
          tableRows.push(createRow("PAN Number", vendor.pan_no));
        if (vendor.adhar_no)
          tableRows.push(createRow("AADHAR Number", vendor.adhar_no));
      }

      // Bank Details
      const hasBankDetails =
        vendor.bank_name ||
        vendor.bank_address_1 ||
        vendor.bank_address_2 ||
        vendor.bank_pin ||
        vendor.account_number ||
        vendor.ifscode ||
        vendor.branch ||
        vendor.beneficiary_name;
      if (hasBankDetails) {
        tableRows.push(createRow("BANK DETAILS", "", true));
        if (vendor.bank_name)
          tableRows.push(createRow("Bank Name", vendor.bank_name));
        if (vendor.beneficiary_name)
          tableRows.push(
            createRow("Beneficiary Name", vendor.beneficiary_name),
          );
        if (vendor.account_number)
          tableRows.push(createRow("Account Number", vendor.account_number));
        if (vendor.ifscode)
          tableRows.push(createRow("IFSC Code", vendor.ifscode));
        if (vendor.branch) tableRows.push(createRow("Branch", vendor.branch));
        if (vendor.bank_address_1)
          tableRows.push(createRow("Bank Address 1", vendor.bank_address_1));
        if (vendor.bank_address_2)
          tableRows.push(createRow("Bank Address 2", vendor.bank_address_2));
        if (vendor.bank_pin)
          tableRows.push(createRow("Bank PIN Code", vendor.bank_pin));
      }

      // Payment Information
      if (vendor.payment_terms || vendor.tds_details) {
        tableRows.push(createRow("PAYMENT INFORMATION", "", true));
        if (vendor.payment_terms)
          tableRows.push(createRow("Payment Terms", vendor.payment_terms));
        if (vendor.tds_details)
          tableRows.push(createRow("TDS Rate & Section", vendor.tds_details));
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Vendor Registered Form",
                    bold: true,
                    size: 28,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              new DocxTable({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                  insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new Paragraph({
                children: [new TextRun({ text: "", size: 20 })],
                spacing: { before: 400, after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "*All the columns should be properly filled up. No column should be kept Blank.",
                    italics: true,
                    size: 18,
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "*All registered certificates should be scanned and attached in system.",
                    italics: true,
                    size: 18,
                  }),
                ],
                spacing: { after: 300 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Compulsory Documents to be Attached:",
                    bold: true,
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "1) Copy of PAN Card", size: 18 }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "2) Address proof- copy of voter card, Aadhar card, license, passport",
                    size: 18,
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "3) Copy of GST certificate as applicable",
                    size: 18,
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "4) Copy of cancelled cheque",
                    size: 18,
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [new TextRun({ text: "5) MSMED form", size: 18 })],
                spacing: { after: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "SIGNATURE",
                    bold: true,
                    size: 22,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "___________________________",
                    size: 20,
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(
        blob,
        `Vendor_${vendor.name.replace(
          /\s+/g,
          "_",
        )}_${new Date().getTime()}.docx`,
      );
      message.success("Word document exported successfully!");
    } catch (error) {
      console.error("Error exporting to Word:", error);
      message.error("Failed to export Word document");
    }
  };

  const openDrawer = (vendor) => {
    setSelectedVendor(vendor);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setSelectedVendor(null);
  };

  const handleEdit = (id) => {
    navigate(getEditVendorPath(id));
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.gst_no?.toLowerCase().includes(search.toLowerCase()) ||
      v.vendor_type?.toLowerCase().includes(search.toLowerCase()) ||
      v.refered_by?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDownloadExcel = async () => {
    if (filteredVendors.length === 0) {
      message.info("No vendors to download");
      return;
    }
    const categoryLabels = {
      cash: "Cash",
      account: "Account",
      cash_and_account: "Cash & Account",
    };
    const filterLines = [];
    if (categoryFilter) {
      filterLines.push(`Category: ${categoryLabels[categoryFilter] ?? categoryFilter}`);
    }
    if (search.trim()) filterLines.push(`Search: ${search.trim()}`);
    await downloadVendorsExcel(filteredVendors, { filterLines });
  };

  const CATEGORIES = [
    { value: null, label: "All" },
    { value: "cash", label: "Cash" },
    { value: "account", label: "Account" },
    { value: "cash_and_account", label: "Cash & Account" },
  ];

  const confirmDelete = (record) =>
    Modal.confirm({
      title: "Delete vendor",
      content:
        "Are you sure you want to delete this vendor? Once deleted, it cannot be retrieved.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => handleDeleteVendor(record._id || record.id),
    });

  const moreMenu = (record) => ({
    items: [
      { key: "pdf", icon: <FilePdfOutlined />, label: "Export PDF" },
      { key: "word", icon: <FileWordOutlined />, label: "Export Word" },
      { type: "divider" },
      { key: "delete", icon: <DeleteOutlined />, label: "Delete", danger: true },
    ],
    onClick: ({ key }) => {
      if (key === "pdf") exportToPDF(record);
      else if (key === "word") exportToWord(record);
      else if (key === "delete") confirmDelete(record);
    },
  });

  const initialOf = (name) => (String(name || "?").trim()[0] || "?").toUpperCase();

  const typeCount = new Set(vendors.map((v) => v.vendor_type).filter(Boolean)).size;

  const columns = [
    {
      title: "Vendor",
      key: "vendor",
      render: (_, record) => (
        <div className="vm-who">
          <span className="vm-avatar" aria-hidden="true">
            {initialOf(record.name)}
          </span>
          <div style={{ minWidth: 0 }}>
            <strong>{record.name || "—"}</strong>
            <span>{record.company_name || "No company"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Code",
      dataIndex: "vendor_code",
      key: "vendor_code",
      width: 130,
      responsive: ["sm"],
      render: (text) =>
        text ? <span className="vm-code">{String(text).toUpperCase()}</span> : <span className="vm-muted">—</span>,
    },
    {
      title: "GST No",
      dataIndex: "gst_no",
      key: "gst_no",
      width: 190,
      responsive: ["lg"],
      render: (text) => (text ? <span>{text}</span> : <span className="vm-muted">—</span>),
    },
    {
      title: "Type",
      dataIndex: "vendor_type",
      key: "vendor_type",
      width: 170,
      responsive: ["md"],
      render: (text) =>
        text ? <span className="vm-pill">{text}</span> : <span className="vm-muted">—</span>,
    },
    {
      title: "",
      key: "actions",
      width: 230,
      align: "right",
      render: (_, record) => (
        <div className="vm-actions">
          <button type="button" className="vm-btn" onClick={() => openDrawer(record)}>
            <EyeOutlined /> View
          </button>
          <button
            type="button"
            className="vm-btn is-solid"
            onClick={() => handleEdit(record._id || record.id)}
          >
            <EditOutlined /> Edit
          </button>
          <Dropdown menu={moreMenu(record)} trigger={["click"]} placement="bottomRight">
            <button type="button" className="vm-btn is-icon" aria-label="More actions">
              <EllipsisOutlined />
            </button>
          </Dropdown>
        </div>
      ),
    },
  ];

  const renderMobileCards = () => (
    <div className="vm-cards">
      {filteredVendors.map((vendor) => (
        <div className="vm-card" key={vendor._id || vendor.id}>
          <div className="vm-who">
            <span className="vm-avatar" aria-hidden="true">
              {initialOf(vendor.name)}
            </span>
            <div style={{ minWidth: 0 }}>
              <strong>{vendor.name}</strong>
              <span>{vendor.company_name || "No company"}</span>
            </div>
          </div>
          <div className="vm-card-meta">
            <span>
              Code <strong>{vendor.vendor_code ? String(vendor.vendor_code).toUpperCase() : "—"}</strong>
            </span>
            <span>
              GST <strong>{vendor.gst_no || "—"}</strong>
            </span>
            <span>
              {vendor.vendor_type ? <span className="vm-pill">{vendor.vendor_type}</span> : null}
              {vendor.refered_by ? <> &nbsp;Ref: {vendor.refered_by}</> : null}
            </span>
          </div>
          <div className="vm-actions">
            <button type="button" className="vm-btn" onClick={() => openDrawer(vendor)}>
              <EyeOutlined /> View
            </button>
            <button
              type="button"
              className="vm-btn is-solid"
              onClick={() => handleEdit(vendor._id || vendor.id)}
            >
              <EditOutlined /> Edit
            </button>
            <Dropdown menu={moreMenu(vendor)} trigger={["click"]} placement="bottomRight">
              <button type="button" className="vm-btn is-icon" aria-label="More actions">
                <EllipsisOutlined />
              </button>
            </Dropdown>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="vm-page">
      <div className="vm-wrap">
        <header className="vm-hero">
          <div>
            <button type="button" className="vm-back" onClick={() => navigate("/user")}>
              <ArrowLeftOutlined /> Back to home
            </button>
            <p className="vm-eyebrow">Directory</p>
            <h1 className="vm-title">Vendor Management</h1>
            <p className="vm-sub">Find, review and manage every vendor in one place.</p>
          </div>
          <button type="button" className="vm-add" onClick={() => navigate(getAddVendorPath())}>
            <PlusOutlined /> Add vendor
          </button>
        </header>

        <section className="vm-stats" aria-label="Summary">
          <div className="vm-stat">
            <span className="vm-stat-icon">
              <TeamOutlined style={{ fontSize: 20 }} />
            </span>
            <div>
              <p className="vm-stat-label">Total vendors</p>
              <p className="vm-stat-value">{vendors.length}</p>
            </div>
          </div>
          <div className="vm-stat">
            <span className="vm-stat-icon">
              <SearchOutlined style={{ fontSize: 20 }} />
            </span>
            <div>
              <p className="vm-stat-label">Showing</p>
              <p className="vm-stat-value">{filteredVendors.length}</p>
            </div>
          </div>
          <div className="vm-stat">
            <span className="vm-stat-icon">
              <AppstoreOutlined style={{ fontSize: 20 }} />
            </span>
            <div>
              <p className="vm-stat-label">Vendor types</p>
              <p className="vm-stat-value">{typeCount}</p>
            </div>
          </div>
        </section>

        <section className="vm-panel">
          <div className="vm-toolbar">
            <div className="vm-toolbar-left">
              <label className="vm-search">
                <SearchOutlined aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, company, GST or type"
                  aria-label="Search vendors"
                />
              </label>
              <div className="vm-seg" role="group" aria-label="Category">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    aria-pressed={categoryFilter === c.value}
                    onClick={() => setCategoryFilter(c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <ExcelDownloadButton onDownload={handleDownloadExcel} />
          </div>

          {loading ? (
            <div className="vm-empty">
              <Spin />
              <span>Loading vendors…</span>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="vm-empty">
              <span className="ring">
                <TeamOutlined style={{ fontSize: 26 }} />
              </span>
              <strong>No vendors found</strong>
              <span>
                {search || categoryFilter
                  ? "Try a different search or category."
                  : "Add your first vendor to get started."}
              </span>
            </div>
          ) : isMobile ? (
            renderMobileCards()
          ) : (
            <Table
              className="vm-table"
              columns={columns}
              dataSource={filteredVendors}
              rowKey={(record) => record._id || record.id}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} vendors`,
              }}
              scroll={{ x: 900 }}
            />
          )}
        </section>
      </div>

      <VendorViewDrawer
        open={drawerVisible}
        onClose={closeDrawer}
        vendor={selectedVendor}
        isMobile={isMobile}
        config={config}
        onExportPdf={exportToPDF}
        onExportDocx={exportToWord}
      />
    </div>
  );
};

export default ViewVendor;
