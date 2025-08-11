// src/components/EndorsementCard.js
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
import FooterCustomized from '../components/Footer';
import AppNavBar from "../components/AppNavBar";

const TourismCert = ({ emp, company, hideNavAndFooter = false }) => {
    const certRef = useRef();
    const loadingShown = useRef(false);
    const [cert, setCert] = useState(null);
    const [verifier, setVerifier] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch latest certificate based on IDs
    useEffect(() => {
        const fetchLatestCert = async () => {
            if (!emp?.tourism_certificate_ids?.length) return;

            let latestCert = null;

            for (const certId of emp.tourism_certificate_ids) {
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
    }, [emp]);

    // Handle loading state with SweetAlert
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

    const handleDownloadImage = async () => {
        if (!certRef.current) return;

        const canvas = await html2canvas(certRef.current, {
            scale: 300 / 96,
            useCORS: true
        });

        const link = document.createElement("a");
        link.download = `tourism_certificate_${cert.tourism_cert_id}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    const handleDownloadPDF = async () => {
        if (!certRef.current) return;

        const canvas = await html2canvas(certRef.current, {
            scale: 2,
            useCORS: true
        });

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
    };

    return (
        <Container fluid>
      {!hideNavAndFooter && <AppNavBar bg="dark" variant="dark" title="Tourism Certificate QR Scanner" />}

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

                <Card ref={certRef} className="p-5 my-3" style={{
                    borderColor: "white",
                    width: "816px",
                    height: "1056px",
                    maxWidth: "100%",
                    overflow: "hidden",
                    position: "relative",
                    backgroundColor: "white"
                }}>
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

                    {/* Body */}
                    <p className="mt-1 text-justify" style={{ fontSize: "12px" }}>
                        {cert.type === "Recommendation" ? (
                            <>
                                <br />
                                This is to recommend <strong>{emp.firstname} {emp.middlename || ''} {emp.surname} {emp.suffix || ''}</strong> of <strong>{company?.name || "Loading..."}</strong> in the issuance of Mayor's Permit in pursuant
                                to section 3, letters d and e of the Municipal Ordinance No. 150 series of 2022 (Creating of Municipal Tourism Office and Defining its Duties and Functions).
                            </>
                        ) : (
                            <>
                                This is to endorse <strong>{emp.firstname} {emp.middlename || ''} {emp.surname} {emp.suffix || ''}</strong> of <strong>{company?.name || "Loading..."}</strong> has successfully completed the Municipal Tourism requirements
                                pursuant to section 3, letters d and e of the Municipal Ordinance No. 150 series of 2022 (Creating of Municipal Tourism office and Defining its Duties and Functions).
                            </>
                        )}
                    </p>

                    <p className="text-justify" style={{ fontSize: "12px" }}>
                        {cert.type === "Recommendation" ? (
                            <>This recommendation is issued on <strong>{issueDateFormatted}</strong>. Valid until <strong>{expireDateFormatted}</strong>.</>
                        ) : (
                            <>This endorsement is valid until <strong>{expireDateFormatted}</strong>.</>
                        )}
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

                    {/* QR and footer */}
                    <div className="d-flex align-items-center mt-3" style={{ fontSize: "12px" }}>
                        <QRCodeCanvas
                            value={`https://projectesteem.com/tourism_certificate/verification/${cert.tourism_cert_id}`}
                            size={100}
                        />
                        <div className="ms-3">
                            <div><strong>Control No.:</strong> {cert.tourism_cert_id}</div>
                            <div className="text-muted mt-2">This is an official electronic copy issued by the LGU Malay...</div>
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
                        <strong>Note on Data Privacy:</strong> This certificate contains personal information protected...
                    </p>
                    <hr className="mt-1 mb-4" />

                    <div className="text-muted small text-center" style={{ fontSize: "10px", lineHeight: "1.5" }}>
                        <strong>LGU MALAY - MUNICIPAL TOURISM OFFICE</strong><br />
                        Main Office: 2nd Floor, Malay Municipal Hall, Brgy. Poblacion, Malay, Aklan 5608, Philippines<br />
                        Boracay Satellite Office: 2nd Floor, Malay Municipal Hall - Boracay Annex...<br />
                        Email: <a href="mailto:lgumalaytourism@yahoo.com">lgumalaytourism@yahoo.com</a><br />
                        Telephone: (036) 288-8827, (036) 288-2493<br />
                        Website: <a href="https://boracayinfoguide.com" target="_blank" rel="noopener noreferrer">boracayinfoguide.com</a><br />
                        Facebook: <a href="https://facebook.com/malaytourism" target="_blank" rel="noopener noreferrer">/malaytourism</a>
                    </div>
                </Card>

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

export default TourismCert;
