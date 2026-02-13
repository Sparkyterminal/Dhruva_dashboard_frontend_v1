import React from "react";

/**
 * Renders vendor details as a label-value grid.
 * Used in VendorViewDrawer "View details" tab.
 */
const ViewVendorDetailsContent = ({ vendor, isMobile = false }) => {
  if (!vendor) return null;

  const flatData = [];
  const pushEntry = (label, value) => {
    if (value !== undefined && value !== null && value !== "") {
      flatData.push({ label, value: value.toString() });
    }
  };

  pushEntry("Vendor Name", vendor.name);
  pushEntry("Person Category", vendor.person_category);
  pushEntry("Company Name", vendor.company_name);
  pushEntry("Referred By", vendor.refered_by);

  pushEntry("Permanent Address 1", vendor.perm_address_1);
  pushEntry("Permanent Address 2", vendor.perm_address_2);
  pushEntry("Permanent City", vendor.perm_city);
  pushEntry("Permanent PIN", vendor.perm_pin);
  pushEntry("Permanent State", vendor.perm_state);
  pushEntry("Permanent Country", vendor.perm_country);

  pushEntry("Temporary Address 1", vendor.temp_address_1);
  pushEntry("Temporary City", vendor.temp_city);
  pushEntry("Temporary PIN", vendor.temp_pin);
  pushEntry("Temporary State", vendor.temp_state);
  pushEntry("Temporary Country", vendor.temp_country);

  pushEntry("Contact Person", vendor.cont_person);
  pushEntry("Designation", vendor.designation);
  pushEntry("Mobile Number", vendor.mobile_no);
  pushEntry("Alternate Mobile Number", vendor.alt_mobile_no);
  pushEntry("Email", vendor.email);
  pushEntry("Vendor Type", vendor.vendor_type);
  pushEntry("GST Number", vendor.gst_no);
  pushEntry("MSMED Number", vendor.msmed_no);
  pushEntry("PAN Number", vendor.pan_no);

  pushEntry("Bank Name", vendor.bank_name);
  pushEntry("Beneficiary Name", vendor.beneficiary_name);
  pushEntry("Bank Address 1", vendor.bank_address_1);
  pushEntry("Bank Address 2", vendor.bank_address_2);
  pushEntry("Bank PIN", vendor.bank_pin);
  pushEntry("Account Number", vendor.account_number);
  pushEntry("IFSC Code", vendor.ifscode);
  pushEntry("Branch", vendor.branch);

  pushEntry("Payment Terms", vendor.payment_terms);
  pushEntry("TDS Details", vendor.tds_details);
  pushEntry("Vendor Status", vendor.vendor_status);

  const departmentList =
    vendor.vendor_belongs_to?.department?.department || [];
  if (departmentList.length > 0) {
    pushEntry("Departments", departmentList.map((d) => d.name).join(", "));
  }

  pushEntry("Created At", vendor.createdAt && new Date(vendor.createdAt).toLocaleString());
  pushEntry("Updated At", vendor.updatedAt && new Date(vendor.updatedAt).toLocaleString());

  return (
    <div
      style={{
        display: "grid",
        gap: "12px",
        overflowY: "auto",
        padding: "8px",
      }}
    >
      {flatData.map(({ label, value }, index) => (
        <div
          key={label}
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
            {label}
          </span>
          <span
            style={{
              wordBreak: "break-word",
              color: "#5b5270",
              fontSize: "15px",
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ViewVendorDetailsContent;
