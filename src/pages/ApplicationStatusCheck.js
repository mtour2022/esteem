import React, { useEffect, useState, useRef } from "react";
import { Container, Row, Col, Button, Spinner, Form, Badge, InputGroup } from "react-bootstrap";
import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { Html5Qrcode } from "html5-qrcode";
import Swal from "sweetalert2";
import useCompanyInfo from "../services/GetCompanyDetails"; // <-- import hook
import { useNavigate } from "react-router-dom";



const STATUSES = ["under review", "approved", "incomplete", "resigned", "change company", "invalid"];

const EmployeeQRScannerPage = () => {
    const [employeeId, setEmployeeId] = useState("");
    const [employee, setEmployee] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [scannerRequested, setScannerRequested] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const html5QrCodeRef = useRef(null);
    // inside your component
    const navigate = useNavigate();
    const [selectedCertId, setSelectedCertId] = useState("");

    const handleViewCert = () => {
        if (selectedCertId) {
            window.open(`/tourism-certificate/${selectedCertId}`, '_blank');
        }
    };

    const companyInfo = useCompanyInfo(employee?.companyId); // <-- use hook with companyId
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
    const fetchEmployee = async (docId) => {
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

    const handleScanClick = async () => {
        try {
            setEmployee(null);
            setErrorMessage("");
            setScannerRequested(true);
            const hasPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            const devices = await Html5Qrcode.getCameras();
            if (devices.length === 0) {
                Swal.fire("No camera found", "Camera not detected on this device.", "error");
                return;
            }

            const config = { fps: 10, qrbox: 250 };
            const scanner = new Html5Qrcode("reader");
            html5QrCodeRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                config,
                async (decodedText) => {
                    if (!scanned && decodedText.trim() !== employeeId) {
                        setEmployeeId(decodedText.trim());
                        await fetchEmployee(decodedText.trim());
                        scanner.stop().catch(console.warn);
                    }
                },
                (errorMessage) => {
                    console.debug("QR scan error:", errorMessage);
                }
            );
        } catch (error) {
            console.error("QR scan init error:", error);
            Swal.fire("Camera error", "Unable to access the camera.", "error");
        }
    };

    const handleReset = () => {
        setEmployeeId("");
        setEmployee(null);
        setScanned(false);
        setScannerRequested(false);
        setErrorMessage("");
        if (html5QrCodeRef.current) {
            html5QrCodeRef.current.stop().catch(console.warn);
        }
    };

    const handleManualSubmit = async () => {
        if (!employeeId.trim()) {
            Swal.fire("Missing ID", "Please enter a valid Application ID.", "warning");
            return;
        }
        await fetchEmployee(employeeId.trim());
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
        <Container className="my-5">
            <Row className="mb-3">
                <Col className="text-center">
                              <p id="toppage" className="barabara-label">APPLICATION STATUS CHECKER</p>
                    <p className="text-muted">Scan QR Code or Enter Application ID</p>
                </Col>
            </Row>

            <Row className="justify-content-center mb-3">
                <Col xs="auto">
                    <Button onClick={handleScanClick} disabled={scannerRequested}>
                        {scannerRequested ? "Scanning..." : "Start Scanning"}
                    </Button>
                </Col>
            </Row>

            <InputGroup className="mb-3 justify-content-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Form.Control
                    type="text"
                    placeholder="Enter Application ID"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                />
                <Button variant="secondary" onClick={handleManualSubmit}>
                    Check
                </Button>
            </InputGroup>


            {scannerRequested && (
                <Row className="justify-content-center mb-3">
                    <Col xs={12} md={6}>
                        <div id="reader" style={{ width: "100%" }} />
                    </Col>
                </Row>
            )}

            <Row className="justify-content-center">
                <Col xs={12} md={6} className="text-center">
                    {loading && <Spinner animation="border" />}
                    {errorMessage && <p className="text-danger mt-3">{errorMessage}</p>}
                    {employee && (
                        <div className="mt-4 border p-3 rounded">
                            <h4>
                                {employee.firstname || "No Name"}{" "}
                                {employee.middlename || ""}{" "}
                                {employee.surname || ""}
                            </h4>
                            <p><strong>Designation:</strong> {employee.designation || "N/A"}</p>
                            <p><strong>Birthday:</strong> {formatBirthday(employee.birthday)}</p>
                            <p><strong>Company:</strong> {companyInfo?.name || "Loading..."}</p>
                            <p><strong>Status:</strong> <Badge bg={getStatusBadgeVariant(employee.status)}>{employee.status}</Badge></p>
                            {employee?.status_history?.length > 0 && (
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

                        </div>
                    )}



                    {employee?.status === "approved" && employee.tourism_certificate_ids?.length > 0 && (
                        <div className="d-flex justify-content-center align-items-center gap-2 mt-3 mb-5">
                            <Form.Select
                                style={{ maxWidth: "300px" }}
                                value={selectedCertId}
                                onChange={(e) => setSelectedCertId(e.target.value)}
                            >
                                <option value="">Select Tourism Certificate ID</option>
                                {employee.tourism_certificate_ids.map((id, idx) => (
                                    <option key={idx} value={id}>
                                        {id}
                                    </option>
                                ))}
                            </Form.Select>

                            <Button
                                variant="success"
                                disabled={!selectedCertId}
                                onClick={handleViewCert}
                            >
                                View Tourism Cert
                            </Button>
                        </div>
                    )}
                    {(employee || errorMessage) && (
                        <div className="d-flex justify-content-center mt-3">
                            <Button variant="secondary" onClick={handleReset}>Reset</Button>
                        </div>
                    )}



                </Col>
            </Row>
        </Container>
    );
};

export default EmployeeQRScannerPage;
