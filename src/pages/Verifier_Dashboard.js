import React, { useState, useEffect } from 'react';
import { Container, Nav, Tab, Row, Col, Card, Image, Tooltip, OverlayTrigger, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUser, faFileExport, faDoorOpen, faCopy, faQrcode, faStepForward, faCheckSquare, faCheckToSlot, faCertificate, faPersonSwimming, faSailboat, faRegistered, faBuilding, faTicket, faTable, faUserGroup } from '@fortawesome/free-solid-svg-icons';
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
import VerifierTicketStatusPage from './VerifierTicketStatusPage';
import ProviderAdminPage from './Verifier_Providers';
import ActivityAdminPage from './Verifier_Activities';
import TourismCertAdminPage from './Verifier_TourismCerts';
import TourismCertQRScannerPage from './Tourism_Cert_Check'
import TicketQRScanner from './Ticket_QR_Check';
import EmployeeRegistrationForm from './Employee_Registration'
import CompanyRegistrationPage from './Company_Registration'
import TicketCreationForm from '../components/TicketCreationForm'
import CompanyPage from './Verifier_Company_List';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

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
    return <>{shouldRender && <EmployeeQRScannerPage hideNavAndFooter />}</>;
};

const TourismTicketsTab = () => (
    <VerifierTicketStatusPage></VerifierTicketStatusPage>
);

const ProfileTab = () => (
    <Card className="p-3 shadow-sm">
        <h5>Verifier Profile</h5>
        <p className="text-muted">Update your personal information or settings here.</p>
    </Card>
);
const TourismCerTab = () => (
    <TourismCertAdminPage></TourismCertAdminPage>
);
const ActivitiesTab = () => (
    <ActivityAdminPage></ActivityAdminPage>
);
const ProvidersTab = () => (
    <ProviderAdminPage></ProviderAdminPage>
);

const SaveReportsTab = () => (
    <Card className="p-3 shadow-sm">
        <h5>Save Reports</h5>
        <p className="text-muted">Download or export saved reports for documentation.</p>
    </Card>
);



