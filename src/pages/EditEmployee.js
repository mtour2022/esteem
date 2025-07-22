import React, { useState, useEffect } from "react";
import { Form, Row, Col, Spinner, Button, Container, InputGroup } from "react-bootstrap"; // ✅ Spinner now imported
import Select from "react-select";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"; // ✅ All Firestore functions imported
import { db } from "../config/firebase";
import { useParams } from "react-router-dom";
import useEmployeeInfo from "../services/GetEmployeesDetails";
import AddressRegistrationForm from '../components/AddressRegistration';
import BirthPlaceForm from '../components/BirthPlaceRegistration copy';
import FileUploader from '../components/UploadImageFile';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import UpdateGroupEmployee from "../components/UpdateGroupEmployee copy";
import Employee from '../classes/employee';
import AppNavBar from "../components/AppNavBar";
import FooterCustomized from '../components/Footer';

const EditEmployeeForm = () => {

    const [formData, setFormData] = useState({
        classification: "",
        companyId: "",
        designation: "",
        application_type: "",
        surname: "",
        middlename: "",
        firstname: "",
        suffix: "",
        nationality: "",
        birthPlace: {},
        presentAddress: {},
        birthday: "",
        age: "",
        sex: "",
        maritalStatus: "",
        height: "",
        weight: "",
        contact: "",
        education: "",
        emergencyContactName: "",
        emergencyContactNumber: "",
        profilePhoto: null,
        trainingCert: null,
        diploma: null,
        additionalRequirement: null,
        workingPermit: null,
        passportNumber: "",
        password: "",
        confirmPassword: "",
        agreed: false,
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [selectedDesignationOption, setSelectedDesignationOption] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { employee_id } = useParams();
    const employee = useEmployeeInfo(employee_id);

    useEffect(() => {
        if (employee) {
            const newFormData = {
                employeeId: employee.employeeId || "",
                userUID: employee.userUID || "",
                classification: employee.classification || "",
                companyId: employee.companyId || "",
                designation: employee.designation || "",
                application_type: employee.application_type || "",
                unit_id: employee.unit_id || "",
                unit_owner: employee.unit_owner || "",
                surname: employee.surname || "",
                middlename: employee.middlename || "",
                firstname: employee.firstname || "",
                suffix: employee.suffix || "",
                nationality: employee.nationality || "",
                birthPlace: {
                    town: employee.birthPlace?.town || "",
                    province: employee.birthPlace?.province || "",
                    country: employee.birthPlace?.country || "",
                },
                presentAddress: {
                    street: employee.presentAddress?.street || "",
                    barangay: employee.presentAddress?.barangay || "",
                    town: employee.presentAddress?.town || "",
                    province: employee.presentAddress?.province || "",
                    region: employee.presentAddress?.region || "",
                    country: employee.presentAddress?.country || "",
                },
                birthday: employee.birthday || "",
                age: employee.age || "",
                sex: employee.sex || "",
                maritalStatus: employee.maritalStatus || "",
                height: employee.height || "",
                weight: employee.weight || "",
                contact: employee.contact || "",
                email: employee.email || "",
                education: employee.education || "",
                emergencyContactName: employee.emergencyContactName || "",
                emergencyContactNumber: employee.emergencyContactNumber || "",
                profilePhoto: employee.profilePhoto || "",
                trainingCert: employee.trainingCert || "",
                diploma: employee.diploma || "",
                additionalRequirement: employee.additionalRequirement || "",
                workingPermit: employee.workingPermit || "",
                passportNumber: employee.passportNumber || "",
                agreed: employee.agreed || false,
                password: employee.password || "",
                status: employee.status || "under review",
                status_history: employee.status_history || [],
                work_history: employee.work_history || [],
                company_status: employee.company_status || "under review",
                company_status_history: employee.company_status_history || [],
                tourism_certificate_ids: employee.tourism_certificate_ids || [],
            };

            setFormData(newFormData);
            console.log("FormData set from fetched employee:", newFormData);
        }
    }, [employee]);


    useEffect(() => {
        if (formData.classification) {
            const fetchCompanies = async () => {
                const q = query(
                    collection(db, 'company'),
                    where('classification', '==', formData.classification)
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
                setCompanies(data);
            };
            fetchCompanies();
        }
    }, [formData.classification]);

    useEffect(() => {
        if (formData.birthday) {
            const birth = new Date(formData.birthday);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            setFormData((prev) => ({ ...prev, age: age.toString() }));
        }
    }, [formData.birthday]);
    if (!employee) return <Spinner animation="border" />;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleDesignationSelect = (option) => {
        setSelectedDesignationOption(option);
        if (option?.value === "Others (Specify)") {
            setFormData((prev) => ({ ...prev, designation: "" }));
        } else {
            setFormData((prev) => ({ ...prev, designation: option?.value || "" }));
        }
    };

    const companyOptions = companies.map((company) => ({
        label: company.name,
        value: company.id,
    }));

    const designationOptions = {
        "travel agency": [
            "Foreign Tour Guide",
            "Local Tour Guide",
            "Local Tour Coordinator",
            "Travel Agency Owner",
            "Tourist Port Assistance",
            "Hotel Coordinator",
            "Foreign Staff",
            "Field Staff",
            "Office Staff",
            "Others (Specify)",
        ],
        "peoples organization": [
            "Local Tour Guide",
            "Stand Up Paddle Board Owner",
            "Crystal Kayak Owner",
            "Dive Instructor",
            "Dive Master",
            "Instructor (Stand Up Paddle Board)",
            "Instructor (Crystal Kayak)",
            "E-trike Driver",
            "E-trike Driver (Reliever)",
            "E-trike Owner",
            "E-bike Rental Owner",
            "Tourist Port Assistance",
            "Photographer",
            "Hairbraider",
            "Souvenir Vendor",
            "Food Vendor",
            "Peddler",
            "Massuer",
            "Manicurist",
            "Motorbike Rental Owner",
            "Motorbike Owner (Transit)",
            "Motorbike Driver",
            "Porter",
            "Tricycle Driver",
            "Tricycle Owner",
            "Island Hopping Boat Owner",
            "Island Hopping Boat Captian",
            "Island Hopping Boatman",
            "Party Boat Owner",
            "Party Boat Captain",
            "Party Boatman",
            "Yacht Owner",
            "Yacht Boat Captain",
            "Yacht Boatman",
            "Yacht Steward",
            "Paraw Owner",
            "Paraw Boatman",
            "Sand Castle Maker",
            "Picnican Staff",
            "Travel Agency Owner",
            "Muslim Trader",
            "Muslim Vendor",
            "Field Staff",
            "Office Staff",
            "Others (Specify)",
        ],
        "watersports provider": [
            "Watersports Provider Owner (Service Provider)",
            "Field Staff",
            "Office Staff",
            "Others (Specify)",
        ],
    };

    const designationList =
        designationOptions[formData.classification]?.map((item) => ({
            label: item,
            value: item,
        })) || [];

    // ✅ This is always called


    // ✅ This return comes *after* the hook
    if (!formData) return <Spinner />;
    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);
    // Include your full JSX form component here using `formData`, `handleChange`, etc.
    return (
        <>
            <AppNavBar bg="dark" variant="dark" title="Left Appbar" />
            <p className="mt-5 mb-5 text-muted small text-center">
                You are editing the employee profile. Please review and update the information carefully.
            </p>


            <div className="d-flex justify-content-end align-items-center gap-2 mt-3 mb-3 flex-wrap"></div>
            <Row className="justify-content-center">
                <Col sm={12} md={8}>
                    <Form className="custom-form">
                        <p className="barabara-label">TOURISM FRONTLINERS PROFILE FORM</p>
                        <p className="sub-title-blue mb-5">
                            Fill out this form to register and generate <strong>QR codes for tourist activity</strong>.
                        </p>

                        {/* Step 1: Company Info */}
                        {currentStep === 1 && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Company Classification *</Form.Label>
                                    <Form.Select
                                        name="classification"
                                        value={formData.classification}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Classification</option>
                                        <option value="travel agency">Travel and Tour Agency</option>
                                        <option value="peoples organization">People's Organization</option>
                                        <option value="watersports provider">Watersports Provider</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Current Company *</Form.Label>
                                    <Select
                                        name="companyId"
                                        value={companyOptions.find((opt) => opt.value === formData.companyId) || null}
                                        onChange={(selectedOption) =>
                                            handleChange({
                                                target: {
                                                    name: "companyId",
                                                    value: selectedOption ? selectedOption.value : "",
                                                },
                                            })
                                        }
                                        options={companyOptions}
                                        placeholder="Select Company"
                                        isClearable
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Current Designation *</Form.Label>
                                    <Select
                                        name="designation"
                                        value={selectedDesignationOption}
                                        onChange={handleDesignationSelect}
                                        options={designationList}
                                        placeholder="Select Designation"
                                        isClearable
                                    />
                                    {selectedDesignationOption?.value === "Others (Specify)" && (
                                        <Form.Control
                                            type="text"
                                            name="designation"
                                            value={formData.designation}
                                            onChange={handleChange}
                                            className="mt-2"
                                            placeholder="Please specify your designation"
                                        />
                                    )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Type of Application *</Form.Label>
                                    <Form.Select
                                        name="application_type"
                                        value={formData.application_type}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Uri ng Aplikasyon</option>
                                        <option value="new">New</option>
                                        <option value="renewal">Renewal</option>
                                    </Form.Select>
                                </Form.Group>
                            </>
                        )}

                        {/* Step 2: Personal Info */}
                        {currentStep === 2 && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Surname *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="surname"
                                        value={formData.surname}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Middle Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="middlename"
                                        value={formData.middlename}
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>First Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="firstname"
                                        value={formData.firstname}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Suffix</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="suffix"
                                        value={formData.suffix}
                                        onChange={handleChange}
                                        placeholder="e.g. Jr., II, III"
                                    />
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Birthdate *</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="birthday"
                                                value={formData.birthday}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Age</Form.Label>
                                            <Form.Control type="text" value={formData.age} readOnly />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Sex *</Form.Label>
                                            <Form.Select
                                                name="sex"
                                                value={formData.sex}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Kasarian</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="prefer not to say">Prefer not to say</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Marital Status *</Form.Label>
                                            <Form.Select
                                                name="maritalStatus"
                                                value={formData.maritalStatus}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Marital Status</option>
                                                <option value="single">Single</option>
                                                <option value="married">Married</option>
                                                <option value="divorced">Divorced</option>
                                                <option value="widowed">Widowed</option>
                                                <option value="annulled">Annulled</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Height (ft)*</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="height"
                                                value={formData.height}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Weight (kg)*</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="weight"
                                                value={formData.weight}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </>
                        )}
                        {/* Step 3: Company Details */}
                        {currentStep === 3 && (
                            <>
                                <Form.Group className="my-2">
                                    <Form.Label>Type of Residency</Form.Label>
                                    <Form.Select
                                        name="nationality"
                                        value={formData.nationality}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, nationality: e.target.value }))
                                        }
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="local">Local</option>
                                        <option value="foreign">Foreign</option>
                                    </Form.Select>

                                    {formData.nationality && (
                                        <>
                                            <Form.Label className="mt-3">Birth Place (Lugar ng Kapanganakan)</Form.Label>
                                            <BirthPlaceForm
                                                type={formData.nationality === "foreign" ? "foreign" : "local"}
                                                address={formData.birthPlace}
                                                onChange={(key, value) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        birthPlace: { ...prev.birthPlace, [key]: value },
                                                    }))
                                                }
                                            />

                                            <Form.Label className="mt-3">Present Address</Form.Label>
                                            <AddressRegistrationForm
                                                type={formData.nationality === "foreign" ? "foreign" : "local"}
                                                address={formData.presentAddress}
                                                onChange={(key, value) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        presentAddress: { ...prev.presentAddress, [key]: value },
                                                    }))
                                                }
                                            />
                                        </>
                                    )}
                                </Form.Group>

                                <Form.Group className="mb-3 mt-4">
                                    <Form.Label>Contact Number *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="contact"
                                        value={formData.contact}
                                        onChange={handleChange}
                                        placeholder="Telepono o Mobile"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Highest Educational Attainment *</Form.Label>
                                    <Form.Select
                                        name="education"
                                        value={formData.education}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Highest Educational Attainment</option>
                                        <option value="elementary">Elementary</option>
                                        <option value="high school">High School</option>
                                        <option value="college">College</option>
                                        <option value="alternative">Alternative Learning</option>
                                        <option value="undergraduate">Undergraduate</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Name of person incase of emergency</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="emergencyContactName"
                                        placeholder='Pangalan ng Kamag-anak para sa Emergency'
                                        value={formData.emergencyContactName}
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Contact number of person incase of emergency</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="emergencyContactNumber"
                                        placeholder='Numero ng Kamag-anak para sa Emergency'
                                        value={formData.emergencyContactNumber}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </>
                        )}
                        {/* Step 4: Company Details */}
                        {currentStep === 4 && (
                            <>
                                <FileUploader
                                    label="2x2 Profile Photo (formal attire)"
                                    fileKey="profilePhoto"
                                    storagePath="employee/profile_photos"
                                    formData={formData}
                                    setFormData={setFormData}
                                />


                                <FileUploader
                                    label="Signed Endorsement from Organization / Certificate of Employment (Notarized) / Contract of Service (for foreign only)"
                                    fileKey="additionalRequirement"
                                    storagePath="employee/requirements"
                                    formData={formData}
                                    setFormData={setFormData}
                                />

                                {(() => {
                                    const isExempted =
                                        formData.designation === "Field Staff" ||
                                        formData.designation === "Office Staff" ||
                                        (formData.designation || "").toLowerCase().includes("owner");

                                    return (
                                        <>
                                            {!isExempted &&
                                                formData.nationality !== "foreign" && (
                                                    <FileUploader
                                                        label="Training Certificate from DOT/LGU (2023/2024/2025) (Optional for renewal)"
                                                        fileKey="trainingCert"
                                                        storagePath="employee/training_certificates"
                                                        formData={formData}
                                                        setFormData={setFormData}
                                                    />
                                                )}

                                            {!isExempted &&
                                                formData.application_type === "new" &&
                                                formData.designation === "Local Tour Coordinator" && (
                                                    <FileUploader
                                                        label="Diploma / Transcript of Records / Certificate of Completion (For new only)"
                                                        fileKey="diploma"
                                                        storagePath="employee/diplomas"
                                                        formData={formData}
                                                        setFormData={setFormData}
                                                    />
                                                )}


                                            {!isExempted &&
                                                formData.nationality === "foreign" &&
                                                ["Foreign Tour Guide", "Foreign Staff"].includes(formData.designation) && (
                                                    <>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="fw-bold">
                                                                Passport Number (for foreign only) *
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                name="passportNumber"
                                                                value={formData.passportNumber}
                                                                onChange={handleChange}
                                                                placeholder="Passport Number"
                                                            />
                                                        </Form.Group>

                                                        <FileUploader
                                                            label="Special Working Permit from Bureau of Immigration e.g. AEP/9G/DOLE Certificate (for foreign only)"
                                                            fileKey="workingPermit"
                                                            storagePath="employee/workingPermit"
                                                            formData={formData}
                                                            setFormData={setFormData}
                                                        />
                                                    </>
                                                )}

                                        </>
                                    );
                                })()}

                                <Form.Group className="my-2">
                                    <Form.Label className="mt-2">Email Address</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="email"
                                        placeholder="Email address"
                                        value={formData.email}
                                        onChange={handleChange}
                                        readOnly
                                        plaintext
                                        disabled
                                    />
                                    <Form.Text className="text-muted">
                                        This email is permanent and cannot be changed.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Password *</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                        <InputGroup.Text onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
                                            {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                                        </InputGroup.Text>
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Confirm Password *</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            isInvalid={formData.confirmPassword && formData.confirmPassword !== formData.password}
                                        />
                                        <InputGroup.Text onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: 'pointer' }}>
                                            {showConfirmPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                                        </InputGroup.Text>
                                        <Form.Control.Feedback type="invalid">
                                            Passwords do not match.
                                        </Form.Control.Feedback>
                                    </InputGroup>
                                </Form.Group>

                                <Form.Check
                                    className='mt-4'
                                    type="checkbox"
                                    name="agreed"
                                    checked={formData.agreed}
                                    onChange={handleChange}
                                    label="I agree to the collection, processing, and storage of my data for registration purposes."
                                    required
                                />
                                <div className="mt-4 mb-3 p-3 border-start border-4 border-warning bg-light rounded">
                                    <strong className="text-danger">Reminder:</strong><br />
                                    Please double-check that all your uploaded files are correct and complete before submitting.
                                    <br /><br />
                                    Incomplete or incorrect files may delay the processing of your application.
                                </div>
                            </>)}
                        <Container className="d-flex justify-content-between mt-5">
                            {/* Previous Button - Show if currentStep > 1 */}
                            {currentStep > 1 && (
                                <Button variant="secondary" onClick={prevStep}>
                                    Previous
                                </Button>
                            )}

                            {/* Next Button or Save Button on Last Step */}
                            {currentStep < 4 ? (
                                <Button className="color-blue-button" variant="primary" onClick={nextStep}>
                                    Next
                                </Button>
                            ) : (
                                <UpdateGroupEmployee
                                    groupData={formData}
                                    setGroupData={setFormData}
                                    fileType="Application"
                                    collectionName="employee"
                                    idName="employeeId"
                                    ModelClass={Employee}
                                    disabled={
                                        (() => {
                                            const isExempted =
                                                formData.designation === "Field Staff" ||
                                                formData.designation === "Office Staff" ||
                                                (formData.designation || "").toLowerCase().includes("owner");

                                            if (isExempted) {
                                                return (
                                                    !formData.profilePhoto ||
                                                    !formData.additionalRequirement ||
                                                    !formData.email ||
                                                    !formData.agreed
                                                );
                                            }

                                            return (
                                                !formData.profilePhoto ||
                                                !formData.trainingCert ||
                                                !formData.additionalRequirement ||
                                                !formData.email ||
                                                !formData.agreed
                                            );
                                        })()
                                    }
                                    onSuccess={() => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            profilePhoto: null,
                                            trainingCert: null,
                                            additionalRequirement: null,
                                            diploma: null,
                                            workingPermit: null,
                                            email: "",
                                            password: "",
                                            confirmPassword: "",
                                        }));
                                    }}
                                />
                            )}


                        </Container>
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
                </Col>
            </Row>

            <FooterCustomized scrollToId="toppage" />
        </>
    );
};

export default EditEmployeeForm;
