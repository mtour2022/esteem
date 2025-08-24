import React, { useEffect, useState } from "react";
import { Container, Row, Col, Image, Tabs, Tab, Card, Badge } from "react-bootstrap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import TouristActivityStatusBoard from "./ActivityStatusBoard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCertificate, faLineChart, faTicket } from "@fortawesome/free-solid-svg-icons";
import CompanyTourismCert from "./CompanyTourismCert"; // still reusable for employee certs
import { useAuth } from "../auth/authentication";
import TourismCert from "./TourismCert"
import useCompanyInfo from "../services/GetCompanyDetails"; // ✅ Import hook

const EmployeeDashboardPanel = ({ employee, refreshKey }) => {
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCert, setSelectedCert] = useState(null);
  
  const company = useCompanyInfo(employee?.companyId);

  const ticketIds = Array.isArray(employee.tickets) ? employee.tickets : [];

  useEffect(() => {
    console.log("Ticket IDs from employee:", ticketIds);
  }, [ticketIds]);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!employee?.tickets || !Array.isArray(employee.tickets)) return;

      try {
        const ticketPromises = employee.tickets.map((ticketId) =>
          getDoc(doc(db, "tickets", ticketId))
        );
        const snapshots = await Promise.all(ticketPromises);
        const ticketData = snapshots
          .filter((snap) => snap.exists())
          .map((snap) => ({ id: snap.id, ...snap.data() }));
        setTickets(ticketData);
      } catch (err) {
        console.error("Error fetching tickets:", err);
      }
    };

    fetchTickets();
  }, [employee, refreshKey]);

  if (!employee) return null;

  return (
    <Container className="body-container" id="toppage">
      {/* Employee Header */}
      <Row className="mb-3 row">
        <Col xs={12} className="col">
          <Card
            className="p-3 border w-100 mb-3"
            style={{ borderColor: "#d3d3d3", boxShadow: "none" }}
          >
            <div className="d-flex align-items-center flex-wrap">
              {employee.profilePhoto && (
                <Image
                  src={employee.profilePhoto}
                  rounded
                  fluid
                  style={{
                    height: 100,
                    width: 100,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                  alt="Employee Photo"
                />
              )}
              <div className="d-flex flex-column ms-4">
                <h2 className="mb-0">{employee.getFullName()}</h2>
                {employee.designation && (
                  <p className="text-muted mb-0">{employee.designation}</p>
                )}
              </div>
            </div>

            {/* Status Badges */}
            <div className="mt-3 d-flex flex-wrap gap-2">
              {employee.status && (
                <Badge
                  bg={
                    employee.status === "approved"
                      ? "success"
                      : employee.status === "rejected"
                      ? "danger"
                      : "secondary"
                  }
                >
                  Tourism Status: {employee.status}
                </Badge>
              )}
              {employee.company_status && (
                <Badge
                  bg={
                    employee.company_status === "approved"
                      ? "success"
                      : employee.company_status === "rejected"
                      ? "danger"
                      : "secondary"
                  }
                >
                  Company Status: {employee.company_status}
                </Badge>
              )}
              {employee.canGenerate !== undefined && (
                <Badge bg={employee.canGenerate ? "success" : "danger"}>
                  Can Generate QR: {employee.canGenerate ? "yes" : "no"}
                </Badge>
              )}
            </div>

            {/* Latest Certificate Summary */}
            {employee.latest_cert_summary &&
              employee.latest_cert_summary.tourism_cert_id && (
                <div className="mt-3">
                  <h6>Latest Certificate</h6>
                  {employee.latest_cert_summary.tourism_cert_id && (
                    <p>
                      <strong>ID:</strong>{" "}
                      {employee.latest_cert_summary.tourism_cert_id}
                    </p>
                  )}
                  {employee.latest_cert_summary.type && (
                    <p>
                      <strong>Type:</strong>{" "}
                      {employee.latest_cert_summary.type}
                    </p>
                  )}
                  {employee.latest_cert_summary.date_Issued && (
                    <p>
                      <strong>Issued:</strong>{" "}
                      {employee.latest_cert_summary.date_Issued}
                    </p>
                  )}
                  {employee.latest_cert_summary.date_Expired && (
                    <p>
                      <strong>Expires:</strong>{" "}
                      {employee.latest_cert_summary.date_Expired}
                    </p>
                  )}
                </div>
              )}
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <div className="mb-4">
        <Tabs
          defaultActiveKey="dashboard"
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4"
        >
          <Tab
            eventKey="dashboard"
            title={
              <>
                <FontAwesomeIcon
                  icon={faTicket}
                  size="sm"
                  className="me-2"
                />{" "}
                Tickets
              </>
            }
          />
          <Tab
            eventKey="certificate"
            title={
              <>
                <FontAwesomeIcon
                  icon={faCertificate}
                  size="sm"
                  className="me-2"
                />{" "}
                My Certificates
              </>
            }
          />
          <Tab
            eventKey="reports"
            title={
              <>
                <FontAwesomeIcon
                  icon={faLineChart}
                  size="sm"
                  className="me-2"
                />{" "}
                Reports
              </>
            }
          />
        </Tabs>
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && (
        <TouristActivityStatusBoard
          ticket_ids={ticketIds}
          refreshKey={refreshKey}
        />
      )}

      {activeTab === "certificate" && (
        <div>
          <p className="barabara-label text-start mt-5">MY TOURISM CERTS</p>
          <p className="m-1 mt-3 text-muted small text-start mb-5">
            List of your issued tourism certificates.
          </p>

          {Array.isArray(employee.tourism_certificate_ids) &&
          employee.tourism_certificate_ids.length > 0 ? (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Certificate ID</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {employee.tourism_certificate_ids.map((certId, index) => (
                  <tr key={certId}>
                    <td>{index + 1}</td>
                    <td>{certId}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setSelectedCert(certId);

                          setTimeout(() => {
                            const element =
                              document.getElementById("summary-cert");
                            if (element) {
                              element.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }
                          }, 200);
                        }}
                      >
                        View Certificate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">
              No certificates found for this employee.
            </p>
          )}

          {selectedCert && (
            <div className="mt-4" id="summary-cert">
              
           <TourismCert emp={employee} company={company} hideNavAndFooter/>
            </div>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="text-muted">📊 Reports section coming soon.</div>
      )}
    </Container>
  );
};

export default EmployeeDashboardPanel;
