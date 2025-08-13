import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Spinner, Alert } from "react-bootstrap";
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import Select from "react-select";
import { db } from "../config/firebase";
import { useAuth } from "../auth/authentication";
import TicketModel from "../classes/tickets";
import Company from "../classes/company";
import TicketAddressForm from "./TicketAddressForm";
import TicketActivitiesForm from "./TicketActivitiesForm";
import TicketSummary from "./TicketSummary";
import SaveTicketToCloud from "./SaveTicket";
import Swal from 'sweetalert2';

export default function TicketCreationForm() {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [savedTicket, setSavedTicket] = useState(null);
    const { currentUser } = useAuth();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [companies, setCompanies] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [ticketData, setTicketData] = useState(
        new TicketModel({
            address: [],
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
                    activity_selected_providers: [],
                    activity_base_price: "",
                },
            ],
            start_date_time: "",
            end_date_time: "",
        })
    );
    // ✅ Step 1: Fetch all companies initially
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const snapshot = await getDocs(collection(db, "company"));
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCompanies(list);
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        };
        fetchCompanies();
    }, []);

    const handleCompanyChange = async (company) => {
        setSelectedCompany(company);
        setEmployees([]);
        setSelectedEmployee(null);

        if (!company) return;

        Swal.fire({
            title: "Loading employees...",
            text: "Please wait while we fetch employee data.",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
          if (company.employees && company.employees.length > 0) {
    const q = query(
        collection(db, "employee"),
        where("employeeId", "in", company.employees)
    );
                const snapshot = await getDocs(q);
                const empList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEmployees(empList);
            } else {
                setEmployees([]);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            Swal.close();
        }
    };
    const resetTicketForm = () => {
        setCurrentStep(1);
        setSavedTicket(null);
        setTicketData(
            new TicketModel({
                address: [],
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
                        activity_selected_providers: [],
                        activity_base_price: "",
                    },
                ],
                start_date_time: "",
                end_date_time: "",
            })
        );
        setRefreshKey((prev) => prev + 1);
    };

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



    const fetchEmployeesByIds = async (ids) => {
        if (!ids || ids.length === 0) return [];
        const batches = [];

        for (let i = 0; i < ids.length; i += 10) {
            const chunk = ids.slice(i, i + 10);
            const q = query(collection(db, "employee"), where(documentId(), "in", chunk));
            batches.push(getDocs(q));
        }

        const results = await Promise.all(batches);
        return results.flatMap((snapshot) =>
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
    };

    useEffect(() => {
        const fetchTicketData = async () => {
            if (!currentUser?.uid) {
                setLoading(false);
                return;
            }

            try {
                const q = query(collection(db, "company"), where("userUID", "==", currentUser.uid));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const companyData = querySnapshot.docs[0].data();
                    const companyInstance = new Company(companyData);
                    setCompany(companyInstance);

                    if (Array.isArray(companyInstance.employee) && companyInstance.employee.length > 0) {
                        const employeeData = await fetchEmployeesByIds(companyInstance.employee);
                        setEmployees(employeeData);
                    }
                }
            } catch (error) {
                console.error("Error fetching company data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTicketData();
    }, [currentUser]);

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;
    const nextStep = () => setCurrentStep((prev) => prev + 1);
    const prevStep = () => setCurrentStep((prev) => prev - 1);

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
            {loading && (
                <Container className="text-center mt-3">
                    <Spinner animation="border" variant="primary" size="sm" /> Loading form data...
                </Container>
            )}

            

            <Row>
                <Col md={12} className="p-0">
                    <Container className="container custom-container">
                        <Container className="body-container">
                            <Form className="custom-form mt-4">
                                <p className="barabara-label">TOURIST ACTIVITY FORM</p>
                                <p className="sub-title-blue">
                                    Fill-out this form to generate <strong>QR code</strong>. Accurate information is vital in
                                    ensuring safety, maintaining reliable records, generating tour activity reports,
                                    providing immediate response in case of emergency, investigating complaints, and
                                    optimizing overall service quality.
                                </p>

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
                                        {/* ✅ Company Selection */}
                                        <Form.Group className="my-3">
                                            <Form.Label><strong>Company</strong></Form.Label>
                                            <Select
                                                options={companies.map(comp => ({
                                                    value: comp.id,
                                                    label: comp.name || "Unnamed Company",
                                                    employees: comp.employee || []
                                                }))}
                                                placeholder="Select a company"
                                                onChange={(option) => handleCompanyChange(option)}
                                                value={selectedCompany}
                                                isClearable
                                            />
                                        </Form.Group>

                                        {/* ✅ Employee Selection */}
                                        <Form.Group className="my-3">
                                            <Form.Label><strong>Assigned To</strong></Form.Label><br />
                                            <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>
                                                Select designated employee to assist the guests.
                                            </Form.Label>
                                            <Select
                                                options={employees
                                                    .filter(emp =>
                                                        emp.status?.toLowerCase() === "approved" &&
                                                        emp.company_status?.toLowerCase() === "approved"
                                                    )
                                                    .map(emp => ({
                                                        value: emp.employeeId,
                                                        label: `${emp.firstname} ${emp.surname} — ${emp.designation || "No title"}`,
                                                        raw: emp
                                                    }))}
                                                placeholder="Select an employee"
                                                onChange={(selectedOption) => {
                                                    setTicketData(prev => ({
                                                        ...prev,
                                                        employee_id: selectedOption?.value || "",
                                                    }));
                                                    setSelectedEmployee(selectedOption ? selectedOption.raw : null);
                                                }}
                                                value={
                                                    employees
                                                        .filter(emp =>
                                                            emp.status?.toLowerCase() === "approved" &&
                                                            emp.company_status?.toLowerCase() === "approved"
                                                        )
                                                        .map(emp => ({
                                                            value: emp.employeeId,
                                                            label: `${emp.firstname} ${emp.surname} — ${emp.designation || "No title"}`,
                                                            raw: emp
                                                        }))
                                                        .find(option => option.value === ticketData.employee_id) || null
                                                }
                                                isClearable
                                                isDisabled={!selectedCompany}
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

                                {currentStep === 2 && (
                                    <TicketAddressForm groupData={ticketData} setGroupData={setTicketData} ifForeign />
                                )}
                                {currentStep === 3 && (
                                    <TicketActivitiesForm groupData={ticketData} setGroupData={setTicketData} />
                                )}
                                {currentStep === 4 && savedTicket && <TicketSummary ticket={savedTicket} />}

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
                                        <Button className="color-blue-button" variant="primary" onClick={resetTicketForm}>
                                            Generate More
                                        </Button>
                                    </Container>
                                ) : (
                                    <Container className="d-flex justify-content-between mt-3">
                                        {currentStep > 1 && (
                                            <Button variant="secondary" onClick={prevStep}>
                                                Previous
                                            </Button>
                                        )}
                                        {currentStep < 3 ? (
                                            <Button className="color-blue-button" variant="primary" onClick={nextStep}>
                                                Next
                                            </Button>
                                        ) : (
                                            <SaveTicketToCloud
                                                groupData={ticketData}
                                                setGroupData={setTicketData}
                                                currentUserUID={currentUser?.uid || ""}
                                                companyID={selectedCompany?.value || ""}
                                                onSuccess={(finalTicket) => {
                                                    setSavedTicket(finalTicket);
                                                    setCurrentStep(4);
                                                }}
                                                disabled={!isStep3FormValid()}
                                            />
                                        )}
                                    </Container>
                                )}

                                <style>
                                    {`
                    .step-indicator {
                      font-size: 1rem;
                      color: #ccc;
                      transition: color 0.3s ease-in-out;
                    }
                    .step-indicator.active {
                      color: #1F89B2;
                    }
                  `}
                                </style>
                            </Form>
                        </Container>
                    </Container>
                </Col>
            </Row>
        </Container>
    );
}
