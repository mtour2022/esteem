import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Card, Form, InputGroup, Dropdown } from "react-bootstrap";
import AppNavBar from "../components/AppNavBar";
import { useMediaQuery } from "react-responsive";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListCheck, faQrcode, faBarChart, faChartGantt, faDownload, faUserGroup, faDatabase, faSearch } from '@fortawesome/free-solid-svg-icons';
import lgu from '../assets/images/lgu.png';
import bagongpilipinas from '../assets/images/bagongpilipinas.png';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import { Link, NavLink } from "react-router-dom";
import { useAuth } from '../auth/authentication.js';
import { Navigate } from 'react-router-dom';
import { doSignInWithEmailAndPassword } from '../config/auth';
import FooterCustomized from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import Employee from "../classes/employee.js"

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase"; // make sure your db import is correct

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
const [loadingNames, setLoadingNames] = useState(false);

  const capitalizeFirstLetter = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
  const fetchData = async () => {
    if (!selectedOption) return;

    setLoadingNames(true); // start loading
    try {
      let fetchedData = [];

      if (selectedOption === "Company") {
        const querySnapshot = await getDocs(collection(db, "company"));
        fetchedData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc => doc.status === "approved")
          .map(doc => ({
            name: capitalizeFirstLetter(doc.name),
            email: doc.email
          }));
      } else if (selectedOption === "Employee") {
        const querySnapshot = await getDocs(collection(db, "employee"));
        fetchedData = querySnapshot.docs.map(doc => {
          const empData = new Employee({ employeeId: doc.id, ...doc.data() });
          return {
            name: capitalizeFirstLetter(empData.getFullName()),
            email: empData.email
          };
        });
      }

      setNameList(fetchedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingNames(false); // stop loading
    }
  };

  fetchData();
}, [selectedOption]);

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

      // Show loading modal
      Swal.fire({
        title: "Signing in...",
        text: "Please wait while we verify your account.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        if (selectedOption === "Company") {
          // Company login
          const userCredential = await doSignInWithEmailAndPassword(email, password);
          const user = userCredential.user;
          console.log("Logged in company user ID:", user.uid);

          Swal.close();
          setErrorMessage("");
          navigate("/company-dashboard");

        } else if (selectedOption === "Employee") {
          // Employee login
          const q = query(
            collection(db, "employee"),
            where("email", "==", email)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const empDoc = querySnapshot.docs[0];
            const empData = empDoc.data();

            // Attempt Firebase Auth login for employee
            const userCredential = await doSignInWithEmailAndPassword(empData.email, password);
            console.log("Employee login successful:", empDoc.id);

            Swal.close();
            setErrorMessage("");
            navigate("/employee-dashboard");
          } else {
            throw new Error("No employee account found with this email");
          }

        } else {
          throw new Error("Please select a login type (Company or Employee).");
        }

      } catch (error) {
        console.error("Login failed:", error);
        setErrorMessage(error.message);

        Swal.fire({
          title: "Login Failed",
          text: "Your password is incorrect, or the account does not exist. You may reach the tourism office for password recovery or visit the activity area verification table.",
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
                        {isDesktop ? <AppNavBar bg="dark" variant="dark" title="Right Appbar" /> : null}

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
                <p className="sub-title-blue-start">An <b>E</b>lectronic <b>S</b>ystem for <b>T</b>racking, <b>E</b>valuating, and <b>E</b>xpert <b>M</b>onitoring of Tourism Information in Malay-Boracay</p>
                <Container className="empty-container"></Container>
                <Form onSubmit={(e) => onSubmit(e)} className="custom-form body-container">
                  <Container className="empty-container"></Container>
                  <h1 className="barabara-label2">TOURIST ACTIVITY TICKET GENERATION</h1>
                  <p className="sub-title">Login to generate QR codes before proceeding to activity areas. QR codes generated are proactively checked during scanning. Track your guests and ensure seamless entry and safety throughout their tour experience.</p>
                  <Form.Group className="d-flex justify-content-end align-items-end w-100">
                    <Dropdown onSelect={handleSelect} className="me-2">
                      <Dropdown.Toggle variant="light" id="dropdown-basic">
                        {selectedOption || "Sign In Option"}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          eventKey="Company"
                          disabled={selectedOption === "Company"}
                        >
                          Company
                        </Dropdown.Item>
                        <Dropdown.Item
                          eventKey="Employee"
                          disabled={selectedOption === "Employee"}
                        >
                          Employee/Member
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </Form.Group>

                  <Form.Group className="my-2 position-relative">
  <Form.Label>Name</Form.Label>
  <Form.Control
    type="text"
    placeholder={
      !selectedOption
        ? "Select sign in option first"
        : loadingNames
          ? "Loading names..."
          : "Start typing..."
    }
    value={inputValue}
    onChange={handleInputChange}
    onFocus={() => selectedOption && !loadingNames && setShowDropdown(filteredOptions.length > 0)}
    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
    disabled={!selectedOption || loadingNames || nameList.length === 0}
    required
  />

  {/* show spinner or dropdown */}
  {loadingNames && (
    <div className="position-absolute w-100 text-center py-2 bg-white border rounded">
      <span className="small text-muted">Loading...</span>
    </div>
  )}

  {!loadingNames && showDropdown && (
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
              {/* <Row className="m-0">
              </Row> */}

              <Container className="body-container">
                <h1 className="barabara-subtitle">MALAY-BORACAY<br></br>TOURISM FRONLINERS</h1>
                <h1 className="barabara-label">PROFILE REGISTRATION</h1>
                <p className="sub-title-blue">Apply and Acquire your Digital Tourism Endorsement and Recommendation <br></br>
                  certifications by simply registering and complying to requirements online!</p>
                
                
                <div className="image-container mt-5">
                  <Link to="/employee-registration/local" className="image-link">
                    <div className="image-box local">
                      <p className="barabara-subtitle-white">LOCAL</p>
                    </div>
                  </Link>

                  <Link to="/employee-registration/foreign" className="image-link">
                    <div className="image-box foreign">
                      <p className="barabara-subtitle-white">FOREIGN</p>
                    </div>
                  </Link>
                </div>



                <Container className="empty-container"></Container>
                {/* <p className="sub-title-center">In accordance with the established guidelines adhering to <b>Municipal Ordinance 341 series of 2015</b>, and <b>SB Resolution no. 010 series of 2024</b>.</p> */}
                <Container className="button-container">
                  <Link to="/company-registration" className="btn white-button">
                    <FontAwesomeIcon className="button-icon" icon={faUserGroup} size="xs" fixedWidth />
                    Register Company/PO
                  </Link>
                  <Link to="/application-status-check" className="btn white-button">
                    <FontAwesomeIcon className="button-icon" icon={faDatabase} size="xs" fixedWidth />
                    Registration Status
                  </Link>
                   <Link to="/requirements" className="btn white-button">
                    <FontAwesomeIcon className="button-icon" icon={faListCheck} size="xs" fixedWidth />
                    Registration Requirements
                  </Link>
                
                  <Link to="/find-my-cert" className="btn white-button">
                    <FontAwesomeIcon className="button-icon" icon={faSearch} size="xs" fixedWidth />
                    Find My Tourism Cert
                  </Link>

                  <Link to="/tourism-cert-check" className="btn white-button">
                    <FontAwesomeIcon className="button-icon" icon={faQrcode} size="xs" fixedWidth />
                    Tourism Cert Verifier
                  </Link>

                  

                  
                   <Link to="/general-tourism-frontliners-summary" className="btn white-button">
                    <FontAwesomeIcon className="button-icon" icon={faBarChart} size="xs" fixedWidth />
                    General Tourism Frontliners Stats
                  </Link>
                
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





  // const onSubmit = async (e) => {
  //   e.preventDefault();

  //   if (!isSigningIn) {
  //     setIsSigningIn(true);

  //     // ✅ Show loading modal
  //     Swal.fire({
  //       title: "Signing in...",
  //       text: "Please wait while we verify your account.",
  //       allowOutsideClick: false,
  //       didOpen: () => {
  //         Swal.showLoading();
  //       }
  //     });

  //     try {
  //       // Try login normally (company)
  //       const userCredential = await doSignInWithEmailAndPassword(email, password);
  //       const user = userCredential.user;
  //       console.log("Logged in user ID:", user.uid);
  //       setErrorMessage("");

  //       Swal.close();
  //       navigate("/company-dashboard");

  //     } catch (companyError) {
  //       console.warn("Company login failed, trying employee login...", companyError);

  //       try {
  //         // Employee login using same Firebase Auth
  //         const q = query(
  //           collection(db, "employee"),
  //           where("email", "==", email)
  //         );
  //         const querySnapshot = await getDocs(q);

  //         if (!querySnapshot.empty) {
  //           const empDoc = querySnapshot.docs[0];
  //           const empData = empDoc.data();

  //           // Attempt Firebase Auth login for employee
  //           const userCredential = await doSignInWithEmailAndPassword(empData.email, password);
  //           console.log("Employee login successful:", empDoc.id);

  //           Swal.close();
  //           setErrorMessage("");
  //           navigate("/employee-dashboard");
  //           return;
  //         }

  //         throw new Error("No employee account found with this email");

  //       } catch (empError) {
  //         console.error("Employee login failed:", empError);
  //         setErrorMessage(empError.message);

  //         Swal.fire({
  //           title: "Login Failed",
  //           text: "Your password is incorrect, you may reach the tourism office for password recovery or visit the activity area verification table.",
  //           icon: "error"
  //         });
  //       }

  //     } finally {
  //       setIsSigningIn(false);
  //     }
  //   }
  // };

  
  //   useEffect(() => {
  //     const fetchData = async () => {
  //       try {
  //         let fetchedData = [];

  //         if (selectedOption === "Travel Agency" || selectedOption === "Watersports Provider" || selectedOption === "People's Organization") {
  //           // Fetch from "company" collection
  //           const querySnapshot = await getDocs(collection(db, "company"));
  //           fetchedData = querySnapshot.docs
  //             .map(doc => ({ id: doc.id, ...doc.data() }))
  //             .filter(doc =>
  //               (selectedOption === "Travel Agency" && doc.classification === "travel agency" && doc.status === "approved") ||
  //               (selectedOption === "Watersports Provider" && doc.classification === "watersports Provider" && doc.status === "approved") ||
  //               (selectedOption === "People's Organization" && doc.classification === "peoples organization" && doc.status === "approved")
  //             )
  //             .map(doc => ({
  //               name: capitalizeFirstLetter(doc.name),
  //               email: doc.email
  //             }));
  //         } else if (selectedOption === "Employee") {
  //   // Fetch from "employee" collection
  //   const querySnapshot = await getDocs(collection(db, "employee"));

  //   fetchedData = querySnapshot.docs.map(doc => {
  //     const empData = new Employee({ employeeId: doc.id, ...doc.data() });
  //     const fullName = empData.getFullName(); // Use method from Employee class
  //     return {
  //       name: capitalizeFirstLetter(fullName),
  //       email: empData.email
  //     };
  //   });
  // }




  //         console.log("Fetched Names:", fetchedData); // PRINT FETCHED NAMES TO CONSOLE
  //         setNameList(fetchedData); // Set only names in state

  //       } catch (error) {
  //         console.error("Error fetching data:", error);
  //       }
  //     };

  //     if (selectedOption) {
  //       fetchData();
  //     } else {
  //       setNameList([]); // Reset list when no option is selected
  //     }
  //   }, [selectedOption, db]); // Run when selectedOption changes
