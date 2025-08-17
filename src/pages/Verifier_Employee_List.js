import React, { useEffect, useRef, useState } from "react";
import { Table, Card, Dropdown, Button, Form, Container, Row, Col, InputGroup, FormControl, Badge, DropdownButton, ButtonGroup } from "react-bootstrap";
import { doc, getDoc, addDoc, updateDoc, getDocs, collection, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject, } from "firebase/storage";
import { db, storage } from "../config/firebase";
import { useAuth } from '../auth/authentication';

import Employee from "../classes/employee";
import Swal from "sweetalert2";
import TourismCert from "../components/TourismCert";
import { faEye, faEyeSlash, faFile, faSearch, faSyncAlt, faFilter, faTrash, faCalendar, faFileCircleCheck, faDownload, faPrint, faColumns, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Select from "react-select";
import SummaryPieChart from '../components/PieChart';
import TopRankingChart from "../components/RankTable";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { exportToPdf } from "../components/ExportEmployeePdf";
import TourismCertRow from "../components/TourismCertRow"; // path depends on your structure
import TourismCertSummaryTable from "../components/SummaryMonthlyTable";
import { toPng } from "html-to-image";
import download from "downloadjs";
import { useNavigate } from "react-router-dom";
import { runTransaction } from "firebase/firestore";
import CertificateIssuanceForecastChart from "../components/TourismCertForecast"
const STATUSES = ["under review", "approved", "incomplete", "resigned", "change company", "invalid"];

const useMouseDragScroll = (ref) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    const mouseDown = (e) => {
      isDown = true;
      el.classList.add("active");
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const mouseLeave = () => {
      isDown = false;
      el.classList.remove("active");
    };
    const mouseUp = () => {
      isDown = false;
      el.classList.remove("active");
    };
    const mouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 2;
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener("mousedown", mouseDown);
    el.addEventListener("mouseleave", mouseLeave);
    el.addEventListener("mouseup", mouseUp);
    el.addEventListener("mousemove", mouseMove);

    return () => {
      el.removeEventListener("mousedown", mouseDown);
      el.removeEventListener("mouseleave", mouseLeave);
      el.removeEventListener("mouseup", mouseUp);
      el.removeEventListener("mousemove", mouseMove);
    };
  }, [ref]);
};

const getStatusBadgeVariant = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "success";
    case "under review":
      return "warning";
    case "incomplete":
      return "secondary";
    case "resigned":
      return "dark";
    case "change company":
      return "info";
    case "invalid":
      return "danger";
    default:
      return "light";
  }
};

