import React, { useState } from "react";
import { Container, Row, Col, Card, ListGroup } from "react-bootstrap";
import AppNavBar from "../components/AppNavBar";
import FooterCustomized from "../components/Footer";

export default function RequirementsPage() {
    const [dataView, setDataView] = useState("employee"); // employee | company | all
    const [employeeType, setEmployeeType] = useState("local"); // local | foreign
    const [registrationMode, setRegistrationMode] = useState("new"); // new | renewal

    // Centralized requirements list
    const requirements = [
        {
            text: "Training Certificate from DOT/LGU (FBSE/COMMUNITY TOUR GUIDING)",
            type: "all",
            optionalForForeign: true, // becomes optional if foreign
        },
        {
            text: "Notarized Certificate of Employment / Contract of Service / Endorsement",
            type: "local",
        },
        {
            text: "Notarized Certificate of Employment / Contract of Service (Foreign only) / Endorsement",
            type: "foreign",
        },
        {
            text: "Diploma/Transcript/Certificate of Completion (For new only)",
            type: "all",
            newOnly: true, // only for new registrations
        },
        {
            text: "Special Working Permit (e.g. AEP/9G/DOLE) (Foreign applicant)",
            type: "foreign",
        },
        { text: "Passport Number (Foreign applicant)", type: "foreign" },
        { text: "Profile Photo (for employee)", type: "all" },
    ];

    // Apply filtering rules
    let filteredRequirements = requirements.filter((req) => {
        if (req.type !== "all" && req.type !== employeeType) return false;
        if (registrationMode === "renewal" && req.newOnly) return false;
        return true;
    });

    // Remove diploma if foreign + new
    if (employeeType === "foreign" && registrationMode === "new") {
        filteredRequirements = filteredRequirements.filter(
            (req) => !req.text.includes("Diploma/Transcript/Certificate of Completion")
        );
    }

    return (
        <Container fluid>
            <AppNavBar bg="dark" variant="dark" title="Right Appbar" />

            {/* Page Header */}
            <h3 className="mb-4 text-primary fw-bold">Account Creation</h3>
            {/* Data View Options (Employees / Company) */}
            <Row className="justify-content-center align-items-center g-2 mb-4">
                <Col lg={8} md={8} sm={12} xs={12}>
                    <Row className="g-2 mb-4">
                        <Col xs={6}>
                            <Card
                                className={`text-center selectable-card ${dataView === "employee" ? "border-primary bg-light" : "border"
                                    }`}
                                onClick={() => setDataView("employee")}
                                style={{ cursor: "pointer" }}
                            >
                                <Card.Body className="py-2">
                                    <small
                                        className={
                                            dataView === "employee" ? "text-dark" : "text-secondary"
                                        }
                                    >
                                        Employees
                                    </small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6}>
                            <Card
                                className={`text-center selectable-card ${dataView === "company" ? "border-primary bg-light" : "border"
                                    }`}
                                onClick={() => setDataView("company")}
                                style={{ cursor: "pointer" }}
                            >
                                <Card.Body className="py-2">
                                    <small
                                        className={
                                            dataView === "company" ? "text-dark" : "text-secondary"
                                        }
                                    >
                                        Company
                                    </small>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Employee options */}
                    {dataView === "employee" && (
                        <>
                            {/* Local vs Foreign */}
                            <Row className="g-2 mb-3">
                                <Col xs={6}>
                                    <Card
                                        className={`text-center ${employeeType === "local" ? "border-info bg-light" : "border"
                                            }`}
                                        onClick={() => setEmployeeType("local")}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <Card.Body className="py-2">
                                            <small
                                                className={
                                                    employeeType === "local" ? "text-dark" : "text-secondary"
                                                }
                                            >
                                                Local Employee
                                            </small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col xs={6}>
                                    <Card
                                        className={`text-center ${employeeType === "foreign" ? "border-info bg-light" : "border"
                                            }`}
                                        onClick={() => setEmployeeType("foreign")}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <Card.Body className="py-2">
                                            <small
                                                className={
                                                    employeeType === "foreign" ? "text-dark" : "text-secondary"
                                                }
                                            >
                                                Foreign Employee
                                            </small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* New vs Renewal */}
                            <Row className="g-2 mb-4">
                                <Col xs={6}>
                                    <Card
                                        className={`text-center ${registrationMode === "new"
                                                ? "border-success bg-light"
                                                : "border"
                                            }`}
                                        onClick={() => setRegistrationMode("new")}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <Card.Body className="py-2">
                                            <small
                                                className={
                                                    registrationMode === "new"
                                                        ? "text-dark"
                                                        : "text-secondary"
                                                }
                                            >
                                                New
                                            </small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col xs={6}>
                                    <Card
                                        className={`text-center ${registrationMode === "renewal"
                                                ? "border-success bg-light"
                                                : "border"
                                            }`}
                                        onClick={() => setRegistrationMode("renewal")}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <Card.Body className="py-2">
                                            <small
                                                className={
                                                    registrationMode === "renewal"
                                                        ? "text-dark"
                                                        : "text-secondary"
                                                }
                                            >
                                                Renewal
                                            </small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}
                </Col>
            </Row>




            {/* Content Wrapper */}
            <Row className="justify-content-center">
                <Col xs={12} lg={9}>
                    {/* Company view */}
                    {dataView === "company" && (
                        <Card className="mb-4 shadow-sm">
                            <Card.Body>
                                <p className="barabara-label">COMPANY ACCOUNT CREATION</p>
                                <p className="sub-title-blue">
                                    Prepare your <b>requirements</b> and <b>register</b> now to
                                    enjoy the perks of having an electronic system for tracking,
                                    evaluating, and expert monitoring of tour activities in
                                    Boracay Island, Malay, Aklan!
                                </p>

                                <h6>📄 Documents Needed:</h6>
                                <ul>
                                    <li>
                                        Business Permit or LGU Accreditation from the SB Office
                                    </li>
                                    <li>Company Official Logo</li>
                                </ul>

                                <h6>📝 Information Needed:</h6>
                                <ul>
                                    <li>Business Name (Registered under DTI)</li>
                                    <li>Year Established</li>
                                    <li>Company Type (Local or Foreign)</li>
                                    <li>Proprietor/President's Name</li>
                                    <li>Local Office Address</li>
                                    <li>Company Email Address</li>
                                    <li>Company Contact Number</li>
                                </ul>

                                <div className="mb-3 p-3 border-start border-4 border-warning bg-light rounded">
                                    <strong className="text-danger">Important Reminder:</strong>
                                    <br />
                                    Only tourism enterprises within the{" "}
                                    <strong>Municipality of Malay</strong> are allowed to
                                    register. Businesses from outside the municipality must have a
                                    local office within Malay or a partnership with a local
                                    enterprise in order to operate.
                                    <br />
                                    <br />
                                    After submitting your registration, please wait up to{" "}
                                    <strong>24 hours</strong> for verification. Kindly note that
                                    registrations submitted during <strong>weekends</strong> may
                                    experience delays.
                                    <br />
                                    <br />
                                    Once validated, an email will be sent to your{" "}
                                    <strong>company email address</strong> with instructions.
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Employee view */}
                    {dataView === "employee" && (
                        <Card className="mb-4 shadow-sm">
                            <Card.Body>
                                <p className="barabara-label">
                                    {employeeType === "local"
                                        ? "LOCAL EMPLOYEE ACCOUNT CREATION"
                                        : "FOREIGN EMPLOYEE ACCOUNT CREATION"}
                                </p>
                                <p className="sub-title-blue">
                                    Prepare your <b>requirements</b> and <b>register</b> now to
                                    enjoy the perks of having an electronic system for tracking,
                                    evaluating, and expert monitoring of tour activities in
                                    Boracay Island, Malay, Aklan!
                                </p>

                                <h6>📄 Documents to Upload:</h6>
                                <ListGroup className="mb-3">
                                    {filteredRequirements.map((req, index) => (
                                        <ListGroup.Item key={index}>
                                            {req.text}
                                            {employeeType === "foreign" &&
                                                req.optionalForForeign && (
                                                    <span className="text-muted"> (Optional)</span>
                                                )}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>

                                <h6>📝 Required Information:</h6>
                                <ul>
                                    <li>Employee Classification & Designation</li>
                                    <li>Unit ID/Control Number</li>
                                    <li>Unit Owner (Full Name)</li>
                                    <li>
                                        Full Name (First, Middle, Last, Suffix)
                                    </li>
                                    <li>Type of Residency (Local or Foreign)</li>
                                    <li>Birth Place and Birthday</li>
                                    <li>Present Address</li>
                                    <li>
                                        Sex, Age, Marital Status, Height, Weight
                                    </li>
                                    <li>Educational Attainment</li>
                                    <li>Emergency Contact Name and Number</li>
                                </ul>

                                <div className="mb-3 p-3 border-start border-4 border-warning bg-light rounded">
                                    <strong className="text-danger">Important Reminder:</strong>
                                    <br />
                                    Only tourism enterprises within the{" "}
                                    <strong>Municipality of Malay</strong> are allowed to
                                    register. Businesses from outside the municipality must have a
                                    local office within Malay or a partnership with a local
                                    enterprise in order to operate.
                                    <br />
                                    <br />
                                    After submitting your registration, please wait up to{" "}
                                    <strong>24 hours</strong> for verification. Registrations
                                    submitted during <strong>weekends</strong> may experience
                                    delays.
                                    <br />
                                    <br />
                                    Once validated, you will receive an email at your{" "}
                                    <strong>company email address</strong> with next steps.
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    {/* All view */}
                    {dataView === "all" && (
                        <Card className="mb-4 shadow-sm">
                            <Card.Body>
                                <p className="barabara-label">ALL REGISTRATION TYPES</p>
                                <p className="sub-title-blue">
                                    View requirements for <b>both Companies and Employees</b>{" "}
                                    below.
                                </p>
                                <p className="text-muted small">
                                    Please select either <b>Company</b> or <b>Employees</b> above
                                    for more detailed instructions.
                                </p>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>

            <FooterCustomized scrollToId="toppage" />
        </Container>
    );
}
