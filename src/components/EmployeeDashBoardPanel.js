import React, { useEffect, useState } from "react";
import { Container, Row, Col, Image, Tabs, Tab } from "react-bootstrap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import TouristActivityStatusBoard from "./ActivityStatusBoard";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCertificate, faLineChart, faTicket } from '@fortawesome/free-solid-svg-icons';
import CompanyTourismCert from "./CompanyTourismCert"; // still reusable for employee certs
import { useAuth } from "../auth/authentication";

const EmployeeDashboardPanel = ({ employee, refreshKey }) => {
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCert, setSelectedCert] = useState(null);

  const ticketIds = Array.isArray(employee.tickets) ? employee.tickets : [];

  useEffect(() => {
    console.log("Employee prop passed to EmployeeDashboardPanel:", employee);
  }, [employee]);

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
      <Row className="align-items-center justify-content-between mb-3">
        <Col xs="auto" className="ps-0 d-flex align-items-center gap-3">
          {employee.profilePhoto && (
            <Image
              src={employee.profilePhoto}
              rounded
              fluid
              style={{ height: 80 }}
              alt="Employee Photo"
            />
          )}
          <h2 className="mb-0">{employee.getFullName()}</h2>
          <p className="text-muted mb-0">{employee.designation || "No designation"}</p>
        </Col>
      </Row>

      {/* Tabs */}
      <div className="mb-4 d-flex gap-2">
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
                <FontAwesomeIcon icon={faTicket} size="sm" className="me-2" /> Tickets
              </>
            }
          />
          <Tab
            eventKey="certificate"
            title={
              <>
                <FontAwesomeIcon icon={faCertificate} size="sm" className="me-2" /> My Certificates
              </>
            }
          />
          <Tab
            eventKey="reports"
            title={
              <>
                <FontAwesomeIcon icon={faLineChart} size="sm" className="me-2" /> Reports
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

          {Array.isArray(employee.tourism_certificate_ids) && employee.tourism_certificate_ids.length > 0 ? (
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
                        onClick={() => setSelectedCert(certId)}
                      >
                        View Certificate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">No certificates found for this employee.</p>
          )}

          {selectedCert && (
            <div className="mt-4">
              <CompanyTourismCert
                employee={employee} // pass employee
                certificateId={selectedCert}
                hideNavAndFooter
              />
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
