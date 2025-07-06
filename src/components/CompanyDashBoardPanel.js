import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Image,
  Dropdown, Button
} from "react-bootstrap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import TouristActivityStatusBoard from "./ActivityStatusBoard"; // ⬅️ Import your reusable component
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
const CompanyDashboardPanel = ({ company }) => {
  const [tickets, setTickets] = useState([]);

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
      <Row className="align-items-center justify-content-between">
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
      {/* ⬇️ Reusable Component */}
      <TouristActivityStatusBoard ticket_ids={ticketIds} />
    </Container>
  );
};

export default CompanyDashboardPanel;
