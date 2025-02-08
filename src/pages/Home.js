import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import AppNavBar from "../components/AppNavBar";
import { useMediaQuery } from "react-responsive";

export default function Home() {
  const isDesktop = useMediaQuery({ minWidth: 768 });

  return (
    <>
      <Container fluid>
        <Row>
          {/* Left Side (65%) */}
          <Col md={7} className="p-0">
            <Container>
              <Row className="m-0">
                {isDesktop ? null : <AppNavBar bg="dark" variant="dark" title="Left Appbar" />}
              </Row>
                <h1 className="text-black text-2xl">Left Side Content</h1>
            </Container>
          </Col>
          
          {/* Right Side (35%) */}
          <Col md={5} className="p-0">
            <Container className="container custom-container">
              <Row className="m-0">
                  {isDesktop ? <AppNavBar bg="dark" variant="dark" title="Right Appbar" /> : null}
              </Row>
                <h1 className="barabara-subtitle ">MALAY-BORACAY TOURISM FRONLINERS PROFILE REGISTRATION</h1>
            </Container>
          </Col>
        </Row>
      </Container>
    </>
  );
}
