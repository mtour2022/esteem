// src/pages/GeneralTFSummaryPage.js
import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Button, Badge, ButtonGroup, Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

import Employee from "../classes/employee";
import Company from "../classes/company";

// Components
import SummaryPieChart from "../components/PieChart";
import TopRankingChart from "../components/RankTable";
import TourismCertSummaryTable from "../components/SummaryMonthlyTable";
import CompanyCertSummaryTable from "../components/CompanySummaryTable"; // ⬅️ NEW IMPORT
import CertificateIssuanceForecastChart from "../components/TourismCertForecast";
import AppNavBar from "../components/AppNavBar";
import html2canvas from "html2canvas";
import FooterCustomized from "../components/Footer";

const GeneralTFSummaryPage = () => {
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [summary, setSummary] = useState({});
    const [companySummary, setCompanySummary] = useState({});
    const [statusCounts, setStatusCounts] = useState({});
    const [companyStatusCounts, setCompanyStatusCounts] = useState({});
    const [topCompanies, setTopCompanies] = useState([]);
    const [topDesignations, setTopDesignations] = useState([]);
    const [activeSearchText, setActiveSearchText] = useState("");
    const [dataView, setDataView] = useState("all"); // "all" | "employee" | "company"
    const summaryRef = useRef();

    /** Fetch employees + companies */
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Employees
                const empSnap = await getDocs(collection(db, "employee"));
                const empList = empSnap.docs.map(
                    (doc) => new Employee({ ...doc.data(), employeeId: doc.id })
                );
                setEmployees(empList);

                // Companies
                const compSnap = await getDocs(collection(db, "company"));
                const compList = compSnap.docs.map(
                    (doc) => new Company({ ...doc.data(), company_id: doc.id })
                );
                setCompanies(compList);
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };

        fetchData();
    }, []);

    /** Process employee + company summary data */
    useEffect(() => {
        if (employees.length) {
            // Employee status counts
            const statusCounter = {};
            employees.forEach((emp) => {
                const st = emp.status || "unknown";
                statusCounter[st] = (statusCounter[st] || 0) + 1;
            });
            setStatusCounts(statusCounter);

            // Employee summary breakdowns
            const sum = {
                new: employees.filter((e) => e.application_type === "new").length,
                renewal: employees.filter((e) => e.application_type === "renewal").length,
                nationalityBreakdown: [
                    {
                        name: "Filipino",
                        value: employees.filter((e) => e.nationality === "Filipino").length,
                    },
                    {
                        name: "Foreign",
                        value: employees.filter((e) => e.nationality !== "Filipino").length,
                    },
                ],
                males: employees.filter((e) => e.sex === "male").length,
                females: employees.filter((e) => e.sex === "female").length,
                preferNotToSay: employees.filter((e) => e.sex === "prefer_not_to_say").length,
                kids: employees.filter((e) => e.age && e.age <= 12).length,
                teens: employees.filter((e) => e.age && e.age >= 13 && e.age <= 19).length,
                adults: employees.filter((e) => e.age && e.age >= 20 && e.age <= 59).length,
                seniors: employees.filter((e) => e.age && e.age >= 60).length,
            };
            setSummary(sum);

            // Top companies by approved employees
            const companyCounts = {};
            employees.forEach((emp) => {
                if (emp.companyId)
                    companyCounts[emp.companyId] = (companyCounts[emp.companyId] || 0) + 1;
            });
            const sortedCompanies = Object.entries(companyCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([companyId, count]) => {
                    const comp = companies.find((c) => c.company_id === companyId);
                    return { name: comp?.name || "Unknown", value: count };
                });
            setTopCompanies(sortedCompanies);

            // Top designations
            const desigCounts = {};
            employees.forEach((emp) => {
                if (emp.designation)
                    desigCounts[emp.designation] = (desigCounts[emp.designation] || 0) + 1;
            });
            const sortedDesignations = Object.entries(desigCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([designation, count]) => ({ name: designation, value: count }));
            setTopDesignations(sortedDesignations);
        }

        if (companies.length) {
            // Company status counts
            const statusCounter = {};
            companies.forEach((comp) => {
                const st = comp.status || "unknown";
                statusCounter[st] = (statusCounter[st] || 0) + 1;
            });
            setCompanyStatusCounts(statusCounter);

            // Company summary
            const compSum = {
                classifications: {},
                ownerships: {},
            };
            companies.forEach((comp) => {
                if (comp.classification) {
                    compSum.classifications[comp.classification] =
                        (compSum.classifications[comp.classification] || 0) + 1;
                }
                if (comp.ownership) {
                    compSum.ownerships[comp.ownership] =
                        (compSum.ownerships[comp.ownership] || 0) + 1;
                }
            });
            setCompanySummary(compSum);
        }
    }, [employees, companies]);

    /** Download Report as Image */
    const handleDownloadImage = async () => {
        if (!summaryRef.current) return;
        const canvas = await html2canvas(summaryRef.current);
        const link = document.createElement("a");
        link.download = "tourism-frontliner-summary.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    const getStatusBadgeVariant = (status) => {
        switch (status.toLowerCase()) {
            case "approved":
                return "success";
            case "rejected":
                return "danger";
            case "under review":
                return "warning";
            default:
                return "secondary";
        }
    };

    // employees
    const filteredEmployees = employees;
    // companies
    const filteredCompanies = companies;

    return (
        <Container fluid>
            <AppNavBar bg="dark" variant="dark" title="Tourism Certificate QR Scanner" />

            <Row className="justify-content-center">
                <Col md={12}>
                    <div className="mt-2 table-border bg-white p-3" ref={summaryRef} id="toppage">
                        {/* Header */}

                        <div className="d-flex justify-content-between align-items-center mt-5">
                            <div>
                                <p className="barabara-label text-start mt-5">TOURISM FRONLINERS SUMMARY</p>
                                <p className="m-1 mt-3 text-muted small text-start mb-5">
                                    A summary of all registered tourism frontliners, showing the total count and status distribution.
                                </p>
                            </div>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={handleDownloadImage}
                            >
                                <FontAwesomeIcon icon={faDownload} />
                            </Button>
                        </div>

                        <div className="d-flex gap-2 mb-5">
                            <ButtonGroup>
                                <Button
                                    size="sm"
                                    variant={dataView === "all" ? "primary" : "outline-primary"}
                                    onClick={() => setDataView("all")}
                                >
                                    All
                                </Button>
                                <Button
                                    size="sm"
                                    variant={dataView === "employee" ? "primary" : "outline-primary"}
                                    onClick={() => setDataView("employee")}
                                >
                                    <span className="d-none d-sm-inline">Employees/Members Only</span>
                                    <span className="d-inline d-sm-none">Employees</span>
                                </Button>
                                <Button
                                    size="sm"
                                    variant={dataView === "company" ? "primary" : "outline-primary"}
                                    onClick={() => setDataView("company")}
                                >
                                    <span className="d-none d-sm-inline">Companies/People's Organizations Only</span>
                                    <span className="d-inline d-sm-none">Companies</span>
                                </Button>
                            </ButtonGroup>

                        </div>


                        {/* EMPLOYEE SUMMARY */}
                        {(dataView === "all" || dataView === "employee") && (
                            <>
                                <h6 className="mt-5 mb-3">Employee Summary</h6>
                                {/* Employee count card */}
                                <Card className="mb-3 border" style={{ borderColor: "#ced4da", borderWidth: "1px" }}>
                                    <Card.Body className="text-center py-2">
                                        <span className="text-muted">A total of</span>
                                        <br></br>
                                        <Badge bg="dark">
                                            <strong>{filteredEmployees.length}</strong>
                                        </Badge>
                                        <br></br>
                                        <span className="text-muted"> Tourism Frontliner(s)</span>
                                    </Card.Body>
                                </Card>

                                {/* STATUS COUNTS */}
                                <Row className="mb-3 g-3">
                                    {Object.entries(statusCounts).map(([status, count], idx) => (
                                        <Col key={idx} md={2}>
                                            <div className="summary-card border rounded bg-white text-muted p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center">
                                                <p className="mb-1 fw-semibold text-capitalize">{status}</p>
                                                <h6 className="mb-0 text-dark">
                                                    <Badge bg={getStatusBadgeVariant(status)}>{count}</Badge>
                                                </h6>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </>
                        )}

                        {/* COMPANY SUMMARY */}
                        {(dataView === "all" || dataView === "company") && (
                            <>
                                <h6 className="mt-5  mb-3">Company Summary</h6>

                                <Card className="mb-3 border" style={{ borderColor: "#ced4da", borderWidth: "1px" }}>
                                    <Card.Body className="text-center py-2">
                                        <span className="text-muted">A total of</span>
                                        <br></br>
                                        <Badge bg="dark">
                                            <strong>{filteredCompanies.length}</strong>
                                        </Badge>
                                        <br></br>
                                        <span className="text-muted"> Tourism Enterprise (s) (Companies/People's Org/Service Providers)</span>
                                    </Card.Body>
                                </Card>

                                {/* STATUS COUNTS */}
                                <Row className="mb-3 g-3">
                                    {Object.entries(companyStatusCounts).map(([status, count], idx) => (
                                        <Col key={idx} md={2}>
                                            <div className="summary-card border rounded bg-white text-muted p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center">
                                                <p className="mb-1 fw-semibold text-capitalize">{status}</p>
                                                <h6 className="mb-0 text-dark">
                                                    <Badge bg={getStatusBadgeVariant(status)}>{count}</Badge>
                                                </h6>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </>
                        )}

                        {/* EMPLOYEE CHARTS & TABLES */}
                        {(dataView === "all" || dataView === "employee") && (
                            <>
                                {/* PIE CHARTS */}
                                <Row className="g-3 mt-2">
                                    <Col md={3}>
                                        <SummaryPieChart
                                            title="Application Type Breakdown"
                                            loading={!filteredEmployees.length}
                                            data={[
                                                {
                                                    name: "New",
                                                    value: filteredEmployees.filter(
                                                        (e) => e.application_type === "new"
                                                    ).length,
                                                },
                                                {
                                                    name: "Renewal",
                                                    value: filteredEmployees.filter(
                                                        (e) => e.application_type === "renewal"
                                                    ).length,
                                                },
                                            ]}
                                        />
                                    </Col>
                                    <Col md={3}>
                                        <SummaryPieChart
                                            title="Type of Residency Breakdown"
                                            loading={!filteredEmployees.length}
                                            data={[
                                                {
                                                    name: "Filipino",
                                                    value: filteredEmployees.filter(
                                                        (e) => e.nationality === "Filipino"
                                                    ).length,
                                                },
                                                {
                                                    name: "Foreign",
                                                    value: filteredEmployees.filter(
                                                        (e) => e.nationality !== "Filipino"
                                                    ).length,
                                                },
                                            ]}
                                        />
                                    </Col>
                                    <Col md={3}>
                                        <SummaryPieChart
                                            title="Sex Breakdown"
                                            loading={!filteredEmployees.length}
                                            data={[
                                                {
                                                    name: "Males",
                                                    value: filteredEmployees.filter((e) => e.sex === "male").length,
                                                },
                                                {
                                                    name: "Females",
                                                    value: filteredEmployees.filter((e) => e.sex === "female").length,
                                                },
                                                {
                                                    name: "Prefer not to say",
                                                    value: filteredEmployees.filter(
                                                        (e) => e.sex === "prefer_not_to_say"
                                                    ).length,
                                                },
                                            ]}
                                        />
                                    </Col>
                                    <Col md={3}>
                                        <SummaryPieChart
                                            title="Age Breakdown"
                                            loading={!filteredEmployees.length}
                                            data={[
                                                {
                                                    name: "Kids (0–12)",
                                                    value: filteredEmployees.filter((e) => e.age && e.age <= 12).length,
                                                },
                                                {
                                                    name: "Teens (13–19)",
                                                    value: filteredEmployees.filter(
                                                        (e) => e.age && e.age >= 13 && e.age <= 19
                                                    ).length,
                                                },
                                                {
                                                    name: "Adults (20–59)",
                                                    value: filteredEmployees.filter(
                                                        (e) => e.age && e.age >= 20 && e.age <= 59
                                                    ).length,
                                                },
                                                {
                                                    name: "Seniors (60+)",
                                                    value: filteredEmployees.filter((e) => e.age && e.age >= 60).length,
                                                },
                                            ]}
                                        />
                                    </Col>
                                </Row>

                                {/* TOP RANKINGS */}
                                <Row className="g-3 mt-2">
                                    <Col md={6}>
                                        <TopRankingChart
                                            title="Top 10 Companies (with the most approved Tourism Frontliners)"
                                            data={topCompanies}
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <TopRankingChart
                                            title="Top 10 Designations"
                                            data={topDesignations}
                                        />
                                    </Col>
                                </Row>

                                {/* CERT SUMMARY TABLE */}
                                <Row className="g-3 mt-2">
                                    <Col md={12}>
                                        <TourismCertSummaryTable
                                            employees={filteredEmployees}
                                            loading={!filteredEmployees.length}
                                        />
                                    </Col>
                                </Row>

                                {/* FORECAST */}
                                <Row>
                                    <Col md={12}>
                                        <CertificateIssuanceForecastChart
                                            title="Certificate Issuance Forecast"
                                            employees={filteredEmployees}
                                        />
                                    </Col>
                                </Row>
                            </>
                        )}

                        {/* COMPANY CHARTS */}
                        {(dataView === "all" || dataView === "company") && (
                            <>
                                {/* PIE CHARTS */}
                                <Row className="g-3 mt-2">
                                    <Col md={6}>
                                        <SummaryPieChart
                                            title="Company Classification Breakdown"
                                            loading={!filteredCompanies.length}
                                            data={Object.entries(companySummary.classifications || {}).map(
                                                ([name, value]) => ({ name, value })
                                            )}
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <SummaryPieChart
                                            title="Ownership Breakdown"
                                            loading={!filteredCompanies.length}
                                            data={Object.entries(companySummary.ownerships || {}).map(
                                                ([name, value]) => ({ name, value })
                                            )}
                                        />
                                    </Col>
                                </Row>

                                {/* COMPANY CERT SUMMARY TABLE */}
                                <Row className="g-3 mt-2">
                                    <Col md={12}>
                                        <CompanyCertSummaryTable
                                            companies={filteredCompanies}
                                            loading={!filteredCompanies.length}
                                        />
                                    </Col>
                                </Row>
                            </>
                        )}
                        {/* Example: Top Companies, Top Designations, Forecast, etc. */}

                        <small className="text-muted d-block text-center mt-5">
                            * This report and its contents are the property of the Local
                            Government of Malay through the Municipal Tourism Office and adhere
                            to the Data Privacy Act of 2012 (Republic Act No. 10173). Please
                            ensure proper disposal of printed or digital copies in accordance
                            with data privacy and confidentiality protocols.
                        </small>
                    </div>
                </Col>
            </Row>
            <FooterCustomized scrollToId="toppage" />

        </Container>
    );
};

export default GeneralTFSummaryPage;
