import React, { useEffect, useState, useRef } from "react";
import { Container, Row, Col, Button, Spinner, Form, Badge, Card, InputGroup } from "react-bootstrap";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import Swal from "sweetalert2";
import useCompanyInfo from "../services/GetCompanyDetails";
import { useNavigate } from "react-router-dom";
import QrScanner from "qr-scanner";
import Webcam from "react-webcam";
import { useParams } from "react-router-dom";
import FooterCustomized from '../components/Footer';
import AppNavBar from "../components/AppNavBar";

const STATUSES = ["under review", "approved", "incomplete", "resigned", "change company", "invalid"];

const EmployeeQRScannerPage = () => {
    const [searchType, setSearchType] = useState("id");
    const [employeeId, setEmployeeId] = useState("");
    const [firstname, setFirstname] = useState("");
    const [surname, setSurname] = useState("");
    const [employees, setEmployees] = useState([]);
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [scannerRequested, setScannerRequested] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();
    const [selectedCertId, setSelectedCertId] = useState("");
    // ✅ Add with the rest of useState declarations
    const [employee, setEmployee] = useState(null);
    const webcamRef = useRef(null);
    const qrScannerRef = useRef(null);
    const handledRef = useRef(false);

    const [birthDate, setBirthDate] = useState("");
    const videoRef = useRef(null);
    const { registration_id } = useParams();

    const handleViewCert = () => {
        if (selectedCertId) {
            window.open(`/tourism-certificate/${selectedCertId}`, '_blank');
        }
    };

    const companyInfo = useCompanyInfo(employee?.companyId);

    useEffect(() => {
        if (scannerRequested && webcamRef.current?.video) {
            const scanner = new QrScanner(
                webcamRef.current.video,
                async (result) => {
                    // ignore if we've already handled a successful scan
                    if (handledRef.current) return;

                    if (result?.data) {
                        const parts = result.data.trim().split("/").filter(Boolean);
                        const scannedId = parts[parts.length - 1];

                        if (!scannedId) {
                            Swal.fire("Invalid QR", "No valid employee ID found in QR code.", "error");
                            return;
                        }

                        // mark handled so we don't double-process
                        handledRef.current = true;

                        // update UI fields immediately
                        setSearchType("id");
                        setEmployeeId(scannedId);

                        // stop and cleanup scanner/camera right away
                        try {
                            const stopResult = scanner.stop?.();
                            if (stopResult instanceof Promise) {
                                await stopResult;
                            }
                        } catch (err) {
                            console.warn("Error stopping scanner after scan:", err);
                        }

                        qrScannerRef.current = null;
                        setScannerRequested(false);

                        // call fetch directly to avoid timing issues with state updates
                        await fetchEmployeeById(scannedId);
                    }
                },
                {
                    highlightScanRegion: true,
                    preferredCamera: "environment"
                }
            );

            qrScannerRef.current = scanner;
            scanner.start().catch(err => {
                console.error("Camera start error:", err);
                Swal.fire("Camera error", "Unable to access the camera.", "error");
                // ensure scannerRequested is reset if camera fails to start
                setScannerRequested(false);
            });

            return () => {
                try {
                    if (scanner && typeof scanner.stop === "function") {
                        const stopResult = scanner.stop();
                        if (stopResult instanceof Promise) {
                            stopResult.catch(() => { });
                        }
                    }
                } catch (err) {
                    console.warn("Error stopping scanner in cleanup:", err);
                }
                qrScannerRef.current = null;
                setScannerRequested(false);
            };

        }
    }, [scannerRequested]);

    useEffect(() => {
        if (registration_id) {
            // Clear previous states
            setEmployee(null);
            setErrorMessage("");
            setSearchType("id");
            setEmployeeId(registration_id);

            // Trigger fetch
            fetchEmployeeById(registration_id);
        }
    }, [registration_id]);






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

    const fetchEmployeeById = async (docId) => {
        try {
            setLoading(true);
            const ref = doc(collection(db, "employee"), docId.trim());
            const snapshot = await getDoc(ref);
            if (snapshot.exists()) {
                setEmployee(snapshot.data());
                setScanned(true);
                setErrorMessage("");
            } else {
                setEmployee(null);
                setErrorMessage("No employee found with this ID.");
            }
        } catch (error) {
            console.error("Error fetching employee:", error);
            Swal.fire("Error", "Could not fetch employee details.", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeByName = async () => {
        try {
            setLoading(true);

            const q = query(collection(db, "employee"));
            const querySnapshot = await getDocs(q);

            const match = querySnapshot.docs.find(doc => {
                const data = doc.data();
                const storedFirst = data.firstname?.toLowerCase() || "";
                const storedLast = data.surname?.toLowerCase() || "";
                return (
                    storedFirst === firstname.trim().toLowerCase() &&
                    storedLast === surname.trim().toLowerCase()
                );
            });

            if (match) {
                setEmployee(match.data());
                setScanned(true);
                setErrorMessage("");
            } else {
                setEmployee(null);
                setErrorMessage("No employee found with that name.");
            }
        } catch (error) {
            console.error("Error fetching by name:", error);
            Swal.fire("Error", "Could not fetch employee details.", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeByBirthday = async () => {
        try {
            setLoading(true);

            if (!birthDate) {
                Swal.fire("Missing Input", "Please enter a valid birth date.", "warning");
                return;
            }

            const date = new Date(birthDate);
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();

            const q = query(collection(db, "employee"));
            const querySnapshot = await getDocs(q);

            const matches = querySnapshot.docs.filter(doc => {
                const data = doc.data();
                if (!data.birthday) return false;

                const birthday = typeof data.birthday === "string"
                    ? new Date(data.birthday)
                    : new Date(data.birthday.seconds * 1000);

                return (
                    birthday.getDate() === day &&
                    birthday.getMonth() + 1 === month &&
                    birthday.getFullYear() === year
                );
            });

            if (matches.length > 0) {
                setEmployees(matches.map(doc => doc.data()));
                setScanned(true);
                setErrorMessage("");
            } else {
                setEmployees([]);
                setErrorMessage("No employees found with that birthday.");
            }
        } catch (error) {
            console.error("Error fetching by birthday:", error);
            Swal.fire("Error", "Could not fetch employee details.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleScanClick = () => {
        setEmployee(null);
        setErrorMessage("");
        setScannerRequested(true);
        handledRef.current = false; // allow next scan to be processed
    };





    const handleManualSubmit = async () => {
        if (searchType === "id" && !employeeId.trim()) {
            Swal.fire("Missing ID", "Please enter a valid Registration ID.", "warning");
            return;
        }
        if (searchType === "name" && (!firstname.trim() || !surname.trim())) {
            Swal.fire("Missing Name", "Please enter both first and last name.", "warning");
            return;
        }
        if (searchType === "birthday" && !birthDate) {
            Swal.fire("Missing Birthday", "Please enter birthday.", "warning");
            return;
        }

        if (searchType === "id") {
            await fetchEmployeeById(employeeId.trim());
        } else if (searchType === "name") {
            await fetchEmployeeByName();
        } else if (searchType === "birthday") {
            await fetchEmployeeByBirthday();
        }
    };


    const handleReset = () => {
        setEmployeeId("");
        setFirstname("");
        setSurname("");
        setEmployees([]);
        setEmployee(null);   // ✅ clear single employee result
        setBirthDate("");
        setScanned(false);
        setScannerRequested(false);
        setErrorMessage("");
        if (qrScannerRef.current) {
            qrScannerRef.current.stop();
            qrScannerRef.current = null;
        }
    };


    const formatBirthday = (birthday) => {
        if (!birthday) return "No Birthday";
        try {
            const dateObj =
                typeof birthday === "string"
                    ? new Date(birthday)
                    : new Date(birthday.seconds * 1000);
            return dateObj.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch (e) {
            return "Invalid Date";
        }
    };

    return (
        <Container fluid>
            <AppNavBar bg="dark" variant="dark" title="Left Appbar" />
            <Container className="my-5 p-4">
                <Row className="mb-3">
                    <Col className="text-center">
                        <p id="toppage" className="barabara-label">APPLICATION STATUS CHECKER</p>
                        <p className="text-muted">Scan QR Code or Enter REGISTRATION ID / Name / Birthday</p>
                    </Col>
                </Row>

                <Row className="justify-content-center g-3 mb-4 p-0">
                    <Col lg={8} md={12} sm={12} xs={12}>
                        <Row className="justify-content-center g-3 mb-4">
                            {/* Scan QR Card */}
                            <Col xs={12} sm={6} md={3}>
                                <Card
                                    className={`text-center shadow-sm h-100 ${searchType === "scan" ? "border-primary" : ""}`}
                                    role="button"
                                    onClick={() => {
                                        // Always reset first
                                        handleReset();
                                        setSearchType("scan");
                                        setScannerRequested(true); // Always re-activate camera
                                        handledRef.current = false; // Allow scan again
                                    }}
                                >
                                    <Card.Body>
                                        <Card.Title>📷 Scan QR Code</Card.Title>
                                        <Card.Text>Use your camera to scan an employee QR</Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Search by ID */}
                            <Col xs={12} sm={6} md={3}>
                                <Card
                                    className={`text-center shadow-sm h-100 ${searchType === "id" ? "border-primary" : ""}`}
                                    role="button"
                                    onClick={() => {
                                        handleReset(); // Close camera + reset results
                                        setSearchType("id");
                                    }}
                                >
                                    <Card.Body>
                                        <Card.Title>🆔 Search by ID</Card.Title>
                                        <Card.Text>Find employee using registration ID</Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Search by Name */}
                            <Col xs={12} sm={6} md={3}>
                                <Card
                                    className={`text-center shadow-sm h-100 ${searchType === "name" ? "border-primary" : ""}`}
                                    role="button"
                                    onClick={() => {
                                        handleReset(); // Close camera + reset results
                                        setSearchType("name");
                                    }}
                                >
                                    <Card.Body>
                                        <Card.Title>👤 Search by Name</Card.Title>
                                        <Card.Text>Find employee using first & last name</Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Search by Birthday */}
                            <Col xs={12} sm={6} md={3}>
                                <Card
                                    className={`text-center shadow-sm h-100 ${searchType === "birthday" ? "border-primary" : ""}`}
                                    role="button"
                                    onClick={() => {
                                        handleReset(); // Close camera + reset results
                                        setSearchType("birthday");
                                    }}
                                >
                                    <Card.Body>
                                        <Card.Title>🎂 Search by Birthday</Card.Title>
                                        <Card.Text>Find employee using their date of birth</Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>



                        </Row>
                    </Col>
                </Row>



                {searchType === "id" && (
                    <InputGroup className="mb-3 justify-content-center" style={{ maxWidth: '550px', margin: '0 auto' }}>
                        <Form.Control
                            type="text"
                            placeholder="Enter Registration ID"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                        />
                        <Button variant="secondary" onClick={handleManualSubmit}>Check</Button>
                    </InputGroup>
                )}
                {searchType === "birthday" && (
                    <div className="mb-3" style={{ maxWidth: '550px', margin: '0 auto' }}>
                        <InputGroup className="mb-2">
                            <Form.Control
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                max={new Date().toISOString().split("T")[0]} // Optional: prevent future dates
                            />
                            <Button variant="secondary" onClick={handleManualSubmit}>Check</Button>
                        </InputGroup>
                    </div>
                )}


                {searchType === "name" && (
                    <div className="mb-3" style={{ maxWidth: '550px', margin: '0 auto' }}>
                        <InputGroup className="mb-2">
                            <Form.Control
                                type="text"
                                placeholder="Firstname"
                                value={firstname}
                                onChange={(e) => setFirstname(e.target.value)}
                            />
                            <Form.Control
                                type="text"
                                placeholder="Surname"
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                            />
                            <Button variant="secondary" onClick={handleManualSubmit}>Check</Button>
                        </InputGroup>
                    </div>
                )}


                {scannerRequested && (
                    <Row className="justify-content-center mb-3">
                        <Col xs={12} md={12} className="text-center">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-100 h-100 mb-2"
                                videoConstraints={{
                                    facingMode: "environment" // mobile back camera, laptop picks default
                                }}
                                onUserMedia={() => console.log("Webcam access granted")}
                                onUserMediaError={(err) => console.error("Webcam error:", err)}
                            />
                        </Col>
                    </Row>
                )}


                <Row className="justify-content-center">
                    <Col xs={12} md={6} className="text-center">
                        {loading && <Spinner animation="border" />}
                        {errorMessage && <p className="text-danger mt-3">{errorMessage}</p>}
                        {employees.length > 1 && (
                            <p className="text-muted">{employees.length} matching employees found</p>
                        )}

                        {/* MULTIPLE EMPLOYEES */}
                        {employees.length > 0 && employees.map((emp, index) => (
                            <div key={index} className="mt-4 border p-3 rounded mb-5">
                                <h4>{emp.firstname || "No Name"} {emp.middlename || ""} {emp.surname || ""}</h4>
                                <p><strong>Registration Id:</strong> {emp.employeeId}</p>
                                <p><strong>Designation:</strong> {emp.designation || "N/A"}</p>
                                <p><strong>Birthday:</strong> {formatBirthday(emp.birthday)}</p>
                                <p><strong>Company:</strong> —</p>
                                <p><strong>Status:</strong> <Badge bg={getStatusBadgeVariant(emp.status)}>{emp.status}</Badge></p>

                                {emp.status_history?.length > 0 && (
                                    <div className="mt-3">
                                        <p><strong>Status History:</strong></p>
                                        <table className="table table-bordered table-striped small">
                                            <thead>
                                                <tr>
                                                    <th>Status</th>
                                                    <th>Remarks</th>
                                                    <th>Date Updated</th>
                                                    <th>Updated By</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {emp.status_history.map((entry, idx) => (
                                                    <tr key={idx}>
                                                        <td>{entry.status}</td>
                                                        <td>{entry.remarks}</td>
                                                        <td>{new Date(entry.date_updated).toLocaleString()}</td>
                                                        <td>{entry.userId}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {emp?.status === "approved" && emp.tourism_certificate_ids?.length > 0 && (
                                    <div className="d-flex justify-content-center align-items-center gap-2 mt-3 mb-2">
                                        <Form.Select
                                            style={{ maxWidth: "300px" }}
                                            value={selectedCertId}
                                            onChange={(e) => setSelectedCertId(e.target.value)}
                                        >
                                            <option value="">Select Tourism Certificate ID</option>
                                            {emp.tourism_certificate_ids.map((id, idx) => (
                                                <option key={idx} value={id}>{id}</option>
                                            ))}
                                        </Form.Select>
                                        <Button variant="success" disabled={!selectedCertId} onClick={handleViewCert}>View Tourism Cert</Button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* SINGLE EMPLOYEE */}
                        {employee && (
                            <div className="mt-4 border p-3 rounded mb-5">
                                <h4>{employee.firstname || "No Name"} {employee.middlename || ""} {employee.surname || ""}</h4>
                                <p><strong>Registration Id:</strong> {employee.employeeId}</p>
                                <p><strong>Designation:</strong> {employee.designation || "N/A"}</p>
                                <p><strong>Birthday:</strong> {formatBirthday(employee.birthday)}</p>
                                <p><strong>Company:</strong> {companyInfo?.name || "Loading..."}</p>
                                <p><strong>Status:</strong> <Badge bg={getStatusBadgeVariant(employee.status)}>{employee.status}</Badge></p>

                                {employee.status_history?.length > 0 && (
                                    <div className="mt-3">
                                        <p><strong>Status History:</strong></p>
                                        <table className="table table-bordered table-striped small">
                                            <thead>
                                                <tr>
                                                    <th>Status</th>
                                                    <th>Remarks</th>
                                                    <th>Date Updated</th>
                                                    <th>Updated By</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employee.status_history.map((entry, idx) => (
                                                    <tr key={idx}>
                                                        <td>{entry.status}</td>
                                                        <td>{entry.remarks}</td>
                                                        <td>{new Date(entry.date_updated).toLocaleString()}</td>
                                                        <td>{entry.userId}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {employee?.status === "approved" && employee.tourism_certificate_ids?.length > 0 && (
                                    <div className="d-flex justify-content-center align-items-center gap-2 mt-3 mb-2">
                                        <Form.Select
                                            style={{ maxWidth: "300px" }}
                                            value={selectedCertId}
                                            onChange={(e) => setSelectedCertId(e.target.value)}
                                        >
                                            <option value="">Select Tourism Certificate ID</option>
                                            {employee.tourism_certificate_ids.map((id, idx) => (
                                                <option key={idx} value={id}>{id}</option>
                                            ))}
                                        </Form.Select>
                                        <Button variant="success" disabled={!selectedCertId} onClick={handleViewCert}>View Tourism Cert</Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </Col>
                    <div className="my-5" >
                    </div>
                    <FooterCustomized scrollToId="toppage"/>

                </Row>

            </Container>
        </Container>
    );
};

export default EmployeeQRScannerPage;
