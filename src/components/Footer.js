import React from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Container, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";

const FooterCustomized = ({ scrollToId = "page-top" }) => {
  const position = { lat: 11.968365518006667, lng: 121.91986877595986 };

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyB12zV70G4pEPERWnWPiC69_BZhw_5Af9k", // Replace with your actual API key
  });

  const handleScroll = () => {
    const el = document.getElementById(scrollToId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="footer-component pb-3">
      <hr className="border-gray" />
      <div
        className="text-center mb-2"
        onClick={handleScroll}
        style={{ cursor: "pointer" }}
      >
        <FontAwesomeIcon icon={faArrowUp} className="me-2" />
        <small className="">Return to top</small>
      </div>

      <Container>
        <hr className="border-gray" />
        <Row className="g-4">
          {/* Map Column */}
          <Col md={6} sm={12}>
            <div className="map-wrapper" style={{ height: "250px", width: "100%" }}>
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{
                    height: "100%",
                    width: "100%",
                    borderRadius: "8px",
                  }}
                  center={position}
                  zoom={16}
                >
                  <Marker position={position} />
                </GoogleMap>
              ) : (
                <p>Loading map...</p>
              )}
            </div>
          </Col>

          {/* Contact Info */}
          <Col md={6} sm={12}>
            <h5 className="mb-3">LGU Malay Municipal Tourism Office</h5>
            <p><strong>Email:</strong> lgumalaytourism@yahoo.com</p>
            <p><strong>24/7 Tourist Hotline:</strong> (+63) 968 243 1919, (+63) 905 219 1604</p>
            <p><strong>Telephone:</strong> (036) 288-8827, (036) 288-2493</p>
            <p><strong>Website:</strong> <a className="text-muted" href="https://boracayinformationguide.com" target="_blank" rel="noreferrer">boracayinfoguide.com</a></p>
            <p><strong>Facebook:</strong> <a className="text-muted" href="https://facebook.com/malaytourism" target="_blank" rel="noreferrer">/malaytourism</a></p>
          </Col>
        </Row>
        <hr className="border-gray" />
        <div className="text-center">
          <small>© {new Date().getFullYear()} LGU Malay Tourism. All rights reserved.</small>
        </div>
      </Container>
    </footer>
  );
};

export default FooterCustomized;
