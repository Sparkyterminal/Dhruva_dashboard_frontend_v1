import dayjs from "dayjs";
import { downloadExcel } from "@/lib/excel/downloadExcel";

// Aadhaar numbers are deliberately not exported: the vendor screens never show
// them, so a spreadsheet should not be the place they leak from.
const COLUMNS = [
  { header: "S.No", type: "number", width: 7 },
  { header: "Vendor Code" },
  { header: "Vendor Name" },
  { header: "Person Category" },
  { header: "Company Name" },
  { header: "Vendor Type" },
  { header: "Category" },
  { header: "Material / Service Description", wrap: true, width: 30 },
  { header: "Vendor Status" },
  { header: "Referred By" },
  { header: "Departments" },
  { header: "Contact Person" },
  { header: "Designation" },
  { header: "Mobile" },
  { header: "Alt Mobile" },
  { header: "Email" },
  { header: "Temporary Address", wrap: true, width: 30 },
  { header: "Temporary City" },
  { header: "Temporary State" },
  { header: "Temporary Country" },
  { header: "Temporary PIN" },
  { header: "Permanent Address", wrap: true, width: 30 },
  { header: "Permanent City" },
  { header: "Permanent State" },
  { header: "Permanent Country" },
  { header: "Permanent PIN" },
  { header: "GST No" },
  { header: "MSMED No" },
  { header: "PAN No" },
  { header: "Bank Name" },
  { header: "Beneficiary Name" },
  { header: "Bank Address", wrap: true, width: 30 },
  { header: "Bank PIN" },
  { header: "Account Number" },
  { header: "IFSC Code" },
  { header: "Branch" },
  { header: "Payment Terms", wrap: true, width: 26 },
  { header: "TDS Details", wrap: true, width: 26 },
  { header: "Created At", type: "datetime" },
  { header: "Updated At", type: "datetime" },
];

const joinParts = (...parts) => parts.filter((p) => p && String(p).trim()).join(", ");

const departmentsOf = (vendor) => {
  const list = vendor.vendor_belongs_to?.department?.department;
  return Array.isArray(list) ? list.map((d) => d?.name).filter(Boolean).join(", ") : null;
};

/** One row per vendor with every field the vendor details screen shows. */
export const buildVendorsSheet = (vendors, ctx = {}) => {
  const rows = vendors.map((v, i) => [
    i + 1,
    v.vendor_code?.toUpperCase?.() ?? v.vendor_code,
    v.name,
    v.person_category,
    v.company_name,
    v.vendor_type,
    v.specify_cat,
    v.material_desc,
    v.vendor_status,
    v.refered_by,
    departmentsOf(v),
    v.cont_person,
    v.designation,
    v.mobile_no,
    v.alt_mobile_no,
    v.email,
    v.temp_address_1,
    v.temp_city,
    v.temp_state,
    v.temp_country,
    v.temp_pin,
    joinParts(v.perm_address_1, v.perm_address_2),
    v.perm_city,
    v.perm_state,
    v.perm_country,
    v.perm_pin,
    v.gst_no,
    v.msmed_no,
    v.pan_no,
    v.bank_name,
    v.beneficiary_name,
    joinParts(v.bank_address_1, v.bank_address_2),
    v.bank_pin,
    v.account_number,
    v.ifscode,
    v.branch,
    v.payment_terms,
    v.tds_details,
    v.createdAt,
    v.updatedAt,
  ]);

  const generated = dayjs(ctx.generatedAt || new Date()).format("DD MMM YYYY, hh:mm A");
  return {
    name: "Vendors",
    title: "Vendors",
    subtitle: [`${rows.length} vendors`, ...(ctx.filterLines || []), `Generated on ${generated}`].join("   |   "),
    columns: COLUMNS,
    rows,
    freezeColumns: 3,
  };
};

export const downloadVendorsExcel = async (vendors, ctx = {}) => {
  const generatedAt = ctx.generatedAt || new Date();
  await downloadExcel({
    fileName: `Vendors_${dayjs(generatedAt).format("YYYY-MM-DD")}`,
    sheets: [buildVendorsSheet(vendors, { ...ctx, generatedAt })],
  });
};
