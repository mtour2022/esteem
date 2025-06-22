import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Card, Form, InputGroup, Dropdown } from "react-bootstrap";
import AppNavBar from "../components/AppNavBar";
import { useMediaQuery } from "react-responsive";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListCheck, faQrcode, faBarChart, faChartGantt, faDownload, faUserGroup } from '@fortawesome/free-solid-svg-icons';
import lgu from '../assets/images/lgu.png';
import bagongpilipinas from '../assets/images/bagongpilipinas.png';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../config/firebase'
import { Link, NavLink } from "react-router-dom";
import { useAuth } from '../auth/authentication.js';
import { Navigate } from 'react-router-dom';
import { doSignInWithEmailAndPassword } from '../config/auth';
import FooterCustomized from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";

export default function Home() {
  const navigate = useNavigate();
  const { userLoggedIn } = useAuth();

  const isDesktop = useMediaQuery({ minWidth: 768 });
  const [selectedOption, setSelectedOption] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [nameList, setNameList] = useState([]); // Stores names from Firebase

  const capitalizeFirstLetter = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let fetchedData = [];

        if (selectedOption === "Travel Agency" || selectedOption === "Service Provider" || selectedOption === "People's Organization") {
          // Fetch from "company" collection
          const querySnapshot = await getDocs(collection(db, "company"));
          fetchedData = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(doc =>
              (selectedOption === "Travel Agency" && doc.classification === "travel agency" && doc.status === "approved") ||
              (selectedOption === "Service Provider" && doc.classification === "service provider" && doc.status === "approved") ||
              (selectedOption === "People's Organization" && doc.classification === "peoples organization" && doc.status === "approved")
            )
            .map(doc => ({
              name: capitalizeFirstLetter(doc.name),
              email: doc.email
            }));
        } else if (selectedOption === "Tour Coordinator") {
          // Fetch from "employee" collection
          const querySnapshot = await getDocs(collection(db, "employee"));
          fetchedData = querySnapshot.docs.map(doc => {
            const nameData = doc.data().name;
            const fullName = `${nameData.first} ${nameData.middle ? nameData.middle + ' ' : ''}${nameData.last}`;
            return {
              name: capitalizeFirstLetter(fullName),
              email: doc.data().email
            };
          });

        }

        console.log("Fetched Names:", fetchedData); // PRINT FETCHED NAMES TO CONSOLE
        setNameList(fetchedData); // Set only names in state

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (selectedOption) {
      fetchData();
    } else {
      setNameList([]); // Reset list when no option is selected
    }
  }, [selectedOption, db]); // Run when selectedOption changes


  const handleSelect = (eventKey) => {
    setSelectedOption(eventKey);
    setInputValue(""); // Clear the input field
    setName(""); // Reset selected name
    setEmail("");
    setNameList([]); // Clear name list until new data is fetched
  };

  const [inputValue, setInputValue] = useState("");
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (inputValue && selectedOption) {
      const filtered = nameList.filter((item) =>
        item.name.toLowerCase().includes(inputValue.toLowerCase())
      );

      setFilteredOptions(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredOptions([]);
      setShowDropdown(false);
    }
  }, [inputValue, nameList, selectedOption]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleNameSelect = (option) => {
    setInputValue(option.name);
    setName(option.name);
    setEmail(option.email || "");
  };


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

