import React, { useEffect, useState, useRef } from "react";
import { Container, Row, Col, Card, Button, Spinner, Form, InputGroup } from "react-bootstrap";
import Swal from "sweetalert2";
import QrScanner from "qr-scanner";
import Webcam from "react-webcam";
import FooterCustomized from "../components/Footer";
import AppNavBar from "../components/AppNavBar";

const TourismCertQRScannerPage = ({ hideNavAndFooter = false }) => {
  const [searchType, setSearchType] = useState("id");
  const [tourismCertId, setTourismCertId] = useState("");
  const [scannerRequested, setScannerRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const webcamRef = useRef(null);
  const qrScannerRef = useRef(null);
  const handledRef = useRef(false);

  // ✅ QR scanner effect
  useEffect(() => {
    if (scannerRequested && webcamRef.current?.video) {
      const scanner = new QrScanner(
        webcamRef.current.video,
        async (result) => {
          if (handledRef.current) return;

          if (result?.data) {
            const parts = result.data.trim().split("/").filter(Boolean);
            const scannedId = parts[parts.length - 1];

            if (!scannedId) {
              Swal.fire("Invalid QR", "No valid tourism certificate ID found in QR code.", "error");
              return;
            }

            handledRef.current = true;
            setTourismCertId(scannedId);

            try {
              const stopResult = scanner.stop?.();
              if (stopResult instanceof Promise) await stopResult;
            } catch (err) {
              console.warn("Error stopping scanner after scan:", err);
            }

            qrScannerRef.current = null;
            setScannerRequested(false);

            // ✅ Open the Tourism Certificate in a new tab
            window.open(`/tourism-certificate/${scannedId}`, "_blank");
          }
        },
        { highlightScanRegion: true, preferredCamera: "environment" }
      );

      qrScannerRef.current = scanner;
      scanner.start().catch((err) => {
        console.error("Camera start error:", err);
        Swal.fire("Camera error", "Unable to access the camera.", "error");
        setScannerRequested(false);
      });

      return () => {
        try {
          if (scanner && typeof scanner.stop === "function") {
            const stopResult = scanner.stop();
            if (stopResult instanceof Promise) stopResult.catch(() => { });
          }
        } catch (err) {
          console.warn("Error stopping scanner in cleanup:", err);
        }
        qrScannerRef.current = null;
        setScannerRequested(false);
      };
    }
  }, [scannerRequested]);

  const handleReset = () => {
    setTourismCertId("");
    setScannerRequested(false);
    setErrorMessage("");
    handledRef.current = false;
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current = null;
    }
  };

  const handleManualSubmit = () => {
    if (!tourismCertId.trim()) {
      Swal.fire("Missing ID", "Please enter a valid Tourism Certificate ID.", "warning");
      return;
    }
    // ✅ Open the Tourism Certificate in a new tab
    window.open(`/tourism-certificate/${tourismCertId.trim()}`, "_blank");
  };

  return (
    <Container fluid>
      {!hideNavAndFooter && <AppNavBar bg="dark" variant="dark" title="Tourism Certificate QR Scanner" />}

      <Container className="my-5 p-4">
        <Row className="mb-3">
          <Col className="text-center">
            <p id="toppage" className="barabara-label">TOURISM CERTIFICATE CHECKER</p>
            <p className="text-muted">Scan QR Code or Enter Tourism Certificate ID</p>
          </Col>
        </Row>

        {/* Options */}
        <Row className="justify-content-center g-3 mb-4 p-0">
          <Col lg={9} md={12} sm={12} xs={12}>
            <Row className="justify-content-center g-3 mb-4">
              {/* Scan QR */}
              <Col xs={12} sm={6} md={3}>
                <Card
                  className={`text-center shadow-sm h-100 ${searchType === "scan" ? "border-primary" : ""}`}
                  role="button"
                  onClick={() => {
                    handleReset();
                    setSearchType("scan");
                    setScannerRequested(true);
                  }}
                >
                  <Card.Body>
                    <Card.Title>📷 Scan QR Code</Card.Title>
                    <Card.Text>Use your camera to scan a tourism certificate QR</Card.Text>
                  </Card.Body>
                </Card>
              </Col>

              {/* Search by ID */}
              <Col xs={12} sm={6} md={3}>
                <Card
                  className={`text-center shadow-sm h-100 ${searchType === "id" ? "border-primary" : ""}`}
                  role="button"
                  onClick={() => {
                    handleReset();
                    setSearchType("id");
                  }}
                >
                  <Card.Body>
                    <Card.Title>🆔 Search by ID</Card.Title>
                    <Card.Text>Find tourism certificate using ID</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Manual ID search */}
        {searchType === "id" && (
          <InputGroup className="mb-3 justify-content-center" style={{ maxWidth: "550px", margin: "0 auto" }}>
            <Form.Control
              type="text"
              placeholder="Enter Tourism Certificate ID"
              value={tourismCertId}
              onChange={(e) => setTourismCertId(e.target.value)}
            />
            <Button variant="secondary" onClick={handleManualSubmit}>Check</Button>
          </InputGroup>
        )}

        {/* QR Scanner View */}
        {scannerRequested && (
          <Row className="justify-content-center mb-3">
            <Col xs={12} md={12} className="text-center">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-100 h-100 mb-2"
                videoConstraints={{ facingMode: "environment" }}
              />
            </Col>
          </Row>
        )}

        {errorMessage && (
          <Row className="justify-content-center">
            <Col xs={12} md={8} className="text-center">
              <p className="text-danger mt-3">{errorMessage}</p>
            </Col>
          </Row>
        )}

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

export default TourismCertQRScannerPage;
