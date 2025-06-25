import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Image,
  Dropdown,
  Button,
  Row,
  Col,
  Badge,
} from "react-bootstrap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase"; // adjust path as needed

const CompanyProfilePanel = ({ company }) => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!company?.employee || !Array.isArray(company.employee)) return;

      try {
        const employeePromises = company.employee.map((empId) =>
          getDoc(doc(db, "employee", empId))
        );
        const snapshots = await Promise.all(employeePromises);
        const employeeData = snapshots
          .filter((snap) => snap.exists())
          .map((snap) => ({ id: snap.id, ...snap.data() }));

        setEmployees(employeeData);
      } catch (error) {
        console.error("Error fetching employee data:", error);
      }
    };

    fetchEmployees();
  }, [company]);

  if (!company) return null;

  const fullName = (name) =>
    `${name?.first || ""} ${name?.middle || ""} ${name?.last || ""}`.trim();

  const fullAddress = (address) => {
    if (!address) return "";
    const {
      street = "",
      barangay = "",
      town = "",
      province = "",
      region = "",
      country = "",
    } = address;
    return `${street}, ${barangay}, ${town}, ${province}, ${region}, ${country}`;
  };

  // Statistics
  const totalEmployees = employees.length;
  const tourCoordinators = employees.filter((e) =>
    e.designation?.toLowerCase().includes("coordinator")
  ).length;
  const tourGuides = employees.filter((e) =>
    e.designation?.toLowerCase().includes("guide")
  ).length;
  const staff = totalEmployees - (tourCoordinators + tourGuides);

  // Demographics
  const genderCount = {
    male: employees.filter((e) => e.sex === "male").length,
    female: employees.filter((e) => e.sex === "female").length,
    prefer_not_to_say: employees.filter((e) => e.sex === "prefer_not_to_say")
      .length,
  };

  const ageBrackets = {
    kids: employees.filter((e) => e.age >= 0 && e.age <= 12).length,
    teens: employees.filter((e) => e.age >= 13 && e.age <= 19).length,
    adults: employees.filter((e) => e.age >= 20 && e.age <= 59).length,
    seniors: employees.filter((e) => e.age >= 60).length,
  };

  return (
    <Container className="container my-4" id="toppage">
      {/* Row 1: Header */}
      <Row className="align-items-center justify-content-between">
        <Col xs="auto" className="d-flex align-items-center gap-3">
          {company.logo && (
            <Image
              src={company.logo}
              rounded
              fluid
              style={{ height: 80, width: "auto" }}
              alt="Company Logo"
            />
          )}
          <h2 className="mb-0">{company.name}</h2>
        </Col>
        <Col xs="auto">
          <Dropdown align="end">
            <Dropdown.Toggle variant="outline-secondary" id="dropdown-menu">
              Menu
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item>Profile</Dropdown.Item>
              <Dropdown.Item>Log Out</Dropdown.Item>
              <Dropdown.Item>Complaint Form</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {/* Row 2: Statistics */}
      <Row className="mt-4 text-center">
        <Col>
          <Button variant="primary" className="w-100">
            Employees <Badge bg="light" text="dark">{totalEmployees}</Badge>
          </Button>
        </Col>
        <Col>
          <Button variant="info" className="w-100">
            Tour Coordinators{" "}
            <Badge bg="light" text="dark">{tourCoordinators}</Badge>
          </Button>
        </Col>
        <Col>
          <Button variant="success" className="w-100">
            Tour Guides <Badge bg="light" text="dark">{tourGuides}</Badge>
          </Button>
        </Col>
        <Col>
          <Button variant="warning" className="w-100">
            Staff <Badge bg="light" text="dark">{staff}</Badge>
          </Button>
        </Col>
      </Row>

      {/* Row 3: Demographics */}
      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Employee Demographics</Card.Title>
          <Row>
            <Col>
              <h6>Sex</h6>
              <p>Male: {genderCount.male}</p>
              <p>Female: {genderCount.female}</p>
              <p>Prefer not to say: {genderCount.prefer_not_to_say}</p>
            </Col>
            <Col>
              <h6>Age Brackets</h6>
              <p>Kids (0–12): {ageBrackets.kids}</p>
              <p>Teens (13–19): {ageBrackets.teens}</p>
              <p>Adults (20–59): {ageBrackets.adults}</p>
              <p>Seniors (60+): {ageBrackets.seniors}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

       {/* Row 2: Individual Stat Cards */}
            <Row className="mt-4 g-3">
              <Col md={3} sm={6}>
                <Card className="h-100 border border-muted bg-white shadow-sm text-center">
                  <Card.Body>
                    <Card.Title>Total Employees</Card.Title>
                    <h4>
                      {totalEmployees}
                    </h4>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} sm={6}>
                <Card className="h-100 border border-muted bg-white shadow-sm text-center">
                  <Card.Body>
                    <Card.Title>Tour Coordinators</Card.Title>
                    <h4>
                        {tourCoordinators}
                    </h4>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} sm={6}>
                <Card className="h-100 border border-muted bg-white shadow-sm text-center">
                  <Card.Body>
                    <Card.Title>Tour Guides</Card.Title>
                    <h4>
                      {tourGuides}
                    </h4>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} sm={6}>
                <Card className="h-100 border border-muted bg-white shadow-sm text-center">
                  <Card.Body>
                    <Card.Title>Staff</Card.Title>
                    <h4>
                        {staff}
                    </h4>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

      {/* Footer Info */}
      <Card className="mt-4">
        <Card.Body>
          <h5>Company Info</h5>
          <p><strong>Email:</strong> {company.email}</p>
          <p><strong>Contact:</strong> {company.contact}</p>
          <p><strong>Classification:</strong> {company.classification}</p>
          <p><strong>Status:</strong> {company.status}</p>
          <p><strong>Ownership:</strong> {company.ownership}</p>
          <p><strong>Type:</strong> {company.type}</p>
          <p><strong>Year Established:</strong> {company.year}</p>
          <p><strong>Permit:</strong> {company.permit}</p>
          <p><strong>Proprietor:</strong> {fullName(company.proprietor)}</p>
          <p><strong>Full Address:</strong> {fullAddress(company.address)}</p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CompanyProfilePanel;
