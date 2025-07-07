import React, { useEffect, useState } from 'react';
import { Form, Container, Row, Col, Button, Card, Spinner, Image, InputGroup, Dropdown } from 'react-bootstrap';
import { query, where, collection, getDocs, documentId } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../auth/authentication';
import Company from '../classes/company';
import FooterCustomized from '../components/Footer';
import AppNavBar from "../components/AppNavBar";
import TicketAddressForm from '../components/TicketAddressForm'
import TicketModel from '../classes/tickets';
import TicketActivitiesForm from '../components/TicketActivitiesForm';
import Select from "react-select";
import SaveTicketToCloud from '../components/SaveTicket';
import TicketSummary from '../components/TicketSummary';
import CompanyDashboardPanel from '../components/CompanyDashBoardPanel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand, faCompress, faBars } from '@fortawesome/free-solid-svg-icons';

export default function CompanyDashboardPage() {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [savedTicket, setSavedTicket] = useState(null);
    const { userLoggedIn } = useAuth();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    // Initial state (when setting up groupData for the first time)
    const [ticketData, setTicketData] = useState(new TicketModel({
        activities: [
            {
                activity_area: "",
                activity_date_time_start: "",
                activity_date_time_end: "",
                activities_availed: [],
                activity_num_pax: "",
                activity_num_unit: "",
                activity_agreed_price: "",
                activity_expected_price: "",
            },
        ]
    }));
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

            return new TicketModel(newData);

        });
    };
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [employees, setEmployees] = useState([]);
    const fetchEmployeesByIds = async (ids) => {
        if (!ids || ids.length === 0) return [];

        const batches = [];
        for (let i = 0; i < ids.length; i += 10) {
            const chunk = ids.slice(i, i + 10);
            const q = query(collection(db, "employee"), where(documentId(), "in", chunk));
            batches.push(getDocs(q));
        }

        const results = await Promise.all(batches);

        return results.flatMap(snapshot =>
            snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        );
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
                    // 👇 Fetch employees
                    if (companyInstance.employee && Array.isArray(companyInstance.employee)) {
                        const employeeData = await fetchEmployeesByIds(companyInstance.employee);
                        setEmployees(employeeData);
                        console.log("EMPLOYEES in fetchticket", employeeData);

                    }

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
    const totalSteps = 4;

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

    const isStep3FormValid = () => {
        return (
            ticketData.name?.trim() &&
            ticketData.accommodation?.trim() &&
            ticketData.employee_id &&
            Array.isArray(ticketData.address) &&
            ticketData.address.length > 0 &&
            Array.isArray(ticketData.activities) &&
            ticketData.activities.length > 0
        );
    };





    return (
        <Container fluid>
            <AppNavBar bg="dark" variant="dark" title="Left Appbar" />

            <Row>
                <Col md={isFullScreen ? 12 : 8} className="p-0">
                    {/* Control Bar Row */}
<div className="d-flex justify-content-end align-items-center gap-2 p-3 me-0 me-md-4 mt-4">
                        <Button
                            variant="outline-secondary"
                            onClick={() => setIsFullScreen((prev) => !prev)}
                            title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        >
                            {isFullScreen ? "Collapse" : "Expand"}
                            <FontAwesomeIcon className="ms-2" icon={isFullScreen ? faCompress : faExpand} />
                        </Button>

                        <Dropdown align="end">
                            <Dropdown.Toggle
                                as={Button}
                                variant="outline-secondary"
                                id="dropdown-custom-button"
                            >
                                <FontAwesomeIcon icon={faBars} />
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item>Profile</Dropdown.Item>
                                <Dropdown.Item>Log Out</Dropdown.Item>
                                <Dropdown.Item>Complaint Form</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>

                    {/* Main Dashboard Content */}
                    <CompanyDashboardPanel company={company} employees={employees} />
                </Col>



                {!isFullScreen && (
                    <Col md={4} className="p-0">
                        <Container className="container custom-container">
                            <Container className='body-container'>
                                <Form className="custom-form mt-4">
                                    <p className='barabara-label'>TOURIST ACTIVITY FORM</p>
                                    <p className="sub-title-blue">Fill-out this form to generate <strong>QR code</strong>. Accurate information is vital in ensuring safety, maintaining reliable records, generating tour activity reports, providing immediate response in case of emergency, investigating complaints, and optimizing overall service quality.</p>

                                    {/* Step 1: Company Details 1 */}
                                    {currentStep === 1 && (
                                        <>
                                            <Form.Group className="my-2">
                                                <Form.Label className="fw-bold mt-2">Representative's Name (Full Name is Optional)</Form.Label>
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
                                                    name="contact"
                                                    placeholder='Email Address, Telephone, or Mobile Number'
                                                    value={ticketData.contact}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                            <Form.Group className="my-2">
                                                <Form.Label className="fw-bold mt-2">Accommodation Establishment</Form.Label>
                                                <Form.Control
                                                    type="text"

                                                    name="accommodation"
                                                    placeholder="Hotel/Resort where the guest is staying"
                                                    value={ticketData.accommodation}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </Form.Group>
                                            <Form.Group className="my-3">
                                                <Form.Label><strong>Assigned To</strong></Form.Label>
                                                <br />
                                                <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>
                                                    Select designated employee to assist the guests.
                                                </Form.Label>
                                                <Select
                                                    options={employees.map(emp => ({
                                                        value: emp.employeeId,
                                                        label: `${emp.firstname} ${emp.surname} — ${emp.designation || "No title"}`,
                                                        contact: emp.contact,
                                                        raw: emp
                                                    }))}
                                                    placeholder="Select an employee"
                                                    onChange={(selectedOption) => {
                                                        setTicketData(prev => ({
                                                            ...prev,
                                                            employee_id: selectedOption?.value || ""
                                                        }));
                                                        setSelectedEmployee(selectedOption ? selectedOption.raw : null);
                                                    }}
                                                    value={
                                                        employees
                                                            .map(emp => ({
                                                                value: emp.employeeId,
                                                                label: `${emp.firstname} ${emp.surname} — ${emp.designation || "No title"}`,
                                                                contact: emp.contact,
                                                                raw: emp
                                                            }))
                                                            .find(option => option.value === ticketData.employee_id) || null
                                                    }
                                                    isClearable
                                                />

                                            </Form.Group>

                                            {selectedEmployee && (
                                                <Form.Group className="mt-2">
                                                    <Form.Label>Assignee's Contact Information</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={selectedEmployee.contact || "No contact provided"}
                                                        readOnly
                                                    />
                                                </Form.Group>
                                            )}




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
                                    {/* Step 4: Ticket Summary */}
                                    {currentStep === 4 && savedTicket && (
                                        <TicketSummary ticket={savedTicket} />
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
                                    {currentStep === 4 ? (
                                        <Container className="d-flex justify-content-between mt-3">
                                            <Button
                                                className="color-blue-button"
                                                variant="primary"
                                                onClick={() => {
                                                    window.location.reload(); // refresh the entire screen
                                                }}
                                            >
                                                Generate More
                                            </Button>
                                        </Container>

                                    ) : (
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
                                                <SaveTicketToCloud
                                                    groupData={ticketData}
                                                    setGroupData={setTicketData}
                                                    currentUserUID={currentUser.uid}
                                                    companyID={company.company_id}
                                                    onSuccess={(finalTicket) => {
                                                        setSavedTicket(finalTicket);
                                                        setCurrentStep(4);
                                                    }}
                                                    disabled={!isStep3FormValid() && (
                                                        <div className="text-danger mt-2">
                                                            Please complete all required fields before saving.
                                                        </div>
                                                    )}
                                                // 👈 add this line
                                                />
                                            )}

                                        </Container>
                                    )}


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
                )}

                <FooterCustomized scrollToId="toppage" />

            </Row>



        </Container>
    );
}
