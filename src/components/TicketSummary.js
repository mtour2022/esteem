import React, { useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import download from "downloadjs";
import Swal from "sweetalert2";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase"; // adjust based on your project structure
import { useEffect, useState } from "react";

const sumField = (array, field) =>
  array.reduce((total, item) => total + parseInt(item[field] || "0"), 0);

const TicketSummary = ({ ticket }) => {
  const exportRef = useRef();
  const [companyInfo, setCompanyInfo] = useState(null); // ✅ always called
  const [employeeInfo, setEmployeeInfo] = useState(null); // ✅ always called

  useEffect(() => {
    const fetchCompany = async () => {
      if (!ticket?.company_id) return;
      try {
        const docRef = doc(db, "company", ticket.company_id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCompanyInfo(docSnap.data());
        } else {
          console.warn("No such company!");
        }
      } catch (error) {
        console.error("Error fetching company:", error);
      }
    };

    fetchCompany();
  }, [ticket?.company_id]); // ✅ always called

  // Fetch Employee Info
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!ticket?.employee_id) return;
      try {
        const docRef = doc(db, "employee", ticket.employee_id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEmployeeInfo(docSnap.data());
        } else {
          console.warn("No such employee!");
        }
      } catch (error) {
        console.error("Error fetching employee:", error);
      }
    };

    fetchEmployee();
  }, [ticket?.employee_id]);

  if (!ticket) return null; // ✅ placed AFTER the hooks
  const {
    ticket_id,
    name,
    contact,
    company_id,
    accommodation,
    total_pax,
    start_date_time,
    end_date_time,
    total_duration,
    total_payment,
    status, prefer_not_to_say,
    date_created,
    valid_until,
    total_expected_payment,
    activities = [],
    address = [],
  } = ticket;

  const totalLocals = sumField(address, "locals");
  const totalForeigns = sumField(address, "foreigns");
  const totalMales = sumField(address, "males");
  const totalFemales = sumField(address, "females");
  const totalKids = sumField(address, "kids");
  const totalTeens = sumField(address, "teens");
  const totalAdults = sumField(address, "adults");
  const totalSeniors = sumField(address, "seniors");

  const localCountries = address
    .filter(addr => !addr.isForeign && addr.town)
    .map(addr => addr.town.trim())
    .filter((v, i, arr) => arr.indexOf(v) === i && v !== "")
    .join(", ");


  const foreignCountries = address
    .filter(addr => addr.isForeign && addr.country)
    .map(addr => addr.country)
    .filter((v, i, arr) => arr.indexOf(v) === i) // remove duplicates
    .join(", ");

  const handleDownloadImage = () => {
    if (exportRef.current === null) return;

    const now = new Date();

    // Format: Jan162025-08:15AM
    const options = { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true };
    const formatted = now.toLocaleString("en-US", options)
      .replace(",", "")                // Remove comma after date
      .replace(/ /g, "")               // Remove spaces
      .replace("AM", "AM")             // Keep AM/PM clean
      .replace("PM", "PM")             // (not lowercase)
      .replace(":", "");               // Optional: remove colon if you want `0815AM`

    const filename = `${ticket.name?.replace(/\s+/g, "_") || "Guest"}-${formatted}-${companyInfo?.name?.replace(/\s+/g, "_") || "NoCompany"}.png`;

    Swal.fire({
      title: "Generating image...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    toPng(exportRef.current, { cacheBust: true })
      .then((dataUrl) => {
        download(dataUrl, filename);
        Swal.close();
        Swal.fire({
          icon: "success",
          title: "Downloaded!",
          text: "Your image has been downloaded successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
      })
      .catch((err) => {
        Swal.close();
        console.error("Could not generate image", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Something went wrong while generating the image.",
        });
      });
  };




  return (
    <>
      <Container ref={exportRef} className="p-3 border bg-white">
        <div className="text-center mb-2 mt-2">
          <h4><strong>TOURIST ACTIVITY TICKET</strong></h4>
        </div>
        {/* QR Code */}
        {ticket_id && (
          <div className="mb-4 text-center">
            <QRCodeCanvas
              value={ticket_id}
              size={400}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
            />
            <p className="mt-1">{ticket_id}</p>
          </div>
        )}
        {/* Basic Details */}
        <Row className="row justify-content-center align-items-center">
          <Col md={6} sm={12} className="col">
            <p className="m-1"><strong>Date Created:</strong> {new Date(date_created).toLocaleString()}</p>
            <p className="m-1"><strong>Activity Start:</strong> {new Date(start_date_time).toLocaleString()}</p>
          </Col>
          <Col md={6} sm={12} className="col">
            <p className="m-1"><strong>Valid Until:</strong> {new Date(valid_until).toLocaleString()}</p>
            <p className="m-1"><strong>Activity End:</strong> {new Date(end_date_time).toLocaleString()}</p>
          </Col>
        </Row>
        <h5 className="mt-2 ms-1"><strong>BASIC INFORMATION</strong></h5>
        <Row className="row justify-content-center align-items-center">
          <Col md={6} sm={12} className="col">
            <p className="m-1"><strong>Representative:</strong> {name}</p>
            <p className="m-1"><strong>Local Address:</strong> {localCountries}</p>
          </Col>
          <Col md={6} sm={12} className="col">
            <p className="m-1"><strong>Accommodation:</strong> {accommodation}</p>
            <p className="m-1"><strong>Foreign Address:</strong> {foreignCountries}</p>
          </Col>
        </Row>
        {/* Demographic Summary */}
        <h5 className="mt-2 ms-1"><strong>DEMOGRAPHIC SUMMARY</strong></h5>
        <Row className="row">
          <Col md={6} className="col">
            <p className="m-1"><strong>Locals:</strong> {totalLocals}</p>
            <p className="m-1"><strong>Males:</strong> {totalMales}</p>
            {prefer_not_to_say ? (
              <p className="m-1"><strong>Prefer not to say:</strong> {prefer_not_to_say}</p>
            ) : null}
            <p className="m-1"><strong>Kids (0-12 y.o.):</strong> {totalKids}</p>
            <p className="m-1"><strong>Adults (20-59 y.o.):</strong> {totalAdults}</p>
          </Col>
          <Col md={6} className="col">
            <p className="m-1"><strong>Foreigns:</strong> {totalForeigns}</p>
            <p className="m-1"><strong>Females:</strong> {totalFemales}</p>
            <p className="m-1"><strong>Teens (13-19 y.o.):</strong> {totalTeens}</p>
            <p className="m-1"><strong>Seniors (60 y.o. above):</strong> {totalSeniors}</p>
          </Col>
        </Row>
        {/* Activities */}
        <h5 className="mt-2 ms-1"><strong>ACTIVITIES AVAILED</strong></h5>
        {activities.map((a, i) => (
          <div key={i} className="mb-3">
            <Row className="row">
              <Col md={6} className="col">
                <p className="m-1"><strong>Activity:</strong> {a.activities_availed?.[0]?.activity_name}</p>
                <p className="m-1"><strong>Area:</strong> {a.activity_area}</p>
                <p className="m-1"><strong>For:</strong> {a.activity_num_pax} pax</p>
              </Col>
              <Col md={6} className="col">
                <p className="m-1" ><strong>Start:</strong> {a.activity_date_time_start}</p>
                <p className="m-1"><strong>End:</strong> {a.activity_date_time_end}</p>
                <p className="m-1"><strong>Duration:</strong> {a.activities_availed?.[0]?.activity_duration}</p>
              </Col>
            </Row>
          </div>
        ))}
        <Row className="row justify-content-center align-items-center">
          <Col md={6} sm={12} className="col">
            <p className="m-1"><strong>Total Pax:</strong> {total_pax}</p>
            <p className="m-1"><strong>Expected Pricing:</strong> {total_expected_payment}</p>
          </Col>
          <Col md={6} sm={12} className="col">
            <p className="m-1"><strong>Total Duration:</strong> {total_duration}</p>
            <p className="m-1"><strong>Agreed Pricing:</strong> {total_payment}</p>
          </Col>
        </Row>
        <div className="text-center mt-2">
          <p className="m-1"><strong>Company:</strong> {companyInfo?.name || "Loading..."}</p>
          <p className="m-1"><strong>Tour Coordinator/Guide:</strong> {employeeInfo ? `${employeeInfo.name.first} ${employeeInfo.name.last}` : "Loading..."}</p>
          <p className="m-1"><strong>Contact:</strong> {employeeInfo ? `${employeeInfo.contact}` : "Loading..."}</p>
        </div>
        <p className="m-1 mt-3 text-muted small text-center">
          Note: Generated electronic QR codes must be deleted properly once used or expired. Unethical or unpermitted use of this electronic copy or any of the data it contains is strictly prohibited and punishable by law.
        </p>
      </Container>
      <div className="d-flex justify-content-center mt-3">
        <button type="button" className="btn btn-primary" onClick={handleDownloadImage}>
          Download as Image
        </button>
      </div>
    </>
  );
};

export default TicketSummary;
