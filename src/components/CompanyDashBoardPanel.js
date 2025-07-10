import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Image,
  Button
} from "react-bootstrap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import TouristActivityStatusBoard from "./ActivityStatusBoard";
import CompanyEmployeeListPage from "./Employee_List";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLineChart, faTicket, faUserGroup } from '@fortawesome/free-solid-svg-icons';

const CompanyDashboardPanel = ({ company }) => {
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'employees' | 'reports'

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
  }, [company]);

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
        <Button
          variant={activeTab === "dashboard" ? "secondary" : "outline-secondary"}
          className={activeTab === "dashboard" ? "text-white" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          <FontAwesomeIcon icon={faTicket} /> Ticket Status Board
        </Button>

        <Button
          variant={activeTab === "employees" ? "secondary" : "outline-secondary"}
          className={activeTab === "employees" ? "text-white" : ""}
          onClick={() => setActiveTab("employees")}
        >
          <FontAwesomeIcon icon={faUserGroup} /> Employee List
        </Button>

        <Button
          variant={activeTab === "reports" ? "secondary" : "outline-secondary"}
          className={activeTab === "reports" ? "text-white" : ""}
          onClick={() => setActiveTab("reports")}
        >
          <FontAwesomeIcon icon={faLineChart} /> Generate Report
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && (
        <TouristActivityStatusBoard ticket_ids={ticketIds} />
      )}

      {activeTab === "employees" && (
        <CompanyEmployeeListPage
  employeeIds={company.employee}
  companyId={company.company_id}
  companyName={company.name}
/>
      )}

      {activeTab === "reports" && (
        <div className="text-muted">📊 Reports section coming soon.</div>
      )}
    </Container>
  );
};

export default CompanyDashboardPanel;
