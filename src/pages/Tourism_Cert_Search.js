import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Form, InputGroup, Table, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import FooterCustomized from "../components/Footer";
import AppNavBar from "../components/AppNavBar";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase"; // ✅ make sure this path is correct for your firebase config
import dayjs from "dayjs";

const TourismCertSearchPage = ({ hideNavAndFooter = false }) => {
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthday, setBirthday] = useState("");
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);

  const handleSearch = async () => {
    if (!firstName.trim() || !surname.trim() || !birthday) {
      Swal.fire("Missing Information", "Please fill in all fields before searching.", "warning");
      return;
    }

    setLoading(true);
    setCertificates([]);

    try {
      // ✅ Step 1: Search employee collection
      const employeeRef = collection(db, "employee");
      const q = query(
        employeeRef,
        where("firstname", "==", firstName.trim()),
        where("surname", "==", surname.trim()),
        where("birthday", "==", birthday)
      );
      const employeeSnap = await getDocs(q);

      if (employeeSnap.empty) {
        Swal.fire("No Match", "No employee found with that name and birthday.", "info");
        setLoading(false);
        return;
      }

      // Assume only one exact match (or use first result)
      const employeeData = employeeSnap.docs[0].data();
      const tourismCertIds = employeeData.tourism_certificate_ids || [];

      if (!tourismCertIds.length) {
        Swal.fire("No Certificates", "This employee has no tourism certificates.", "info");
        setLoading(false);
        return;
      }

      // ✅ Step 2: Fetch tourism certificates
      const certPromises = tourismCertIds.map(async (certId) => {
        const certDocRef = doc(db, "tourism_cert", certId.toString());
        const certDoc = await getDoc(certDocRef);
        if (certDoc.exists()) {
          return certDoc.data();
        }
        return null;
      });

      const certResults = (await Promise.all(certPromises)).filter(Boolean);
      setCertificates(certResults);
    } catch (err) {
      console.error("Search error:", err);
      Swal.fire("Error", "An error occurred while searching.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFirstName("");
    setSurname("");
    setBirthday("");
    setCertificates([]);
  };

  return (
    <Container fluid>
      {!hideNavAndFooter && <AppNavBar bg="dark" variant="dark" title="Tourism Certificate Search" />}

      <Container className="my-5 p-4">
        <Row className="mb-3">
          <Col className="text-center">
            <p id="toppage" className="barabara-label">FIND MY TOURISM CERTIFICATE</p>
            <p className="text-muted">Search by Name and Birthday</p>
          </Col>
        </Row>

        {/* Search Card */}
        <Row className="justify-content-center g-3 mb-4 p-0">
          <Col lg={8} md={10} sm={12}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title>🔍 Search by Name & Birthday</Card.Title>
                <Card.Text>Enter your details below to find your tourism certificate</Card.Text>

                <Form>
                  <Form.Label><small>Name and Birthday</small></Form.Label>
                  <InputGroup className="mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Firstname"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Form.Control
                      type="text"
                      placeholder="Surname"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                    />
                    <Form.Control
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                    />
                  </InputGroup>

                  <div className="d-flex gap-2 justify-content-end">
                    <Button variant="secondary" onClick={handleSearch} size="sm" disabled={loading}>
                      {loading ? <Spinner animation="border" size="sm" /> : "Search"}
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={handleReset}>
                      Clear
                    </Button>
                  </div>


                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={8} md={10} sm={12}>
            {/* Results Table */}
            {certificates.length > 0 && (
              <Row className="justify-content-center mt-4">
                <Col lg={12}>
                  <Table bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Certificate ID</th>
                        <th>Type</th>
                        <th>Date Issued</th>
                        <th>Date Expired</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map((cert) => (
                        <tr key={cert.tourism_cert_id}>
                          <td>{cert.tourism_cert_id}</td>
                          <td>{cert.type}</td>
                          <td>{dayjs(cert.date_Issued).format("MMM DD, YYYY")}</td>
                          <td>{dayjs(cert.date_Expired).format("MMM DD, YYYY")}</td>

                          <td>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => window.open(`/tourism-certificate/${cert.tourism_cert_id}`, "_blank")}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            )}

          </Col>
        </Row>


        {!hideNavAndFooter && (
          <>
            <div className="my-5"></div>
            <FooterCustomized scrollToId="toppage" />
          </>
        )}
      </Container>
    </Container>
  );
};

export default TourismCertSearchPage;
