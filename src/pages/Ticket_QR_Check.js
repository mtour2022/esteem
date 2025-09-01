import { useState, useEffect, useRef } from "react";
import QrScanner from "qr-scanner";
import Webcam from "react-webcam";
import Swal from "sweetalert2";
import { doc, getDoc, collection, query, where, getDocs, documentId } from "firebase/firestore";
import { db } from "../config/firebase";
import TicketModel from "../classes/tickets";
import UpdateTicketToCloud from "../components/UpdateTickets";
import { Form, Container, Row, Col, Button, Card, InputGroup } from 'react-bootstrap';
import Select from "react-select";
import TicketAddressForm from '../components/TicketAddressForm';
import UpdateTicketActivitiesForm from '../components/UpdateTicketActivitiesForm';
import TicketSummary from '../components/TicketSummary';
import { useAuth } from '../auth/authentication';
import Company from '../classes/company';
import VerifierModel from "../classes/verifiers"; // your VerifierModel

export default function TicketQRScanner() {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const { currentUser } = useAuth();
    const [verifier, setVerifier] = useState(null);


    // QR scanning
    const [scannerRequested, setScannerRequested] = useState(false);
    const [searchType, setSearchType] = useState("manual"); // manual | scan | id
    const webcamRef = useRef(null);
    const qrScannerRef = useRef(null);
    const handledRef = useRef(false);

    // Company and employees
    const [company, setCompany] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Ticket form states
    const [ticketData, setTicketData] = useState(new TicketModel({}));
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [savedTicket, setSavedTicket] = useState(null);
    const totalSteps = 3;

    const nextStep = () => setCurrentStep((prev) => prev + 1);
    const prevStep = () => setCurrentStep((prev) => prev - 1);

    const fetchEmployeesByIds = async (ids) => {
        if (!ids || ids.length === 0) return [];
        const batches = [];
        for (let i = 0; i < ids.length; i += 10) {
            const chunk = ids.slice(i, i + 10);
            const q = query(collection(db, "employee"), where(documentId(), "in", chunk));
            batches.push(getDocs(q));
        }
        const results = await Promise.all(batches);
        return results.flatMap(snapshot =>
            snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        );
    };

    // Fetch company and employees
    useEffect(() => {
        const fetchticketData = async () => {
            if (!currentUser?.uid) return;
            try {
                const q = query(collection(db, "company"), where("userUID", "==", currentUser.uid));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const companyData = querySnapshot.docs[0].data();
                    const companyInstance = new Company(companyData);
                    setCompany(companyInstance);

                    if (companyInstance.employee && Array.isArray(companyInstance.employee)) {
                        const employeeData = await fetchEmployeesByIds(companyInstance.employee);
                        setEmployees(employeeData);
                        console.log("EMPLOYEES:", employeeData);
                    }
                } else {
                    console.warn("No company document found with this UID");
                }
            } catch (error) {
                console.error("Error fetching company data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchticketData();
    }, [currentUser]);
useEffect(() => {
  if (scannerRequested && webcamRef.current?.video) {
    const initScanner = async () => {
      try {
        // 🔹 Try to get the list of cameras
        const cameras = await QrScanner.listCameras(true);

        // Default to "environment" if found, else fallback to first available
        let preferredCamera = "environment";
        if (cameras.length > 0) {
          const backCam = cameras.find(c => 
            c.label.toLowerCase().includes("back") || 
            c.label.toLowerCase().includes("environment")
          );
          preferredCamera = backCam ? backCam.id : cameras[0].id;
        }

        const scanner = new QrScanner(
          webcamRef.current.video,
          async (result) => {
            if (handledRef.current) return;
            if (result?.data) {
              handledRef.current = true;
              try {
                const parts = result.data.trim().split("/").filter(Boolean);
                const scannedTicketId = parts[parts.length - 1];

                if (!scannedTicketId) {
                  Swal.fire("Invalid QR", "No valid Ticket ID found.", "error");
                  return;
                }

                const q = query(collection(db, "tickets"), where("ticket_id", "==", scannedTicketId));
                const snap = await getDocs(q);

                if (!snap.empty) {
                  const ticketDoc = snap.docs[0].data();
                  setTicketData(new TicketModel(ticketDoc));

                  if (ticketDoc.employee_id) {
                    const empData = await fetchEmployeeById(ticketDoc.employee_id);
                    if (empData) {
                      setSelectedEmployee(empData);
                      setEmployees(prev => {
                        const exists = prev.some(e => e.employeeId === empData.employeeId);
                        return exists ? prev : [...prev, empData];
                      });
                    }
                  }

                  Swal.fire("Ticket Loaded", "Ticket data loaded into form.", "success");
                  setCurrentStep(1);
                } else {
                  Swal.fire("Not Found", "No ticket found with that ID.", "warning");
                }

                scanner.stop();
                qrScannerRef.current = null;
                setScannerRequested(false);
              } catch (err) {
                console.error("Error fetching ticket:", err);
                Swal.fire("Error", "Failed to fetch ticket data.", "error");
                setScannerRequested(false);
              }
            }
          },
          {
            highlightScanRegion: true,
            preferredCamera, // 👈 will be actual camera id
          }
        );

        qrScannerRef.current = scanner;
        scanner.start().catch((err) => {
          console.error("Camera start error:", err);
          Swal.fire("Camera error", "Unable to access the camera.", "error");
          setScannerRequested(false);
        });
      } catch (err) {
        console.error("Error initializing scanner:", err);
        Swal.fire("Error", "Failed to initialize scanner.", "error");
        setScannerRequested(false);
      }
    };

    initScanner();

    return () => {
      try {
        if (qrScannerRef.current && typeof qrScannerRef.current.stop === "function") {
          const stopResult = qrScannerRef.current.stop();
          if (stopResult instanceof Promise) stopResult.catch(() => {});
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
        const fetchVerifier = async () => {
            if (!currentUser?.uid) return;
            try {
                const q = query(
                    collection(db, "verifier"),
                    where("userUID", "==", currentUser.uid)
                );
                const snap = await getDocs(q);

                if (!snap.empty) {
                    const verifierData = snap.docs[0].data();
                    setVerifier(new VerifierModel(verifierData));
                }
            } catch (err) {
                console.error("Error fetching verifier data:", err);
            }
        };

        fetchVerifier();
    }, [currentUser]);

    const fetchEmployeeById = async (employeeId) => {
        if (!employeeId) return null;
        try {
            const empRef = doc(db, "employee", employeeId);
            const empSnap = await getDoc(empRef);
            if (empSnap.exists()) {
                return { id: empSnap.id, ...empSnap.data() };
            }
        } catch (err) {
            console.error("Error fetching employee:", err);
        }
        return null;
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setTicketData((prevData) => {
            const newData = { ...prevData };
            if (name.startsWith("proprietor.")) {
                const key = name.split(".")[1];
                newData.proprietor = { ...prevData.proprietor, [key]: value };
            } else if (name.startsWith("address.")) {
                const key = name.split(".")[1];
                newData.address = { ...prevData.address, [key]: value };
            } else {
                newData[name] = value;
            }
            return new TicketModel(newData);
        });
    };

    const handleResetScanner = () => {
        setScannerRequested(false);
        handledRef.current = false;
        if (qrScannerRef.current) {
            qrScannerRef.current.stop();
            qrScannerRef.current = null;
        }
    };

    const isStep3FormValid = () => {
        return (
            ticketData.name?.trim() &&
            ticketData.accommodation?.trim() &&
            ticketData.employee_id &&
            Array.isArray(ticketData.address) &&
            ticketData.address.length > 0 &&
            Array.isArray(ticketData.activities) &&
            ticketData.activities.length > 0
        );
    };

    const handleManualSubmit = async () => {
        if (!ticketData.ticket_id?.trim()) {
            Swal.fire("Missing ID", "Please enter a Ticket ID.", "warning");
            return;
        }

        try {
            const q = query(
                collection(db, "tickets"),
                where("ticket_id", "==", ticketData.ticket_id.trim())
            );
            const snap = await getDocs(q);

            if (!snap.empty) {
                const ticketDoc = snap.docs[0].data();
                setTicketData(new TicketModel(ticketDoc));

                if (ticketDoc.employee_id) {
                    const empData = await fetchEmployeeById(ticketDoc.employee_id);
                    if (empData) {
                        setSelectedEmployee(empData);
                        setEmployees((prev) => {
                            const exists = prev.some((e) => e.employeeId === empData.employeeId);
                            return exists ? prev : [...prev, empData];
                        });
                    }
                }

                Swal.fire("Ticket Loaded", "Ticket data loaded into form.", "success");
                setCurrentStep(1);
            } else {
                Swal.fire("Not Found", "No ticket found with that ID.", "warning");
            }
        } catch (err) {
            console.error("Error fetching ticket:", err);
            Swal.fire("Error", "Failed to fetch ticket data.", "error");
        }
    };


    return (
        <div>
            {/* Search Options */}
            <Row className="mb-3">
                <Col className="text-center">
                    <p id="toppage" className="barabara-label">TOURIST ACTIVITY TICKET SCANNER</p>
                    <p className="text-muted">Scan QR Code or Enter Ticket ID</p>
                </Col>
            </Row>
            <Row className="justify-content-center g-3 mb-4 p-0">
                <Col lg={9} md={12} sm={12} xs={12}>
                    <Row className="justify-content-center g-3 mb-4">
                        {/* Scan QR */}
                        <Col xs={12} sm={6} md={3}>
                            <Card
                                className={`text-center shadow-sm h-100 ${searchType === "scan" ? "border-primary" : ""}`}
                                role="button"
                                onClick={() => {
                                    handleResetScanner();
                                    setSearchType("scan");
                                    setScannerRequested(true);
                                }}
                            >
                                <Card.Body>
                                    <Card.Title>📷 Scan QR Code</Card.Title>
                                    <Card.Text>Use your camera to scan a tourism certificate QR</Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Search by ID */}
                        <Col xs={12} sm={6} md={3}>
                            <Card
                                className={`text-center shadow-sm h-100 ${searchType === "id" ? "border-primary" : ""}`}
                                role="button"
                                onClick={() => {
                                    handleResetScanner();
                                    setSearchType("id");
                                }}
                            >
                                <Card.Body>
                                    <Card.Title>🆔 Search by ID</Card.Title>
                                    <Card.Text>Find tourism certificate using ID</Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* QR Scanner */}
            {searchType === "scan" && (
                <div>
                    {!scannerRequested ? (
                        <Button
                            onClick={() => {
                                setScannerRequested(true);
                                setSearchType("scan");
                            }}
                        >
                            Start QR Scanner
                        </Button>
                    ) : (
                        <div>
                            <Webcam ref={webcamRef} style={{ width: "100%" }} />
                            <Button onClick={handleResetScanner}>Stop Scanner</Button>
                        </div>
                    )}
                </div>
            )}

            {searchType === "id" && (
                <InputGroup
                    className="mb-3 justify-content-center"
                    style={{ maxWidth: "550px", margin: "0 auto" }}
                >
                    <Form.Control
                        type="text"
                        placeholder="Enter Tourism Certificate ID"
                        value={ticketData.ticket_id || ""}
                        onChange={(e) =>
                            setTicketData((prev) => new TicketModel({
                                ...prev,
                                ticket_id: e.target.value
                            }))
                        }
                    />
                    <Button variant="secondary" onClick={handleManualSubmit}>
                        Check
                    </Button>
                </InputGroup>
            )}

            {/* Scan Logs Table */}
            {Array.isArray(ticketData.scan_logs) && ticketData.scan_logs.length > 0 && (
                <Container className="mb-4">
                    <p className="fw-bold">Scan Logs</p>
                    <table className="table table-bordered table-striped table-sm">
                        <thead className="table-light">
                            <tr>
                                <th>Date Updated</th>
                                <th>Status</th>
                                <th>Remarks</th>
                                <th>Verifier / User ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ticketData.scan_logs.map((log, index) => (
                                <tr key={index}>
                                    <td>{log.date_updated ? new Date(log.date_updated).toLocaleString() : "-"}</td>
                                    <td>{log.status || "-"}</td>
                                    <td>{log.remarks || "-"}</td>
                                    <td>{log.userId || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Container>
            )}





            {/* Main Form */}
            {!isFullScreen && ticketData?.ticket_id && (

                <Col md={12} className="p-0">
                    <Container className="container custom-container">
                        <Container className="body-container">
                            <Form className="custom-form mt-4">
                                <p className="barabara-label">TOURIST ACTIVITY FORM</p>
                                <p className="sub-title-blue">
                                    Fill-out this form to generate <strong>QR code</strong>. Accurate information is vital in ensuring safety, maintaining reliable records, generating tour activity reports, providing immediate response in case of emergency, investigating complaints, and optimizing overall service quality.
                                </p>

                                {/* Step 1 */}
                                {currentStep === 1 && (
                                    <>
                                        <Form.Group className="my-2">
                                            <Form.Label className="fw-bold mt-2">Representative's Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                placeholder="Business Name Registered Under DTI"
                                                value={ticketData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                        <Form.Group className="my-2">
                                            <Form.Label className="fw-bold mt-2">Contact Information (Optional)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="contact"
                                                placeholder="Email Address, Telephone, or Mobile Number"
                                                value={ticketData.contact}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                        <Form.Group className="my-2">
                                            <Form.Label className="fw-bold mt-2">Accommodation Establishment</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="accommodation"
                                                placeholder="Hotel/Resort where the guest is staying"
                                                value={ticketData.accommodation}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                        <Form.Group className="my-3">
                                            <Form.Label><strong>Assigned To</strong></Form.Label>
                                            <br />
                                            <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>
                                                Select designated employee to assist the guests.
                                            </Form.Label>
                                            <Select
                                                options={employees
                                                    .filter(emp =>
                                                        emp.status?.toLowerCase() === "approved" &&
                                                        emp.company_status?.toLowerCase() === "approved"
                                                    )
                                                    .map(emp => ({
                                                        value: emp.employeeId,
                                                        label: `${emp.firstname} ${emp.surname} — ${emp.designation || "No title"}`,
                                                        contact: emp.contact,
                                                        raw: emp
                                                    }))
                                                }
                                                placeholder="Select an employee"
                                                onChange={(selectedOption) => {
                                                    setTicketData(prev => ({
                                                        ...prev,
                                                        employee_id: selectedOption?.value || ""
                                                    }));
                                                    setSelectedEmployee(selectedOption ? selectedOption.raw : null);
                                                }}
                                                value={
                                                    employees
                                                        .filter(emp => emp.status?.toLowerCase() === "approved" && emp.company_status?.toLowerCase() === "approved")
                                                        .map(emp => ({
                                                            value: emp.employeeId,
                                                            label: `${emp.firstname} ${emp.surname} — ${emp.designation || "No title"}`,
                                                            contact: emp.contact,
                                                            raw: emp
                                                        }))
                                                        .find(option => option.value === ticketData.employee_id)
                                                    || (selectedEmployee ? {
                                                        value: selectedEmployee.employeeId,
                                                        label: `${selectedEmployee.firstname} ${selectedEmployee.surname} — ${selectedEmployee.designation || "No title"}`,
                                                        contact: selectedEmployee.contact,
                                                        raw: selectedEmployee
                                                    } : null)
                                                }
                                                isClearable
                                                isDisabled  // 🔹 Makes it read-only
                                            />

                                        </Form.Group>

                                        {selectedEmployee && (
                                            <Form.Group className="mt-2">
                                                <Form.Label>Assignee's Contact Information</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={selectedEmployee.contact || "No contact provided"}
                                                    readOnly
                                                />
                                            </Form.Group>
                                        )}
                                    </>
                                )}

                                {/* Step 2 */}
                                {currentStep === 2 && (
                                    <TicketAddressForm
                                        groupData={ticketData}
                                        setGroupData={setTicketData}
                                        ifForeign={true}
                                    />
                                )}

                                {/* Step 3 */}
                                {currentStep === 3 && (
                                    <UpdateTicketActivitiesForm
                                        groupData={ticketData}
                                        setGroupData={setTicketData}
                                    />
                                )}

                                {/* Verifier Info */}
                                {verifier && (
                                    <Container className="my-3">
                                        <Form.Group>
                                            <Form.Label className="fw-bold">Verifier Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={verifier.getFullName()}
                                                readOnly
                                            />
                                        </Form.Group>

                                        <Form.Group className="mt-2">
                                            <Form.Label className="fw-bold">Verifier Contact</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={verifier.designation || "No contact provided"}
                                                readOnly
                                            />
                                        </Form.Group>
                                    </Container>
                                )}


                                {/* Navigation */}
                                {/* Navigation */}
                                <Container className="d-flex justify-content-between mt-3">
                                    {currentStep > 1 && (
                                        <Button variant="secondary" onClick={prevStep}>
                                            Previous
                                        </Button>
                                    )}

                                    {currentStep < 3 ? (
                                        <Button
                                            className="color-blue-button"
                                            variant="primary"
                                            onClick={nextStep}
                                        >
                                            Next
                                        </Button>
                                    ) : (
                                        <UpdateTicketToCloud
                                            groupData={ticketData}
                                            setGroupData={setTicketData}
                                            currentUserUID={currentUser.uid}
                                            companyID={company?.company_id}
                                            onSuccess={() => {
                                                // Reset to initial state
                                                setSavedTicket(null);
                                                setTicketData(new TicketModel({})); // clear form data
                                                setSelectedEmployee(null);
                                                setCurrentStep(1);
                                                setSearchType("manual"); // hides scan/id UI
                                                handleResetScanner();
                                            }}
                                            disabled={!isStep3FormValid()}
                                        />


                                    )}
                                </Container>


                                {/* add here the Text field of the verifier name and contact using the currentUser Id in the /verifier collection */}
                                {/* Step Indicators */}
                                <Container className="d-flex justify-content-center my-1">
                                    {Array.from({ length: totalSteps }, (_, index) => (
                                        <span
                                            key={index}
                                            className={`mx-1 step-indicator ${currentStep === index + 1 ? "active" : ""}`}
                                        >
                                            ●
                                        </span>
                                    ))}
                                </Container>
                            </Form>
                        </Container>
                    </Container>
                </Col>
            )}
        </div>
    );
}
