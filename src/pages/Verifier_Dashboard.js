import React, { useState, useEffect } from 'react';
import { Container, Nav, Tab, Row, Col, Card, Image, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUser, faFileExport, faDoorOpen, faCopy, faQrcode, faStepForward, faCheckSquare, faCheckToSlot } from '@fortawesome/free-solid-svg-icons';
import AppNavBar from '../components/AppNavBar';
import FooterCustomized from '../components/Footer';
import { auth } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import VerifierModel from '../classes/employee';
import VerifierEmployeeListPage from './Verifier_Employee_List';
import { useNavigate } from 'react-router-dom';
import { doSignOut } from '../config/auth';
import Swal from 'sweetalert2';
import { FaStepForward } from 'react-icons/fa';
import EmployeeQRScannerPage from './ApplicationStatusCheck';

const TourismFrontlinersTab = () => (
    <VerifierEmployeeListPage></VerifierEmployeeListPage>
);

const ScanTicketTab = () => (
    <Card className="p-3 shadow-sm">
        <h5>TicketTabScan</h5>
        <p className="text-muted">Update your personal information or settings here.</p>
    </Card>
);

const ApplicationStatusTab = ({ shouldRender }) => {
    return <>{shouldRender && <EmployeeQRScannerPage />}</>;
};

const TourismTicketsTab = () => (
    <Card className="p-3 shadow-sm">
        <h5>Verifier Profile</h5>
        <p className="text-muted">Update your personal information or settings here.</p>
    </Card>
);

const ProfileTab = () => (
    <Card className="p-3 shadow-sm">
        <h5>Verifier Profile</h5>
        <p className="text-muted">Update your personal information or settings here.</p>
    </Card>
);

const SaveReportsTab = () => (
    <Card className="p-3 shadow-sm">
        <h5>Save Reports</h5>
        <p className="text-muted">Download or export saved reports for documentation.</p>
    </Card>
);

export default function VerifierDashboard() {
    const [key, setKey] = useState("frontliners");
    const [verifier, setVerifier] = useState(null);
    const currentUser = auth.currentUser;
    const navigate = useNavigate();

    const handleSelect = async (selectedKey) => {
        if (selectedKey === 'logout') {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: 'You will be logged out of your session.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, log out',
                cancelButtonText: 'Cancel',
            });

            if (result.isConfirmed) {
                await doSignOut();
                Swal.fire('Logged out!', 'You have been successfully signed out.', 'success');
                navigate('/home');
            }
        } else {
            setKey(selectedKey);
        }
    };

    useEffect(() => {
        const fetchVerifierProfile = async () => {
            if (!currentUser) return;

            const q = query(
                collection(db, "verifier"),
                where("userUID", "==", currentUser.uid)
            );

            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                const model = new VerifierModel(data);
                console.log("✅ Verifier Model:", model);
                setVerifier(model); // ✅ Keep class instance intact
            } else {
                console.warn("No verifier found for user:", currentUser.uid);
            }
        };

        fetchVerifierProfile();
    }, []);
    const navItems = [
        { key: 'frontliners', label: 'Tourism Frontliners', icon: faUsers },
        { key: 'applicationstatus', label: 'Application Status Check', icon: faCheckToSlot },
        { key: 'scanticket', label: 'Scan Tickets', icon: faQrcode },
        { key: 'tickets', label: 'Tourism Tickets', icon: faUser },
        { key: 'profile', label: 'Profile', icon: faUser },
        { key: 'reports', label: 'Save Reports', icon: faFileExport },
        { key: 'logout', label: 'Log Out', icon: faDoorOpen },
    ];


    return (
        <>
            <AppNavBar bg="dark" variant="dark" title="Verifier Dashboard" />
            <Container fluid className="py-4 px-md-5 bg-light" style={{ minHeight: "100vh" }}>
                <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
                    <Row>
                        <Col md={3} className="mb-3">
                            <Card className="p-3 shadow-sm border-0">
                                {/* Verifier Info */}
                                {verifier && (
                                    <Row className="justify-content-center my-4">
                                        <Col xs={12} md={10}>
                                            <Row className="align-items-center justify-content-center text-center text-md-start">
                                                <Col xs="auto">
                                                    <Image
                                                        src={verifier.profilePhoto || "/default-profile.png"}
                                                        roundedCircle
                                                        width={180}
                                                        height={180}
                                                        style={{ objectFit: "cover" }}
                                                        alt="Verifier Profile"
                                                    />
                                                </Col>
                                                <Col md="auto" className="text-center">
                                                    <h5 className="mt-4 mb-1 fw-bold">{verifier.getFullName()}</h5>
                                                    <p className="mb-1 text-muted">{verifier.designation}</p>
                                                    <p className="mb-1 text-muted">{auth.currentUser?.uid}</p>

                                                </Col>

                                            </Row>
                                        </Col>
                                    </Row>
                                )}

                                {/* Greeting and Date */}
                                <p className="mt-0 mb-4 text-muted small text-center">
                                    {new Date().toLocaleString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit",
                                        second: "2-digit",
                                        hour12: true,
                                        timeZoneName: "short"
                                    })}
                                </p>

                                {/* Navigation */}
                                <Nav variant="pills" className="flex-column gap-2" onSelect={handleSelect} activeKey={key}>
                                    {navItems.map(({ key: navKey, label, icon }) => (
                                        <Nav.Item key={navKey}>
                                            <Nav.Link
                                                eventKey={navKey}
                                                className={`py-2 px-3 rounded ${key === navKey
                                                    ? 'bg-dark text-white'
                                                    : 'bg-transparent text-secondary border border-secondary'
                                                    }`}
                                            >
                                                <FontAwesomeIcon icon={icon} className="me-2" />
                                                {label}
                                            </Nav.Link>
                                        </Nav.Item>
                                    ))}
                                </Nav>

                            </Card>
                        </Col>

                        {/* Tab Content */}
                        <Col md={9}>
                            <Card className="p-4 shadow-sm border-0 bg-white">
                                <Tab.Content>
                                    <Tab.Pane eventKey="frontliners">
                                        <TourismFrontlinersTab />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="applicationstatus">
                                        <ApplicationStatusTab shouldRender={key === 'applicationstatus'} />
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="scanticket">
                                        <ScanTicketTab />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="tickets">
                                        <TourismTicketsTab />
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="profile">
                                        <ProfileTab />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="reports">
                                        <SaveReportsTab />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="logout">
                                        <TourismFrontlinersTab />
                                    </Tab.Pane>
                                </Tab.Content>
                            </Card>
                        </Col>
                    </Row>
                </Tab.Container>
            </Container>
            <FooterCustomized scrollToId="toppage" />
        </>
    );
}
