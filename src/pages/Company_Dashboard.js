import React, { useEffect, useState } from 'react';
import { Form, Container, Row, Col, Button, Card, Spinner, Image, InputGroup } from 'react-bootstrap';
import { query, where, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../auth/authentication';
import Company from '../classes/company';
import FooterCustomized from '../components/Footer';
import AppNavBar from "../components/AppNavBar";
import Webcam from "react-webcam"; // Install with: npm install react-webcam
import TicketAddressForm from '../components/TicketAddressForm'
import SaveGroupToCloud from "../components/SaveGroup"; // Adjust the import path if necessary
import TicketModel from '../classes/tickets';
import TicketActivitiesForm from '../components/TicketActivitiesForm';

export default function CompanyDashboardPage() {
    const { userLoggedIn } = useAuth();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const [ticketData, setTicketData] = useState(new TicketModel({}));
    const handleChange = (e) => {
        const { name, value } = e.target;

        setTicketData((prevData) => {
            const newData = { ...prevData };

            if (name.startsWith("proprietor.")) {
                const key = name.split(".")[1];
                newData.proprietor = { ...prevData.proprietor, [key]: value };
            } else if (name.startsWith("address.")) {
                const key = name.split(".")[1];
                newData.address = { ...prevData.address, [key]: value };
            } else {
                newData[name] = value;
            }

            return new Company(newData);
        });
    };



    useEffect(() => {
        const fetchticketData = async () => {
            if (!currentUser?.uid) return;

            try {
                const q = query(collection(db, "company"), where("userUID", "==", currentUser.uid));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const ticketData = querySnapshot.docs[0].data();
                    const companyInstance = new Company(ticketData);
                    setCompany(companyInstance);
                } else {
                    console.warn("No company document found with this UID");
                }
            } catch (error) {
                console.error("Error fetching company data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchticketData();
    }, [currentUser]);

    // Pagination
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    const nextStep = () => setCurrentStep((prev) => prev + 1);
    const prevStep = () => setCurrentStep((prev) => prev - 1);



    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" variant="primary" />
                <p>Loading company dashboard...</p>
            </Container>
        );
    }

    if (!company) {
        return (
            <Container className="text-center mt-5">
                <p>No company data found for this user.</p>
            </Container>
        );
    }


    return (
        <Container fluid>
            <AppNavBar bg="dark" variant="dark" title="Left Appbar" />

            <Row>
                <Col md={7} className="p-0">
                    <Container className="container" id="toppage">
                        <Container className='body-container'>
                            <h1>Welcome, {company.name}</h1>
                            {company.logo && (
                                <Image src={company.logo} rounded fluid style={{ maxHeight: 120 }} alt="Company Logo" className="my-3" />
                            )}
                            <p><strong>Email:</strong> {company.email}</p>
                            <p><strong>Contact:</strong> {company.contact}</p>
                            <p><strong>Classification:</strong> {company.classification}</p>
                            <p><strong>Status:</strong> {company.status}</p>
                            <p><strong>Ownership:</strong> {company.ownership}</p>
                            <p><strong>Type:</strong> {company.type}</p>
                            <p><strong>Year Established:</strong> {company.year}</p>
                            <p><strong>Permit:</strong> {company.permit}</p>

                            <p><strong>Proprietor:</strong> {company.proprietor?.first} {company.proprietor?.middle} {company.proprietor?.last}</p>

                            <p><strong>Full Address:</strong> {`${company.address.street}, ${company.address.barangay}, ${company.address.town}, ${company.address.province}, ${company.address.region}, ${company.address.country}`}</p>

                        </Container>


                    </Container>
                </Col>


                <Col md={5} className="p-0">
                    <Container className="container custom-container">
                        <Container className='body-container'>
                            <Form className="custom-form ">
                                <p className='barabara-label'>TOURIST ACTIVITY FORM</p>
                                <p className="sub-title-blue">Fill-out this form to generate <strong>QR code</strong>. Accurate information is vital in ensuring safety, maintaining reliable records, generating tour activity reports, providing immediate response in case of emergency, investigating complaints, and optimizing overall service quality.</p>

                                {/* Step 1: Company Details 1 */}
                                {currentStep === 1 && (
                                    <>
                                        <Form.Group className="my-2">
                                            <Form.Label className="fw-bold mt-2">Name (Full Name is Optional)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                placeholder='Business Name Registered Under DTI'
                                                value={ticketData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                        <Form.Group className="my-2">
                                            <Form.Label className="fw-bold mt-2">Contact Information (Optional)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                placeholder='Email Address, Telephone, or Mobile Number'
                                                value={ticketData.contact}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                        <Form.Group className="my-2">
                                            <Form.Label className="fw-bold mt-2">Accommodation Establishment</Form.Label>
                                            <Form.Control
                                                type="text"
                                                required
                                                name="name"
                                                placeholder="Hotel/Resort where the guest is staying"
                                                value={ticketData.accommodation}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>



                                    </>
                                )}
                                {/* Step 2: Company Details */}
                                {currentStep === 2 && (
                                    <>
                                        <TicketAddressForm
                                            groupData={ticketData}
                                            setGroupData={setTicketData}
                                            ifForeign={true} // or false depending on what default you want
                                        />






                                    </>
                                )}
                                {/* Step 3: Company Details */}
                                {currentStep === 3 && (
                                    <>
                                        <TicketActivitiesForm
                                            groupData={ticketData}
                                            setGroupData={setTicketData}
                                        />


                                    </>
                                )}
                                {/* Pagination Buttons */}
                                <Container className='empty-container'></Container>
                                {/* Page Indicators */}
                                <Container className="d-flex justify-content-center my-1">
                                    {Array.from({ length: totalSteps }, (_, index) => (
                                        <span
                                            key={index}
                                            className={`mx-1 step-indicator ${currentStep === index + 1 ? "active" : ""}`}
                                        >
                                            ●
                                        </span>
                                    ))}
                                </Container>
                                <Container className="d-flex justify-content-between mt-3">
                                    {/* Previous Button - Show if currentStep > 1 */}
                                    {currentStep > 1 && (
                                        <Button variant="secondary" onClick={prevStep}>
                                            Previous
                                        </Button>
                                    )}

                                    {/* Next Button or Save Button on Last Step */}
                                    {currentStep < 3 ? (
                                        <Button className="color-blue-button" variant="primary" onClick={nextStep}>
                                            Next
                                        </Button>
                                    ) : (
                                        <>
                                            {/* submit data here */}
                                        </>

                                    )}
                                </Container>

                                <Container className='empty-container'></Container>

                                {/* Custom Styles for Dots */}
                                <style>
                                    {`
                            .step-indicator {
                                font-size: 1rem;
                                color: #ccc;
                                transition: color 0.3s ease-in-out;
                            }
                            .step-indicator.active {
                                color: #1F89B2; /* Bootstrap primary color */
                            }
                        `}
                                </style>




                            </Form>
                        </Container>
                    </Container>
                </Col>
                <FooterCustomized scrollToId="toppage" />

            </Row>



            <Row className="mt-4">
                <Col>
                    <Card>
                        <Card.Body>
                            <Card.Title>Company Summary</Card.Title>
                            <Card.Text>
                                You're logged in as <strong>{company.classification}</strong>, status: <strong>{company.status}</strong>.
                            </Card.Text>
                            <Card.Text>
                                Total Employees: <strong>{company.employee.length}</strong> <br />
                                Total Tickets Issued: <strong>{company.ticket.length}</strong>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
