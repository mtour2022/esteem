import { Form, Button, InputGroup, Row, Col, Alert, Container, Image, Modal } from 'react-bootstrap';
import React, { useState, useRef, useCallback } from 'react';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import { Navigate } from 'react-router-dom';
import { db, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, doc, updateDoc  } from 'firebase/firestore';
import Swal from 'sweetalert2';
import Company from '../classes/company';
import AppNavBar from "../components/AppNavBar";
import Webcam from "react-webcam"; // Install with: npm install react-webcam
import { useDropzone } from "react-dropzone";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faCancel, faCamera, faFileWord, faFilePdf } from '@fortawesome/free-solid-svg-icons';



export default function Login(){

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Initialize Company class
    const [companyData, setCompanyData] = useState(new Company({}));
    const companyCollectionRef = collection(db, "company");

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
    
    
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const docRef = await addDoc(companyCollectionRef, companyData.toObject()); // Convert before saving
            const companyDoc = doc(db, "company", docRef.id);
            await updateDoc(companyDoc, { company_id: docRef.id });
            setCompanyData(new Company({})); // Reset with empty object
            Swal.fire({ title: "Success!", icon: "success", text: "Company Successfully Created" });
        } catch (error) {
            console.error('Error submitting form:', error);
            setErrorMessage(error.message);
            Swal.fire({ title: "Error!", icon: "error", text: "Please Try Again" });
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const classificationOption = [
        { value: "travel agency", label: "Travel and Tour Agency" },
        { value: "peoples organization", label: "People's Organization (Associations / Cooperative)" },
        { value: "service provider", label: "Service Provider (Tour Activity Providers)" },
      ];
    
    const ownershipOption = [
        { value: "sole proprietorship", label: "Sole Proprietorship" },
        { value: "one person corporation", label: "One Person Corporation" },
        { value: "corporation", label: "Corporation" },
        { value: "partnership", label: "Parnership" },
        { value: "cooperative", label: "Cooperative" },
        { value: "association", label: "Association" },
      ];

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 2; // Adjust this if you add more steps

    const nextStep = () => setCurrentStep((prev) => prev + 1);
    const prevStep = () => setCurrentStep((prev) => prev - 1);

    // const [logo, setLogo] = useState("");


    // const handleLogoChange = (e) => {
    //     const file = e.target.files[0];
    //     setLogo(file);
    //   };

    // const uploadLogo = async () => {
    //     if (!logo) return;
    
    //     const filesFolderRef = ref(storage, `company/logos/${logo.name}`);
    
    //     try {
    //       await uploadBytes(filesFolderRef, logo);
    
    //       const downloadURL = await getDownloadURL(filesFolderRef);
    
    //     setLogo(downloadURL);
    //         setCompanyData((prevData) => ({
    //          ...prevData,
    //          logo: downloadURL,
    //      }));

         
    //     } catch (err) {
    //       console.error(err);
    //     }
    //   };

    //Logo Upload

    // Permit Scanner
    const [logo, setLogo] = useState(null);
    const [logoURL, setLogoURL] = useState(""); // Stores the uploaded file's URL


    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        setLogo(file);
      };

    


    // Dropzone Logic
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

   

    const handlePermitUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange({ target: { name: "permit", value: reader.result } });
            };
            reader.readAsDataURL(file);
        }
    };

    const capturePhoto = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        handleChange({ target: { name: "permit", value: imageSrc } });

        setShowCamera(false);
    };

    // Dropzone

    


    return (
        <>  
        <Row  className="justify-content-center">
        <AppNavBar bg="dark" variant="dark" title="Left Appbar" />

            <Col md={6} className="p-0">
                <Container className="container">
                        <Container className='body-container'>
                        <p className='barabara-label'>COMPANY ACCOUNT CREATION</p>  
                        <p className="sub-title-blue">Prepare your <b>requirements</b> and <b>register</b> now to enjoy the perks of having an electronic system for tracking, evaluating, and expert monitoring of tour activities in Malay-Boracay!</p>
                        <p className="label">REQUIREMENTS</p>
                        </Container> 
                
                    </Container>
                </Col>
            <Col md={6} className="p-0">
                <Container className="container background-container">
                    <Container className='body-container'>
                    <Form onSubmit={(e) => handleSubmit(e)} className="custom-form body-container">
                    <p className='barabara-label'>REGISTRATION FORM</p> 
                    {/* Step 1: Company Details 1 */}
                    {currentStep === 1 && (
                        <>
                        
                        <Form.Group className="my-2">
                            <Form.Label  className="fw-bold">Business Name</Form.Label>
                            <Form.Control 
                                type="text" 
                                name="name"
                                placeholder='business name registered in DTI'
                                value={companyData.name}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="my-2">
                            <Form.Label  className="fw-bold">Classification</Form.Label>
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
                            <Form.Label  className="fw-bold">Year Established</Form.Label>
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
                        <Form.Group className="mt-3 d-flex flex-column flex-md-row justify-content-md-end align-items-end">
                            <Form.Check
                                type="checkbox"
                                label="Is a Foreign Company?"
                                checked={companyData.type === "foreign"} // Checkbox is checked if type is "foreign"
                                onChange={(e) =>
                                    handleChange({
                                        target: { name: "type", value: e.target.checked ? "foreign" : "local" },
                                    })
                                }
                            />
                        </Form.Group>
                        
                    
                    {/* Drag and Drop Zone */}
                    <Form.Group className="my-2">
                            <Form.Label className="my-2 fw-bold">
                                {companyData.classification === "peoples organization"
                                    ? "Certificate of Accreditation from the Sangguniang Bayan Offfice"
                                    : companyData.classification === "travel agency" ||  companyData.classification === "service provider"
                                    ? "Business Permit/Receipt from the Licensing Office dated in the current year"
                                    : "Business Permit / LGU Accreditation "}
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
                                    )  : permit.type === "application/pdf" ? (
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
                                    ) :  (
                                    <p className="text-muted">
                                        Drag & Drop your{" "}
                                        {companyData.classification === "peoples organization"
                                            ? "LGU Accreditation"
                                            : companyData.classification === "travel agency" || companyData.classification === "service provider"
                                            ? "Business Permit"
                                            : "Business Permit / LGU Accreditation"}{" "}
                                        here or <span className="text-primary text-decoration-underline">Choose File</span>
                                    </p>
                                )}
                            </Container>
                            <Container className="d-flex justify-content-between mt-2">
                                    <p className='sub-title'>Supported File: PNG, JPG, JPEG, PDF, DOC, and DOCX</p>
                                    <p className='sub-title'>Maximum size: 25MB</p>
                            </Container>

                            {/* Upload & Camera Buttons */}
                            <Container className="d-flex justify-content-between">
                                {/* Always show "Use Camera" button */}
                                <Button className="my-2" variant="outline-secondary" onClick={() => setShowCamera(!showCamera)}>
                                    <FontAwesomeIcon className="button-icon" icon={faCamera} size="xs" fixedWidth />
                                    {showCamera ? "Cancel Camera" : "Use Camera"}
                                </Button>

                                {/* Show Upload / Reupload button only when a file is selected */}
                                {permit && (
                                    !permitURL ? (
                                        <Button className="my-2" variant="outline-success" onClick={uploadPermit}>
                                            <FontAwesomeIcon className="button-icon" icon={faUpload} size="xs" fixedWidth />
                                            Upload File
                                        </Button>
                                    ) : (
                                        <Button className="my-2" variant="outline-danger" onClick={resetPermit}>
                                            <FontAwesomeIcon className="button-icon" icon={faCancel} size="xs" fixedWidth />
                                            Reupload
                                        </Button>
                                    )
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
                    {currentStep === 2 && (
                        <>
                            <Form.Group className="my-2">
                                <Form.Label className="mt-2 fw-bold">
                                    Local Office Address
                                </Form.Label>
                                <Form.Control 
                                className="my-2"
                                    type="text" 
                                    name="address.country"
                                    placeholder='country'
                                    required
                                    value={companyData.address.country}
                                    onChange={handleChange}
                                />
                                <Form.Control 
                                className="my-2"
                                    type="text" 
                                    name="address.region"
                                    placeholder='region'
                                    required
                                    value={companyData.address.region}
                                    onChange={handleChange}
                                />
                                <Form.Control 
                                className="my-2"
                                    type="text" 
                                    name="address.province"
                                    placeholder='province/city'
                                    required
                                    value={companyData.address.province}
                                    onChange={handleChange}
                                />
                                <Form.Control 
                                className="my-2"
                                    type="text" 
                                    name="address.zip"
                                    placeholder='zip code'
                                    value={companyData.address.zip}
                                    onChange={handleChange}
                                />
                                <Form.Control 
                                className="my-2"
                                    type="text" 
                                    name="address.town"
                                    placeholder='town/city'
                                    required
                                    value={companyData.address.town}
                                    onChange={handleChange}
                                />
                                <Form.Control 
                                className="my-2"
                                    type="text" 
                                    name="address.barangay"
                                    placeholder='barangay'
                                    value={companyData.address.barangay}
                                    onChange={handleChange}
                                />
                                <Form.Control 
                                className="my-2"
                                    type="text" 
                                    name="address.street"
                                    placeholder='street name'
                                    value={companyData.address.street}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                            <Form.Group className="my-2">
                            <Form.Label  className="fw-bold">Email Address</Form.Label>
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
                            <Form.Label  className="fw-bold">Contact Number</Form.Label>
                            <Form.Control 
                                
                                type="text" 
                                name="contact"
                                placeholder='company telephone/mobile number'
                                value={companyData.contact}
                                onChange={handleChange}
                                required
                                />
                            
                            </Form.Group >
                            {/* <Form.Group controlId="logo" className="mb-3">
                            <Form.Label className="fw-bold">Upload Logo</Form.Label>
                                <InputGroup>
                                <Form.Control 
                                type="file" 
                                //onClick={uploadFile}
                                onChange={handleLogoChange} />
                                <Button variant="outline-secondary" onClick={uploadLogo}>
                                Upload
                                </Button>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="postal">
                                    <InputGroup>
                                    <InputGroup.Text id="inputGroupPrepend">

                                            {companyData.logo && (
                                        <Image src={companyData.logo} alt="Uploaded Logo" fluid style={{ width: '25px', height: '25px' }} />
                                    )}
                                    </InputGroup.Text>
                                    <Form.Control
                                        placeholder='wait while your logo is uploading'
                                        type="text"
                                        name="postal"
                                        value={companyData.logo}
                                        required
                                    />
                                    </InputGroup>
                                    
                            </Form.Group> */}
                            <Form.Group className="my-2">
                                <Form.Label className="my-2 fw-bold">
                                    Upload Official Logo
                                </Form.Label>
                                <Container {...getLogoRootProps({
                                    accept: "image/png, image/jpeg, image/jpg",
                                    onDrop: (acceptedFiles) => {
                                        const file = acceptedFiles[0];
                                        if (file && ["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
                                            setLogo(file);
                                        } else {
                                            Swal.fire({
                                                icon: "error",
                                                title: "Invalid File Type",
                                                text: "Only PNG, JPG, and JPEG files are allowed.",
                                            });
                                        }
                                    }
                                })}
                                className={`dropzone-container text-center w-100 ${permitURL ? "border-success" : ""}`}
                                        >
                                    <input {...getLogoInputProps()} accept="image/png, image/jpeg, image/jpg"/>
                                    {logo ? (
                                        logo.type.startsWith("image/") ? (
                                            <img
                                                src={URL.createObjectURL(logo)}
                                                alt="Uploaded Preview"
                                                className="img-fluid mt-2"
                                                style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
                                            />
                                        ) : (
                                            <p className="fw-bold text-muted">File selected: {logo.name}</p>
                                        )
                                    ) : (
                                        <p className="text-muted">
                                            Drag & Drop your logo here or <span className="text-primary text-decoration-underline">Choose File</span>
                                        </p>
                                    )}
                                </Container>
                                <Container className="d-flex justify-content-between mt-2">
                                        <p className='sub-title'>Supported File: PNG, JPEG, and JPG</p>
                                        <p className='sub-title'>Maximum size: 25MB</p>
                                </Container>

                                {/* Upload & Camera Buttons */}
                                <Container className="d-flex justify-content-end">
                                    {/* Show Upload / Reupload button only when a file is selected */}
                                    {logo && (
                                        !logoURL ? (
                                            <Button className="my-2" variant="outline-success" onClick={uploadLogo}>
                                                <FontAwesomeIcon className="button-icon" icon={faUpload} size="xs" fixedWidth />
                                                Upload Logo
                                            </Button>
                                        ) : (
                                            <Button className="my-2" variant="outline-danger" onClick={resetLogo}>
                                                <FontAwesomeIcon className="button-icon" icon={faCancel} size="xs" fixedWidth />
                                                Reupload
                                            </Button>
                                        )
                                    )}
                                </Container>
                                {logo && (
                                        !logoURL ? ("") : (
                                            <Container className="d-flex justify-content-center mt-2">
                                                <p className='sub-title text-success'>Logo Successfully Uploaded!</p>
                                            </Container>
                                        )
                                )}   
                            </Form.Group>
                            
                            
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
                        {currentStep > 1 && (
                            <Button variant="secondary " onClick={prevStep}>
                                Previous
                            </Button>
                        )}
                        {currentStep < 2 ? (
                            <Button className="color-blue-button" variant='primary' onClick={nextStep}>
                                Next
                            </Button>
                        ) : (
                            <Button  className="color-blue-button" disabled={!companyData.logo} type="submit">Submit</Button>
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
       
            </Row>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        </>
    );
};