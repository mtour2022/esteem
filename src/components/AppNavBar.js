import { Container, Navbar, Nav, Image, NavDropdown } from 'react-bootstrap';
import logoSmall from'../assets/images/esteem_logo_small.png';
import logoBig from'../assets/images/esteem_logo_big.png';

import { Link, NavLink } from 'react-router-dom';
// import { useAuth } from '../auth/authentication.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faBed, faUtensils, faSpa, faFlag, faList, faCheckToSlot, faUserGroup } from '@fortawesome/free-solid-svg-icons';

export default function AppNavBar() {
  // const { userLoggedIn } = useAuth();

  return (
    <Navbar expand="lg" className='px-4 px-md-10 px-lg-4 navbar'>
      <Container fluid>
        <Navbar.Brand as={Link} to="/">
          <Image src={logoBig} alt="Logo" height="30" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {/* <NavLink className="ms-lg-3 navlink d-flex align-items-center" as={NavLink} to="/"> 
                        <FontAwesomeIcon className="button-icon" icon={faBell} size="md" fixedWidth />
            </NavLink> */}
            <Nav.Link className='ms-lg-3 navlink' as={NavLink} to="/">Home</Nav.Link>
            <NavDropdown className='ms-lg-3 navlink' title="Register" id="basic-nav-dropdown">
              <NavDropdown.Item as={NavLink} to="/application-status-check">
                REGISTRATION STATUS CHECKER
              </NavDropdown.Item>
              <hr></hr>
                <NavDropdown.Item as={NavLink} to="/company-registration">
                REGISTER COMPANY/PO
              </NavDropdown.Item>
              <hr></hr>
                <NavDropdown.Item as={NavLink} to="/employee-registration/local">
                REGISTER LOCAL
              </NavDropdown.Item>
              <hr></hr>
                <NavDropdown.Item as={NavLink} to="/employee-registration/foreign">
                REGISTER FOREIGN
              </NavDropdown.Item>
                            <hr></hr>
                 <NavDropdown.Item as={NavLink} to="/requirements">
                REGISTRATION REQUIREMENTS
              </NavDropdown.Item>
            </NavDropdown>
            <NavDropdown className='ms-lg-3 navlink' title="Certification" id="basic-nav-dropdown">
               <NavDropdown.Item as={NavLink} to="/find-my-cert">
                FIND MY TOURISM CERT
              </NavDropdown.Item>
              <hr></hr>
              <NavDropdown.Item as={NavLink} to="/tourism-cert-check">
                TOURISM CERT VERIFIER
              </NavDropdown.Item>
            </NavDropdown>
             <NavDropdown className='ms-lg-3 navlink' title="Analyze" id="basic-nav-dropdown">
               <NavDropdown.Item as={NavLink} to="/general-tourism-frontliners-summary">
                GENERAL TF SUMMARY
              </NavDropdown.Item>
              <hr></hr>
              <NavDropdown.Item as={NavLink} to="/">
                GENERAL TA SUMMARY
              </NavDropdown.Item>
            </NavDropdown>
            {/* <Nav.Link className='ms-lg-3 navlink' as={NavLink} to="/">Analyze</Nav.Link> */}
            <Nav.Link className='ms-lg-3 navlink' as={NavLink} to="/">About Us</Nav.Link>
            <Nav.Link className='ms-lg-3 navlink' as={NavLink} to="/">Eng</Nav.Link>

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