export default function VerifierDashboard() {
    const [key, setKey] = useState("scanticket");
    const [verifier, setVerifier] = useState(null);
    const currentUser = auth.currentUser;
    const navigate = useNavigate();
    const isSmallScreen = window.innerWidth < 768;


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

    const [navItems, setNavItems] = useState([
        { key: "scanticket", label: "Scan Tickets", icon: faQrcode },
        { key: "generatetickets", label: "Generate Tourism Tickets", icon: faTicket },
        { key: "tickets", label: "Tourist Activity Tickets", icon: faTable },
        { key: "applicationstatus", label: "Application Status Check", icon: faCheckToSlot },
        { key: "companyList", label: "Company List", icon: faUsers },
        { key: "frontliners", label: "Tourism Frontliners", icon: faUserGroup },
        { key: "tourismCerts", label: "Tourism Certificates", icon: faCertificate },
        { key: "scanTourismCheck", label: "Tourism Cert Checker", icon: faCheckSquare },
        { key: "registerCompany", label: "Register Company", icon: faBuilding },
        { key: "registerEmployee", label: "Register Frontliner", icon: faUser },
        { key: "activities", label: "Activities", icon: faPersonSwimming },
        { key: "providers", label: "Providers", icon: faSailboat },
        { key: "reports", label: "Save Reports", icon: faFileExport },
        { key: "profile", label: "Profile", icon: faUser },
        { key: "logout", label: "Log Out", icon: faDoorOpen },
    ]);

    const [showMore, setShowMore] = useState(false);

    // ✅ Handle Drag & Drop reorder
    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const reordered = Array.from(navItems);
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);
        setNavItems(reordered);
        localStorage.setItem("navOrder", JSON.stringify(reordered)); // persist order
    };

    // ✅ Load saved order if available
    useEffect(() => {
        const saved = localStorage.getItem("navOrder");
        if (saved) {
            setNavItems(JSON.parse(saved));
        }
    }, []);

   return (
    <>
        <AppNavBar bg="dark" variant="dark" title="Verifier Dashboard" />
        <Container fluid className="py-4 px-md-5 bg-light" style={{ minHeight: "100vh" }}>
            <Tab.Container activeKey={key} onSelect={handleSelect}>
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
                                    timeZoneName: "short",
                                })}
                            </p>

                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="nav">
                                    {(provided) => (
                                        <Nav
                                            variant="pills"
                                            className="flex-column gap-2"
                                            activeKey={key}
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                        >
                                            {navItems.map(({ key: navKey, label, icon }, index) => {
                                                const isSmallScreen = window.innerWidth < 768;
                                                const shouldHide = isSmallScreen && index >= 3 && !showMore;

                                                if (shouldHide) return null;

                                                return (
                                                    <Draggable key={navKey} draggableId={navKey} index={index}>
                                                        {(provided) => (
                                                            <Nav.Item
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                            >
                                                                <Nav.Link
                                                                    eventKey={navKey}
                                                                    className={`py-2 px-3 rounded ${
                                                                        key === navKey
                                                                            ? "bg-dark text-white"
                                                                            : "bg-transparent text-secondary border border-secondary"
                                                                    }`}
                                                                >
                                                                    <FontAwesomeIcon icon={icon} className="me-2" />
                                                                    {label}
                                                                </Nav.Link>
                                                            </Nav.Item>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </Nav>
                                    )}
                                </Droppable>
                            </DragDropContext>

                            {/* ✅ Show More button only on small screens */}
                            {window.innerWidth < 768 && (
                                <Button
                                    variant="link"
                                    className="mt-2 text-primary"
                                    onClick={() => setShowMore(!showMore)}
                                >
                                    {showMore ? "Show Less" : "Show More"}
                                </Button>
                            )}
                        </Card>
                    </Col>

                    {/* Tab Content */}
                    <Col md={9}>
                        <Card className="p-4 shadow-sm border-0 bg-white">
                            <Tab.Content>
                                <Tab.Pane eventKey="scanticket">
                                    <TicketQRScanner />
                                </Tab.Pane>
                                <Tab.Pane eventKey="generatetickets">
                                    <TicketCreationForm />
                                </Tab.Pane>
                                <Tab.Pane eventKey="tickets">
                                    <TourismTicketsTab />
                                </Tab.Pane>
                                <Tab.Pane eventKey="companyList">
                                    <CompanyPage />
                                </Tab.Pane>
                                <Tab.Pane eventKey="frontliners">
                                    <TourismFrontlinersTab />
                                </Tab.Pane>
                                <Tab.Pane eventKey="applicationstatus">
                                    <ApplicationStatusTab shouldRender={key === "applicationstatus"} />
                                </Tab.Pane>
                                <Tab.Pane eventKey="profile">
                                    <ProfileTab />
                                </Tab.Pane>
                                <Tab.Pane eventKey="tourismCerts">
                                    <TourismCerTab />
                                </Tab.Pane>
                                <Tab.Pane eventKey="scanTourismCheck">
                                    <TourismCertQRScannerPage hideNavAndFooter />
                                </Tab.Pane>
                                <Tab.Pane eventKey="registerCompany">
                                    <CompanyRegistrationPage hideNavAndFooter />
                                </Tab.Pane>
                                <Tab.Pane eventKey="registerEmployee">
                                    <EmployeeRegistrationForm hideNavAndFooter />
                                </Tab.Pane>
                                <Tab.Pane eventKey="activities">
                                    <ActivitiesTab />
                                </Tab.Pane>
                                <Tab.Pane eventKey="providers">
                                    <ProvidersTab />
                                </Tab.Pane>
                                <Tab.Pane eventKey="reports">
                                    <SaveReportsTab />
                                </Tab.Pane>
                                <Tab.Pane eventKey="logout">
                                    {/* Swal handles logout */}
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
