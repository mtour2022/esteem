import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Employee from "../classes/employee";

export function exportToPdf(data, filename = "employees.pdf") {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "in",
    format: [14, 8.5], // Legal size: 14 x 8.5 inches
  });

  const employees = data.map((e) => new Employee(e));

  const headers = [
    [
      "Employee ID",
      "Name",
      "Sex",
      "Age",
      "Birthday",
      "Nationality",
      "Marital Status",
      "Height",
      "Weight",
      "Email",
      "Contact No.",
      "Education",
      "Classification",
      "Designation",
      "Application Type",
      "Company ID",
      "Company Status",
      "Unit ID",
      "Unit Owner",
      "Present Address",
      "Birthplace",
      "Passport No.",
      "Emergency Contact Name",
      "Emergency Contact No.",
      "Status",
      "Status History",
      "Company Status",
      "Company Status History",
      "Tourism Certificates",
      "Tourism Certificate History",
      "Work History",
    ],
  ];

  const rows = employees.map((emp) => [
    emp.employeeId,
    emp.getFullName(),
    emp.sex || "",
    emp.age || "",
    emp.birthday || "",
    emp.nationality || "",
    emp.maritalStatus || "",
    emp.height || "",
    emp.weight || "",
    emp.email || "",
    emp.contact || "",
    emp.education || "",
    emp.classification || "",
    emp.designation || "",
    emp.application_type || "",
    emp.companyId || "",
    emp.company_status || "",
    emp.unit_id || "",
    emp.unit_owner || "",
    formatAddress(emp.presentAddress),
    formatAddress(emp.birthPlace),
    emp.passportNumber || "",
    emp.emergencyContactName || "",
    emp.emergencyContactNumber || "",
    emp.status || "",
    formatStatusHistory(emp.status_history),
    emp.company_status || "",
    formatStatusHistory(emp.company_status_history),
    formatCertificates(emp.tourism_certificate),
    formatCertificates(emp.tourism_certificate_history),
    formatWorkHistory(emp.work_history),
  ]);

  doc.setFontSize(14);
  doc.text("Filtered Employee List", 0.5, 0.5);

  autoTable(doc, {
    startY: 0.8,
    head: headers,
    body: rows,
    styles: {
      fontSize: 6.5,
      cellPadding: 0.07,
    },
    headStyles: {
      fillColor: [22, 160, 133],
      textColor: [255, 255, 255],
    },
    margin: { top: 0.8, left: 0.3, right: 0.3 },
    theme: "grid",
    tableWidth: 'auto',
    columnStyles: {
      1: { cellWidth: 1.5 }, // Name
      19: { cellWidth: 1.8 }, // Present Address
      20: { cellWidth: 1.5 }, // Birthplace
    }
  });

  doc.save(filename);
}

function formatAddress(addr) {
  if (!addr) return "";
  const parts = [
    addr.street,
    addr.barangay,
    addr.town,
    addr.province,
    addr.region,
    addr.country,
  ];
  return parts.filter(Boolean).join(", ");
}

function formatStatusHistory(history = []) {
  if (!Array.isArray(history) || history.length === 0) return "N/A";
  return history
    .map((h) => `${h.status || "?"} (${formatDate(h.date_updated)})`)
    .join(", ");
}

function formatCertificates(certs = []) {
  if (!Array.isArray(certs) || certs.length === 0) return "N/A";
  return certs
    .map((c) => {
      const type = c.type || "Cert";
      const issued = formatDate(c.date_Issued);
      const expired = formatDate(c.date_Expired);
      return `${type}: ${issued} - ${expired}`;
    })
    .join("; ");
}

function formatWorkHistory(work = []) {
  if (!Array.isArray(work) || work.length === 0) return "N/A";
  return work
    .map((w) => `${w.company || "Unknown"} (${w.role || "N/A"})`)
    .join(", ");
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return isNaN(date) ? "?" : date.toLocaleDateString("en-PH");
}
