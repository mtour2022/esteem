// src/components/CompanyTourismCert.js
import React, { useEffect, useRef, useState } from "react";
import { Card, Button, Row, Col, Container } from "react-bootstrap";
import logo from "../assets/images/lgu.png";
import bagongpilipinaslogo from "../assets/images/bagongpilipinas.png";
import { QRCodeCanvas } from "qrcode.react";
import Swal from "sweetalert2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faPrint } from "@fortawesome/free-solid-svg-icons";
import esign from "../assets/images/sirfelixsign.png";
import { TourismCertificateModel } from "../classes/tourism_certificate";
import { db } from "../config/firebase";
import { getDoc, doc } from "firebase/firestore";
import FooterCustomized from './Footer';
import AppNavBar from "./AppNavBar";

const CompanyTourismCert = ({ company, hideNavAndFooter = false }) => {
    const certRef = useRef();
    const loadingShown = useRef(false);
    const [cert, setCert] = useState(null);
    const [verifier, setVerifier] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch latest certificate for the company
    useEffect(() => {
        const fetchLatestCert = async () => {
            if (!company?.tourism_certificate_ids?.length) return;

            let latestCert = null;

            for (const certId of company.tourism_certificate_ids) {
                const certSnap = await getDoc(doc(db, "tourism_cert", certId));
                if (certSnap.exists()) {
                    const data = certSnap.data();
                    const certModel = new TourismCertificateModel({ ...data, tourism_cert_id: certSnap.id });

                    if (!latestCert || new Date(certModel.date_Issued) > new Date(latestCert.date_Issued)) {
                        latestCert = certModel;
                    }
                }
            }

            if (latestCert) {
                setCert(latestCert);

                // Fetch verifier details
                const verifierSnap = await getDoc(doc(db, "verifier", latestCert.verifier_id));
                if (verifierSnap.exists()) {
                    const v = verifierSnap.data();
                    setVerifier({
                        getFullName: () => `${v.firstname} ${v.middlename || ""} ${v.surname}`.trim(),
                        designation: v.designation || "Tourism Verifier"
                    });
                }
            }

            setLoading(false);
        };

        fetchLatestCert();
    }, [company]);

    // SweetAlert loading
    useEffect(() => {
        if (loading && !loadingShown.current) {
            loadingShown.current = true;
            Swal.fire({
                title: "Loading certificate...",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading()
            });
        } else if (!loading && loadingShown.current) {
            Swal.close();
            loadingShown.current = false;
        }
    }, [loading]);

    if (!cert || !verifier) return null;

    const issueDateFormatted = new Date(cert.date_Issued).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const expireDateFormatted = new Date(cert.date_Expired).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const exportWithFixedSize = async (exportType = "image") => {
        if (!certRef.current) return;

        const originalWidth = certRef.current.style.width;
        const originalHeight = certRef.current.style.height;
        const originalMaxWidth = certRef.current.style.maxWidth;

        certRef.current.style.width = "816px";
        certRef.current.style.height = "1056px";
        certRef.current.style.maxWidth = "none";

        await new Promise((resolve) => setTimeout(resolve, 50));

        const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true });

        if (exportType === "image") {
            const link = document.createElement("a");
            link.download = `tourism_certificate_${cert.tourism_cert_id}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } else if (exportType === "pdf") {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("portrait", "pt", "letter");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
            const imgWidth = canvas.width * ratio;
            const imgHeight = canvas.height * ratio;
            const x = (pageWidth - imgWidth) / 2;
            const y = 0;

            pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
            pdf.save(`tourism_certificate_${cert.tourism_cert_id}.pdf`);
        }

        certRef.current.style.width = originalWidth;
        certRef.current.style.height = originalHeight;
        certRef.current.style.maxWidth = originalMaxWidth;
    };

    const handleDownloadImage = () => exportWithFixedSize("image");
    const handleDownloadPDF = () => exportWithFixedSize("pdf");

    return (
        <Container fluid>
            {!hideNavAndFooter && <AppNavBar bg="dark" variant="dark" title="Tourism Certificate QR Scanner" />}

            <div className="d-flex flex-column align-items-center mt-5">

                <div className="alert alert-info px-3 py-3 mb-4" style={{
                    marginLeft: "10px",
                    marginRight: "10px",
                    maxWidth: "750px",
                    fontSize: "12px",
                    textAlign: "justify",
                    backgroundColor: "#e8f4fa",
                    borderLeft: "4px solid #17a2b8",
                }}>
                    <p className="mb-0 text-muted">
                        The generated Tourism Certificate is an official digital copy issued by the
                        Local Government Unit of Malay through the Municipal Tourism Office,
                        certifying compliance with the applicable Municipal Tourism requirements.
                        Printed copies are considered valid reproductions of the original digital certificate.
                    </p>
                </div>

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

    <div
  style={{
    width: "100%",          // Fill parent
    height: "80vh",         // Limit vertical space on screen
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    overflowY: "auto",      // ✅ Scroll if card exceeds container
    padding: "20px",
    boxSizing: "border-box",
  }}
>
  <Card
    ref={certRef}
    className="p-5 my-3"
    style={{
      borderColor: "white",
      width: "816px",         // Letter width (A4 ~ 8.5in x 11in)
      height: "1056px",       // Letter height
      position: "relative",
      backgroundColor: "white",
      flexShrink: 0           // Prevent shrinking below 816px
    }}
  >
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url(${require('../assets/images/lgu.png')})`,
                        backgroundSize: "80%",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        opacity: 0.05,
                        zIndex: 0
                    }}></div>

                    <div style={{ position: "relative", zIndex: 1 }}>
                        {/* Header */}
                        <Row className="align-items-center mb-2 mt-4 text-center">
                            <Col xs="4"><div className="d-flex justify-content-end"><img src={logo} height="80" alt="LGU Logo" /></div></Col>
                            <Col xs="4">
                                <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
                                    <strong>Republic of the Philippines</strong><br />
                                    Province of Aklan<br />
                                    Municipality of Malay<br /><br />
                                </div>
                            </Col>
                            <Col xs="4"><div className="d-flex justify-content-start"><img src={bagongpilipinaslogo} height="80" alt="Bagong Pilipinas Logo" /></div></Col>
                        </Row>

                        <p className="text-center" style={{ fontSize: "12px" }}><strong>Municipal Tourism Office</strong></p>
                        <h3 className="barabara-label text-center mt-2" style={{ fontSize: "36px" }}>{cert.type.toUpperCase()}</h3>
                        {cert.type !== "Recommendation" && (
                            <p className="text-end mb-4 mt-4" style={{ fontSize: "12px" }}>Dated <strong>{issueDateFormatted}</strong></p>
                        )}
                        <p className="mt-1 text-justify" style={{ fontSize: "12px" }}>
                            This is to certify that <strong>{company.name}</strong>, a <strong>
                                {company.classification
                                    ? company.classification
                                        .split(" ")
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(" ")
                                    : ""}
                            </strong> and represented by <strong>{company.proprietor.first}{" "}{company.proprietor.last}</strong>,
                            has successfully completed the Municipal Tourism requirements pursuant to Section 3, letters D and E of the Municipal Ordinance No. 150 series of 2022.
                        </p>

                        <p className="text-justify" style={{ fontSize: "12px" }}>
                            This certificate is valid until <strong>{expireDateFormatted}</strong>.
                        </p>

                        <p className="text-center mb-2" style={{ fontSize: "12px" }}>This is issued for Mayor's Permit purposes only.</p>

                        {/* Signature */}
                        <p className="text-center mt-2 mb-5" style={{ fontSize: "12px" }}><strong>Digitally Signed by</strong></p>
                        <div className="position-relative text-center mb-0" style={{ fontSize: "12px" }}>
                            <div style={{ position: "relative", display: "inline-block" }}>
                                <img
                                    src={esign}
                                    alt="E-signature"
                                    height="50"
                                    style={{
                                        position: "absolute",
                                        top: "-25px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        zIndex: 0,
                                        opacity: 0.8,
                                        pointerEvents: "none",
                                        userSelect: "none"
                                    }}
                                    draggable={false}
                                    onContextMenu={(e) => e.preventDefault()}
                                />
                                <strong style={{ position: "relative", zIndex: 1 }}>
                                    DR. FELIX G. DELOS SANTOS JR.
                                </strong>
                            </div>
                            <br />
                            Chief Tourism Operations Officer
                        </div>

                        <p className="mt-3 mb-3 text-center" style={{ fontSize: "12px" }}>
                            <strong>Verified by</strong><br />
                            <span className="mb-1">{verifier.getFullName()}<br />{verifier.designation}</span>
                        </p>

                        <div className="d-flex align-items-center mt-3" style={{ fontSize: "12px" }}>
                            <QRCodeCanvas
                                value={`https://projectesteem.com/tourism_certificate/${cert.tourism_cert_id}`}
                                size={100}
                            />
                            <div className="ms-3">
                                <div><strong>Control No.:</strong> {cert.tourism_cert_id}</div>
                                <div className="text-muted mt-2">This is an official electronic copy issued by the LGU Malay through the Municipal Tourism Office via Project ESTEEM - Electronic System for Tracking, Evaluating, and Expert Monitoring of Tourism Information in The Municipality of Malay.</div>
                                <div className="mt-1">
                                    <a
                                        href={`https://projectesteem.com/tourism_certificate/${cert.tourism_cert_id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Verify: projectesteem.com/tourism-certificate/{cert.tourism_cert_id}
                                    </a>
                                </div>
                            </div>
                        </div>

                        <hr className="my-4" />
                        <p
                            className="text-muted small text-justify"
                            style={{ fontSize: "10px" }}
                        >
                            <strong>Note on Data Privacy:</strong> This certificate contains personal
                            information protected under the Data Privacy Act of 2012 (Republic Act No.
                            10173). Any unauthorized collection, use, disclosure, or processing of this
                            information is strictly prohibited. This document is issued solely for its
                            intended purpose and should be handled with utmost confidentiality.
                        </p>


                        <hr className="mt-1 mb-4" />

                        <div className="text-muted small text-center" style={{ fontSize: "10px", lineHeight: "1.5" }}>
                            <strong>LGU MALAY - MUNICIPAL TOURISM OFFICE</strong><br />
                            Main Office: 2nd Floor, Malay Municipal Hall, Brgy. Poblacion, Malay, Aklan 5608, Philippines<br />
                            Boracay Satellite Office: 2nd Floor, Malay Municipal Hall - Boracay Annex<br />
                            Email: <a href="mailto:lgumalaytourism@yahoo.com">lgumalaytourism@yahoo.com</a><br />
                            Telephone: (036) 288-8827, (036) 288-2493<br />
                            Website: <a href="https://boracayinfoguide.com" target="_blank" rel="noopener noreferrer">boracayinfoguide.com</a><br />
                            Facebook: <a href="https://facebook.com/malaytourism" target="_blank" rel="noopener noreferrer">/malaytourism</a>
                        </div>
                    </div>
                </Card>
                </div>
            </div>

            {!hideNavAndFooter && (
                <>
                    <div className="my-5"></div>
                    <FooterCustomized scrollToId="toppage" />
                </>
            )}
        </Container>
    );
};

export default CompanyTourismCert;
