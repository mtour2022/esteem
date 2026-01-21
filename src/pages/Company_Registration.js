import { Form, Button, Dropdown, InputGroup, Row, Col, Alert, Container, Image, Modal } from 'react-bootstrap';
import ReactDOM from "react-dom";

import React, { useState, useRef, useCallback } from 'react';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import { Navigate } from 'react-router-dom';
import { db, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { docreateUserWithEmailAndPassword } from "../config/auth";
import Swal from 'sweetalert2';
import Company from '../classes/company';
import AppNavBar from "../components/AppNavBar";
import Webcam from "react-webcam"; // Install with: npm install react-webcam
import { useDropzone } from "react-dropzone";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faCancel, faCamera, faFileWord, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import AddressInput from '../components/AddressForm'
import SaveGroupToCloud from "../components/SaveGroup"; // Adjust the import path if necessary
import FooterCustomized from '../components/Footer';
import { auth } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import download from "downloadjs";
import { createRoot } from "react-dom/client";

import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import logolgu from "../assets/images/lgu.png";

import QRCode from "qrcode";



export default function CompanyRegistrationPage({ hideNavAndFooter = false }) {

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [inputAddressValue, setInputAddressValue] = useState("");
    const [showAddressDropdown, setShowAddressDropdown] = useState(false);
    const [filteredAddressOptions, setFilteredAddressOptions] = useState([]);

    // Initialize Company class 
    const [companyData, setCompanyData] = useState(new Company({}));
    const companyCollectionRef = collection(db, "company");
    const navigate = useNavigate();
const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
        // 1. Validation
        if (!permit || !logo) {
            Swal.fire({
                title: "Missing File(s)",
                icon: "warning",
                text: "Please upload both your permit/accreditation and official logo before submitting."
            });
            return;
        }

        // 2. Start Loading
        Swal.fire({
            title: "Processing Registration...",
            text: "Creating account and uploading files. Please wait.",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        // 3. Create Auth User
        let userCredential;
        try {
            userCredential = await docreateUserWithEmailAndPassword(
                companyData.email,
                companyData.password 
            );
        } catch (authError) {
            if (authError.code === "auth/email-already-in-use") {
                Swal.fire({ title: "Error", icon: "warning", text: "Email already registered." });
                return;
            }
            throw authError;
        }

        const authUID = userCredential.user.uid;

        // 4. Auto-Upload Files to Storage Helper
        const uploadFile = async (file, folder) => {
            const ext = file.name?.split(".").pop() || "jpg";
            const storageRef = ref(storage, `company/${folder}/${authUID}_${Date.now()}.${ext}`);
            await uploadBytes(storageRef, file);
            return await getDownloadURL(storageRef);
        };

        // Parallel upload for better speed
        const [permitURL, logoURL] = await Promise.all([
            uploadFile(permit, "permits"),
            uploadFile(logo, "logos")
        ]);

        // 5. Create Firestore Document
        const companyObject = {
            ...companyData,
            userUID: authUID,
            permit: permitURL,
            logo: logoURL,
            status: "under review",
            status_history: [
                {
                    date_updated: new Date().toISOString(),
                    remarks: "Application Submitted",
                    status: "under review"
                }
            ]
        };

        const docRef = await addDoc(companyCollectionRef, companyObject);
        
        // Update document with its own ID
        await updateDoc(doc(db, "company", docRef.id), { company_id: docRef.id });

        // 6. Success & QR Generation UI
        const dateNow = new Date().toLocaleString("en-PH", { dateStyle: "long", timeStyle: "short" });

        Swal.fire({
            title: "Registration Successful!",
            html: `
                <div id="qr-download-area" style="padding:20px; background:#fff; border:1px solid #eee; color: #333;">
                    <img src="${logolgu}" height="60" style="display: block; margin: 0 auto 10px;" />
                    <div style="text-align: center;">
                        <h6 style="margin:5px 0; font-weight: bold;">Municipal Tourism Office - Malay</h6>
                        <p style="font-size:12px; margin-bottom: 10px;">ID: ${docRef.id}<br><strong>${companyData.companyName}</strong></p>
                        <canvas id="generatedQR" style="margin: 0 auto;"></canvas>
                        <p style="font-size:10px; color:#666; margin-top:10px;">Registered on: ${dateNow}</p>
                    </div>
                </div>
                <div style="margin-top:15px; display:flex; flex-direction:column; gap:10px;">
                    <button id="downloadImageBtn" class="swal2-confirm swal2-styled" style="background:#007bff;">Download QR Image</button>
                    <button id="proceedBtn" class="swal2-confirm swal2-styled" style="background:#28a745;">Finish</button>
                </div>
            `,
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => {
                const canvas = document.getElementById("generatedQR");
                // Generate the QR inside the canvas
                QRCode.toCanvas(canvas, `https://esteem.com/status/${docRef.id}`, { width: 200 });

                // Download Logic
                document.getElementById("downloadImageBtn").onclick = async () => {
                    const area = document.getElementById("qr-download-area");
                    try {
                        // useCORS: true is vital if your logolgu is hosted on Firebase/External
                        const dataUrl = await toPng(area, { 
                            backgroundColor: "#ffffff",
                            cacheBust: true,
                            useCORS: true 
                        });
                        const link = document.createElement("a");
                        link.download = `Registration_QR_${companyData.companyName}.png`;
                        link.href = dataUrl;
                        link.click();
                    } catch (err) {
                        console.error("Download failed", err);
                        Swal.showValidationMessage(`Download failed: ${err.message}`);
                    }
                };

                // Proceed Logic
                document.getElementById("proceedBtn").onclick = () => {
                    Swal.close();
                    navigate("/home");
                };
            }
        });

        // 7. Clear local state after success
        setPermit(null);
        setLogo(null);
        // If you have a state reset function for companyData:
        // setCompanyData(initialState); 

    } catch (error) {
        console.error("Submission Error:", error);
        Swal.fire({ 
            title: "Submission Error", 
            icon: "error", 
            text: error.message || "An unexpected error occurred. Please try again." 
        });
    }
};



    const handleChange = (e) => {
        const { name, value } = e.target;

        setCompanyData((prevData) => {
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


    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(prev => !prev);
    };

    // DropDownOptions
    const classificationOption = [
        { value: "travel agency", label: "Travel and Tour Agency" },
        { value: "peoples organization", label: "People's Organization (Associations / Cooperative)" },
        { value: "watersports provider", label: "Watersports Provider" },
    ];

    const ownershipOption = [
        { value: "sole proprietorship", label: "Sole Proprietorship" },
        { value: "one person corporation", label: "One Person Corporation" },
        { value: "corporation", label: "Corporation" },
        { value: "partnership", label: "Parnership" },
        { value: "cooperative", label: "Cooperative" },
        { value: "association", label: "Association" },
    ];

    const foreignOrLocalOption = [
        { value: "local", label: "Local" },
        { value: "foreign", label: "Foreign" },
    ];

    // Pagination
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    const nextStep = () => setCurrentStep((prev) => prev + 1);
    const prevStep = () => setCurrentStep((prev) => prev - 1);

    // Logo Upload 
    const [logo, setLogo] = useState(null);
    const [logoURL, setLogoURL] = useState("");

    // Logo Dropzone 
    const onLogoDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setLogo(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps } = useDropzone({
        onDrop: onLogoDrop,
        accept: "image/*,application/pdf",
        disabled: !!logoURL, // Disable dropzone after upload
    });

    // Logo State
const [showLogoCamera, setShowLogoCamera] = useState(false);
const logoWebcamRef = useRef(null);

// Logo Camera Capture
const captureLogoPhoto = () => {
    const imageSrc = logoWebcamRef.current.getScreenshot();
    if (imageSrc) {
        fetch(imageSrc)
            .then(res => res.blob())
            .then(blob => {
                const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
                const fileName = `captured_logo_${timestamp}.jpg`;
                const file = new File([blob], fileName, { type: "image/jpeg" });
                setLogo(file);
                setShowLogoCamera(false); // Close camera after capture
            });
    }
};



    // Upload Logo to Firebase
    const uploadLogo = async () => {
        if (!logo) return;

        // Show Swal loading
        Swal.fire({
            title: "Uploading...",
            text: "Please wait while your logo is being uploaded.",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const filesFolderRef = ref(storage, `company/logos/${logo.name}`);

        try {
            await uploadBytes(filesFolderRef, logo);
            const downloadURL = await getDownloadURL(filesFolderRef);

            setLogoURL(downloadURL);
            setCompanyData((prevData) => ({
                ...prevData,
                logo: downloadURL,
            }));

            // Show success message
            Swal.fire({
                title: "Upload Complete!",
                text: "Your logo has been uploaded successfully.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });

        } catch (err) {
            console.error(err);

            // Show error message
            Swal.fire({
                title: "Upload Failed!",
                text: "Something went wrong. Please try again.",
                icon: "error",
            });
        }
    };


    // Reset the uploaded file and delete from firebase
    const resetLogo = async () => {
        if (!logoURL) return;

        try {
            // Reference to the uploaded file in Firebase Storage
            const fileRef = ref(storage, logoURL);

            // Delete the file from Firebase Storage
            await deleteObject(fileRef);

            // Reset the state
            setLogo(null);
            setLogoURL("");  // Clear uploaded file URL
            setCompanyData((prevData) => ({
                ...prevData,
                logo: "",
            }));

            console.log("Previous file deleted successfully.");
        } catch (err) {
            console.error("Error deleting file:", err);
        }
    };

    // Permit Scanner
    const [permit, setPermit] = useState(null);
    const [permitURL, setPermitURL] = useState(""); // Stores the uploaded file's URL


    const handlePermitChange = (e) => {
        const file = e.target.files[0];
        setPermit(file);
    };

    // Dropzone Logic
    const onPermitDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setPermit(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps: getPermitRootProps, getInputProps: getPermitInputProps } = useDropzone({
        onDrop: onPermitDrop,
        accept: "image/*,application/pdf",
        disabled: !!permitURL, // Disable dropzone after upload
    });


    // Upload Permit to Firebase
    const uploadPermit = async () => {
        if (!permit) return;

        // Show Swal loading
        Swal.fire({
            title: "Uploading...",
            text: "Please wait while your permit/accreditation is being uploaded.",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const filesFolderRef = ref(storage, `company/permits/${permit.name}`);

        try {
            await uploadBytes(filesFolderRef, permit);
            const downloadURL = await getDownloadURL(filesFolderRef);

            setPermitURL(downloadURL);
            setCompanyData((prevData) => ({
                ...prevData,
                permit: downloadURL,
            }));

            // Show success message
            Swal.fire({
                title: "Upload Complete!",
                text: "Your permit/accreditation has been uploaded successfully.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });

        } catch (err) {
            console.error(err);

            // Show error message
            Swal.fire({
                title: "Upload Failed!",
                text: "Something went wrong. Please try again.",
                icon: "error",
            });
        }
    };


    // Reset the uploaded file and delete from firebase
    const resetPermit = async () => {
        if (!permitURL) return;

        try {
            // Reference to the uploaded file in Firebase Storage
            const fileRef = ref(storage, permitURL);

            // Delete the file from Firebase Storage
            await deleteObject(fileRef);

            // Reset the state
            setPermit(null);
            setPermitURL("");  // Clear uploaded file URL
            setCompanyData((prevData) => ({
                ...prevData,
                permit: "",
            }));

            console.log("Previous file deleted successfully.");
        } catch (err) {
            console.error("Error deleting file:", err);
        }
    };

    const [showCamera, setShowCamera] = useState(false);
    const webcamRef = useRef(null);

    const capturePhoto = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        fetch(imageSrc)
            .then(res => res.blob())
            .then(blob => {
                const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
                const fileName = `captured_permit_${timestamp}.jpg`;
                const file = new File([blob], fileName, { type: "image/jpeg" });
                setPermit(file);
                setShowCamera(false);
            });
        console.log(imageSrc);
    };




    return (
        <>
            <Row className="justify-content-center">
                {!hideNavAndFooter && <AppNavBar bg="dark" variant="dark" title="Tourism Certificate QR Scanner" />}

                <Col md={6} className="p-0">
                    <Container className="container" id="toppage">
                        <Container className='body-container'>
                            <p className='barabara-label'>COMPANY ACCOUNT CREATION</p>
                            <p className="sub-title-blue">Prepare your <b>requirements</b> and <b>register</b> now to enjoy the perks of having an electronic system for tracking, evaluating, and expert monitoring of tour activities in Boracay Island, Malay, Aklan!</p>

                            <h6>📄 Documents Needed:</h6>
                            <ul>
                                <li>Business Permit or LGU Accreditation from the SB Office</li>
                                <li>Company Official Logo</li>
                            </ul>
                            <h6>📝 Information Needed:</h6>
                            <ul>
                                <li>Business Name (Registered under DTI)</li>
                                <li>Year Established</li>
                                <li>Company Type (Local or Foreign)</li>
                                <li>Proprietor/President's Name</li>
                                <li>Local Office Address</li>
                                <li>Company Email Address</li>
                                <li>Company Contact Number</li>
                            </ul>
                            <div className="mb-3 p-3 border-start border-4 border-warning bg-light rounded">
                                <strong className="text-danger">Important Reminder:</strong><br />
                                Only tourism enterprises within the <strong>Municipality of Malay</strong> are allowed to register.
                                Businesses from outside the municipality must have a local office within Malay or a partnership with a local enterprise in order to operate.
                                <br /><br />
                                After submitting your registration, please wait up to <strong>24 hours</strong> for verification.
                                Kindly note that registrations submitted during <strong>weekends</strong> may experience delays in the validation process.
                                <br /><br />
                                Once your registration is successfully validated, an email will be sent to your <strong>company email address</strong> with further instructions or confirmation.
                            </div>

                        </Container>


                    </Container>
                </Col>
                <Col md={6} className="p-0">
                    <Container className="container background-container">
                        <Container className='body-container'>
                            <Form className="custom-form ">
                                <p className='barabara-label'>REGISTRATION FORM</p>
                                {/* Step 1: Company Details 1 */}
                                {currentStep === 1 && (
                                    <>
                                        <Form.Group className="my-2">
                                            <Form.Label className="fw-bold mt-2">Business Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                placeholder='Business Name Registered Under DTI'
                                                value={companyData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                        <Form.Group className="my-2">
                                            <Form.Label className="fw-bold mt-2">Classification</Form.Label>
                                            <Form.Select
                                                name="classification"
                                                value={companyData.classification}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">select classification</option> {/* Optional default placeholder */}
                                                {classificationOption.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="my-2">
                                            <Form.Label className="fw-bold mt-2">Year Established</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="year"
                                                value={companyData.year}
                                                onChange={handleChange}
                                                min="1900"  // Optional: Prevents unrealistic years
                                                max={new Date().getFullYear()} // Optional: Limits to the current year
                                                required
                                            />
                                        </Form.Group>
                                        <Form.Group className="my-2">
                                            <Form.Label className="fw-bold">Ownership Type</Form.Label>
                                            <Form.Select
                                                name="ownership"
                                                value={companyData.ownership}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">select ownership type</option> {/* Optional default placeholder */}
                                                {ownershipOption.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="my-2">
                                            <Form.Label className="fw-bold">Company Type</Form.Label>
                                            <Form.Select
                                                name="type"
                                                value={companyData.type}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">select company type</option> {/* Optional default placeholder */}
                                                {foreignOrLocalOption.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="my-2">
                                            <Form.Label className="mt-2 fw-bold">
                                                {companyData.ownership === "corporation"
                                                    ? "Proprietor's Name (only one representative)"
                                                    : companyData.ownership === "cooperative"
                                                        ? "President's Name (registered under the Sangguniang Bayan Office)"
                                                        : companyData.ownership === "association"
                                                            ? "President's Name (registered under the Sangguniang Bayan Office)"
                                                            : "Proprietor's Name"}
                                            </Form.Label>
                                            <Form.Control
                                                className="my-2"
                                                type="text"
                                                name="proprietor.first"
                                                placeholder='first name'
                                                required
                                                value={companyData.proprietor.first}
                                                onChange={handleChange}
                                            />
                                            <Form.Control
                                                className="my-2"
                                                type="text"
                                                name="proprietor.last"
                                                placeholder='last name'
                                                required
                                                value={companyData.proprietor.last}
                                                onChange={handleChange}
                                            />
                                            <Form.Control
                                                className="my-2"
                                                type="text"
                                                name="proprietor.middle"
                                                placeholder='middle name'
                                                value={companyData.proprietor.middle}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </>
                                )}
                                {/* Step 2: Company Details */}
                                {currentStep === 2 && (
                                    <>
                                        <AddressInput groupData={companyData} setGroupData={setCompanyData}></AddressInput>

                                        <Form.Group className="my-2">
                                            <Form.Label className="fw-bold mt-2">Company Email Address</Form.Label>
                                            <p className="sub-title text-muted">Use official working email for this.</p>

                                            <Form.Control

                                                type="text"
                                                name="email"
                                                placeholder='company email address'
                                                value={companyData.email}
                                                onChange={handleChange}
                                                required
                                            />

                                        </Form.Group>
                                        <Form.Group className="my-2">
                                            <Form.Label className="fw-bold mt-2">Company Contact Number</Form.Label>
                                            <Form.Control

                                                type="text"
                                                name="contact"
                                                placeholder='company telephone/mobile number'
                                                value={companyData.contact}
                                                onChange={handleChange}
                                                required
                                            />

                                        </Form.Group >
                                        {/* Drag and Drop Zone */}
                                        <Form.Group className="my-2">
                                            <Form.Label className="my-2 fw-bold">
                                                {companyData.classification === "peoples organization"
                                                    ? "Certificate of Accreditation from the Sangguniang Bayan Offfice"
                                                    : companyData.classification === "travel agency" || companyData.classification === "watersports provider"
                                                        ? "Business Permit/Receipt from the Licensing Office dated in the current year"
                                                        : "Business Permit / LGU Accreditation from the SB Office"}
                                            </Form.Label>
                                            <Container {...getPermitRootProps({
                                                accept: "image/png, image/jpeg, image/jpg, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                                onDrop: (acceptedFiles) => {
                                                    const file = acceptedFiles[0];
                                                    if (file && ["image/png", "image/jpeg", "image/jpg", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
                                                        setPermit(file);
                                                    } else {
                                                        Swal.fire({
                                                            icon: "error",
                                                            title: "Invalid File Type",
                                                            text: "Only PNG, JPG, JPEG, PDF, and DOC files are allowed.",
                                                        });
                                                    }
                                                }
                                            })}
                                                className={`dropzone-container text-center w-100 ${permitURL ? "border-success" : ""}`}
                                            >
                                                <input {...getPermitInputProps()} accept="image/png, image/jpeg, image/jpg, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document" />

                                                {permit ? (
                                                    permit.type.startsWith("image/") ? (
                                                        <img
                                                            src={URL.createObjectURL(permit)}
                                                            alt="Uploaded Preview"
                                                            className="img-fluid mt-2"
                                                            style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
                                                        />
                                                    ) : permit.type === "application/pdf" ? (
                                                        <p className="fw-bold text-muted">
                                                            <FontAwesomeIcon icon={faFilePdf} className="text-danger me-2" />
                                                            PDF Selected: {permit.name}
                                                        </p>
                                                    ) : permit.type === "application/msword" || permit.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? (
                                                        <p className="fw-bold text-muted">
                                                            <FontAwesomeIcon icon={faFileWord} className="text-primary me-2" />
                                                            DOC File Selected: {permit.name}
                                                        </p>
                                                    ) : (
                                                        <p className="fw-bold text-muted">File selected: {permit.name}</p>
                                                    )
                                                ) : (
                                                    <p className="text-muted">
                                                        Drag & Drop your{" "}
                                                        {companyData.classification === "peoples organization"
                                                            ? "LGU Accreditation"
                                                            : companyData.classification === "travel agency" || companyData.classification === "watersports provider"
                                                                ? "Business Permit"
                                                                : "Business Permit / LGU Accreditation"}{" "}
                                                        here or <span className="text-primary text-decoration-underline">Choose File</span>
                                                    </p>
                                                )}
                                            </Container>
                                            <Container className="d-flex flex-wrap justify-content-between mt-2">
                                                <p className="sub-title me-3">Supported File: PNG, JPEG, and JPG</p>
                                                <p className="sub-title">Maximum size: 25MB</p>
                                            </Container>


                                            {/* Upload & Camera Buttons */}
<Container className="d-flex justify-content-center gap-2 flex-wrap">
    <Button
        className="my-2"
        variant="outline-secondary"
        onClick={() => {
            if (permit) setPermit(null); // Clear if retaking
            setShowCamera(!showCamera);
        }}
    >
        <FontAwesomeIcon icon={faCamera} /> {showCamera ? "Cancel Camera" : "Use Camera"}
    </Button>

    {/* Note: We removed the "Upload File" button here. 
        The file is now sent during handleSubmit. */}
    
    {permit && (
        <Button className="my-2" variant="outline-danger" onClick={() => setPermit(null)}>
            <FontAwesomeIcon icon={faCancel} size="xs" fixedWidth className="me-1"/>
            Clear Selection
        </Button>
    )}
</Container>

                                            {permit && (
                                                !permitURL ? ("") : (
                                                    <Container className="d-flex justify-content-center mt-2">
                                                        <p className='sub-title text-success'>Permit/Accreditation Successfully Uploaded!</p>
                                                    </Container>
                                                )
                                            )}
                                        </Form.Group>

                                        <Modal show={showCamera} onHide={() => setShowCamera(false)} centered fullscreen>
                                            <Modal.Body className="d-flex flex-column justify-content-center align-items-center">
                                                <Webcam
                                                    audio={false}
                                                    ref={webcamRef}
                                                    screenshotFormat="image/jpeg"
                                                    className="w-100 h-100" // Makes the webcam full screen inside modal
                                                />
                                                <Container className="mt-3">
                                                    <Row className="justify-content-center">
                                                        <Col xs="auto">
                                                            <Button variant="outline-primary" onClick={capturePhoto}>
                                                                Capture
                                                            </Button>
                                                        </Col>
                                                        <Col xs="auto">
                                                            <Button variant="outline-danger" onClick={() => setShowCamera(false)}>
                                                                Cancel Camera
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                </Container>

                                            </Modal.Body>
                                        </Modal>


                                    </>
                                )}
                                {/* Step 3: Company Details */}
                                {currentStep === 3 && (
                                    <>
                                       <Form.Group className="my-4">
    <Form.Label className="fw-bold">Official Company Logo</Form.Label>

    {/* Camera View */}
    {showLogoCamera ? (
        <Container className="text-center p-3 border rounded bg-light">
            <Webcam
                audio={false}
                ref={logoWebcamRef}
                screenshotFormat="image/jpeg"
                className="w-100 rounded mb-2"
                videoConstraints={{ facingMode: "user" }}
            />
            <Button variant="primary" onClick={captureLogoPhoto}>
                <FontAwesomeIcon icon={faCamera} className="me-2" /> Capture Logo
            </Button>
        </Container>
    ) : (
        /* Dropzone View */
        <Container 
            {...getLogoRootProps()} 
            className={`dropzone-container text-center p-4 border-2 rounded ${logo ? "border-success" : "border-dashed"}`}
            style={{ borderStyle: logo ? 'solid' : 'dashed', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
        >
            <input {...getLogoInputProps()} />
            {logo ? (
                <div>
                    <img
                        src={URL.createObjectURL(logo)}
                        alt="Logo Preview"
                        className="img-fluid"
                        style={{ maxHeight: "150px" }}
                    />
                    <p className="mt-2 mb-0 text-success fw-bold">{logo.name}</p>
                </div>
            ) : (
                <div className="py-3">
                    <FontAwesomeIcon icon={faUpload} size="2x" className="text-muted mb-2" />
                    <p className="text-muted mb-0">Drag & Drop logo or click to select</p>
                </div>
            )}
        </Container>
    )}

    {/* Action Buttons */}
    <Container className="d-flex justify-content-center gap-2 mt-3 flex-wrap">
        <Button
            variant="outline-secondary"
            onClick={() => {
                if (logo) setLogo(null); 
                setShowLogoCamera(!showLogoCamera);
            }}
        >
            <FontAwesomeIcon icon={faCamera} className="me-2" />
            {showLogoCamera ? "Cancel Camera" : "Use Camera"}
        </Button>

        {logo && (
            <Button variant="outline-danger" onClick={() => setLogo(null)}>
                <FontAwesomeIcon icon={faCancel} className="me-1" />
                Clear Selection
            </Button>
        )}
    </Container>
</Form.Group>
                                        <Form.Group className="my-2">

                                        </Form.Group>
                                        <Form.Group>
                                            <Form.Label className="fw-bold mt-2">Password</Form.Label>
                                            <InputGroup className="mb-3">
                                                <Form.Control
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="Password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => {
                                                        setPassword(e.target.value);
                                                        setCompanyData(prev => ({
                                                            ...prev,
                                                            password: e.target.value
                                                        }));
                                                    }}
                                                />
                                                <InputGroup.Text onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }}>
                                                    {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                                                </InputGroup.Text>
                                            </InputGroup>
                                        </Form.Group>

                                        <Form.Group>
                                            <Form.Label className="fw-bold">Confirm Password</Form.Label>
                                            <InputGroup className="mb-3">
                                                <Form.Control
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    placeholder="Confirm password"
                                                    required
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    isInvalid={confirmPassword && confirmPassword !== password}
                                                />
                                                <InputGroup.Text onClick={toggleConfirmPasswordVisibility} style={{ cursor: 'pointer' }}>
                                                    {showConfirmPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                                                </InputGroup.Text>
                                                <Form.Control.Feedback type="invalid">
                                                    Passwords do not match.
                                                </Form.Control.Feedback>
                                            </InputGroup>
                                        </Form.Group>

                                    </>
                                )}
                                <Container className="d-flex justify-content-between mt-3">
                                    {/* Page 1 → Only Next button aligned right */}
                                    {currentStep === 1 && (
                                        <div className="ms-auto"> {/* pushes to the right */}
                                            <Button
                                                type="button"
                                                className="color-blue-button"
                                                variant="primary"
                                                onClick={nextStep}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}

                                    {/* Page 2 → Previous (left) and Next (right) */}
                                    {currentStep === 2 && (
                                        <>
                                            <Button type="button" variant="secondary" onClick={prevStep}>
                                                Previous
                                            </Button>
                                            <Button
                                                type="button"
                                                className="color-blue-button"
                                                variant="primary"
                                                onClick={nextStep}
                                            >
                                                Next
                                            </Button>
                                        </>
                                    )}

                                    {/* Page 3 → Previous (left) and Submit (right) */}
                                    {currentStep === 3 && (
                                        <>
                                            <Button type="button" variant="secondary" onClick={prevStep}>
                                                Previous
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="color-blue-button"
                                                onClick={handleSubmit}
                                            >
                                                Submit
                                            </Button>
                                        </>
                                    )}
                                </Container>


                                <Container className='empty-container'></Container>
                                {/* // <SaveGroupToCloud
                                        //     groupData={companyData}
                                        //     setGroupData={setCompanyData}
                                        //     password={password}
                                        //     email={companyData.email}
                                        //     fileType="Application"
                                        //     collectionName="company"
                                        //     disabled={!logoURL || !permitURL || !password}
                                        //     idName="company_id"
                                        //     ModelClass={Company}
                                        //     onSuccess={() => {
                                        //         setLogoURL("");
                                        //         setPermitURL("");
                                        //         setConfirmPassword("");
                                        //         setPassword("");
                                        //     }}
                                        // /> */}
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

                {!hideNavAndFooter && (
                    <>
                        <div className="my-5"></div>
                        <FooterCustomized scrollToId="toppage" />
                    </>
                )}

            </Row>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        </>
    );
};