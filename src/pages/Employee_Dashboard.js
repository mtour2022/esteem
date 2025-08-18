import React, { useEffect, useState } from 'react';
import { Form, Container, Row, Col, Button, Card, Spinner, Image, InputGroup, Dropdown } from 'react-bootstrap';
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
import { faExpand, faCompress, faBars, faUserGroup, faLineChart } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";
import { doSignOut } from "../config/auth"; // <-- import your logout helper
import Swal from 'sweetalert2';
import Employee from "../classes/employee"; // adjust path if needed
import { doc, getDoc } from "firebase/firestore";
import { collection, getDocs, query, where } from "firebase/firestore";
import EmployeeDashboardPanel from '../components/EmployeeDashBoardPanel';
export default function EmployeeDashboardPage() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [savedTicket, setSavedTicket] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

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

  const resetTicketForm = () => {
    setCurrentStep(1);
    setSavedTicket(null);
    setTicketData({
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
    });
    setRefreshKey(prev => prev + 1); // Trigger data refresh
  };

  const handleLogout = async () => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'You will be logged out of your session.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, log out',
        cancelButtonText: 'Cancel',
      });

      if (result.isConfirmed) {
        await doSignOut(); // Firebase sign out
        Swal.fire('Logged out!', 'You have been successfully signed out.', 'success');
        navigate("/home");
      }
    } catch (err) {
      console.error("Logout failed:", err);
      Swal.fire('Error', 'Something went wrong while logging out.', 'error');
    }
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

  // Fetch employee and tickets
  useEffect(() => {
    const fetchEmployeeTickets = async () => {
      if (!currentUser?.uid) return;

      try {
        const q = query(
          collection(db, "employee"),
          where("userUID", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const employeeDoc = querySnapshot.docs[0];
          const employeeData = employeeDoc.data();
          const employeeInstance = new Employee({ employeeId: employeeDoc.id, ...employeeData });
          setSelectedEmployee(employeeInstance);

          if (employeeInstance.tickets && Array.isArray(employeeInstance.tickets)) {
            const ticketPromises = employeeInstance.tickets.map(ticketId =>
              getDoc(doc(db, "tickets", ticketId))
            );
            const ticketSnapshots = await Promise.all(ticketPromises);

            const ticketsData = ticketSnapshots
              .filter(snap => snap.exists())
              .map(snap => ({ id: snap.id, ...snap.data() }));

            setSavedTicket(ticketsData);
            console.log("Employee tickets:", ticketsData);
          }
        } else {
          console.warn("No employee found for current user");
        }
      } catch (error) {
        console.error("Error fetching employee tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeTickets();
  }, [currentUser]);

  // Pagination
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading employee dashboard...</p>
      </Container>
    );
  }

  if (!selectedEmployee) {
    return (
      <Container className="text-center mt-5">
        <p>No employee data found for this user.</p>
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
        {!isFullScreen && (
          <Col md={4} className="p-0">
            <Container className="container custom-container">
              <Container className='body-container'>
                <Form className="custom-form mt-4">
                  <p className='barabara-label'>TOURIST ACTIVITY FORM</p>
                  <p className="sub-title-blue">Fill-out this form to generate <strong>QR code</strong>. Accurate information is vital in ensuring safety, maintaining reliable records, generating tour activity reports, providing immediate response in case of emergency, investigating complaints, and optimizing overall service quality.</p>

                  {/* Step 1 */}
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
                          Assigned employee to assist the guests.
                        </Form.Label>
                        <Select
                          options={[
                            {
                              value: selectedEmployee.employeeId,
                              label: `${selectedEmployee.firstname} ${selectedEmployee.surname} — ${selectedEmployee.designation || "No title"}`,
                              contact: selectedEmployee.contact,
                              raw: selectedEmployee
                            }
                          ]}
                          placeholder="Select an employee"
                          onChange={(selectedOption) => {
                            setTicketData(prev => ({
                              ...prev,
                              employee_id: selectedOption?.value || ""
                            }));
                            setSelectedEmployee(selectedOption ? selectedOption.raw : null);
                          }}
                          value={{
                            value: selectedEmployee.employeeId,
                            label: `${selectedEmployee.firstname} ${selectedEmployee.surname} — ${selectedEmployee.designation || "No title"}`,
                            contact: selectedEmployee.contact,
                            raw: selectedEmployee
                          }}
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
                    <TicketActivitiesForm
                      groupData={ticketData}
                      setGroupData={setTicketData}
                    />
                  )}

                  {/* Step 4 */}
                  {currentStep === 4 && savedTicket && (
                    <TicketSummary ticket={savedTicket} />
                  )}

                  {/* Pagination */}
                  <Container className='empty-container'></Container>
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
                        onClick={resetTicketForm}
                      >
                        Generate More
                      </Button>
                    </Container>
                  ) : (
                    <Container className="d-flex justify-content-between mt-3">
                      {currentStep > 1 && (
                        <Button variant="secondary" onClick={prevStep}>Previous</Button>
                      )}
                      {currentStep < 3 ? (
                        <Button className="color-blue-button" variant="primary" onClick={nextStep}>Next</Button>
                      ) : (
                        <SaveTicketToCloud
                          groupData={ticketData}
                          setGroupData={setTicketData}
                          currentUserUID={currentUser.uid}
                          companyID={selectedEmployee.companyId} // ✅ replaced
                          onSuccess={(finalTicket) => {
                            setSavedTicket(finalTicket);
                            setCurrentStep(4);
                          }}
                          disabled={!isStep3FormValid()}
                        />
                      )}
                    </Container>
                  )}

                  <Container className='empty-container'></Container>

                  <style>{`
                    .step-indicator {
                      font-size: 1rem;
                      color: #ccc;
                      transition: color 0.3s ease-in-out;
                    }
                    .step-indicator.active {
                      color: #1F89B2;
                    }
                  `}</style>
                </Form>
              </Container>
            </Container>
          </Col>
        )}

        <Col md={isFullScreen ? 12 : 8} className="p-0">
          <div className="d-flex justify-content-end align-items-center gap-2 p-3 me-0 me-md-4 mt-4">
            <Button
              size='sm'
              variant="outline-secondary"
              onClick={() => setIsFullScreen((prev) => !prev)}
              title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <FontAwesomeIcon icon={isFullScreen ? faCompress : faExpand} />
            </Button>

            <Dropdown align="end">
              <Dropdown.Toggle as={Button} size="sm" variant="outline-secondary">
                <FontAwesomeIcon icon={faBars} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item>Advisories</Dropdown.Item>
                <Dropdown.Item>Profile</Dropdown.Item>
                <Dropdown.Item>Saved Reports</Dropdown.Item>
                <Dropdown.Item onClick={handleLogout}>Log Out</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
  {/* Main Dashboard Content */}
                    <EmployeeDashboardPanel
                        employee={selectedEmployee}
                        refreshKey={refreshKey}
                    />
        </Col>
       

        <FooterCustomized scrollToId="toppage" />
      </Row>
    </Container>
  );
}
