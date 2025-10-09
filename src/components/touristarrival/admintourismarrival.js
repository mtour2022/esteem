import React, { useState, useEffect } from "react";
import { Button, Form, Card, Row, Col, Table } from "react-bootstrap";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../config/firebase";
import TourismData from "../../classes/TouristArrival"; // ✅ import your model

export default function TourismDataAdmin() {
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState(
    new TourismData({
      year: new Date().getFullYear(),
      visitorTypeBreakdown: {
        foreign: 0,
        domestic: 0,
        ofw: 0,
        immigrants: 0,
        halalTravelers: 0,
      },
      sexSegregation: {
        male: 0,
        female: 0,
        preferNotToSay: 0,
      },
      ageGroup: {
        "0-12": 0,
        "13-59": 0,
        "60-above": 0,
      },
      modeOfTransportation: {
        air: 0,
        land: 0,
        sea: 0,
      },
    })
  );

  const tourismCollectionRef = collection(db, "tourismData");

  // 🔹 Fetch existing records
  useEffect(() => {
    const fetchRecords = async () => {
      const snapshot = await getDocs(tourismCollectionRef);
      setRecords(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchRecords();
  }, []);

  // 🔹 Handle input updates
  const handleChange = (path, value) => {
    setFormData((prev) => {
      const updated = { ...prev };

      const keys = path.split(".");
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = Number(value);
      return { ...updated };
    });
  };

  // 🔹 Add new record
  const handleAdd = async (e) => {
    e.preventDefault();

    const totalVisitors =
      formData.visitorTypeBreakdown.foreign +
      formData.visitorTypeBreakdown.domestic +
      formData.visitorTypeBreakdown.ofw +
      formData.visitorTypeBreakdown.immigrants;

    const dataToSave = {
      ...formData,
      totalVisitors,
    };

    await addDoc(tourismCollectionRef, dataToSave);
    setRecords((prev) => [...prev, dataToSave]);

    alert("Tourism data added successfully!");
  };

  return (
    <div className="container py-4">
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h5 className="mb-3 fw-bold">Add Tourism Statistics</h5>
          <Form onSubmit={handleAdd}>
            <Row className="mb-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Year</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-3 text-primary">Visitor Type Breakdown</h6>
            <Row>
              {Object.keys(formData.visitorTypeBreakdown).map((key) => (
                <Col md={2} key={key}>
                  <Form.Group>
                    <Form.Label className="text-capitalize">{key}</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.visitorTypeBreakdown[key]}
                      onChange={(e) =>
                        handleChange(`visitorTypeBreakdown.${key}`, e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>

            <h6 className="mt-4 text-primary">Sex Segregation</h6>
            <Row>
              {Object.keys(formData.sexSegregation).map((key) => (
                <Col md={3} key={key}>
                  <Form.Group>
                    <Form.Label className="text-capitalize">{key}</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.sexSegregation[key]}
                      onChange={(e) =>
                        handleChange(`sexSegregation.${key}`, e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>

            <h6 className="mt-4 text-primary">Age Group</h6>
            <Row>
              {Object.keys(formData.ageGroup).map((key) => (
                <Col md={3} key={key}>
                  <Form.Group>
                    <Form.Label>{key}</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.ageGroup[key]}
                      onChange={(e) =>
                        handleChange(`ageGroup.${key}`, e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>

            <h6 className="mt-4 text-primary">Mode of Transportation</h6>
            <Row>
              {Object.keys(formData.modeOfTransportation).map((key) => (
                <Col md={3} key={key}>
                  <Form.Group>
                    <Form.Label className="text-capitalize">{key}</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.modeOfTransportation[key]}
                      onChange={(e) =>
                        handleChange(`modeOfTransportation.${key}`, e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>

            <div className="mt-4">
              <Button variant="primary" type="submit">
                Add Record
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <h5 className="mb-3 fw-bold">Tourism Records</h5>
      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>Year</th>
            <th>Total Visitors</th>
            <th>Foreign</th>
            <th>Domestic</th>
            <th>OFW</th>
            <th>Immigrants</th>
            <th>Halal Travelers</th>
            <th>Male</th>
            <th>Female</th>
            <th>Prefer Not To Say</th>
            <th>0-12</th>
            <th>13-59</th>
            <th>60-above</th>
            <th>Air</th>
            <th>Land</th>
            <th>Sea</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec, i) => (
            <tr key={i}>
              <td>{rec.year}</td>
              <td>{rec.totalVisitors}</td>
              <td>{rec.visitorTypeBreakdown.foreign}</td>
              <td>{rec.visitorTypeBreakdown.domestic}</td>
              <td>{rec.visitorTypeBreakdown.ofw}</td>
              <td>{rec.visitorTypeBreakdown.immigrants}</td>
              <td>{rec.visitorTypeBreakdown.halalTravelers}</td>
              <td>{rec.sexSegregation.male}</td>
              <td>{rec.sexSegregation.female}</td>
              <td>{rec.sexSegregation.preferNotToSay}</td>
              <td>{rec.ageGroup["0-12"]}</td>
              <td>{rec.ageGroup["13-59"]}</td>
              <td>{rec.ageGroup["60-above"]}</td>
              <td>{rec.modeOfTransportation.air}</td>
              <td>{rec.modeOfTransportation.land}</td>
              <td>{rec.modeOfTransportation.sea}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
