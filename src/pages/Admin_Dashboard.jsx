import { Link } from 'react-router-dom';



function Sidebar({ show, handleClose }) {
    return (
      // Offcanvas component for mobile view
      <Offcanvas show={show} onHide={handleClose} backdrop={false} scroll={true} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Admin Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            <Nav.Link href="/dashboard">Dashboard</Nav.Link>
            <Nav.Link href="/users">Users</Nav.Link>
            <Nav.Link href="/settings">Settings</Nav.Link>
            <Nav.Link href="/reports">Reports</Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    );
  }
  
  function Dashboard() {
    const [show, setShow] = useState(false);
  
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
  
    return (
      <Container fluid>
        <Row>
          {/* Sidebar for larger screens */}
          <Col xs={2} className="p-0 d-none d-md-block bg-light" style={{ minHeight: '100vh' }}>
            <div className="sidebar-sticky p-3">
              <h4>Admin</h4>
              <Nav className="flex-column">
                <Nav.Link href="/dashboard">Dashboard</Nav.Link>
                <Nav.Link href="/users">Users</Nav.Link>
                <Nav.Link href="/settings">Settings</Nav.Link>
                <Nav.Link href="/reports">Reports</Nav.Link>
              </Nav>
            </div>
          </Col>
  
          {/* Main content area */}
          <Col xs={12} md={10} className="p-4">
            {/* Button to show offcanvas drawer on mobile */}
            <Button variant="primary" className="d-md-none mb-3" onClick={handleShow}>
              Menu
            </Button>
  
            <h1>Admin Dashboard</h1>
            <p>This is your main content area. Add your dashboard widgets or charts here.</p>
            {/* Additional dashboard content can go here */}
          </Col>
        </Row>
  
        {/* Offcanvas Sidebar for mobile */}
        <div className="d-md-none">
          <Sidebar show={show} handleClose={handleClose} />
        </div>
      </Container>
    );
  }