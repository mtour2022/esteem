import { Container, Navbar, Nav, Image, NavDropdown } from 'react-bootstrap';
import logo from'../assets/images/lgu.png';
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
          <Image src={logo} alt="Logo" height="30" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <NavLink className="ms-lg-3 navlink d-flex align-items-center" as={NavLink} to="/"> 
                        <FontAwesomeIcon className="button-icon" icon={faBell} size="md" fixedWidth />
            </NavLink>
            <Nav.Link className='ms-lg-3 navlink' as={NavLink} to="/">Home</Nav.Link>
            <NavDropdown className='ms-lg-3 navlink' title="Quick Check" id="basic-nav-dropdown">
              <NavDropdown.Item as={NavLink} >
                Tour Ticket
              </NavDropdown.Item>
              <NavDropdown.Item as={NavLink} >
                QR Verifier
              </NavDropdown.Item>
              <NavDropdown.Item as={NavLink} >
               Registration
              </NavDropdown.Item>
              <NavDropdown className='ms-lg-2 navlink' title="Requirements" id="basic-nav-dropdown">
                    <NavDropdown.Item as={NavLink} >
                      Local
                    </NavDropdown.Item>
                    <NavDropdown.Item as={NavLink} >
                      Foreign
                    </NavDropdown.Item>
              </NavDropdown>
              <NavDropdown className='ms-lg-2 navlink' title="Companies" id="basic-nav-dropdown">
                    <NavDropdown.Item as={NavLink} >
                      Associations
                    </NavDropdown.Item>
                    <NavDropdown.Item as={NavLink} >
                      Cooperatives
                    </NavDropdown.Item>
                    <NavDropdown.Item as={NavLink} >
                      TTAs
                    </NavDropdown.Item>
              </NavDropdown>
              
              <NavDropdown.Item as={NavLink} >
                About Us
              </NavDropdown.Item> 
              <NavDropdown.Item as={NavLink} >
                Data Privacy
              </NavDropdown.Item> 
              <NavDropdown.Item as={NavLink} >
                Terms & Conditions
              </NavDropdown.Item> 
            </NavDropdown>
            <Nav.Link className='ms-lg-3 navlink' as={NavLink} to="/">Eng</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
