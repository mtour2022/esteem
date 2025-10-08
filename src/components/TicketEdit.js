import { useState, useEffect, useRef } from "react";
import QrScanner from "qr-scanner";
import Webcam from "react-webcam";
import Swal from "sweetalert2";
import { doc, getDoc, collection, query, where, getDocs, documentId } from "firebase/firestore";
import { db } from "../config/firebase";
import TicketModel from "../classes/tickets";
import UpdateTicketToCloud from "../components/UpdateTickets";
import { Form, Container, Row, Col, Spinner, Button, Card, InputGroup } from 'react-bootstrap';
import Select from "react-select";
import TicketAddressForm from '../components/TicketAddressForm';
import UpdateTicketActivitiesForm from '../components/UpdateTicketActivitiesForm';
import TicketSummary from '../components/TicketSummary';
import { useAuth } from '../auth/authentication';
import Company from '../classes/company';
import VerifierModel from "../classes/verifiers"; // your VerifierModel
import EditTickets from "./EditTickets";

export default function TicketEdit({ ticket }) {
    const { currentUser } = useAuth(); // ✅ get current user
    const [ticketData, setTicketData] = useState(ticket || new TicketModel({}));
    const [company, setCompany] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [savedTicket, setSavedTicket] = useState(null);

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    const nextStep = () => setCurrentStep((prev) => prev + 1);
    const prevStep = () => setCurrentStep((prev) => prev - 1);

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

    // helper to fetch employees
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

    // ✅ fetch company + employees for currentUser
    useEffect(() => {
        const fetchticketData = async () => {
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

                    if (companyInstance.employee && Array.isArray(companyInstance.employee)) {
                        const employeeData = await fetchEmployeesByIds(companyInstance.employee);
                        setEmployees(employeeData);
                        console.log("EMPLOYEES:", employeeData);
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

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center p-4">
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <div>



            {/* Main Form */}
            {ticketData?.ticket_id && (

                <Col md={12} className="p-0">
                    <Container className="container custom-container">
                        <Container className="body-container">
                            <Form className="custom-form mt-4">
                                <p className="barabara-label">TOURIST ACTIVITY FORM</p>
                                <p className="sub-title-blue">
                                    Fill-out this form to generate <strong>QR code</strong>. Accurate information is vital in ensuring safety, maintaining reliable records, generating tour activity reports, providing immediate response in case of emergency, investigating complaints, and optimizing overall service quality.
                                </p>

                                {/* Step 1 */}
                                {currentStep === 1 && (
                                    <>
                                        <Form.Group className="my-2">
                                            <Form.Label className="fw-bold mt-2">Representative's Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                placeholder="Business Name Registered Under DTI"
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
                                                placeholder="Email Address, Telephone, or Mobile Number"
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
                                                options={employees
                                                    .filter(emp =>
                                                        emp.status?.toLowerCase() === "approved" &&
                                                        emp.company_status?.toLowerCase() === "approved"
                                                    )
                                                    .map(emp => ({
                                                        value: emp.employeeId,
                                                        label: `${emp.firstname} ${emp.surname} — ${emp.designation || "No title"}`,
                                                        contact: emp.contact,
                                                        raw: emp
                                                    }))
                                                }
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
                                                        .filter(emp => emp.status?.toLowerCase() === "approved" && emp.company_status?.toLowerCase() === "approved")
                                                        .map(emp => ({
                                                            value: emp.employeeId,
                                                            label: `${emp.firstname} ${emp.surname} — ${emp.designation || "No title"}`,
                                                            contact: emp.contact,
                                                            raw: emp
                                                        }))
                                                        .find(option => option.value === ticketData.employee_id)
                                                    || (selectedEmployee ? {
                                                        value: selectedEmployee.employeeId,
                                                        label: `${selectedEmployee.firstname} ${selectedEmployee.surname} — ${selectedEmployee.designation || "No title"}`,
                                                        contact: selectedEmployee.contact,
                                                        raw: selectedEmployee
                                                    } : null)
                                                }
                                                isClearable
                                            // 🔹 Makes it read-only
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

                                {/* Step 2 */}
                                {currentStep === 2 && (
                                    <TicketAddressForm
                                        groupData={ticketData}
                                        setGroupData={setTicketData}
                                        ifForeign={true}
                                    />
                                )}

                                {/* Step 3 */}
                                {currentStep === 3 && (
                                    <>
                                        {/* NEW ADDED */}
                                        <Form.Group className="my-3 d-flex align-items-center justify-content-between">
                                            <Form.Label className="fw-bold mb-0">Is this a Packaged Tour?</Form.Label>
                                            <Form.Check
                                                type="switch"
                                                id="isPackaged-switch"
                                                label={ticketData.isPackaged ? "Packaged" : "Not Packaged"}
                                                checked={ticketData.isPackaged || false}
                                                onChange={(e) =>
                                                    setTicketData((prev) => ({
                                                        ...prev,
                                                        isPackaged: e.target.checked,
                                                    }))
                                                }
                                            />
                                        </Form.Group>
                                        <UpdateTicketActivitiesForm
                                            groupData={ticketData}
                                            setGroupData={setTicketData}
                                            isPackaged={ticketData.isPackaged} // ✅ pass value here
                                        />
                                    </>

                                )}



                                {/* Navigation */}
                                {/* Navigation */}
                                <Container
                                    className={`d-flex mt-3 ${currentStep === 1 ? "justify-content-end" : "justify-content-between"
                                        }`}
                                >
                                    {/* Previous Button - Show only if currentStep > 1 */}
                                    {currentStep > 1 && (
                                        <Button variant="secondary" onClick={prevStep}>
                                            Previous
                                        </Button>
                                    )}

                                    {/* Next or Edit Button */}
                                    {currentStep < 3 ? (
                                        <Button
                                            className="color-blue-button"
                                            variant="primary"
                                            onClick={nextStep}
                                        >
                                            Next
                                        </Button>
                                    ) : (
                                        <EditTickets
                                            groupData={ticketData}
                                            setGroupData={setTicketData}
                                            currentUserUID={currentUser.uid}
                                            companyID={company?.company_id}
                                            onSuccess={() => {
                                                // Reset to initial state
                                                setSavedTicket(null);
                                                setTicketData(new TicketModel({})); // clear form data
                                                setSelectedEmployee(null);
                                                setCurrentStep(1);
                                            }}
                                            disabled={!isStep3FormValid()}
                                        />
                                    )}
                                </Container>



                                {/* add here the Text field of the verifier name and contact using the currentUser Id in the /verifier collection */}
                                {/* Step Indicators */}
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
                            </Form>
                        </Container>
                    </Container>
                </Col>
            )}
        </div>
    );
}
