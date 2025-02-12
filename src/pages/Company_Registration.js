import { Form, Button, InputGroup, Row, Col, Alert, Container, Image, Modal } from 'react-bootstrap';
import React, { useState, useRef } from 'react';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import { Navigate } from 'react-router-dom';
import { db, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import Company from '../classes/company';
import AppNavBar from "../components/AppNavBar";
import Webcam from "react-webcam"; // Install with: npm install react-webcam


export default function Login(){

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Initialize Company class
    const [companyData, setCompanyData] = useState(new Company({}));
    


    

    
    const companyCollectionRef = collection(db, "company");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCompanyData((prevData) => new Company({ ...prevData.toObject(), [name]: value }));
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

    const [logo, setLogo] = useState("");


    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        setLogo(file);
      };

    const uploadLogo = async () => {
        if (!logo) return;
    
        const filesFolderRef = ref(storage, `company/logos/${logo}`);
    
        try {
          await uploadBytes(filesFolderRef, logo);
    
          const downloadURL = await getDownloadURL(filesFolderRef);
    
        setLogo(downloadURL);
            setCompanyData((prevData) => ({
             ...prevData,
             logo: downloadURL,
         }));

         
        } catch (err) {
          console.error(err);
        }
      };

    // Permit Scanner

    const [permit, setPermit] = useState("");


    const handlePermitChange = (e) => {
        const file = e.target.files[0];
        setPermit(file);
      };


    const uploadPermit = async () => {
        if (!permit) return;
    
        const filesFolderRef = ref(storage, `company/permits/${permit}`);
    
        try {
          await uploadBytes(filesFolderRef, logo);
    
          const downloadURL = await getDownloadURL(filesFolderRef);
    
          setPermit(downloadURL);
            setCompanyData((prevData) => ({
             ...prevData,
             permit: downloadURL,
         }));

         
        } catch (err) {
          console.error(err);
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
                                name="first"
                                placeholder='first name'
                                required
                                value={companyData.proprietor.first}
                                onChange={handleChange}
                            />
                            <Form.Control 
                            className="my-2"
                                type="text" 
                                name="last"
                                placeholder='last name'
                                required
                                value={companyData.proprietor.last}
                                onChange={handleChange}
                            />
                            <Form.Control 
                            className="my-2"
                                type="text" 
                                name="middle"
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
                        </>
                    )}
                    
                    <Form.Group className="my-2">
                        <Form.Label className="mt-2 fw-bold">
                                {companyData.ownership === "cooperative"
                                    ? "Certificate of Accreditation from the Sangguniang Bayan Offfice"
                                    : companyData.ownership === "association"
                                    ? "Certificate of Accreditation from the Sangguniang Bayan Offfice"
                                    : "Business Permit/Receipt from the Licensing dated in the current year"}
                            </Form.Label>
                        <InputGroup>
                                <Form.Control 
                                type="file" 
                                //onClick={uploadFile}
                                onChange={handlePermitChange} />
                                <Button variant="outline-secondary" onClick={uploadPermit}>
                                Upload
                                </Button>
                        </InputGroup>
                        {/* <InputGroup>
                            <Form.Control type="file" accept="image/*" onChange={handlePermitUpload} />
                            <Button variant="outline-secondary" onClick={() => setShowCamera(!showCamera)}>
                                {showCamera ? "Cancel Camera" : "Use Camera"}
                            </Button>
                        </InputGroup> */}
                    </Form.Group>
                    <Form.Group className="text-center my-2">
                        <Button className="my-2 justify-content-center" variant="outline-secondary" onClick={() => setShowCamera(!showCamera)}>
                                {showCamera ? "Cancel Camera" : "Use Camera"}
                        </Button>
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
                    {/* {showCamera && (
                        <Container className="d-flex flex-column text-center my-2 justify-content-center align-items-center">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                width={300}
                                height={200}
                            />
                            <Button className="mt-3"  variant="outline-primary" onClick={capturePhoto}>Capture</Button>
                        </Container>
                    )} */}

                    <Form.Group className="mb-3">
                        <InputGroup>
                            <InputGroup.Text id="inputGroupPrepend">
                                {companyData.permit && (
                                    <Image src={companyData.permit} alt="Uploaded Permit" fluid style={{ width: "25px", height: "25px" }} />
                                )}
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Permit preview"
                                type="text"
                                name="permit"
                                value={companyData.permit || ""}
                                readOnly
                            />
                        </InputGroup>
                    </Form.Group>
                    {/* Step 2: Company Details 2 */}
                    {currentStep === 2 && (
                        <>
                            <Form.Group className="my-2">
                                <Form.Label className="mt-2 fw-bold">
                                    Local Office Address
                                </Form.Label>
                                <Form.Control 
                                className="my-2"
                                    type="text" 
                                    name="country"
                                    placeholder='country'
                                    required
                                    value={companyData.address.country}
                                    onChange={handleChange}
                                />
                                <Form.Control 
                                className="my-2"
                                    type="text" 
                                    name="region"
                                    placeholder='region'
                                    required
                                    value={companyData.address.region}
                                    onChange={handleChange}
                                />
                                <Form.Control 
                                className="my-2"
                                    type="text" 
                                    name="province"
                                    placeholder='province/city'
                                    required
                                    value={companyData.address.province}
                                    onChange={handleChange}
                                />
                                <Form.Control 
                                className="my-2"
                                    type="text" 
                                    name="zip"
                                    placeholder='zip code'
                                    value={companyData.address.zip}
                                    onChange={handleChange}
                                />
                                <Form.Control 
                                className="my-2"
                                    type="text" 
                                    name="town"
                                    placeholder='town/city'
                                    required
                                    value={companyData.address.town}
                                    onChange={handleChange}
                                />
                                <Form.Control 
                                className="my-2"
                                    type="text" 
                                    name="barangay"
                                    placeholder='barangay'
                                    value={companyData.address.barangay}
                                    onChange={handleChange}
                                />
                                <Form.Control 
                                className="my-2"
                                    type="text" 
                                    name="street"
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
                            <Form.Group controlId="logo" className="mb-3">
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