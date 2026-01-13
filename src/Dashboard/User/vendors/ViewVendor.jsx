/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { message, Modal, Table, Button, Card, Input } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  UserOutlined,
  SearchOutlined,
  FilePdfOutlined,
  FileWordOutlined,
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
import { API_BASE_URL } from "../../../../config";

const customStyles = `
  .vendor-glass-card {
    background: rgba(255,255,255,0.85);
    border-radius: 1.25rem;
    box-shadow: 0 8px 32px 0 rgba(102,126,234,0.12);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.4);
    transition: all 0.3s ease;
  }
  
  .vendor-glass-card:hover {
    box-shadow: 0 12px 40px 0 rgba(102,126,234,0.18);
    transform: translateY(-2px);
  }
  
  .vendor-stats-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 1.25rem;
    border: none;
    box-shadow: 0 8px 32px rgba(102,126,234,0.25);
  }
  
  .vendor-btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 0.65rem;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(102,126,234,0.25);
    transition: all 0.3s ease;
  }
  
  .vendor-btn-primary:hover {
    background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102,126,234,0.35) !important;
  }
  
  .vendor-search-input {
    border-radius: 0.65rem;
    border: 1.5px solid rgba(102,126,234,0.2);
    transition: all 0.3s ease;
  }
  
  .vendor-search-input:hover,
  .vendor-search-input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102,126,234,0.1);
  }
  
  .vendor-table .ant-table {
    border-radius: 0.75rem;
    overflow: hidden;
  }
  
  .vendor-table .ant-table-thead > tr > th {
    background: linear-gradient(135deg, #f8f7ff 0%, #f3f1ff 100%);
    color: #32255e;
    font-weight: 700;
    border: none;
    font-size: 15px;
  }
  
  .vendor-table .ant-table-tbody > tr:hover > td {
    background: #faf8fe !important;
  }
  
  .vendor-mobile-card {
    background: rgba(255,255,255,0.9);
    border-radius: 1rem;
    border: 1px solid rgba(102,126,234,0.15);
    box-shadow: 0 4px 16px rgba(102,126,234,0.08);
    transition: all 0.3s ease;
  }
  
  .vendor-mobile-card:hover {
    box-shadow: 0 8px 24px rgba(102,126,234,0.15);
    transform: translateY(-2px);
  }
  
  .vendor-modal .ant-modal-header {
    background: linear-gradient(135deg, #f8f7ff 0%, #f3f1ff 100%);
    border-radius: 1rem 1rem 0 0;
    border: none;
  }
  
  .vendor-modal .ant-modal-content {
    border-radius: 1rem;
    overflow: hidden;
  }
`;

