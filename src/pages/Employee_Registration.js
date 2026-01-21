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
import {
    collection,
    where, addDoc, updateDoc, doc, arrayUnion,
    query,
    getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AppNavBar from '../components/AppNavBar';
import AddressRegistrationForm from '../components/AddressRegistration';
import SaveGroupEmployee from '../components/SaveGroupEmployee';
import FooterCustomized from '../components/Footer';
import useCompanyInfo from '../services/GetCompanyDetails';
import Employee from '../classes/employee';
import BirthPlaceForm from '../components/BirthPlaceRegistration copy';
import Select from "react-select";
import { useParams, useNavigate } from "react-router-dom";
import FileUploader from '../components/UploadImageFile';
import Swal from "sweetalert2";
import { storage, db, auth } from "../config/firebase";
import { docreateUserWithEmailAndPassword } from "../config/auth";
import { toPng } from "html-to-image";
import download from "downloadjs";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import logo from "../assets/images/lgu.png";

export default function EmployeeRegistrationForm({ hideNavAndFooter = false }) {
    const { residency } = useParams();
    const navigate = useNavigate(); // ✅ defines navigate

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '', // 🟢 ADD THIS: Critical for Firebase Auth and controlled inputs
        classification: '',
        companyId: '',
        designation: '',
        years_in_service: '',
        application_type: '',
        surname: '',
        middlename: '',
        firstname: '',
        suffix: '',
        nationality: '',
        birthPlace: {},
        isTrained: true,
        canGenerate: false,
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
    // 🟢 Replace with your Firestore collection
    const collectionName = "employee";
    const groupCollectionRef = collection(db, collectionName);
    const dateNow = new Date().toLocaleString("en-PH");
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        try {
            // 1. Sanitize input immediately to prevent "scalar field" (object) errors
            const finalEmail = typeof formData.email === 'string' ? formData.email.trim() : String(formData.email || "").trim();
            const finalPassword = typeof formData.password === 'string' ? formData.password : String(formData.password || "");

            if (!finalEmail || !finalEmail.includes("@")) {
                Swal.fire("Error", "A valid email address is required.", "error");
                return;
            }

            // 2. Determine exemption and nationality logic
            const isExempted =
                formData.designation === "Field Staff" ||
                formData.designation === "Office Staff" ||
                (formData.designation || "").toLowerCase().includes("owner");

            const nationalityValue = formData.nationality?.toLowerCase();
            const isForeign =
                nationalityValue === "foreign" ||
                (!nationalityValue && typeof residency !== 'undefined' && residency === "foreign");

            // 3. Show Uploading message
            Swal.fire({
                title: "Uploading...",
                text: "Please wait while your account is created and files are uploaded.",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            // 4. Create Firebase Auth User (Single, sanitized call)
            let userCredential;
            try {
                // CRITICAL: We create local constants that are guaranteed to be primitives
                const emailToSubmit = String(formData.email || "").trim();
                const passwordToSubmit = String(formData.password || "");

                console.log("Submitting to Firebase:", { emailToSubmit, passwordToSubmit });

                // Ensure the parameters are passed exactly like this
                userCredential = await docreateUserWithEmailAndPassword(
                    auth,
                    emailToSubmit,
                    passwordToSubmit
                );
            } catch (authError) {
                console.error("Firebase Auth specific error:", authError);
                if (authError.code === "auth/email-already-in-use") {
                    Swal.fire("Warning", "Email already in use.", "warning");
                    return;
                }
                throw authError;
            }

            const userUID = userCredential.user.uid;

            // 5. Upload files helper (with null-check fix)
            const uploads = {};
            const uploadFile = async (file, folderName) => {
                if (!file || !(file instanceof File)) return null;
                const fileExt = file.name?.split(".").pop() || "jpg";
                const fileRef = ref(
                    storage,
                    `employee/${folderName}/${Date.now()}_${userUID}.${fileExt}`
                );
                await uploadBytes(fileRef, file);
                return getDownloadURL(fileRef);
            };

            if (formData.profilePhoto) uploads.profilePhoto = await uploadFile(formData.profilePhoto, "profilePhotos");
            if (formData.trainingCert) uploads.trainingCert = await uploadFile(formData.trainingCert, "trainingCerts");
            if (formData.additionalRequirement) uploads.additionalRequirement = await uploadFile(formData.additionalRequirement, "additionalRequirements");
            if (formData.workingPermit) uploads.workingPermit = await uploadFile(formData.workingPermit, "workingPermits");
            if (formData.diploma) uploads.diploma = await uploadFile(formData.diploma, "diplomas");

            // 6. Firestore object construction
            const employeeData = {
                ...formData,
                ...uploads,
                email: finalEmail, // Ensure string format
                userUID,
                status: "under review",
                date_registered: typeof dateNow !== 'undefined' ? dateNow : new Date().toISOString(),
                status_history: arrayUnion({
                    date_updated: new Date().toISOString(),
                    remarks: "Under Review",
                    status: "under review",
                    userId: userUID || "system",
                }),
            };

            // Save to Firestore
            const docRef = await addDoc(groupCollectionRef, employeeData);
            const empDoc = doc(db, collectionName, docRef.id);
            await updateDoc(empDoc, {
                employeeId: docRef.id,
                quickstatus_id: docRef.id,
            });

            // 7. Success message + QR
            Swal.fire({
                title: "Success!",
                html: `
    <div id="qr-preview" style="padding: 20px; text-align: center; background: #fff; border: 1px solid #ccc; font-family: Arial;">
        <img src="${logo}" alt="Logo" height="80" style="margin-bottom: 10px;" />
        <div style="font-size: 12px; font-weight: bold; line-height: 18px; margin-bottom: 10px;">
            Republic of the Philippines<br /> Province of Aklan<br /> Municipality of Malay<br /> Municipal Tourism Office
        </div>
        <p style="font-size: 11px; margin-bottom: 10px; margin-top: 5px;">
            ${docRef.id} - ${formData.firstname} ${formData.surname}
        </p>
        <div style="display: flex; justify-content: center;">
            <canvas id="generatedQR"></canvas>
        </div>
        <p style="font-size: 11px; margin-top: 10px;">
            Scan this QR code to check your application status.<br />
            All information is protected under the Data Privacy Act.
        </p>
    </div>
    <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
        <button id="downloadImageBtn" class="swal2-confirm swal2-styled">Download as Image</button>
        <button id="proceedBtn" class="swal2-confirm swal2-styled" style="background: #28a745;">Proceed</button>
    </div>
`,
                showConfirmButton: false,
                allowOutsideClick: false,
                didOpen: () => {
                    const qrCanvas = document.getElementById("generatedQR");
                    QRCode.toCanvas(
                        qrCanvas,
                        `https://esteem.com/application-status-check/${docRef.id}`,
                        { width: 300 },
                        (err) => { if (err) console.error("QR error:", err); }
                    );

                    // DOWNLOAD BUTTON LOGIC
                    document.getElementById("downloadImageBtn").addEventListener("click", async () => {
                        const qrPreview = document.getElementById("qr-preview");
                        Swal.showLoading();
                        try {
                            const dataUrl = await toPng(qrPreview, { useCORS: true, backgroundColor: "#ffffff" });
                            download(dataUrl, `EmployeeQR_${formData.surname}_${docRef.id}.png`);

                            // NEW POP-UP AFTER DOWNLOAD
                            Swal.fire({
                                title: "Important Notice",
                                icon: "info",
                                html: `
                        <div style="text-align: left;">
                            <p><strong>Your QR Code has been downloaded.</strong></p>
                            <p>Please allow up to <strong>24 hours</strong> for our team to review your application.</p>
                            <p style="color: #d33;">Note: Expect potential delays on weekends and holidays.</p>
                            <hr>
                            <p>You can track your application anytime using the <strong>Registration Status</strong> feature on the home page.</p>
                        </div>
                    `,
                                confirmButtonText: "I understand",
                                confirmButtonColor: "#28a745"
                            }).then(() => navigate("/home"));

                        } catch (err) {
                            console.error(err);
                            Swal.fire({ icon: "error", title: "Download Failed", text: "Error generating image." });
                        }
                    });

                    // PROCEED BUTTON LOGIC
                    document.getElementById("proceedBtn").addEventListener("click", () => {
                        Swal.fire({
                            title: "Next Steps",
                            icon: "info",
                            html: `
                    <p>Your submission is under review. Notification will be sent to <em>${finalEmail}</em>.</p>
                    <p>Processing usually takes 24 hours (excluding weekends).</p>
                `,
                            confirmButtonText: "Okay, got it!",
                        }).then(() => navigate("/home"));
                    });
                },
            });
        } catch (error) {
            console.error("Error submitting form:", error);
            if (typeof setErrorMessage === 'function') setErrorMessage(error.message);
            Swal.fire({
                title: "Error!",
                icon: "error",
                text: error.message || "Something went wrong. Please try again.",
            });
        }
    };


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
                const data = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, status: doc.data().status }));
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

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox'
                ? checked
                : type === 'file'
                    ? files[0] // Capture the first file selected
                    : value,
        }));
    };
    const totalSteps = 4;

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);


    const companyOptions = companies.map((company) => ({
        label: company.name,
        value: company.id,
        status: company.status // Ensure your API/data provides this field
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

    const designationOptionsForPassword = { "travel agency": ["Foreign Tour Guide", "Local Tour Guide", "Local Tour Coordinator", "Travel Agency Owner", "Tourist Port Assistance", "Hotel Coordinator", "Foreign Staff", "Field Staff", "Office Staff", "Others (Specify)"], "peoples organization": ["Local Tour Guide", "Island Hopping Boat Owner", "Island Hopping Boat Captian", "Island Hopping Boatman", "Party Boat Owner", "Party Boat Captain", "Party Boatman", "Yacht Owner", "Yacht Boat Captain", "Yacht Boatman", "Yacht Steward", "Paraw Owner", "Paraw Boatman", "Picnican Staff", "Travel Agency Owner", "Field Staff", "Office Staff",], "watersports provider": ["Watersports Provider Owner (Service Provider)", "Field Staff", "Office Staff",] };
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
                {!hideNavAndFooter && <AppNavBar bg="dark" variant="dark" title="Tourism Certificate QR Scanner" />}

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
                                            <Form.Label>Select Current Company *</Form.Label>

                                            <Select
                                                name="companyId"
                                                value={companyOptions.find((option) => option.value === formData.companyId) || null}
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
                                                // Disables the option if status is anything other than 'approved'
                                                isOptionDisabled={(option) => option.status !== 'approved'}
                                                // Customizes the label to show the status note
                                                formatOptionLabel={(option) => (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>{option.label}</span>
                                                        {option.status !== 'approved' && (
                                                            <span style={{
                                                                fontSize: '0.8rem',
                                                                color: '#dc3545',
                                                                backgroundColor: '#fff5f5',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                border: '1px solid #feb2b2'
                                                            }}>
                                                                {option.status ? option.status.toUpperCase() : 'PENDING'}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                            <Form.Text className="text-muted" style={{ fontSize: '0.85rem', marginTop: '8px', display: 'block' }}>
                                                If your current company is not on the list, kindly advise them to register first.
                                            </Form.Text>
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
                                            <Form.Label>Years in service as {formData.designation || ""}</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="years_in_service"
                                                value={formData.years_in_service}
                                                onChange={handleChange}
                                                placeholder={`Taon ng serbisyo bilang isang ${formData.designation || "trabahodor"}`}
                                            />
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


                                        <Form.Label className="mt-3">--- In case of Emergency ---</Form.Label>
                                        <Form.Group className="mb-3 mt-4">
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

                                {/* Step 4: Requirements */}
                                {currentStep === 4 && (
                                    <>
                                        {!formData.designation && (
                                            <p className="text-danger mb-4">
                                                Please select your <strong>Designation</strong> first to avoid missing any required file uploads.
                                            </p>
                                        )}


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

                                            // ✅ Prioritize formData.nationality over residency
                                            const nationalityValue = formData.nationality?.toLowerCase();
                                            const isForeign = nationalityValue === "foreign" || (!nationalityValue && residency === "foreign");

                                            return (
                                                <>
                                                    {!isExempted && !isForeign && (
                                                        <>
                                                            <Form.Check
                                                                type="checkbox"
                                                                label="I have completed FBSE/Tour Guiding training (Training Certificate required)"
                                                                checked={formData.isTrained}
                                                                onChange={(e) =>
                                                                    setFormData((prev) => ({
                                                                        ...prev,
                                                                        isTrained: e.target.checked
                                                                    }))
                                                                }
                                                            />

                                                            {!formData.isTrained && (
                                                                <div className="text-muted mb-2">
                                                                    You indicated you are not trained — training certificate is optional.
                                                                </div>
                                                            )}
                                                            {formData.isTrained && (
                                                                <FileUploader
                                                                    label="Training Certificate from DOT/LGU (2023/2024/2025) (Optional for renewal)"
                                                                    fileKey="trainingCert"
                                                                    storagePath="employee/training_certificates"
                                                                    formData={formData}
                                                                    setFormData={setFormData}
                                                                />
                                                            )}
                                                        </>

                                                    )}

                                                    {!isExempted && formData.application_type === "new" && formData.designation === "Local Tour Coordinator" && (
                                                        <FileUploader
                                                            label="Diploma / Transcript of Records / Certificate of Completion (For new tour coordinators only)"
                                                            fileKey="diploma"
                                                            storagePath="employee/diplomas"
                                                            formData={formData}
                                                            setFormData={setFormData}
                                                        />
                                                    )}

                                                    {!isExempted && isForeign && ["Foreign Tour Guide", "Foreign Staff"].includes(formData.designation) && (
                                                        <>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label className="fw-bold">Passport Number (for foreign only) *</Form.Label>
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
                                                type="email" // 1. Better for mobile keyboards and browser validation
                                                name="email"
                                                placeholder='Email address'
                                                // 2. The "|| ''" prevents errors if formData.email starts as undefined
                                                value={formData.email || ''}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                        {/* Notification + Password Fields */}
                                        {Object.values(designationOptionsForPassword)
                                            .flat()
                                            .includes(formData.designation) && (
                                                <div className="mt-4">
                                                    {/* Notification */}
                                                    <div className="alert alert-info small">
                                                        ⚠️ Submitting a password will enable tourist activity online access for this employee.
                                                    </div>

                                                    {/* Password */}
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
                                                            <InputGroup.Text
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                style={{ cursor: "pointer" }}
                                                            >
                                                                {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                                                            </InputGroup.Text>
                                                        </InputGroup>
                                                    </Form.Group>

                                                    {/* Confirm Password */}
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Confirm Password *</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control
                                                                type={showConfirmPassword ? "text" : "password"}
                                                                name="confirmPassword"
                                                                value={formData.confirmPassword}
                                                                onChange={handleChange}
                                                                required
                                                                isInvalid={
                                                                    formData.confirmPassword &&
                                                                    formData.confirmPassword !== formData.password
                                                                }
                                                            />
                                                            <InputGroup.Text
                                                                onClick={() =>
                                                                    setShowConfirmPassword(!showConfirmPassword)
                                                                }
                                                                style={{ cursor: "pointer" }}
                                                            >
                                                                {showConfirmPassword ? (
                                                                    <AiFillEyeInvisible />
                                                                ) : (
                                                                    <AiFillEye />
                                                                )}
                                                            </InputGroup.Text>
                                                            <Form.Control.Feedback type="invalid">
                                                                Passwords do not match.
                                                            </Form.Control.Feedback>
                                                        </InputGroup>
                                                    </Form.Group>
                                                </div>
                                            )}

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
                                            <strong className="text-danger">Reminder:</strong>
                                            <br />
                                            <br />
                                            <strong>Upload first the required documents before submitting. You will not be able to submit if the required documents is empty.</strong>
                                            <br />
                                            <br />
                                            Please double-check that all your uploaded files are correct and complete before submitting.
                                            <br /><br />
                                            Incomplete or incorrect files may delay the processing of your application.
                                        </div>
                                    </>)}
                                {/* Pagination Buttons */}
                                <Container className="empty-container"></Container>

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

                                {/* Navigation Buttons */}
                                <Container className="d-flex justify-content-between mt-3">
                                    {/* Previous Button - Set type="button" to prevent submission */}
                                    {currentStep > 1 ? (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={prevStep}
                                        >
                                            Previous
                                        </Button>
                                    ) : (
                                        <div />
                                    )}

                                    {/* Next Button or Submit */}
                                    {currentStep < 4 ? (
                                        <Button
                                            type="button"
                                            className="color-blue-button"
                                            variant="primary"
                                            onClick={nextStep}
                                        >
                                            Next
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            className="color-blue-button mt-3"
                                            // Note: Since this is type="submit", the Form's onSubmit will handle it.
                                            onClick={handleSubmit}
                                        >
                                            Submit
                                        </Button>
                                    )}
                                </Container>

                                <Container className='empty-container'></Container>

                                {/* Custom Styles for Dots */}

                            </Form>
                        </Container>
                    </Container>
                </Col>
                {!hideNavAndFooter && (
                    <>
                        <div className="my-5"></div>
                        <FooterCustomized scrollToId="toppage" />
                    </>
                )}            </Row>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        </>
    );
};