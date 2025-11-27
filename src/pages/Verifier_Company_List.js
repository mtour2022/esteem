import React, { useEffect, useRef, useState, useMemo } from "react";
import { doc, getDoc, addDoc, updateDoc, getDocs, collection, setDoc, deleteDoc } from "firebase/firestore";
import { db, storage } from "../config/firebase";
import Swal from "sweetalert2";
import { Table, Badge, Dropdown, Button, Form, Container, Card, Row, Col } from "react-bootstrap";
import { useAuth } from '../auth/authentication';
import { runTransaction } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject, } from "firebase/storage";
import CompanyTourismCert from "../components/CompanyTourismCert";
import { faEye, faEyeSlash, faFile, faSearch, faSyncAlt, faFilter, faTrash, faCalendar, faFileCircleCheck, faDownload, faPrint, faColumns, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendApprovalEmailCompany } from "../components/ApprovalEmailCompany";
import { sendResubmitEmailCompany } from "../components/ResubmitEmailCompany";

const STATUSES = ["under review", "approved", "incomplete", "resigned", "change company", "invalid", "temporary"];

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


export default function CompanyPage() {
    const scrollRef = useRef();
    const tableRef = useRef();

    useMouseDragScroll(scrollRef);
    const [selectedCert, setSelectedCert] = useState(null);

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const [showCertificateFor, setShowCertificateFor] = useState(null);

    // Pagination states
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCompany, setSelectedCompany] = useState(null);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanyDetails = async () => {
        try {
            setLoading(true);
            Swal.fire({
                title: "Fetching company data...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const snapshot = await getDocs(collection(db, "company"));
            let companyDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort by the most recent status_history date (descending)
            companyDocs.sort((a, b) => {
                const aLatest = getLatestStatusDate(a.status_history);
                const bLatest = getLatestStatusDate(b.status_history);
                return bLatest - aLatest; // descending
            });

            setCompanies(companyDocs);

            // Reset filters and search states
            setCurrentPage(1);

        } catch (err) {
            console.error("Error fetching companies:", err);
            Swal.fire("Error", "Failed to load company data.", "error");
        } finally {
            setLoading(false);
            Swal.close();
        }
    };

    // Utility to get the latest status_history date
    const getLatestStatusDate = (history) => {
        if (!history || history.length === 0) return 0;
        return new Date(history[history.length - 1].date_updated).getTime();
    };


    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "company"));
            const data = querySnapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
            }));
            setCompanies(data);
        } catch (err) {
            console.error("Error fetching companies:", err);
        }
        setLoading(false);
    };


    const handleChangeStatus = async (company, newStatus) => {
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
                userId: currentUser?.email || "system",
            };

            // 🔥 ALWAYS initialize updates with safe defaults
            const updates = {
                status: newStatus,
                status_history: [...(company.status_history || []), historyEntry],
                latest_cert_id: company.latest_cert_id || "",
                latest_cert_summary: company.latest_cert_summary || {},
                tourism_certificate_ids: [...(company.tourism_certificate_ids || [])],
            };

            const companyRef = doc(db, "company", company.company_id);

            // ❌ TEMPORARY — skip certificate creation
            if (newStatus.toLowerCase() === "temporary") {
                await updateDoc(companyRef, updates);
                await fetchCompanyDetails();
                Swal.fire("Updated", "Company status updated to Temporary.", "success");
                return;
            }

            // ✅ APPROVED — generate certificate
            if (newStatus.toLowerCase() === "approved") {
                const dateNow = new Date();
                const currentYear = dateNow.getFullYear();
                const oneYearLater = new Date(currentYear, 11, 31);

                const counterRef = doc(db, "counters", `tourism_cert_${currentYear}`);
                let tourismCertId = "";

                await runTransaction(db, async (transaction) => {
                    const counterDoc = await transaction.get(counterRef);
                    let lastNumber = 0;

                    if (counterDoc.exists()) lastNumber = counterDoc.data().last_number;

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
                    type: "endorsement",
                    date_Issued: dateNow.toISOString(),
                    date_Expired: oneYearLater.toISOString(),
                    company_id: company.company_id,
                    verifier_id: currentUser?.uid || "system",
                    tourism_cert_history: "",
                };

                await setDoc(certRef, cert);

                updates.tourism_certificate_ids.push(tourismCertId);

                updates.latest_cert_id = tourismCertId;
                updates.latest_cert_summary = {
                    tourism_cert_id: tourismCertId,
                    type: cert.type,
                    date_Issued: cert.date_Issued,
                    date_Expired: cert.date_Expired,
                };

                setShowCertificateFor(company.company_id);

                await sendApprovalEmailCompany(company, updates.latest_cert_summary);
            }

            // 🔁 INCOMPLETE — resubmit email
            if (newStatus.toLowerCase() === "incomplete") {
                await sendResubmitEmailCompany(company);
            }

            await updateDoc(companyRef, updates);
            await fetchCompanyDetails();

            Swal.fire("Success", "Company status updated successfully.", "success");

        } catch (err) {
            console.error("Error updating company status:", err);
            Swal.fire("Error", "Failed to update company status.", "error");
        }
    };


    const getStatusBadgeVariant = (status) => {
        if (!status) return "secondary";

        switch (status.toLowerCase()) {
            case "approved":
                return "success";
            case "under review":
                return "warning";
            case "incomplete":
                return "danger";
            case "temporary":
                return "info"; // NEW STATUS
            case "resigned":
                return "dark";
            default:
                return "secondary";
        }
    };

    // Paginated companies
    const paginatedCompanies = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return companies.slice(start, end);
    }, [companies, currentPage, rowsPerPage]);

    const viewDocLink = (url) =>
        url ? (
            <a href="#" onClick={(e) => { e.preventDefault(); window.open(url, "_blank"); }}>
                View Doc
            </a>
        ) : (
            <span className="text-muted">N/A</span>
        );


    return (
        <Container>
            <Row className="justify-content-center">
                <Col md={12}></Col>
                <Card.Body>
                    <p id="toppage" className="barabara-label text-start">COMPANY FULL LIST</p>
                    <p className="mt-1 mb-4 text-muted small text-start">
                        Full list of TTAs and POs.
                    </p>


                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div ref={scrollRef} className="custom-scroll-wrapper table-border">
                            <div ref={tableRef} className="mt-2">


                                <Table bordered hover style={{ minWidth: "1400px" }}>
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th>Actions</th>
                                            <th>Classification</th>
                                            <th>Tourism Certificates</th>
                                            <th>Business Name</th>
                                            <th>Proprietor/President</th>
                                            <th>Contact</th>
                                            <th>Email</th>

                                            <th>Type</th>
                                            <th>Year</th>
                                            <th>Address</th>
                                            <th>Logo</th>
                                            <th>Permit/Accreditation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedCompanies.map((company, index) => (
                                            <tr key={company.id}>
                                                {/* <td>{(currentPage - 1) * rowsPerPage + index + 1}</td> */}
                                                <td>
                                                    <Badge bg={getStatusBadgeVariant(company.status)}>
                                                        {company.status || "N/A"}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Dropdown>
                                                        <Dropdown.Toggle size="sm" variant="outline-primary">
                                                            Change Status
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu>
                                                            {STATUSES.map((status) => (
                                                                <Dropdown.Item
                                                                    key={status}
                                                                    onClick={() => handleChangeStatus(company, status)}
                                                                >
                                                                    {status}
                                                                </Dropdown.Item>
                                                            ))}
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </td>
                                                <td>{company.classification}</td>
                                                <td>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {(company.tourism_certificate_ids || []).map((certId, index) => (
                                                            <Button
                                                                key={certId}
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setSelectedCompany(
                                                                        selectedCompany?.company_id === company.company_id ? null : company
                                                                    )
                                                                }
                                                            >
                                                                <FontAwesomeIcon icon={faEye} className="me-1" />
                                                                View {company.tourism_certificate_ids.length > 1 ? `#${index + 1}` : ""}
                                                            </Button>
                                                        ))}

                                                    </div>
                                                </td>

                                                <td>{company.name}</td>
                                                <td>
                                                    {company.proprietor
                                                        ? `${company.proprietor.first} ${company.proprietor.middle || ""} ${company.proprietor.last}`
                                                        : ""}
                                                </td>
                                                <td>{company.contact}</td>
                                                <td>{company.email}</td>

                                                <td>{company.type}</td>
                                                <td>{company.year}</td>
                                                <td>
                                                    {company.address
                                                        ? `${company.address.street}, ${company.address.barangay}, ${company.address.town}, ${company.address.province}, ${company.address.region}, ${company.address.country}`
                                                        : ""}
                                                </td>
                                                <td>{viewDocLink(company.logo)}</td>
                                                <td>{viewDocLink(company.permit)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>

                            </div>
                        </div>
                    )}

                    {/* Pagination controls */}
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
                                    setCurrentPage(1); // reset to page 1
                                }}
                            >
                                {[5, 10, 50, 100].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
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
                            <span className="text-muted small">
                                Page {currentPage} of {Math.max(1, Math.ceil(companies.length / rowsPerPage))}
                            </span>
                            <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        prev * rowsPerPage < companies.length ? prev + 1 : prev
                                    )
                                }
                                disabled={currentPage * rowsPerPage >= companies.length}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                    {/* Below the table */}

                    {selectedCompany && (
                        <div className="mt-4">
                            <CompanyTourismCert company={selectedCompany}
                                currentUser={currentUser}
                                hideNavAndFooter />
                        </div>
                    )}



                </Card.Body>
            </Row>


        </Container>
    );
}