const onSubmit = async (e) => {
  e.preventDefault();

  if (!isSigningIn) {
    setIsSigningIn(true);

    // ✅ Show loading modal
    Swal.fire({
      title: "Signing in...",
      text: "Please wait while we verify your account.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const userCredential = await doSignInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log("Logged in user ID:", user.uid);
      setErrorMessage("");

      // ✅ Close the loading modal
      Swal.close();

      // ✅ Navigate after login
      navigate("/company-dashboard");
    } catch (error) {
      setErrorMessage(error.message);

      // ❌ Show error modal
      Swal.fire({
        title: "Login Failed",
        text: error.message,
        icon: "error"
      });
    } finally {
      setIsSigningIn(false);
    }
  }
};


  return (
    // if logged in proceed to company_dash board
    // (userLoggedIn) ?
    //     <Navigate to='/'/>
    //     :
    <>
      <Container fluid>
        <Row>
          {/* Left Side (65%) */}
          <Col md={7} className="p-0">
            <Container className="container background-container">
              <Row className="m-0" id="toppage">
                {isDesktop ? null : <AppNavBar bg="dark" variant="dark" title="Left Appbar" />}
              </Row>
              <Container className="body-container">
                <Container className="empty-container"></Container>
                <Container className="logo-container">
                  <img src={lgu} alt="Image 1" className="logo-image" />
                  {/* <img src={bagongpilipinas} alt="Image 2" className="logo-image"/> */}
                </Container>
                <Container className="empty-container"></Container>
                <h1 className="barabara-title">PROJECT: ESTEEM</h1>
                <p className="sub-title-blue-start">An <b>E</b>lectronic <b>S</b>ystem for <b>T</b>racking, <b>E</b>valuating, and <b>E</b>xpert <b>M</b>onitoring of Tour Activities in Malay-Boracay</p>
                <Container className="empty-container"></Container>
                <Form onSubmit={(e) => onSubmit(e)} className="custom-form body-container">
                  <Container className="empty-container"></Container>
                  <h1 className="barabara-label2">TOUR TICKET GENERATION</h1>
                  <p className="sub-title">Login to generate QR codes before proceeding to activity areas. QR codes generated are proactively checked during scanning. Track your guests and ensure seamless entry and safety throughout their tour experience.</p>
                  <Form.Group className="d-flex justify-content-end align-items-end w-100">
                    {/* "Create Account" */}
                    <Dropdown onSelect={handleSelect} className="me-2">
                      <Dropdown.Toggle variant="light" id="dropdown-basic">
                        {selectedOption || "Sign In Option"}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item eventKey="Travel Agency" disabled={selectedOption === "Travel Agency"}>Travel Agency</Dropdown.Item>
                        <Dropdown.Item eventKey="Tour Coordinator" disabled={selectedOption === "Tour Coordinator"}>Tour Coordinator</Dropdown.Item>
                        <Dropdown.Item eventKey="People's Organization" disabled={selectedOption === "People's Organization"}>People's Organization</Dropdown.Item>
                        <Dropdown.Item eventKey="Service Provider" disabled={selectedOption === "Service Provider"}>Service Provider</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </Form.Group>
                  <Form.Group className="my-2 position-relative">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder={selectedOption ? "Start typing..." : "Select sign in option first"}
                      value={inputValue}
                      onChange={handleInputChange}
                      onFocus={() => selectedOption && setShowDropdown(filteredOptions.length > 0)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      disabled={!selectedOption || nameList.length === 0}
                      autoComplete="on"
                      required
                    />

                    {showDropdown && (
                      <Dropdown.Menu show className="w-100 position-absolute">
                        {filteredOptions.map((option, index) => (
                          <Dropdown.Item key={index} onMouseDown={() => handleNameSelect(option)}>
                            {option.name}
                          </Dropdown.Item>
                        ))}


                      </Dropdown.Menu>
                    )}
                  </Form.Group>
                  <Form.Label>Password</Form.Label>
                  <InputGroup className="mb-3">
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      placeholder={selectedOption ? "password" : "select sign in option first"}
                      required
                      value={password}
                      onChange={e => { setPassword(e.target.value) }}
                      disabled={!selectedOption} // Disable if no option is selected
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
                  <Form.Group className="d-flex flex-column flex-md-row justify-content-md-between align-items-end w-100">
                    <Form.Check
                      type="checkbox"
                      label="Remember Me"
                      checked={rememberMe}
                      onChange={handleRememberMe} />
                    <Button
                      className="blue-button my-2"
                      type="submit"
                      disabled={!selectedOption}>
                      Sign In
                    </Button>
                  </Form.Group>
                  <Container className="empty-container"></Container>
                  <p className="sub-title">In compliance to the <b>Republic Act. No. 9593</b>, also known as the <b>Tourism Act of 2009</b>, and Section 121 of its implementing rules and regulations mandate Local Government Units (LGUs) to develop a system for gathering and reporting tourism statistics.</p>

                  <p className="sub-title">Adhering to the implementation of <b>Executive Order No. 06-A Series of 2022</b>. An Executive Order providing additional guidelines to the digitization of tour activities data collection and flow of transactions pertaining to tour activities in the Municipality of Malay.</p>
                </Form>
                <Container className="empty-container"></Container>
                <Container className="empty-container"></Container>


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
                {/* <p className="sub-title-center">In accordance with the established guidelines adhering to <b>Municipal Ordinance 341 series of 2015</b>, and <b>SB Resolution no. 010 series of 2024</b>.</p> */}
                <Container className="button-container">
                  <Link to="/company-registration" className="btn white-button">
                    <FontAwesomeIcon className="button-icon" icon={faUserGroup} size="xs" fixedWidth />
                    Company Registration
                  </Link>
                  <Button className="white-button">
                    <FontAwesomeIcon className="button-icon" icon={faListCheck} size="xs" fixedWidth />See Requirements
                  </Button>
                  <Button className="white-button">
                    <FontAwesomeIcon className="button-icon" icon={faQrcode} size="xs" fixedWidth />Cert Verifier
                  </Button>
                  <Button className="white-button">
                    <FontAwesomeIcon className="button-icon" icon={faBarChart} size="xs" fixedWidth />General TF Stats
                  </Button>
                  <Button className="white-button">
                    <FontAwesomeIcon className="button-icon" icon={faChartGantt} size="xs" fixedWidth />General TA Stats
                  </Button>
                </Container>

                <Container className="empty-container"></Container>
                <Container className="footer-links">
                  <Button variant="link" className="footer-button" type="submit" >Privacy Policy</Button>
                  <Button variant="link" className="footer-button" type="submit" >Terms & Conditions</Button>
                  <Button variant="link" className="footer-button" type="submit" >© 2025 Boracay Project:ESTEEM ™. All Rights Reserved</Button>
                </Container>

              </Container>
            </Container>
          </Col>

          <FooterCustomized scrollToId="toppage" />

        </Row>
      </Container>
    </>
  );
}
