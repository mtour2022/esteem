import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Card, Form, InputGroup, Dropdown} from "react-bootstrap";
import AppNavBar from "../components/AppNavBar";
import { useMediaQuery } from "react-responsive";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListCheck, faQrcode, faBarChart } from '@fortawesome/free-solid-svg-icons';
import lgu from'../assets/images/lgu.png';
import bagongpilipinas from'../assets/images/bagongpilipinas.png';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';


export default function Home() {
  const isDesktop = useMediaQuery({ minWidth: 768 });


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  return (
    <>
      <Container fluid>
        <Row>
          {/* Left Side (65%) */}
          <Col md={7} className="p-0">
            <Container className="container background-container">
              <Row className="m-0">
                {isDesktop ? null : <AppNavBar bg="dark" variant="dark" title="Left Appbar" />}
              </Row>
                <Container className="body-container">
                  <Container className="empty-container"></Container>
                  <Container className="logo-container">
                    <img src={lgu} alt="Image 1" className="logo-image" />
                    <img src={bagongpilipinas} alt="Image 2" className="logo-image"/>
                  </Container>
                  <Container className="empty-container"></Container>
                  <h1 className="barabara-title">PROJECT: ESTEEM</h1>
                  <p className="sub-title-blue-start">An <b>E</b>lectronic <b>S</b>ystem for <b>T</b>racking, <b>E</b>valuating, and <b>E</b>xpert <b>M</b>onitoring of Tour Activities in Malay-Boracay</p>
                  <Container className="empty-container"></Container>
                  
                      <Form onSubmit={()=>{}} className="custom-form body-container">
                        <Container className="empty-container"></Container>
                        <h1 className="barabara-label2">TOUR TICKET GENERATION</h1>  
                        <p className="sub-title">Login to generate QR codes before proceeding to activity areas. QR codes generated are proactively checked during scanning. Track your guests and ensure seamless entry and safety throughout their tour experience.</p>
                            <Form.Group className="my-2">
                                <Form.Label>Username</Form.Label>
                                <Form.Control 
                                    
                                    type="username" 
                                    placeholder="company name"
                                    required
                                    value={email}
                                    onChange={e => {}}
                                    />
                            </Form.Group>
                            <Form.Label>Password</Form.Label>
                            <InputGroup className="mb-3">
                                <Form.Control 
                                    type={showPassword ? 'text' : 'password'}  
                                    placeholder="password"
                                    required
                                    value={password}
                                    onChange={e => {}}
                                    />
                                <InputGroup.Text
                                    onClick={togglePasswordVisibility}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {showPassword ? (
                                    <AiFillEyeInvisible />
                                    ) : (
                                    <AiFillEye />
                                    )}
                                </InputGroup.Text>
                            </InputGroup>
                            <Form.Group className="d-flex justify-content-between align-items-center">
                                <Form.Check
                                    type="checkbox"
                                    label="Remember Me"
                                    checked={rememberMe}
                                    onChange={handleRememberMe}
                                />
                                <Form.Group className="d-flex align-items-center">
                                  {/* dropdown option here */}
                                  <Dropdown className="me-2">
                                    <Dropdown.Toggle variant="light" id="dropdown-basic">
                                      Sign In Option
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                      <Dropdown.Item href="#">Travel Agency</Dropdown.Item>
                                      <Dropdown.Item href="#">Tour Coordinator</Dropdown.Item>
                                      <Dropdown.Item href="#">People's Organization</Dropdown.Item>
                                      <Dropdown.Item href="#">Service Provider</Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                  <Button
                                      className="blue-button my-2"
                                      
                                      type="submit"
                                  >
                                      Sign In
                                  </Button>
                                </Form.Group>
                            </Form.Group>
                          <Container className="empty-container"></Container>
                           <p className="sub-title">In compliance to the <b>Republic Act. No. 9593</b>, also known as the <b>Tourism Act of 2009</b>, and Section 121 of its implementing rules and regulations mandate Local Government Units (LGUs) to develop a system for gathering and reporting tourism statistics.</p>
                           
                           <p className="sub-title">Adhering to the implementation of <b>Executive Order No. 06-A Series of 2022</b>. An Executive Order providing additional guidelines to the digitization of tour activities data collection and flow of transactions pertaining to tour activities in the Municipality of Malay.</p>
                        </Form>  
                    

                </Container>
            </Container>
          </Col>
          
          {/* Right Side (35%) */}
          <Col md={5} className="p-0">
            <Container className="container custom-container">
              <Row className="m-0">
                  {isDesktop ? <AppNavBar bg="dark" variant="dark" title="Right Appbar" /> : null}
              </Row>

                <Container className="body-container">
                  <h1 className="barabara-subtitle">MALAY-BORACAY<br></br>TOURISM FRONLINERS</h1>
                  <h1 className="barabara-label">PROFILE REGISTRATION</h1>
                  <p className="sub-title-blue">Register and Acquire your Tourism Endorsement and Recommendation
                  certifications by simply registering and complying to requirements online!</p>
                
                    <Container className="image-container">
                      <Container className="image-box">
                        <p className="barabara-subtitle-white">LOCAL</p>
                      </Container>
                      <Container className="image-box">
                        <p className="barabara-subtitle-white">FOREIGN</p>
                      </Container>

                    </Container>
                    <Container className="empty-container"></Container>
                    <Container className="button-container">
                      <Button className="white-button">
                        <FontAwesomeIcon className="button-icon" icon={faListCheck} size="xs" fixedWidth />See Requirements
                      </Button>
                      <Button className="white-button">
                        <FontAwesomeIcon className="button-icon" icon={faQrcode} size="xs" fixedWidth />Cert Validator
                      </Button>
                      <Button className="white-button">
                        <FontAwesomeIcon className="button-icon" icon={faBarChart} size="xs" fixedWidth />General TF Stats
                      </Button>
                    </Container>
                    <Container className="empty-container"></Container>
                    <Container className="empty-container"></Container>
                </Container>
            </Container>
          </Col>
        </Row>
      </Container>
    </>
  );
}
