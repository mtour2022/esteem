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
import { faLineChart, faTicket, faUserGroup } from '@fortawesome/free-solid-svg-icons';
import CompanyTourismCert from "./CompanyTourismCert";
import { useAuth } from "../auth/authentication";

const CompanyDashboardPanel = ({ company, refreshKey }) => {
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { currentUser } = useAuth();

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
                <FontAwesomeIcon icon={faUserGroup} size="sm" className="me-2" /> Employees
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
          <Tab
            eventKey="certificate"
            title={
              <>
                <FontAwesomeIcon icon={faLineChart} size="sm" className="me-2" /> My Certificate
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
        <CompanyTourismCert
          company={company}
          hideNavAndFooter
        />
      )}

      {activeTab === "reports" && (
        <div className="text-muted">📊 Reports section coming soon.</div>
      )}
    </Container>
  );
};

export default CompanyDashboardPanel;
