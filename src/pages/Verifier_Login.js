import React, { useState } from 'react';
import { Form, Button, Card, Container } from 'react-bootstrap';
import { doSignInWithEmailAndPassword } from '../config/auth';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import AppNavBar from '../components/AppNavBar';
import FooterCustomized from '../components/Footer';

export default function VerifierLoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      Swal.fire({
        title: 'Logging in...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await doSignInWithEmailAndPassword(formData.email, formData.password);
      Swal.fire('Success', 'Login successful!', 'success');

      // ✅ Redirect to dashboard with specific ID
      navigate('/verifier-dashboard/0b5f8f06bafb3828f619f6f96fc6adb2');
    } catch (error) {
      console.error('Login error:', error);
      Swal.fire('Login Failed', error.message || 'Unable to log in', 'error');
    }
  };

  return (
    <Container>
      <AppNavBar bg="dark" variant="dark" title="Verifier Login" />

      <div className="d-flex justify-content-center" id="toppage">
        <div className="col-11 col-lg-4">
          <Card className="p-4 my-5 shadow">
            <h3 className="mb-3">Verifier Login</h3>
            <p className="text-muted small">
              For authorized LGU Malay Tourism personnel only.
            </p>

            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                />
              </Form.Group>

              <div className="d-flex justify-content-end">
                <Button variant="primary" type="submit">Login</Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>

      <FooterCustomized scrollToId="toppage" />
    </Container>
  );
}
