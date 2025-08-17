import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, Form, InputGroup, Dropdown, ButtonGroup } from "react-bootstrap";
import Swal from "sweetalert2";
import { db } from "../config/firebase";
import {
    collection,
    getDocs,
    deleteDoc, updateDoc, arrayRemove,
    doc,
} from "firebase/firestore";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash, faTrash, faPlus, faCalendar, faFileExport, faEye } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../auth/authentication";
import TourismCert from "../components/TourismCert";
import CompanyTourismCert from "../components/CompanyTourismCert";
import Employee from "../classes/employee";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { faDownload, faPrint } from "@fortawesome/free-solid-svg-icons";

const TourismCertAdminPage = () => {
    const [certs, setCerts] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCert, setSelectedCert] = useState(null);

    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [verifiers, setVerifiers] = useState([]);


    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedVerifier, setSelectedVerifier] = useState(null);
    const [dateFilterType, setDateFilterType] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [customRange, setCustomRange] = useState({ start: "", end: "" });

    const { currentUser } = useAuth();

    // Fetch certificates
    const fetchCerts = async () => {
        const snapshot = await getDocs(collection(db, "tourism_cert"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCerts(data);
    };

    // Fetch employees
    const fetchEmployees = async () => {
        const snapshot = await getDocs(collection(db, "employee"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setEmployees(data);
    };

    // Fetch companies
    const fetchCompanies = async () => {
        const snapshot = await getDocs(collection(db, "company"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCompanies(data);
    };

    const fetchVerifiers = async () => {
        try {
            const snapshot = await getDocs(collection(db, "verifier"));
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setVerifiers(data);
        } catch (error) {
            console.error("Failed to fetch verifiers:", error);
        }
    };

    const companyDataMap = useMemo(() => {
        const map = {};
        companies.forEach((c) => {
            map[c.id] = c;
        });
        return map;
    }, [companies]);

    const selectedEmp = employees.find((emp) => emp.id === selectedCert?.employee_id);

    // If employee exists, get their company; otherwise, get company directly from cert
    const selectedComp = selectedEmp
        ? companyDataMap[selectedEmp.companyId]
        : selectedCert
            ? companyDataMap[selectedCert.company_id] // <-- use company_id from cert
            : null;


    useEffect(() => {
        fetchCerts();
        fetchEmployees();
        fetchCompanies();
        fetchVerifiers();
    }, []);

    const filterByDate = (certs) => {
        if (!dateFilterType || dateFilterType === "") return certs;

        return certs.filter((cert) => {
            const issuedDate = new Date(cert.date_Issued);

            if (dateFilterType === "monthly") {
                return issuedDate.getMonth() + 1 === Number(selectedMonth) &&
                    issuedDate.getFullYear() === new Date().getFullYear(); // Optional: allow selecting year
            }

            if (dateFilterType === "yearly") {
                return issuedDate.getFullYear() === Number(selectedYear);
            }

            if (dateFilterType === "custom") {
                const start = new Date(customRange.start);
                const end = new Date(customRange.end);
                return issuedDate >= start && issuedDate <= end;
            }

            return true;
        });
    };




    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
        setCurrentPage(1);
    };

    const filteredCerts = certs.filter((c) => {
        const emp = employees.find((e) => e.employeeId === c.employee_id);
        const matchesCompany = !selectedCompany || emp?.companyId === selectedCompany.value;
        const matchesEmployee = !selectedEmployee || emp?.employeeId === selectedEmployee.value;
        const matchesVerifier = !selectedVerifier || c.verifier_id === selectedVerifier.value;

        return matchesCompany && matchesEmployee && matchesVerifier;
    });

    const displayedCerts = filterByDate(filteredCerts); // or filteredCerts depending on your logic


    const paginatedCerts = displayedCerts.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );


    const handleDelete = async (certificateId, employeeId) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "This will permanently delete the certificate.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
        });

        if (!result.isConfirmed) return;

        try {
            // 1. Delete certificate document
            await deleteDoc(doc(db, "tourism_certificates", certificateId));

            // 2. Remove certificateId from employee's tourism_certificate_ids
            const employeeRef = doc(db, "employee", employeeId);
            await updateDoc(employeeRef, {
                tourism_certificate_ids: arrayRemove(certificateId),
            });

            Swal.fire("Deleted!", "Certificate has been deleted.", "success");
            // Optionally refresh UI
        } catch (error) {
            console.error("Error deleting certificate:", error);
            Swal.fire("Error!", "Something went wrong while deleting.", "error");
        }
    };



    const exportToExcel = (data, filename = "TourismCertificatesData.xlsx") => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, filename);
    };
    const exportToPdf = (data, filename = "TourismCertificatesData.pdf") => {
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "legal", // or use "a4" for standard width
        });

        const columns = Object.keys(data[0] || {}).map(key => ({
            header: key,
            dataKey: key,
        }));

        autoTable(doc, {
            head: [columns.map(col => col.header)],
            body: data.map(row => columns.map(col => row[col.dataKey])),
            styles: { fontSize: 8 },
            margin: { top: 20 },
        });

        doc.save(filename);
    };



    return (
        <div className="container py-4">
            <p className="barabara-label text-start">TOURISM CERTIFICATES</p>
            <p className="text-muted small text-start mb-4">
                Manage employee tourism certification records.
            </p>

            <div className="mb-3 d-flex justify-content-between align-items-center">
                <div className="d-flex flex-wrap gap-3 mb-3">
                    <div style={{ minWidth: 200 }}>
                        <label className="form-label mb-0 small">Filter by Company</label>
                        <Select
                            options={companies.map((c) => ({ value: c.id, label: c.name }))}
                            onChange={(selected) => setSelectedCompany(selected)}
                            isClearable
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    minHeight: '30px',
                                    height: '30px',
                                    fontSize: '0.85rem',
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    height: '30px',
                                    padding: '0 6px',
                                }),
                                indicatorsContainer: (base) => ({
                                    ...base,
                                    height: '30px',
                                }),
                            }}
                        />
                    </div>

                    <div style={{ minWidth: 200 }}>
                        <label className="form-label mb-0 small">Filter by Employee</label>
                        <Select
                            options={employees.map((e) => ({
                                value: e.id,
                                label: `${e.firstname} ${e.middlename || ""} ${e.surname}`.trim(),
                            }))}
                            onChange={(selected) => setSelectedEmployee(selected)}
                            isClearable
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    minHeight: '30px',
                                    height: '30px',
                                    fontSize: '0.85rem',
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    height: '30px',
                                    padding: '0 6px',
                                }),
                                indicatorsContainer: (base) => ({
                                    ...base,
                                    height: '30px',
                                }),
                            }}
                        />
                    </div>

                    <div style={{ minWidth: 200 }}>
                        <label className="form-label mb-0 small">Filter by Verifier</label>
                        <Select
                            options={verifiers.map((v) => ({
                                value: v.verifierId,
                                label: `${v.firstname} ${v.middlename?.charAt(0) || ""}. ${v.surname} ${v.suffix || ""}`.trim(),
                            }))}
                            onChange={(selected) => setSelectedVerifier(selected)}
                            isClearable
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    minHeight: '30px',
                                    height: '30px',
                                    fontSize: '0.85rem',
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    height: '30px',
                                    padding: '0 6px',
                                }),
                                indicatorsContainer: (base) => ({
                                    ...base,
                                    height: '30px',
                                }),
                            }}
                        />
                    </div>

                    <div>
                        <label className="form-label mb-1 small"></label>
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
                    </div>

                    <div>
                        <label className="form-label mb-1 small"></label> <br></br>
                        <Dropdown as={ButtonGroup}>
                            <Button variant="outline-secondary" size="sm">
                                <FontAwesomeIcon icon={faFileExport} />
                            </Button>
                            <Dropdown.Toggle split variant="outline-secondary" id="dropdown-split-basic" size="sm" />

                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => exportToExcel(filteredCerts, "Filtered_Employees.xlsx")}>
                                    <FontAwesomeIcon icon={faDownload} className="me-2" />
                                    Export Excel
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => exportToPdf(filteredCerts, "Filtered_Employees.pdf")}>
                                    <FontAwesomeIcon icon={faPrint} className="me-2" />
                                    Download PDF
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>

                </div>


            </div>

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Control No.</th>
                        <th>Type</th>
                        <th>Actions</th>
                        <th>Date Issued</th>
                        <th>Date Expired</th>
                        <th>Employee Name</th>
                        <th>Company Name</th>
                        <th>Verifier Name</th>

                    </tr>
                </thead>

                <tbody>
                    {paginatedCerts.map((cert) => {
                        const employee = employees.find((e) => e.employeeId === cert.employee_id);
                        const company = employee ? companyDataMap[employee.companyId] : null;
                        const verifier = verifiers.find((v) => v.verifierId === cert.verifier_id);
                        const verifierName = verifier
                            ? `${verifier.firstname} ${verifier.middlename?.charAt(0) || ""}. ${verifier.surname} ${verifier.suffix || ""}`.trim()
                            : "—";
                        return (
                            <tr key={cert.id}>
                                <td>{cert.id}</td>
                                <td>{cert.type}</td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            className="me-2"
                                            onClick={() => setSelectedCert(cert)}
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            onClick={() => handleDelete(cert.id, cert.employee_id)}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </Button>
                                    </div>
                                </td>

                                <td>
                                    {cert.date_Issued
                                        ? new Date(
                                            cert.date_Issued.seconds
                                                ? cert.date_Issued.toDate()
                                                : cert.date_Issued
                                        ).toLocaleDateString("en-US", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })
                                        : "—"}
                                </td>

                                <td>
                                    {cert.date_Expired
                                        ? new Date(
                                            cert.date_Expired.seconds
                                                ? cert.date_Expired.toDate()
                                                : cert.date_Expired
                                        ).toLocaleDateString("en-US", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })
                                        : "—"}
                                </td>

<td>
  {cert.employee_id
    ? `${employee.firstname} ${employee.middlename} ${employee.surname}${employee.suffix ? `, ${employee.suffix}` : ""}`
    : selectedComp?.name || "—"}
</td>
<td>
  {cert.employee_id
    ? company?.name || "—"
    : selectedComp?.name || "—"}
</td>

                                <td>{verifierName}</td>

                            </tr>
                        );
                    })}
                    {paginatedCerts.length === 0 && (
                        <tr>
                            <td colSpan="6" className="text-center text-muted">
                                No data found
                            </td>
                        </tr>
                    )}
                </tbody>

            </Table>

            <div className="d-flex justify-content-between align-items-center mt-2 mb-5 flex-wrap">
                <Form.Group className="d-flex align-items-center gap-2 mb-2 mb-md-0">
                    <Form.Label className="mb-0 small">Rows per page</Form.Label>
                    <Form.Select
                        size="sm"
                        style={{ width: "auto" }}
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        {[5, 10, 50, 100].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <div className="d-flex align-items-center gap-2">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                    >
                        Prev
                    </Button>
                    <span className="small">
                        Page {currentPage} of {Math.ceil(displayedCerts.length / rowsPerPage)}
                    </span>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled={currentPage >= Math.ceil(displayedCerts.length / rowsPerPage)}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                        Next
                    </Button>

                </div>
            </div>

            {selectedCert && (
                <>
                    {selectedCert.employee_id ? (
                        <TourismCert
                            emp={new Employee(selectedEmp)}
                            company={selectedComp}
                            currentUser={currentUser}
                            hideNavAndFooter
                        />
                    ) : (
                        <CompanyTourismCert
                            company={selectedComp}
                            currentUser={currentUser}
                            hideNavAndFooter
                        />
                    )}

                    <div className="text-center mt-3 mb-5">
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setSelectedCert(null)}
                        >
                            <FontAwesomeIcon icon={faEyeSlash} className="me-2" />
                            Hide
                        </Button>
                    </div>
                </>
            )}


        </div>
    );
};

export default TourismCertAdminPage;
