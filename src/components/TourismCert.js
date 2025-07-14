// src/components/EndorsementCard.js
import React, { useEffect, useRef } from "react";
import { Card, Button, Row, Col } from "react-bootstrap";
import logo from "../assets/images/lgu.png";
import bagongpilipinaslogo from "../assets/images/bagongpilipinas.png";
import useTourismCertificate from "../services/GetTourismCertDetails"; // fixed path
import { QRCodeCanvas } from "qrcode.react";
import useVerifierInfo from "../services/GetVerifierDetail"; // adjust the path if needed
import Swal from "sweetalert2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faPrint } from "@fortawesome/free-solid-svg-icons";

const TourismCert = ({ emp, company }) => {
    const loadingShown = useRef(false); // Track Swal state

    const tourismCerts = Array.isArray(emp.tourism_certificate) ? emp.tourism_certificate : [];

    const latestCert = tourismCerts.reduce((latest, current) => {
        if (!current?.date_Issued) return latest;
        if (!latest?.date_Issued) return current;
        return new Date(current.date_Issued) > new Date(latest.date_Issued) ? current : latest;
    }, null);

    const cert = useTourismCertificate(latestCert?.tourism_cert_id);
    const verifier = useVerifierInfo(cert?.verifier_id);
    const certRef = useRef();

    useEffect(() => {
        if (!cert || !verifier) {
            if (!loadingShown.current) {
                loadingShown.current = true;
                Swal.fire({
                    title: "Loading certificate...",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => Swal.showLoading(),
                });
            }
        } else {
            if (loadingShown.current) {
                Swal.close();
                loadingShown.current = false;
            }
        }
    }, [cert, verifier]);

    if (!cert || !verifier) return null;
    const dateIssued = new Date(cert.date_Issued);
    const dateExpired = new Date(cert.date_Expired);

    const issueDateFormatted = dateIssued.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const expireDateFormatted = dateExpired.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const handleDownloadImage = async () => {
        if (!certRef.current) return;

        const scaleFactor = 300 / 96; // Screen DPI → Print DPI
        const canvas = await html2canvas(certRef.current, {
            scale: scaleFactor,
            useCORS: true,
        });

        const link = document.createElement("a");
        link.download = `tourism_certificate_${cert.tourism_cert_id}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    const handleDownloadPDF = async () => {
        if (!certRef.current) return;
        const canvas = await html2canvas(certRef.current, {
            scale: 2, // sharper image
            useCORS: true,
        });

        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("portrait", "pt", "letter"); // 612x792pt (8.5x11in)
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
        const imgWidth = canvas.width * ratio;
        const imgHeight = canvas.height * ratio;

        const x = (pageWidth - imgWidth) / 2;
        const y = 0;

        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
        pdf.save(`tourism_certificate_${cert.tourism_cert_id}.pdf`);
    };



    return (
        <div className="d-flex flex-column align-items-center mt-5">

            <div className="d-flex justify-content-center gap-3 mb-3 mt-5">
                <Button variant="outline-secondary" size="md" onClick={handleDownloadImage}>
                    <FontAwesomeIcon icon={faDownload} className="me-2" />
                    Download as Image
                </Button>
                <Button variant="outline-secondary" size="md" onClick={handleDownloadPDF}>
                    <FontAwesomeIcon icon={faPrint} className="me-2" />
                    Print as PDF
                </Button>
            </div>

           <Card
  ref={certRef}
  className="p-5 my-3 "
  style={{
    borderColor: "white", // overrides the Bootstrap border
    width: "816px",
    height: "1056px",
    maxWidth: "100%",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "white",
  }}
>


              <Row className="align-items-center mb-2 mt-4 text-center">
  <Col xs="4">
    <div className="d-flex justify-content-end">
              <img src={logo} height="80" alt="LGU Logo" />

    </div>
  </Col>
  <Col xs="4">
    <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
      <strong>Republic of the Philippines</strong><br />
      Province of Aklan<br />
      Municipality of Malay<br /><br />
    </div>
  </Col>
  <Col xs="4">
    <div className="d-flex justify-content-start">
            <img src={bagongpilipinaslogo} height="80" alt="Bagong Pilipinas Logo" />

    </div>
  </Col>
</Row>

                <p style={{ fontSize: "12px" }} className="text-center"><strong>Municipal Tourism Office</strong></p>
                <h3 className="barabara-label text-center mt-2" style={{ fontSize: "36px" }}>{cert.type.toUpperCase()}</h3>
                {cert.type !== 'Recommendation' && (
                    <p style={{ fontSize: "12px" }} className="text-end mb-4 mt-4">Dated <strong>{issueDateFormatted}</strong></p>
                )}
                <p className="mt-1 text-justify" style={{ fontSize: "12px" }}>
                    {cert.type === 'Recommendation' ? (
                        <>
                            <br />
                            This is to recommend <strong>{emp.firstname} {emp.middlename || ''} {emp.surname} {emp.suffix || ''}</strong> of <strong>{company?.name || "Loading..."}</strong> in the issuance of Mayor's Permit in pursuant to section 3, letters d and e of the Municipal Ordinance No. 150 series of 2022 (Creating of Municipal Tourism Office and Defining its Duties and Functions).
                        </>
                    ) : (
                        <>
                            This is to endorse <strong>{emp.firstname} {emp.middlename || ''} {emp.surname} {emp.suffix || ''}</strong> of <strong>{company?.name || "Loading..."}</strong> has successfully completed the Municipal Tourism requirement pursuant to section 3, letters d and e of the Municipal Ordinance No. 150 series of 2022.
                        </>
                    )}
                </p>

                <p className="text-justify" style={{ fontSize: "12px" }}>
                    {cert.type === 'Recommendation' ? (
                        <>This recommendation is issued on <strong>{issueDateFormatted}</strong>. Valid until <strong>{expireDateFormatted}</strong>.</>
                    ) : (
                        <>This endorsement is valid until <strong>{expireDateFormatted}</strong>.</>
                    )}
                </p>

                <p className="text-center mb-2" style={{ fontSize: "12px" }}>
                    This is issued for Mayor's Permit purposes, Health Card application and Tourism Frontliner verification only.
                </p>

                <p className="text-center mt-2 mb-2" style={{ fontSize: "12px" }}>
                    <strong>Digitally authorized by</strong>
                </p>

                <p className="mt-5 mb-0 text-center" style={{ fontSize: "12px" }}>
                    <strong>DR. FELIX G. DELOS SANTOS JR.</strong><br />
                    Chief Tourism Operations Officer
                </p>

                <div className="text-center mt-4 mb-4" style={{ fontSize: "12px" }}>
                    <p className="fw-bold mb-1">Verified by</p>
                    <p className="mb-1">{verifier?.getFullName() || "Authorized Officer"}</p>
                    <p className="mb-0">{verifier?.designation || "Tourism Verifier"}</p>
                </div>

                <div className="d-flex align-items-center mt-3" style={{ fontSize: "12px" }}>
                    <QRCodeCanvas
                        value={`https://projectesteem.com/tourism_certificate/verification/${cert.tourism_cert_id}`}
                        size={100}
                    />
                    <div className="ms-3">
                        <div><strong>Tourism Cert ID:</strong> {cert.tourism_cert_id}</div>
                        <div className="text-muted mt-2">
                            This is an official electronic copy issued by the LGU Malay through the Municipal Tourism Office released via Project ESTEEM.
                        </div>
                        <div className="mt-1">
                            <a
                                href={`https://projectesteem.com/tourism_certificate/verification/${cert.tourism_cert_id}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Verify: projectesteem.com/tourism_certificate/verification/{cert.tourism_cert_id}
                            </a>
                        </div>
                    </div>
                </div>


                <hr className="my-4" />
                <p className="text-muted small text-justify" style={{ fontSize: "10px" }}>
                    <strong>Note on Data Privacy:</strong> This certificate contains personal information protected under the Data Privacy Act of 2012 (RA 10173). It is issued solely for official purposes related to tourism regulation and should be stored securely. Any printed copy must be disposed of properly by shredding or other secure means to prevent unauthorized access or disclosure.
                </p>


            </Card>
        </div>
    );
};

export default TourismCert;

