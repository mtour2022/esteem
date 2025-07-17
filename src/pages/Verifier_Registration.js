import React, { useState } from 'react';
import { Form, Button, Card, Container } from 'react-bootstrap';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { docreateUserWithEmailAndPassword } from '../config/auth';
import VerifierModel from '../classes/verifiers';
import Swal from 'sweetalert2';
import AppNavBar from '../components/AppNavBar';
import FooterCustomized from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import FileUploader from '../components/UploadImageFile';

export default function VerifierRegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    surname: '',
    firstname: '',
    middlename: '',
    suffix: '',
    designation: '',
    tourism_Id_code: '',
    profilePhoto: '', // ✅ Add this to hold the file URL
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      Swal.fire({ title: 'Registering...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const { email, password, ...rest } = formData;
      const userCredential = await docreateUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      const verifierId = user.uid;
      const verifierData = new VerifierModel({
        verifierId,
        userUID: user.uid,
        ...rest,
      });

      const verifierRef = doc(db, 'verifier', verifierId);
      await setDoc(verifierRef, verifierData.toObject());

      Swal.fire('Success', 'Verifier registered successfully!', 'success');
      navigate(`/verifier-employee/0b5f8f06bafb3828f619f6f96fc6adb2`);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error.message || 'Failed to register verifier', 'error');
    }
  };

  return (
    <Container>
      <AppNavBar bg="dark" variant="dark" title="Left Appbar" />
      <div className="d-flex justify-content-center" id="toppage">
        <div className="col-11 col-lg-6">
          <Card className="p-4 my-4">
            <h3 className="mb-3">Tourism Verifier Registration</h3>
            <p className="text-muted small">
              <strong>Note:</strong> Only tourism employees within the Local Government Unit (LGU) of the Municipality of Malay are authorized to access and register in this system.
              <br />
              This registration complies with the <strong>Data Privacy Act</strong> and is pursuant to <strong>Republic Act No. 9593</strong>, also known as the <em>Tourism Act of 2009</em>, and Section 121 of its Implementing Rules and Regulations (IRR) mandating LGUs to develop systems for collecting and reporting tourism statistics.
              <br />
              Additionally, this system adheres to the implementation of <strong>Executive Order No. 06-A, Series of 2022</strong>, which provides additional guidelines for the digitization of tour activity data collection and the flow of transactions pertaining to tour activities in the Municipality of Malay.
            </p>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-2">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>First Name</Form.Label>
                <Form.Control type="text" name="firstname" value={formData.firstname} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Middle Name</Form.Label>
                <Form.Control type="text" name="middlename" value={formData.middlename} onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Surname</Form.Label>
                <Form.Control type="text" name="surname" value={formData.surname} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Suffix</Form.Label>
                <Form.Control type="text" name="suffix" value={formData.suffix} onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Designation</Form.Label>
                <Form.Control type="text" name="designation" value={formData.designation} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Tourism ID Code</Form.Label>
                <Form.Control type="text" name="tourism_Id_code" value={formData.tourism_Id_code} onChange={handleChange} required />
              </Form.Group>

              {/* ✅ File Uploader */}
              <FileUploader
                label="2x2 Profile Photo (formal attire)"
                fileKey="profilePhoto"
                storagePath="employee/profile_photos"
                formData={formData}
                setFormData={setFormData}
              />

              <div className="d-flex justify-content-end mt-3">
                <Button variant="primary" type="submit">Register</Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>
      <FooterCustomized scrollToId="toppage" />
    </Container>
  );
}
