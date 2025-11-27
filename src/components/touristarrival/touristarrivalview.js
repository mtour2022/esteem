import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';

import AppNavBar from '../AppNavBar';
import FooterCustomized from '../Footer.js';
import TourismDataAdmin from './admintourismarrival.js';

export default function TouristArrivalPage() {
 

  

  return (
    <Container>
      <AppNavBar bg="dark" variant="dark" title="Left Appbar" />
      <div className="d-flex justify-content-center" id="toppage">
        <Row className="justify-content-center align-items-center g-2 mb-4">
                <Col lg={8} md={8} sm={12} xs={12}>
                       <TourismDataAdmin></TourismDataAdmin>
                </Col></Row>
      </div>
      <FooterCustomized scrollToId="toppage" />
    </Container>
  );
}
