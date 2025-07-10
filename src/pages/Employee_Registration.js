import React, { useState, useRef, useEffect } from 'react';
import {
    Form,
    Button,
    InputGroup,
    Row,
    Col,
    Alert,
    Container,

} from 'react-bootstrap';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import { db } from '../config/firebase';
import {
    collection,
    where,
    query,
    getDocs
} from 'firebase/firestore';
import AppNavBar from '../components/AppNavBar';
import AddressRegistrationForm from '../components/AddressRegistration';
import SaveGroupEmployee from '../components/SaveGroupEmployee';
import FooterCustomized from '../components/Footer';
// import FileUploader from '../components/UploadFile';
import useCompanyInfo from '../services/GetCompanyDetails';
import Employee from '../classes/employee';
import BirthPlaceForm from '../components/BirthPlaceRegistration copy';
import Select from "react-select";
import { useParams } from "react-router-dom";
import FileUploader from '../components/UploadImageFile';


export default function EmployeeRegistrationForm() {
    const { residency } = useParams();

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        classification: '',
        companyId: '',
        designation: '',
        application_type: '',
        surname: '',
        middlename: '',
        firstname: '',
        suffix: '',
        nationality: '',
        birthPlace: {},

        presentAddress: {},
        birthday: '',
        age: '',
        sex: '',
        maritalStatus: '',
        height: '',
        weight: '',
        contact: '',
        education: '',
        emergencyContactName: '',
        emergencyContactNumber: '',
        profilePhoto: null,
        trainingCert: null,
        diploma: null,
        additionalRequirement: null,
        workingPermit: null,
        passportNumber: '',
        password: '',
        confirmPassword: '',
        agreed: false,
    });

    const [companies, setCompanies] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const webcamRef = useRef(null);
    const [errorMessage, setErrorMessage] = useState('');

    const companyInfo = useCompanyInfo(formData.companyId);

    useEffect(() => {
        if (residency === "local" || residency === "foreign") {
            setFormData((prev) => ({
                ...prev,
                nationality: residency
            }));
        }
    }, [residency]);
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
            const birthDate = new Date(formData.birthday);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            setFormData(prev => ({ ...prev, age: age.toString() }));
        }
    }, [formData.birthday]);

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
    const totalSteps = 4;

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const capturePhoto = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        fetch(imageSrc).then(res => res.blob()).then(blob => {
            const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '');
            const file = new File([blob], `captured_profile_${timestamp}.jpg`, { type: 'image/jpeg' });
            setFormData(prev => ({ ...prev, profilePhoto: file }));
            setShowCamera(false);
        });
    };

    const companyOptions = companies.map((company) => ({
        label: company.name,
        value: company.id
    }));
    const designationOptions = {
        "travel agency": [
            "Foreign Tour Guide",
            "Local Tour Guide",
            "Local Tour Coordinator",
            "Tourist Port Assistance",
            "Travel Agency Owner",
            "Hotel Coordinator",
            "Foreign Staff",
            "Field Staff",
            "Office Staff",
            "Others (Specify)"
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
            "Others (Specify)"
        ],
        "watersports provider": [
            "Watersports Provider Owner (Service Provider)",
            "Field Staff",
            "Office Staff",
            "Others (Specify)"
        ]
    };


    const [selectedDesignationOption, setSelectedDesignationOption] = useState(null);

    const handleDesignationSelect = (option) => {
        setSelectedDesignationOption(option);
        if (option?.value === "Others (Specify)") {
            setFormData((prev) => ({ ...prev, designation: "" }));
        } else {
            setFormData((prev) => ({ ...prev, designation: option?.value || "" }));
        }
    };

    const designationList =
        designationOptions[formData.classification]?.map((item) => ({
            label: item,
            value: item
        })) || [];



    return (
        <>
            <Row className="justify-content-center">
                <AppNavBar bg="dark" variant="dark" title="Left Appbar" />

                <Col md={6} className="p-0">
                    <Container className="container" id="toppage">
                        <Container className="body-container">
                            <p className="barabara-label">TOURISM PROFILE ACCOUNT CREATION</p>
                            <p className="sub-title-blue">
                                Prepare your <b>requirements</b> and <b>register</b> now to enjoy the perks of having an electronic system for tracking, evaluating, and expert monitoring of tour activities in Boracay Island, Malay, Aklan!
                            </p>
                            <h6>📄 Documents to Upload:</h6>
                            <ul>
                                <li>Training Certificate from DOT/LGU (FBSE/COMMUNITY TOUR GUIDING)</li>
                                <li>Notarized Certificate of Employment/ Contract of Service (Foreign only) / Signed Endorsement from Organization</li>
                                <li>Diploma/ Transcript of Records / Certificate of Completion (For new only)</li>
                                <li>Special Working Permit from Beareau of Immigration e.g. AEP/9G/DOLE Certificate (for foreign applicant)</li>
                                <li>Passport Number (for foreign applicant)</li>
                                <li>Profile Photo (for employee)</li>
                            </ul>
                            <h6>📝 Required Information:</h6>
                            <ul>
                                <li>Employee Classification & Designation</li>
                                <li>Unit ID/Control Number</li>
                                <li>Unit Owner (Full Name)</li>
                                <li>Full Name (First, Middle, Last, Suffix)</li>
                                <li>Type of Residency (Local or Foreign)</li>
                                <li>Birth Place and Birthday</li>
                                <li>Present Address</li>
                                <li>Sex, Age, Marital Status, Height, Weight</li>
                                <li>Educational Attainment</li>
                                <li>Emergency Contact Name and Number</li>
                            </ul>
                            <div className="mb-3 p-3 border-start border-4 border-warning bg-light rounded">
                                <strong className="text-danger">Important Reminder:</strong><br />
                                Only tourism enterprises within the <strong>Municipality of Malay</strong> are allowed to register.
                                Businesses from outside the municipality must have a local office within Malay or a partnership with a local enterprise in order to operate.
                                <br /><br />
                                After submitting your registration, please wait up to <strong>24 hours</strong> for verification.
                                Registrations submitted during <strong>weekends</strong> may experience delays in validation.
                                <br /><br />
                                Once your registration is validated, you will receive an email at your <strong>company email address</strong> with next steps.
                            </div>
                        </Container>
                    </Container>
                </Col>
                <Col md={6} className="p-0">
                    <Container className="container background-container">
                        <Container className='body-container'>
                            <Form className="custom-form ">
                                <p className='barabara-label'>TOURISM FRONTLINERS PROFILE FORM</p>
                                <p className="sub-title-blue mb-5">
                                    Fill out this form to register and generate <strong>QR codes for tourist activity</strong>. Accurate information is essential for profiling tourism frontliners in the Municipality of Malay. It supports safety, reliable record-keeping, quick emergency response, effective complaint resolution, activity reporting, and continuous improvement of tourism services.
                                </p>

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
                                                <option value="peoples organization">People's Organization (Associations/Cooperatives)</option>
                                                <option value="watersports provider">Watersports Provider</option>
                                            </Form.Select>
                                        </Form.Group>



                                        <Form.Group className="mb-3">
                                            <Form.Label>Current Company *</Form.Label>
                                            <Select
                                                name="companyId"
                                                value={
                                                    companyOptions.find((option) => option.value === formData.companyId) || null
                                                }
                                                onChange={(selectedOption) =>
                                                    handleChange({
                                                        target: {
                                                            name: "companyId",
                                                            value: selectedOption ? selectedOption.value : ""
                                                        }
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
                                                    placeholder="Please specify your designation"
                                                    className="mt-2"
                                                    required
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
                                        {[
                                            "E-trike Driver",
                                            "E-trike Driver (Reliever)",
                                            "E-trike Owner",
                                            "E-bike Rental Owner",
                                            "Motorbike Rental Owner",
                                            "Motorbike Owner (Transit)",
                                            "Motorbike Driver",
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
                                            "Paraw Boatman"
                                        ].includes(formData.designation) && (
                                                <>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>
                                                            Unit ID/Control Number (for Boats/E-trike/Motorbikes/E-vehicles)
                                                        </Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="unit_id"
                                                            value={formData.unit_id}
                                                            onChange={handleChange}
                                                            placeholder=""
                                                        />
                                                    </Form.Group>

                                                    <Form.Group className="mb-3">
                                                        <Form.Label>
                                                            Unit Owner (Full Name) (for Boats/E-trike/Motorbikes/E-vehicles)
                                                        </Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="unit_owner"
                                                            value={formData.unit_owner}
                                                            onChange={handleChange}
                                                            placeholder=""
                                                        />
                                                    </Form.Group>
                                                </>
                                            )}


                                    </>
                                )}

                                {/* Step 2: Company Details */}
                                {currentStep === 2 && (
                                    <>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Surname *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="surname"
                                                value={formData.surname}
                                                onChange={handleChange}
                                                placeholder="Apelyido"
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
                                                placeholder="Gitnang Pangalan"
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>First Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="firstname"
                                                value={formData.firstname}
                                                onChange={handleChange}
                                                placeholder="Pangalan"
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-5">
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
                                                    <Form.Control
                                                        type="text"
                                                        value={formData.age}
                                                        readOnly
                                                    />
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
                                                    <Form.Label>Height (ft) (e.g. 5'7")*</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="height"
                                                        value={formData.height}
                                                        onChange={handleChange}
                                                        placeholder="Tangkad"
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Weight (kg) (e.g. 55)*</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="weight"
                                                        value={formData.weight}
                                                        onChange={handleChange}
                                                        placeholder="Timbang"
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
                                                        (formData.nationality !== "foreign" ||
                                                            (!formData.nationality && residency !== "foreign")) && (
                                                            <FileUploader
                                                                label="Training Certificate from DOT/LGU (2023/2024/2025) (Optional for renewal)"
                                                                fileKey="trainingCert"
                                                                storagePath="employee/training_certificates"
                                                                formData={formData}
                                                                setFormData={setFormData}
                                                            />
                                                        )}

                                                    {!isExempted && formData.application_type === "new" && (
                                                        formData.designation === "Local Tour Coordinator" && (
  <FileUploader
    label="Diploma / Transcript of Records / Certificate of Completion (For new only)"
    fileKey="diploma"
    storagePath="employee/diplomas"
    formData={formData}
    setFormData={setFormData}
  />
)

                                                    )}

                                                    {!isExempted &&
                                                       (formData.nationality === "foreign" ||
  (!formData.nationality && residency === "foreign")) &&
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
)

                                                        
                                                        }
                                                </>
                                            );
                                        })()}



                                        <Form.Group className="my-2">
                                            <Form.Label className=" mt-2">Email Address</Form.Label>
                                            <Form.Control

                                                type="text"
                                                name="email"
                                                placeholder='Email address'
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />

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
                                    {currentStep < 4 ? (
                                        <Button className="color-blue-button" variant="primary" onClick={nextStep}>
                                            Next
                                        </Button>
                                    ) : (
                                        <SaveGroupEmployee
                                            groupData={formData}
                                            setGroupData={setFormData}
                                            password={formData.password}
                                            email={formData.email}
                                            fileType="Application"
                                            collectionName="employee"
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
                                                            !formData.password ||
                                                            !formData.agreed
                                                        );
                                                    }

                                                    return (
                                                        !formData.profilePhoto ||
                                                        !formData.trainingCert ||
                                                        !formData.additionalRequirement ||
                                                        !formData.email ||
                                                        !formData.password ||
                                                        !formData.agreed
                                                    );
                                                })()
                                            }
                                            idName="employeeId"
                                            ModelClass={Employee}
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
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        </>
    );
};