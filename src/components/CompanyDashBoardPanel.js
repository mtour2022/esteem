import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Image, Tabs, Tab,
} from "react-bootstrap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import TouristActivityStatusBoard from "./ActivityStatusBoard";
import CompanyEmployeeListPage from "../pages/CompanyEmployeeList";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCertificate, faLineChart, faTicket, faUserGroup } from '@fortawesome/free-solid-svg-icons';
import CompanyTourismCert from "./CompanyTourismCert";
import { useAuth } from "../auth/authentication";

const CompanyDashboardPanel = ({ company, refreshKey }) => {
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { currentUser } = useAuth();
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    console.log("Company prop passed to CompanyDashboardPanel:", company);
  }, [company]);


  useEffect(() => {
    const fetchTickets = async () => {
      if (!company?.ticket || !Array.isArray(company.ticket)) return;

      try {
        const ticketPromises = company.ticket.map((ticketId) =>
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
  }, [company, refreshKey]); // 👈 include refreshKey here

  const ticketIds = Array.isArray(company.ticket) ? company.ticket : [];

  if (!company) return null;

  return (
    <Container className="body-container" id="toppage">
      {/* Company Header */}
      <Row className="align-items-center justify-content-between mb-3">
        <Col xs="auto" className="ps-0 d-flex align-items-center gap-3">
          {company.logo && (
            <Image
              src={company.logo}
              rounded
              fluid
              style={{ height: 80 }}
              alt="Company Logo"
            />
          )}
          <h2 className="mb-0">{company.name}</h2>
        </Col>
      </Row>

      {/* Tab Buttons */}
      <div className="mb-4 d-flex gap-2">
        <Tabs
          defaultActiveKey="ticketboard"
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
            eventKey="employees"
            title={
              <>
                <FontAwesomeIcon icon={faUserGroup} size="sm" className="me-2" /> Employees/Members
              </>
            }
          />

          <Tab
            eventKey="certificate"
            title={
              <>
                <FontAwesomeIcon icon={faCertificate} size="sm" className="me-2" /> My Certificate
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
          refreshKey={refreshKey}   // 👈 pass refreshKey down
        />
      )}

      {activeTab === "employees" && (
        <CompanyEmployeeListPage
          employeeIds={company.employee}
          companyId={company.company_id}
          companyName={company.name}
        />
      )}

      {activeTab === "certificate" && (
        <div>
          <p className="barabara-label text-start mt-5">MY TOURISM CERTS</p>
          <p className="m-1 mt-3 text-muted small text-start mb-5">
            List of your issued tourism certificates.
          </p>

          {Array.isArray(company.tourism_certificate_ids) && company.tourism_certificate_ids.length > 0 ? (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Certificate ID</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {company.tourism_certificate_ids.map((certId, index) => (
                  <tr key={certId}>
                    <td>{index + 1}</td>
                    <td>{certId}</td>
                    <td>
                              <button
  className="btn btn-sm btn-primary"
  onClick={() => {
    setSelectedCert(certId);

    // Wait a tick for React to render <CompanyTourismCert />
    setTimeout(() => {
      const element = document.getElementById("summary-cert");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
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
            <p className="text-muted">No certificates found for this company.</p>
          )}

          {/* Display the selected certificate below */}
          {selectedCert && (
            <div className="mt-4" id="summary-cert">
              <CompanyTourismCert
                company={company}
                certificateId={selectedCert} // pass the selected cert if needed
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

export default CompanyDashboardPanel;