const ViewVendor = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [search, setSearch] = useState("");

  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();

  const deptId = user?.departments?.length ? user.departments[0].id : null;

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const getAddVendorPath = () => {
    if (!user) return "/user/addvendor";
    const candidates = [];
    if (user.role) candidates.push(user.role);
    if (user.user_role) candidates.push(user.user_role);
    if (user.roles) {
      if (Array.isArray(user.roles)) {
        user.roles.forEach((r) => {
          if (!r) return;
          if (typeof r === "string") candidates.push(r);
          else if (r.role) candidates.push(r.role);
          else if (r.name) candidates.push(r.name);
        });
      } else if (typeof user.roles === "string") candidates.push(user.roles);
    }

    const normalized = candidates.map((s) => String(s).toUpperCase());
    if (normalized.includes("OWNER")) return "/owner/addvendor";
    if (normalized.includes("APPROVER")) return "/approver/addvendor";
    return "/user/addvendor";
  };

  const getEditVendorPath = (id) => {
    if (!id) return "/user/editvendor/";
    if (!user) return `/user/editvendor/${id}`;
    const candidates = [];
    if (user.role) candidates.push(user.role);
    if (user.user_role) candidates.push(user.user_role);
    if (user.roles) {
      if (Array.isArray(user.roles)) {
        user.roles.forEach((r) => {
          if (!r) return;
          if (typeof r === "string") candidates.push(r);
          else if (r.role) candidates.push(r.role);
          else if (r.name) candidates.push(r.name);
        });
      } else if (typeof user.roles === "string") candidates.push(user.roles);
    }
    const normalized = candidates.map((s) => String(s).toUpperCase());
    if (normalized.includes("OWNER")) return `/owner/editvendor/${id}`;
    if (normalized.includes("APPROVER")) return `/approver/editvendor/${id}`;
    return `/user/editvendor/${id}`;
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchRequirementsData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}vendor/list`, config);
      setVendors(res.data.vendors.reverse() || []);
    } catch (err) {
      message.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementsData();
    // eslint-disable-next-line
  }, []);

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
      finalY
    );
    doc.text(
      "*All registered certificates should be scanned and attached in system.",
      14,
      finalY + 5
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
          createRow("Alternate Mobile Number", vendor.alt_mobile_no)
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
            createRow("Beneficiary Name", vendor.beneficiary_name)
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
          "_"
        )}_${new Date().getTime()}.docx`
      );
      message.success("Word document exported successfully!");
    } catch (error) {
      console.error("Error exporting to Word:", error);
      message.error("Failed to export Word document");
    }
  };

  const showModal = (vendor) => {
    setSelectedVendor(vendor);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
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
      v.refered_by?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: "Vendor Code",
      dataIndex: "vendor_code",
      key: "vendor_code",
      responsive: ["sm"],
      render: (text) => (
        <span style={{ fontWeight: 700, color: "#32255e" }}>
          {text.toUpperCase() || "N/A"}
        </span>
      ),
    },
    {
      title: "Vendor Name",
      dataIndex: "name",
      key: "name",
      responsive: ["md"],
      render: (text) => (
        <span style={{ fontWeight: 600, color: "#32255e" }}>{text}</span>
      ),
    },
    {
      title: "Company Name",
      dataIndex: "company_name",
      key: "company_name",
      responsive: ["lg"],
      render: (text) => <span>{text || "N/A"}</span>,
    },
    {
      title: "GST No",
      dataIndex: "gst_no",
      key: "gst_no",
      responsive: ["lg"],
      render: (text) => <span>{text || "N/A"}</span>,
    },
    {
      title: "Vendor Type",
      dataIndex: "vendor_type",
      key: "vendor_type",
      responsive: ["md"],
      render: (text) => (
        <span
          style={{
            padding: "4px 12px",
            background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
            borderRadius: "6px",
            color: "#667eea",
            fontWeight: 500,
          }}
        >
          {text || "N/A"}
        </span>
      ),
    },
    // {
    //   title: "Referred By",
    //   dataIndex: "refered_by",
    //   key: "refered_by",
    //   responsive: ["lg"],
    //   render: (text) => <span>{text || "N/A"}</span>,
    // },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 250,
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => showModal(record)}
            style={{
              color: "#667eea",
              borderRadius: "6px",
              transition: "all 0.3s",
            }}
          />
          <Button
            type="text"
            icon={<FilePdfOutlined />}
            onClick={() => exportToPDF(record)}
            style={{
              color: "#e74c3c",
              borderRadius: "6px",
              transition: "all 0.3s",
            }}
            title="Export to PDF"
          />
          <Button
            type="text"
            icon={<FileWordOutlined />}
            onClick={() => exportToWord(record)}
            style={{
              color: "#2b579a",
              borderRadius: "6px",
              transition: "all 0.3s",
            }}
            title="Export to Word"
          />
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
            className="vendor-btn-primary"
            style={{ height: "32px" }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  const renderMobileCards = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {filteredVendors.map((vendor, index) => (
        <motion.div
          key={vendor.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className="vendor-mobile-card" styles={{ padding: "20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#32255e",
                  marginBottom: "8px",
                }}
              >
                {vendor.name}
              </div>
              <div style={{ color: "#5b5270", fontSize: "13px", marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: "#32255e" }}>
                  Code:{" "}
                </span>
                {vendor.vendor_code.toUpperCase() || "N/A"}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "14px",
                }}
              >
                <div style={{ color: "#5b5270" }}>
                  <span style={{ fontWeight: 600, color: "#32255e" }}>
                    Company:{" "}
                  </span>
                  {vendor.company_name || "N/A"}
                </div>
                <div style={{ color: "#5b5270" }}>
                  <span style={{ fontWeight: 600, color: "#32255e" }}>
                    GST:{" "}
                  </span>
                  {vendor.gst_no || "N/A"}
                </div>
                <div>
                  <span
                    style={{
                      padding: "3px 10px",
                      background:
                        "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                      borderRadius: "6px",
                      color: "#667eea",
                      fontWeight: 500,
                      fontSize: "13px",
                    }}
                  >
                    {vendor.vendor_type || "N/A"}
                  </span>
                  {vendor.refered_by && (
                    <>
                      <span style={{ margin: "0 8px", color: "#d1c9e0" }}>
                        •
                      </span>
                      <span style={{ color: "#5b5270" }}>
                        Ref: {vendor.refered_by}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <Button
                icon={<EyeOutlined />}
                onClick={() => showModal(vendor)}
                style={{
                  borderRadius: "8px",
                  border: "1.5px solid #667eea30",
                  color: "#667eea",
                }}
              >
                View
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                onClick={() => exportToPDF(vendor)}
                style={{
                  borderRadius: "8px",
                  border: "1.5px solid #e74c3c30",
                  color: "#e74c3c",
                }}
              >
                PDF
              </Button>
              <Button
                icon={<FileWordOutlined />}
                onClick={() => exportToWord(vendor)}
                style={{
                  borderRadius: "8px",
                  border: "1.5px solid #2b579a30",
                  color: "#2b579a",
                }}
              >
                Word
              </Button>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => handleEdit(vendor.id)}
                className="vendor-btn-primary"
              >
                Edit
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div
      className="font-[cormoreg]"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8f7ff 0%, #f0edff 100%)",
        padding: isMobile ? "16px" : "32px",
      }}
    >
      <style>{customStyles}</style>

      {/* Gradient Background Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 20% 80%, rgba(102,126,234,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(118,75,162,0.08) 0%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: "24px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/user")}
              style={{
                color: "#667eea",
                fontSize: "16px",
                fontWeight: 600,
                height: "40px",
              }}
            >
              Back
            </Button>
          </div>
          <h1
            style={{
              fontSize: isMobile ? "32px" : "42px",
              fontWeight: "bold",
              color: "#32255e",
              margin: 0,
              letterSpacing: "-1px",
            }}
          >
            Vendor Management
          </h1>
          <p style={{ color: "#9079a5", fontSize: "16px", marginTop: "4px" }}>
            Manage and track all your vendors
          </p>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="vendor-stats-card" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(10px)",
                }}
              >
                <UserOutlined style={{ fontSize: "32px", color: "white" }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "rgba(255,255,255,0.85)",
                    marginBottom: "4px",
                    fontWeight: 500,
                  }}
                >
                  Total Vendors
                </div>
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {vendors.length}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card
            className="vendor-glass-card"
            styles={{ padding: isMobile ? "16px" : "28px" }}
          >
            {/* Search and Add Button */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  color: "#32255e",
                  fontWeight: 700,
                  fontSize: "24px",
                  margin: 0,
                }}
              >
                All Vendors
              </h2>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <Input
                  prefix={<SearchOutlined style={{ color: "#9079a5" }} />}
                  allowClear
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vendors..."
                  className="vendor-search-input"
                  style={{
                    width: isMobile ? "100%" : 280,
                    height: "42px",
                    fontSize: "15px",
                  }}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate(getAddVendorPath())}
                  className="vendor-btn-primary"
                  style={{
                    height: "42px",
                    fontSize: "15px",
                    paddingLeft: "24px",
                    paddingRight: "24px",
                  }}
                >
                  Add Vendor
                </Button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 20px",
                  color: "#9079a5",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: 500 }}>
                  Loading vendors...
                </div>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 20px",
                  color: "#9079a5",
                }}
              >
                <UserOutlined
                  style={{
                    fontSize: "48px",
                    marginBottom: "16px",
                    opacity: 0.3,
                  }}
                />
                <div style={{ fontSize: "18px", fontWeight: 500 }}>
                  No vendors found
                </div>
                <div style={{ fontSize: "14px", marginTop: "8px" }}>
                  {search
                    ? "Try adjusting your search"
                    : "Add your first vendor to get started"}
                </div>
              </div>
            ) : isMobile ? (
              renderMobileCards()
            ) : (
              <div className="vendor-table">
                <Table
                  columns={columns}
                  dataSource={filteredVendors}
                  loading={loading}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} vendors`,
                  }}
                  scroll={{ x: 1200 }}
                />
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Modal to show vendor details */}
      <Modal
        title={
          <span style={{ fontSize: "22px", fontWeight: 700, color: "#32255e" }}>
            Vendor Details
          </span>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button
            key="pdf"
            icon={<FilePdfOutlined />}
            onClick={() => {
              exportToPDF(selectedVendor);
              handleCancel();
            }}
            style={{
              background: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "0.65rem",
              height: "40px",
            }}
          >
            Export PDF
          </Button>,
          <Button
            key="word"
            icon={<FileWordOutlined />}
            onClick={() => {
              exportToWord(selectedVendor);
              handleCancel();
            }}
            style={{
              background: "#2b579a",
              color: "white",
              border: "none",
              borderRadius: "0.65rem",
              height: "40px",
            }}
          >
            Export Word
          </Button>,
          <Button
            key="close"
            onClick={handleCancel}
            className="vendor-btn-primary"
            style={{ height: "40px" }}
          >
            Close
          </Button>,
        ]}
        width={isMobile ? "95%" : 700}
        className="vendor-modal"
        style={{ top: isMobile ? 20 : 40 }}
      >
        {selectedVendor && (
          <div
            style={{
              display: "grid",
              gap: "12px",
              maxHeight: isMobile ? "60vh" : "65vh",
              overflowY: "auto",
              padding: "8px",
            }}
          >
            {(() => {
              const preferred = ["vendor_code", "name", "company_name"];
              const entries = Object.entries(selectedVendor)
                .filter(([, v]) => v !== undefined && v !== null && v !== "")
                .sort((a, b) => {
                  const ai = preferred.indexOf(a[0]);
                  const bi = preferred.indexOf(b[0]);
                  if (ai !== -1 || bi !== -1)
                    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
                  return a[0].localeCompare(b[0]);
                });

              const formatLabel = (key) =>
                key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (ch) => ch.toUpperCase());

              const formatValue = (val) => {
                if (val === true || val === false) return val.toString();
                if (typeof val === "object") {
                  if (val === null) return "";
                  if (val.id) return val.id;
                  try {
                    return JSON.stringify(val);
                  } catch (e) {
                    return String(val);
                  }
                }
                return String(val);
              };

              return entries.map(([key, value], index) => (
                <div
                  key={key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "180px 1fr",
                    gap: "12px",
                    padding: "14px",
                    background: index % 2 === 0 ? "#faf8fe" : "#fff",
                    borderRadius: "10px",
                    transition: "all 0.2s",
                  }}
                >
                  <span
                    style={{
                      color: "#32255e",
                      fontWeight: 700,
                      fontSize: "15px",
                    }}
                  >
                    {formatLabel(key)}
                  </span>
                  <span
                    style={{
                      wordBreak: "break-word",
                      color: "#5b5270",
                      fontSize: "15px",
                    }}
                  >
                    {formatValue(value)}
                  </span>
                </div>
              ));
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViewVendor;