export default function VerifierEmployeeListPage() {

  const navigate = useNavigate();

  const handleEditEmployee = (employee) => {
    const url = `/verifier-employee-edit/${employee.id}/0b5f8f06bafb3828f619f6f96fc6adb2`;
    window.open(url, '_blank'); // opens in a new tab
  };

  const summaryRef = useRef(null);

  const [expandedRows, setExpandedRows] = useState([]);
  const [showCertificateFor, setShowCertificateFor] = useState(null);
  const tableRef = useRef();
  const scrollRef = useRef();
  const [employees, setEmployees] = useState([]);
  const { currentUser } = useAuth();
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [activeSearchText, setActiveSearchText] = useState(""); // <-- used for filtering

  const [companyDataMap, setCompanyDataMap] = useState({});
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [companyFilter, setCompanyFilter] = useState("");
  const [applicationTypeFilter, setApplicationTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyStatusFilter, setCompanyStatusFilter] = useState("");
  const [sexFilter, setSexFilter] = useState("");
  const [ageGroupFilter, setAgeGroupFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState("");
  const [certTypeFilter, setCertTypeFilter] = useState("");

  const [documentFilters, setDocumentFilters] = useState({
    profilePhoto: false,
    trainingCert: false,
    diploma: false,
    additionalRequirement: false,
    workingPermit: false,
  });
  const [dateFilterType, setDateFilterType] = useState(""); // "monthly", "yearly", "custom"
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [showSummary, setShowSummary] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Define all possible columns (match keys with employee object)
  const allColumns = [
    { key: "status", label: "Tourism Status" },

    { key: "actions", label: "Actions" },
    { key: "companyStatus", label: "Company Status" },
    { key: "tourismCertificate", label: "Tourism Certificate" },
    { key: "tourismCertificateLatestSummary", label: "Latest Certificate Summary" },
    { key: "history", label: "History" },

    { key: "applicationType", label: "Application Type" },
    { key: "companyName", label: "Company Name" },
    { key: "fullName", label: "Full Name" },
    { key: "sex", label: "Sex" },
    { key: "birthday", label: "Birthday" },
    { key: "age", label: "Age" },
    { key: "maritalStatus", label: "Marital Status" },
    { key: "nationality", label: "Type of Residency" }, // you can adjust the key if needed
    { key: "contact", label: "Contact" },
    { key: "email", label: "Email" },
    { key: "designation", label: "Designation" },
    { key: "education", label: "Education" },
    { key: "emergencyContact", label: "Emergency Contact" },
    { key: "presentAddress", label: "Present Address" },
    { key: "birthPlace", label: "Birth Place" },
    { key: "height", label: "Height (ft)" },
    { key: "weight", label: "Weight (kg)" },
    { key: "profilePhoto", label: "Profile Photo" },
    { key: "trainingCert", label: "Training Cert" },
    { key: "diploma", label: "Diploma" },
    { key: "additionalRequirement", label: "Notarized COE / Signed Endorsement" },
    { key: "workingPermit", label: "Working Permit (for Foreigns)" },
  ];

  const [visibleColumns, setVisibleColumns] = useState(
    allColumns.map(col => col.key) // Default to show all
  );


  const toggleSummary = () => {
    if (showSummary) {
      setShowSummary(false);
    } else {
      setLoadingSummary(true);
      setTimeout(() => {
        setShowSummary(true);
        setLoadingSummary(false);
      }, 500); // simulate a short load delay
    }
  };


  useMouseDragScroll(scrollRef);

  const toggleExpand = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      Swal.fire({
        title: "Fetching data...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const snapshot = await getDocs(collection(db, "employee"));
      let employeeDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Sort by the most recent status_history date (descending)
      employeeDocs.sort((a, b) => {
        const aLatest = getLatestStatusDate(a.status_history);
        const bLatest = getLatestStatusDate(b.status_history);
        return bLatest - aLatest; // descending
      });

      setEmployees(employeeDocs);
      setSearchText("");
      setActiveSearchText("");
      setCompanyFilter("");
      setApplicationTypeFilter("");
      setStatusFilter("");
      setCompanyStatusFilter("");
      setSexFilter("");
      setAgeGroupFilter("");
      setDesignationFilter("");
      setNationalityFilter("");
      setDocumentFilters({
        profilePhoto: false,
        trainingCert: false,
        diploma: false,
        additionalRequirement: false,
        workingPermit: false,
      });
      setDateFilterType("");
      setSelectedMonth("");
      setSelectedYear("");
      setCertTypeFilter("");
      setCustomRange({ start: "", end: "" });
      setFilteredEmployees(employeeDocs);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching employees:", err);
      Swal.fire("Error", "Failed to load employee data.", "error");
    } finally {
      setLoading(false);
      Swal.close();
    }
  };

  // Helper function to get latest status update date
  const getLatestStatusDate = (history) => {
    if (!Array.isArray(history) || history.length === 0) return 0;

    return Math.max(
      ...history.map((entry) => {
        const d = new Date(entry.date_updated);
        return isNaN(d) ? 0 : d.getTime();
      })
    );
  };

  useEffect(() => {
    fetchEmployeeDetails();
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      const newMap = {};
      for (const emp of employees) {
        if (emp.companyId && !newMap[emp.companyId]) {
          const docSnap = await getDoc(doc(db, "company", emp.companyId));
          if (docSnap.exists()) newMap[emp.companyId] = docSnap.data();
        }
      }
      setCompanyDataMap(newMap);
    };

    if (employees.length) fetchCompanies();
  }, [employees]);
const handleChangeStatus = async (employee, newStatus) => {
  const { value: formValues, isConfirmed } = await Swal.fire({
    title: `Change status to "${newStatus}"?`,
    html: `
      <p class="text-start">You may add remarks about this status change.</p>
      <input id="remarks" class="swal2-input" placeholder="Remarks (optional)">
    `,
    showCancelButton: true,
    confirmButtonText: "Confirm",
    preConfirm: () => {
      const remarks = document.getElementById("remarks").value.trim();
      return { remarks };
    },
  });

  if (!isConfirmed) return;

  try {
    const historyEntry = {
      status: newStatus,
      date_updated: new Date().toISOString(),
      remarks: formValues.remarks || "",
      userId: currentUser?.uid || null,
    };

    const updates = {
      status: newStatus,
      status_history: [...(employee.status_history || []), historyEntry],
      recent_certificate_id: employee.recent_certificate_id || "",
      recent_certificate_type: employee.recent_certificate_type || "",
    };

    const employeeRef = doc(db, "employee", employee.employeeId);

    // ✅ Handle certificate creation if approved
    if (newStatus.toLowerCase() === "approved") {
      const dateNow = new Date();
      const currentYear = dateNow.getFullYear();
      const oneYearLater = new Date(currentYear, 11, 31);

      const counterRef = doc(db, "counters", `tourism_cert_${currentYear}`);
      let tourismCertId = "";

      await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let lastNumber = 0;

        if (counterDoc.exists()) {
          lastNumber = counterDoc.data().last_number;
        }

        const nextNumber = lastNumber + 1;
        const paddedNumber = String(nextNumber).padStart(4, "0");
        tourismCertId = `TOURISM-${paddedNumber}-${currentYear}`;

        transaction.set(counterRef, {
          year: currentYear,
          last_number: nextNumber,
        });
      });

      const certRef = doc(db, "tourism_cert", tourismCertId);

      const cert = {
        tourism_cert_id: tourismCertId,
        type: employee.trainingCert ? "Endorsement" : "Recommendation",
        date_Issued: dateNow.toISOString(),
        date_Expired: oneYearLater.toISOString(),
        company_id: employee.companyId,
        employee_id: employee.employeeId,
        verifier_id: currentUser?.uid || "system",
        tourism_cert_history: "",
      };

      await setDoc(certRef, cert);

      // 🔹 Update employee with cert list + summary
      updates.tourism_certificate_ids = [
        ...(employee.tourism_certificate_ids || []),
        tourismCertId,
      ];
      updates.recent_certificate_id = tourismCertId;
      updates.recent_certificate_type = cert.type;

      updates.latest_cert_summary = {
        tourism_cert_id: tourismCertId,
        type: cert.type,
        date_Issued: cert.date_Issued,
        date_Expired: cert.date_Expired,
      };

      setShowCertificateFor(employee.employeeId);
    }

    await updateDoc(employeeRef, updates);
    await fetchEmployeeDetails();
    await new Promise((res) => setTimeout(res, 500));

    if (newStatus.toLowerCase() === "approved") {
      setShowCertificateFor(employee.employeeId);
    }

    Swal.fire("Success", "Status updated successfully.", "success");
  } catch (err) {
    console.error("Error updating status:", err);
    Swal.fire("Error", "Failed to update status.", "error");
  }
};


  const getStatusBadgeVariant = (status) => {
    if (!status) return "secondary";
    switch (status.toLowerCase()) {
      case "approved": return "success";
      case "under review": return "warning";
      case "incomplete": return "danger";
      case "resigned": return "dark";
      default: return "secondary";
    }
  };


  const viewDocLink = (url) =>
    url ? (
      <a href="#" onClick={(e) => { e.preventDefault(); window.open(url, "_blank"); }}>
        View Doc
      </a>
    ) : (
      <span className="text-muted">N/A</span>
    );


  useEffect(() => {
    const filtered = employees.filter((e) => {
      const emp = new Employee(e);
      const fullName = emp.getFullName().toLowerCase();
      const companyName = companyDataMap[emp.companyId]?.name?.toLowerCase() || "";

      const matchesText =
        fullName.includes(activeSearchText.toLowerCase()) ||
        companyName.includes(activeSearchText.toLowerCase());

      const matchesCompany =
        !companyFilter || companyName === companyFilter;

      const matchesApplicationType =
        !applicationTypeFilter ||
        (e.application_type || "").toLowerCase() === applicationTypeFilter;

      const matchesStatus =
        !statusFilter || (e.status || "").toLowerCase() === statusFilter;

      const matchesCompanyStatus =
        !companyStatusFilter || (e.company_status || "").toLowerCase() === companyStatusFilter;

      const matchesSex = !sexFilter || (e.sex || "").toLowerCase() === sexFilter;

      const matchesAgeGroup = !ageGroupFilter || (() => {
        const age = Number(e.age);
        if (isNaN(age)) return false;

        switch (ageGroupFilter) {
          case "kid":
            return age >= 0 && age <= 12;
          case "teen":
            return age >= 13 && age <= 19;
          case "adult":
            return age >= 20 && age <= 59;
          case "senior":
            return age >= 60;
          default:
            return true;
        }
      })();

      const matchesDesignation = !designationFilter ||
        (e.designation || "").toLowerCase() === designationFilter;

      const matchesNationality = !nationalityFilter || (e.nationality || "").toLowerCase() === nationalityFilter;

      // ✅ Document Filters: if checked, the field must be non-empty
      const matchesDocuments = Object.entries(documentFilters).every(([field, required]) => {
        if (!required) return true;
        const val = e[field];
        return val && val.trim() !== "";
      });

      const issuedDates = e.tourism_certificate_history?.map(h => new Date(h.date_Issued)) || [];
      const latestIssued = issuedDates.length > 0 ? new Date(Math.max(...issuedDates)) : null;

      let matchesDate = true;
      if (latestIssued && dateFilterType === "monthly" && selectedMonth) {
        matchesDate = latestIssued.getMonth() + 1 === Number(selectedMonth);
      }
      if (latestIssued && dateFilterType === "yearly" && selectedYear) {
        matchesDate = latestIssued.getFullYear() === Number(selectedYear);
      }
      if (latestIssued && dateFilterType === "custom" && customRange.start && customRange.end) {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        matchesDate = latestIssued >= start && latestIssued <= end;
      }
      const matchesCertType =
        !certTypeFilter ||
        (e.latest_cert_summary?.type || "").toLowerCase() === certTypeFilter;

      return matchesText && matchesCompany && matchesApplicationType && matchesStatus && matchesCompanyStatus && matchesSex && matchesAgeGroup && matchesDesignation && matchesNationality && matchesDocuments && matchesDate && matchesCertType;
    });

    setFilteredEmployees(filtered);
    setCurrentPage(1);

  }, [
    activeSearchText,
    employees,
    companyDataMap,
    statusFilter,
    companyStatusFilter,
    companyFilter,
    sexFilter,
    ageGroupFilter,
    designationFilter,
    nationalityFilter,
    documentFilters,
    dateFilterType,
    selectedMonth,
    selectedYear,
    customRange.start,
    customRange.end,
    certTypeFilter,
    applicationTypeFilter, // ✅ Include this
  ]);


  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getCompanyLabel = (value) => {
    const match = Object.values(companyDataMap).find(
      (c) => c.name?.toLowerCase() === value
    );
    return match?.name || value;
  };


  const handleDeleteEmployee = async (employeeId, employeeData) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the employee record.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        // Delete documents in Firestore
        await deleteDoc(doc(db, "employee", employeeId));

        // Delete related files from Firebase Storage
        const filesToDelete = [
          employeeData.profilePhoto,
          employeeData.trainingCert,
          employeeData.diploma,
          employeeData.additionalRequirement,
          employeeData.workingPermit,
        ];

        await Promise.all(
          filesToDelete
            .filter((url) => url?.startsWith("https://")) // only delete if it’s a valid uploaded file
            .map(async (url) => {
              try {
                const decodedUrl = decodeURIComponent(url.split("?")[0]);
                const pathStartIndex = decodedUrl.indexOf("/o/") + 3;
                const path = decodedUrl.substring(pathStartIndex).replaceAll("%2F", "/");
                const fileRef = ref(storage, path);
                await deleteObject(fileRef);
              } catch (error) {
                console.warn("Failed to delete file:", url, error);
              }
            })
        );

        Swal.fire("Deleted!", "Employee has been deleted.", "success");

        // Remove from UI
        setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
        setFilteredEmployees((prev) => prev.filter((e) => e.id !== employeeId));
      } catch (error) {
        console.error("Error deleting employee:", error);
        Swal.fire("Error", "Failed to delete employee.", "error");
      }
    }
  };

  const exportToExcel = (data, filename = "EmployeeData.xlsx") => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    XLSX.writeFile(workbook, filename);
  };


  const summary = {
    males: 0,
    females: 0,
    preferNotToSay: 0,
    kids: 0,
    teens: 0,
    adults: 0,
    seniors: 0,
    nationalityBreakdown: [],
    new: 0,
    renewal: 0,
  };

  const statusCounts = {};
  const nationalityMap = {};
  const companyCounts = {}; // For Top Companies
  const designationCounts = {}; // For Top Designations

  filteredEmployees.forEach((emp) => {
    const age = emp.age || 0;

    // Status counts
    const status = (emp.status || "unknown").toLowerCase();
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    // Sex counts
    const sex = (emp.sex || "").toLowerCase();
    if (sex === "male") summary.males++;
    else if (sex === "female") summary.females++;
    else summary.preferNotToSay++;

    // Age Segregation
    if (age <= 12) summary.kids++;
    else if (age <= 19) summary.teens++;
    else if (age <= 59) summary.adults++;
    else summary.seniors++;

    // Nationality aggregation
    const nat = emp.nationality?.toLowerCase() || "unknown";
    nationalityMap[nat] = (nationalityMap[nat] || 0) + 1;

    // Application Type Summary
    const appType = (emp.application_type || "").toLowerCase();
    if (appType === "new") summary.new++;
    else if (appType === "renewal") summary.renewal++;

    // ✅ Top Companies (if company_status === "approved")
    const companyId = emp.companyId;
    const companyStatus = emp.company_status?.toLowerCase();
    if (companyId && companyStatus === "approved") {
      companyCounts[companyId] = (companyCounts[companyId] || 0) + 1;
    }

    // ✅ Top Designations
    const desig = emp.designation?.trim();
    if (desig) {
      designationCounts[desig] = (designationCounts[desig] || 0) + 1;
    }
  });

  // Convert nationality map to pie data
  summary.nationalityBreakdown = Object.entries(nationalityMap).map(([nat, count]) => ({
    name: nat,
    value: count,
  }));

  // ✅ Generate Top 10 Companies (sorted descending by count)
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([companyId, count]) => ({
      name: companyDataMap[companyId]?.name || companyId,
      value: count,
    }));

  // ✅ Generate Top 10 Designations
  const topDesignations = Object.entries(designationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));


  function renderExpandedHistory(emp, empData) {
    return (
      <tr key={`${emp.id}-expanded`}>
        <td colSpan={100}>
          <Card className="bg-light border mb-3">
            <Card.Body>
              <p className="fw-bold mb-2">Status History:</p>
              {empData.status_history?.length > 0 ? (
                <Table size="sm" bordered className="mb-3">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Remarks</th>
                      <th>User</th>
                      <th>Date Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empData.status_history.map((entry, index) => (
                      <tr key={index}>
                        <td>{entry.status}</td>
                        <td>{entry.remarks || "—"}</td>
                        <td>{entry.userId}</td>
                        <td>{new Date(entry.date_updated).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No status history available.</p>
              )}

              <p className="fw-bold mb-2">Company Status History:</p>
              {empData.company_status_history?.length > 0 ? (
                <Table size="sm" bordered className="mb-3">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Remarks</th>
                      <th>User</th>
                      <th>Date Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empData.company_status_history.map((entry, index) => (
                      <tr key={index}>
                        <td>{entry.company_status}</td>
                        <td>{entry.remarks || "—"}</td>
                        <td>{entry.userId}</td>
                        <td>{new Date(entry.date_updated).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No company status history available.</p>
              )}

              <p className="fw-bold mb-2">Tourism Certificate History:</p>
              {empData.tourism_certificate_ids?.length > 0 ? (
                <Table size="sm" bordered>
                  <thead>
                    <tr>
                      <th>Tourism ID</th>
                      <th>Actions</th>
                      <th>Type</th>
                      <th>Date Issued</th>
                      <th>Date Expired</th>
                      <th>Verifier</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empData.tourism_certificate_ids.map((certId, idx) => (
                      <TourismCertRow key={certId} certId={certId} empId={empData.id} />
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No tourism certificate history available.</p>
              )}
            </Card.Body>
          </Card>
        </td>
      </tr>
    );
  }

  const handleDownloadImage = () => {
    if (summaryRef.current === null) return;

    Swal.fire({
      title: "Preparing image...",
      text: "Please wait while we generate your report.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    toPng(summaryRef.current, { cacheBust: true })
      .then((dataUrl) => {
        download(dataUrl, "tourism_summary.png");
        Swal.close(); // close the loading alert
      })
      .catch((err) => {
        console.error("Image download failed", err);
        Swal.fire("Error", "Failed to generate the image.", "error");
      });
  };



  return (
    <>
      <Container>
        <Row className="justify-content-center">
          <Col md={12}>
            <Card.Body>
              <p id="toppage" className="barabara-label text-start">TOURISM FRONTLINERS FULL LIST</p>
              <p className="mt-1 mb-4 text-muted small text-start">
                Full list of current employees and applicants.
              </p>

              <div className="d-flex justify-content-end align-items-center gap-2 mt-3 mb-3 flex-wrap">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={fetchEmployeeDetails}
                >
                  <FontAwesomeIcon icon={faSyncAlt} />
                </Button>
                <DropdownButton
                  as={ButtonGroup}
                  variant="outline-secondary"
                  title={<><FontAwesomeIcon icon={faDownload} /></>}
                  size="sm"

                >
                  <Dropdown.Item onClick={() => exportToExcel(employees, "All_Employees.xlsx")}>
                    <FontAwesomeIcon icon={faDownload} className="me-2" />
                    Download All Data (Excel)
                  </Dropdown.Item>

                  <Dropdown.Item onClick={() => exportToExcel(filteredEmployees, "Filtered_Employees.xlsx")}>
                    <FontAwesomeIcon icon={faDownload} className="me-2" />
                    Download Filtered Data (Excel)
                  </Dropdown.Item>

                  <Dropdown.Item onClick={() => exportToPdf(filteredEmployees, "Filtered_Employees.pdf")}>
                    <FontAwesomeIcon icon={faPrint} className="me-2" />
                    Download Filtered Data (PDF)
                  </Dropdown.Item>
                </DropdownButton>

                <Dropdown
                  show={showColumnDropdown}
                  onToggle={() => setShowColumnDropdown(!showColumnDropdown)}
                >
                  <Dropdown.Toggle variant="outline-secondary" size="sm" title="Customize Columns">
                    <FontAwesomeIcon icon={faColumns} />
                  </Dropdown.Toggle>

                  <Dropdown.Menu  style={{ maxHeight: "300px", overflowY: "auto", padding: "10px 15px", minWidth: "220px" }}>
                    <div className="d-flex justify-content-between mb-2">
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick={() => setVisibleColumns(allColumns.map(col => col.key))}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick={() => setVisibleColumns([])}
                      >
                        Unselect All
                      </Button>
                    </div>

                    <Form>
                      {allColumns.map(col => (
                        <Form.Check
                          key={col.key}
                          type="checkbox"
                          id={`toggle-${col.key}`}
                          label={col.label}
                          checked={visibleColumns.includes(col.key)}
                          onChange={() => {
                            setVisibleColumns(prev =>
                              prev.includes(col.key)
                                ? prev.filter(k => k !== col.key)
                                : [...prev, col.key]
                            );
                          }}
                        />
                      ))}
                    </Form>
                  </Dropdown.Menu>
                </Dropdown>

                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm">
                    <FontAwesomeIcon icon={faFileCircleCheck} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={{ padding: "10px", width: 250 }}>
                    {[
                      { key: "profilePhoto", label: "With Profile Photo" },
                      { key: "trainingCert", label: "With Training Certificate" },
                      { key: "diploma", label: "With Diploma" },
                      { key: "additionalRequirement", label: "With Additional Requirement" },
                      { key: "workingPermit", label: "With Working Permit" },
                    ].map(({ key, label }) => (
                      <Form.Check
                        key={key}
                        type="checkbox"
                        id={`doc-filter-${key}`}
                        label={label}
                        checked={documentFilters[key]}
                        onChange={(e) =>
                          setDocumentFilters((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                      />
                    ))}
                  </Dropdown.Menu>
                </Dropdown>

                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm">
                    <FontAwesomeIcon icon={faCalendar} />
                  </Dropdown.Toggle>

                  <Dropdown.Menu style={{ padding: "1rem", minWidth: 250 }}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted">Date Type</label>
                      <Form.Select
                        value={dateFilterType}
                        onChange={(e) => {
                          setDateFilterType(e.target.value);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="">All Dates</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="custom">Custom Range</option>
                      </Form.Select>
                    </div>

                    {dateFilterType === "monthly" && (
                      <div className="mb-3">
                        <label className="form-label fw-semibold small text-muted">Select Month</label>
                        <Form.Select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                          <option value="">Select Month</option>
                          {Array.from({ length: 12 }).map((_, i) => (
                            <option key={i} value={i + 1}>
                              {new Date(0, i).toLocaleString("default", { month: "long" })}
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                    )}

                    {dateFilterType === "yearly" && (
                      <div className="mb-3">
                        <label className="form-label fw-semibold small text-muted">Select Year</label>
                        <Form.Control
                          type="number"
                          min="2000"
                          max={new Date().getFullYear()}
                          value={selectedYear}
                          placeholder="Enter year"
                          onChange={(e) => setSelectedYear(e.target.value)}
                        />
                      </div>
                    )}

                    {dateFilterType === "custom" && (
                      <div className="mb-3">
                        <label className="form-label fw-semibold small text-muted">Custom Range</label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="date"
                            value={customRange.start}
                            onChange={(e) =>
                              setCustomRange((prev) => ({ ...prev, start: e.target.value }))
                            }
                          />
                          <Form.Control
                            type="date"
                            value={customRange.end}
                            onChange={(e) =>
                              setCustomRange((prev) => ({ ...prev, end: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm">
                    <FontAwesomeIcon icon={faFilter} className="me-2" />
                    Filters
                  </Dropdown.Toggle>

                  <Dropdown.Menu style={{ padding: "1rem", width: 300 }}>
                    {/* Company Filter */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted">Company</label>
                      <Select
                        options={[
                          { value: "", label: "All Companies" },
                          ...Object.values(companyDataMap)
                            .filter((c) => c?.name)
                            .map((c) => ({ value: c.name.toLowerCase(), label: c.name })),
                        ]}
                        isClearable
                        placeholder="Filter by Company"
                        value={
                          companyFilter
                            ? { value: companyFilter, label: getCompanyLabel(companyFilter) }
                            : null
                        }
                        onChange={(selected) => {
                          setCompanyFilter(selected?.value || "");
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    {/* Certificate Type Filter */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted">Certificate Type (Latest Only)</label>
                      <Select
                        options={[
                          { value: "", label: "All Types" },
                          ...Array.from(
                            new Set(
                              employees
                                .map((e) => e.latest_cert_summary?.type || "")
                                .filter(Boolean)
                            )
                          ).map((type) => ({
                            value: type.toLowerCase(),
                            label: type,
                          })),
                        ]}
                        isClearable
                        placeholder="Filter by Certificate Type"
                        value={
                          certTypeFilter ? { value: certTypeFilter, label: certTypeFilter } : null
                        }
                        onChange={(selected) => {
                          setCertTypeFilter(selected?.value || "");
                          setCurrentPage(1);
                        }}
                      />
                    </div>


                    {/* Designation Filter */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted">Designation</label>
                      <Select
                        options={[
                          { value: "", label: "All Designations" },
                          ...Array.from(new Set(employees.map((e) => e.designation || "")))
                            .filter(Boolean)
                            .map((designation) => ({
                              value: designation.toLowerCase(),
                              label: designation,
                            })),
                        ]}
                        isClearable
                        placeholder="Filter by Designation"
                        value={
                          designationFilter
                            ? { value: designationFilter, label: designationFilter }
                            : null
                        }
                        onChange={(selected) => {
                          setDesignationFilter(selected?.value || "");
                          setCurrentPage(1);
                        }}
                      />
                    </div>

                    {/* Application Type Filter */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted">Application Type</label>
                      <Select
                        options={[
                          { value: "", label: "All Application Types" },
                          ...Array.from(new Set(employees.map((e) => e.application_type || "")))
                            .filter(Boolean)
                            .map((type) => ({ value: type.toLowerCase(), label: type })),
                        ]}
                        isClearable
                        placeholder="Filter by Application Type"
                        value={
                          applicationTypeFilter
                            ? { value: applicationTypeFilter, label: applicationTypeFilter }
                            : null
                        }
                        onChange={(selected) => {
                          setApplicationTypeFilter(selected?.value || "");
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted">Type of Residency</label>
                      <Select
                        options={[
                          { value: "", label: "All Nationalities" },
                          ...Array.from(new Set(employees.map((e) => e.nationality || "")))
                            .filter(Boolean)
                            .map((nat) => ({ value: nat.toLowerCase(), label: nat })),
                        ]}
                        isClearable
                        placeholder="Filter by Type of Residency"
                        value={
                          nationalityFilter
                            ? { value: nationalityFilter, label: nationalityFilter }
                            : null
                        }
                        onChange={(selected) => {
                          setNationalityFilter(selected?.value || "");
                          setCurrentPage(1);
                        }}
                      />
                    </div>


                    {/* Employee Status Filter */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted">Employee Status</label>
                      <Select
                        options={[
                          { value: "", label: "All Statuses" },
                          ...Array.from(new Set(employees.map((e) => e.status || "")))
                            .filter(Boolean)
                            .map((status) => ({ value: status.toLowerCase(), label: status })),
                        ]}
                        isClearable
                        placeholder="Filter by Status"
                        value={
                          statusFilter
                            ? { value: statusFilter, label: statusFilter }
                            : null
                        }
                        onChange={(selected) => {
                          setStatusFilter(selected?.value || "");
                          setCurrentPage(1);
                        }}
                      />
                    </div>

                    {/* Company Status Filter */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted">Company Status</label>
                      <Select
                      
                        options={[
                          { value: "", label: "All Company Statuses" },
                          ...Array.from(new Set(employees.map((e) => e.company_status || "")))
                            .filter(Boolean)
                            .map((status) => ({ value: status.toLowerCase(), label: status })),
                        ]}
                        isClearable
                        placeholder="Filter by Company Status"
                        value={
                          companyStatusFilter
                            ? { value: companyStatusFilter, label: companyStatusFilter }
                            : null
                        }
                        onChange={(selected) => {
                          setCompanyStatusFilter(selected?.value || "");
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted">Sex</label>
                      <Select
                        options={[
                          { value: "", label: "All Sex" },
                          ...Array.from(new Set(employees.map((e) => e.sex || "")))
                            .filter(Boolean)
                            .map((sex) => ({ value: sex.toLowerCase(), label: sex })),
                        ]}
                        isClearable
                        placeholder="Filter by Sex"
                        value={
                          sexFilter
                            ? { value: sexFilter, label: sexFilter }
                            : null
                        }
                        onChange={(selected) => {
                          setSexFilter(selected?.value || "");
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted">Age Group</label>
                      <Select
                        options={[
                          { value: "", label: "All Age Groups" },
                          { value: "kid", label: "Kid (0-12)" },
                          { value: "teen", label: "Teen (13-19)" },
                          { value: "adult", label: "Adult (20-59)" },
                          { value: "senior", label: "Senior (60+)" },
                        ]}
                        isClearable
                        placeholder="Filter by Age Group"
                        value={
                          ageGroupFilter
                            ? {
                              value: ageGroupFilter,
                              label:
                                ageGroupFilter === "kid"
                                  ? "Kid (0-12)"
                                  : ageGroupFilter === "teen"
                                    ? "Teen (13-19)"
                                    : ageGroupFilter === "adult"
                                      ? "Adult (20-59)"
                                      : "Senior (60+)",
                            }
                            : null
                        }
                        onChange={(selected) => {
                          setAgeGroupFilter(selected?.value || "");
                          setCurrentPage(1);
                        }}
                      />
                    </div>



                  </Dropdown.Menu>
                </Dropdown>
                {/* Search Input */}
                <InputGroup size="sm" style={{ maxWidth: "350px" }}>
                  <FormControl
                    placeholder="Search by name or company..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <Button
                    variant="outline-secondary"size="sm"
                    onClick={() => {
                      setActiveSearchText(searchText);
                      setCurrentPage(1);
                    }}
                  >
                    <FontAwesomeIcon icon={faSearch} />
                  </Button>
                </InputGroup>

              </div>



              <div ref={scrollRef} className="custom-scroll-wrapper table-border">
                <div ref={tableRef} className="mt-2">
                  <div className="mb-3">
                    <p className="small text-muted mb-1"><strong>Active Filters:</strong></p>
                    <p className="small text-dark mb-0">
                      {[
                        companyFilter && `Company: ${getCompanyLabel(companyFilter)}`,
                        applicationTypeFilter && `Application Type: ${applicationTypeFilter}`,
                        statusFilter && `Status: ${statusFilter}`,
                        companyStatusFilter && `Company Status: ${companyStatusFilter}`,
                        sexFilter && `Sex: ${sexFilter}`,
                        ageGroupFilter && `Age Group: ${ageGroupFilter}`,
                        designationFilter && `Designation: ${designationFilter}`,
                        nationalityFilter && `Nationality: ${nationalityFilter}`,
                        ...Object.entries(documentFilters)
                          .filter(([_, isChecked]) => isChecked)
                          .map(([field]) => `Has ${field}`),
                        dateFilterType === "monthly" && selectedMonth && `Month: ${new Date(0, selectedMonth - 1).toLocaleString("default", { month: "long" })}`,
                        dateFilterType === "yearly" && selectedYear && `Year: ${selectedYear}`,
                        dateFilterType === "custom" && customRange.start && customRange.end &&
                        `Date Range: ${new Date(customRange.start).toLocaleDateString()} to ${new Date(customRange.end).toLocaleDateString()}`
                      ]
                        .filter(Boolean)
                        .join(" | ") || "None"}
                    </p>
                  </div>

                  <Table bordered hover style={{ minWidth: "1400px" }}>
                    <thead>
                      <tr>
                        {allColumns
                          .filter(col => visibleColumns.includes(col.key))
                          .map(col => (
                            <th key={col.key}>{col.label}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={visibleColumns.length} className="text-center text-muted">
                            No employees found.
                          </td>
                        </tr>
                      ) : (
                        paginatedEmployees.map((empData) => {
                          const emp = new Employee({ id: empData.id, ...empData });
                          const company = companyDataMap[emp.companyId];

                          const rowData = {
                            status: <Badge bg={getStatusBadgeVariant(emp.status)}>{emp.status}</Badge>,



                            actions: (
                              <div className="d-flex gap-2">
                                <Dropdown>
                                  <Dropdown.Toggle size="sm" variant="outline-secondary">
                                    Change Tourism Status
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu>
                                    {STATUSES.map((status) => (
                                      <Dropdown.Item
                                        key={status}
                                        disabled={empData.status?.toLowerCase() === status.toLowerCase()}
                                        onClick={() => handleChangeStatus(empData, status)}
                                      >
                                        {status}
                                      </Dropdown.Item>
                                    ))}
                                  </Dropdown.Menu>
                                </Dropdown>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEditEmployee(empData)}
                                  title="Edit Employee"
                                >
                                  <FontAwesomeIcon icon={faPen} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"

                                  onClick={() => handleDeleteEmployee(empData.id)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </Button>
                                {/* add here the edit button */}
                              </div>
                            ),

                            companyStatus: <Badge bg={getStatusBadgeVariant(emp.company_status)}>{emp.company_status || "N/A"}</Badge>,
                            tourismCertificate: Array.isArray(emp.tourism_certificate_ids) && emp.tourism_certificate_ids.length > 0 ? (
                              <div className="d-flex flex-wrap gap-2">
                                {emp.tourism_certificate_ids.map((certId, index) => (
                                  <Button
                                    key={certId}
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => window.open(`/tourism-certificate/${certId}`, "_blank")}
                                  >
                                    <FontAwesomeIcon icon={faEye} className="me-1" />
                                    View {emp.tourism_certificate_ids.length > 1 ? `#${index + 1}` : ""}
                                  </Button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted">N/A</span>
                            ),
                            tourismCertificateLatestSummary: emp.latest_cert_summary &&
                              emp.latest_cert_summary.tourism_cert_id &&
                              emp.latest_cert_summary.type &&
                              emp.latest_cert_summary.date_Issued &&
                              emp.latest_cert_summary.date_Expired ? (
                              <div className="text-start small">
                                <div><strong>ID:</strong> {emp.latest_cert_summary.tourism_cert_id}</div>
                                <div><strong>Type:</strong> {emp.latest_cert_summary.type}</div>
                                <div><strong>Date Issued:</strong> {new Date(emp.latest_cert_summary.date_Issued).toLocaleDateString()}</div>
                                <div><strong>Date Expired:</strong> {new Date(emp.latest_cert_summary.date_Expired).toLocaleDateString()}</div>
                              </div>
                            ) : null,
                            history: (
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => toggleExpand(emp.id)}
                              >
                                {expandedRows.includes(emp.id) ? "Hide History" : "View History"}
                              </button>
                            ),
                            applicationType: emp.application_type,
                            companyName: company?.name || emp.companyId,
                            fullName: emp.getFullName(),
                            sex: emp.sex,
                            birthday: emp.birthday,
                            age: emp.age,
                            maritalStatus: emp.maritalStatus,
                            nationality: emp.nationality,
                            contact: emp.contact,
                            email: emp.email,
                            designation: emp.designation,
                            education: emp.education,
                            emergencyContact: `${emp.emergencyContactName} / ${emp.emergencyContactNumber}`,
                            presentAddress: [
                              emp.presentAddress?.street,
                              emp.presentAddress?.barangay,
                              emp.presentAddress?.town,
                              emp.presentAddress?.province,
                              emp.presentAddress?.region,
                              emp.presentAddress?.country,
                            ].filter(Boolean).join(", "),
                            birthPlace: [
                              emp.birthPlace?.town,
                              emp.birthPlace?.province,
                              emp.birthPlace?.country,
                            ].filter(Boolean).join(", "),
                            height: emp.height,
                            weight: emp.weight,
                            profilePhoto: viewDocLink(emp.profilePhoto),
                            trainingCert: viewDocLink(emp.trainingCert),
                            diploma: viewDocLink(emp.diploma),
                            additionalRequirement: viewDocLink(emp.additionalRequirement),
                            workingPermit: viewDocLink(emp.workingPermit),
                          };

                          return (
                            <React.Fragment key={emp.id}>
                              <tr>
                                {allColumns.map(col =>
                                  visibleColumns.includes(col.key) && (
                                    <td key={col.key}>{rowData[col.key]}</td>
                                  )
                                )}
                              </tr>
                              {expandedRows.includes(emp.id) && renderExpandedHistory(emp, empData)}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>

                  </Table>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
                {/* Left: Rows per page */}
                <Form.Group className="d-flex align-items-center gap-2 mb-0">
                  <Form.Label className="mb-0 small">Rows per page</Form.Label>
                  <Form.Select
                    size="sm"
                    style={{ width: "auto" }}
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1); // Reset to first page on change
                    }}
                  >
                    {[5, 10, 50, 100].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                {/* Right: Pagination controls */}
                <div className="d-flex align-items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </Button>
                  <span className="text-muted small">Page {currentPage}</span>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => setCurrentPage((prev) =>
                      prev * rowsPerPage < filteredEmployees.length ? prev + 1 : prev
                    )}
                    disabled={currentPage * rowsPerPage >= filteredEmployees.length}
                  >
                    Next
                  </Button>
                </div>
              </div>
              {/* OUTSIDE of map, and below the table */}
              {showCertificateFor && (() => {
                const selectedEmp = employees.find(e => e.id === showCertificateFor);
                const company = companyDataMap[selectedEmp?.companyId];
                if (!selectedEmp) return null;
                return (
                  <React.Fragment key={selectedEmp.id}>
                    <TourismCert
                      emp={new Employee(selectedEmp)}
                      company={company}
                      currentUser={currentUser}
                      hideNavAndFooter
                    />

                    <div className="text-center mt-3 mb-5">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setShowCertificateFor(null)}
                      >
                        <FontAwesomeIcon icon={faEyeSlash} className="me-2" />
                        Hide
                      </Button>
                    </div>

                  </React.Fragment>

                );
              })()}
            </Card.Body>
          </Col>
        </Row>
        <div className="d-flex justify-content-center mt-4 mb-5">
          <Button
            variant={showSummary ? "outline-danger" : "outline-secondary"}
            onClick={toggleSummary}
            disabled={loadingSummary}
          >
            {loadingSummary
              ? "Loading..."
              : showSummary
                ? "Hide Summary"
                : "Show Summary"}
          </Button>
        </div>
        {showSummary && (
          <Row className="justify-content-center">
            <Col md={12}>
              <div className="mt-2 table-border bg-white p-3" ref={summaryRef}>
                <div className="d-flex justify-content-between align-items-center mb-3 mt-5">
                  <h6 className="mb-0">Summary</h6>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleDownloadImage}
                  >
                    <FontAwesomeIcon icon={faDownload} /> Download Report
                  </Button>
                </div>
                <p className="text-muted">
                  <strong>{filteredEmployees.length}</strong> Tourism Fronliner(s){" "}
                  {activeSearchText && (
                    <>
                      matching "<strong>{activeSearchText}</strong>"
                    </>
                  )}
                </p>

                {/* STATUS COUNTS */}
                <Row className="mb-3 g-3">
                  {Object.entries(statusCounts).map(([status, count], idx) => (
                    <Col key={idx} md={2}>
                      <div className="summary-card border rounded bg-white text-muted p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center">
                        <div>
                          <p className="mb-1 fw-semibold text-capitalize">{status}</p>
                          <h6 className="mb-0 text-dark">
                            <Badge bg={getStatusBadgeVariant(status)}>{count}</Badge>
                          </h6>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>

                {/* PIE CHART BREAKDOWNS */}
                <Row className="g-3 mt-2">


                  <Col md={3}>
                    <SummaryPieChart
                      title="Application Type Breakdown"
                      loading={!filteredEmployees.length}
                      data={[
                        { name: 'New', value: summary?.new || 0 },
                        { name: 'Renewal', value: summary?.renewal || 0 },
                      ]}
                    />
                  </Col>
                  <Col md={3}>
                    <SummaryPieChart
                      title="Type of Residency Breakdown"
                      loading={!filteredEmployees.length}
                      data={summary?.nationalityBreakdown || []}
                    />
                  </Col>
                  <Col md={3}>
                    <SummaryPieChart
                      title="Sex Breakdown"
                      loading={!filteredEmployees.length}
                      data={[
                        { name: 'Males', value: summary?.males || 0 },
                        { name: 'Females', value: summary?.females || 0 },
                        { name: 'Prefer not to say', value: summary?.preferNotToSay || 0 },
                      ]}
                    />
                  </Col>

                  <Col md={3}>
                    <SummaryPieChart
                      title="Age Breakdown"
                      loading={!filteredEmployees.length}
                      data={[
                        { name: 'Kids (0–12)', value: summary?.kids || 0 },
                        { name: 'Teens (13–19)', value: summary?.teens || 0 },
                        { name: 'Adults (20–59)', value: summary?.adults || 0 },
                        { name: 'Seniors (60+)', value: summary?.seniors || 0 },
                      ]}
                    />
                  </Col>


                </Row>
                <Row className="g-3 mt-2">
                  <Col md={6}>
                    <TopRankingChart title="Top 10 Companies (Company Approved Tourism Frontliners)" data={topCompanies} />
                  </Col>
                  <Col md={6}>
                    <TopRankingChart title="Top 10 Designations" data={topDesignations} />
                  </Col>
                </Row>
                <Row className="g-3 mt-2">
                  <Col md={12}>
                    <TourismCertSummaryTable employees={filteredEmployees} loading={!filteredEmployees.length} />
                  </Col>
                


                </Row>
                <Row>
                    <Col md={12}>
                    <CertificateIssuanceForecastChart
                      title="Certificate Issuance Forecast"
                      employees={filteredEmployees}
                    />
                  </Col>

                </Row>
                <small className="text-muted d-block text-center mt-5">
                  * This report and its contents are the property of the Local Government of Malay through the Municipal Tourism Office and adhere to the Data Privacy Act of 2012 (Republic Act No. 10173). Please ensure proper disposal of printed or digital copies in accordance with data privacy and confidentiality protocols.
                </small>
              </div>
            </Col>
          </Row>


        )}
        <div className="my-5">
        </div>
      </Container>
    </>
  );
}
