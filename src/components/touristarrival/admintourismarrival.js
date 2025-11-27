import React, { useState, useEffect } from "react";
import { Button, Form, Card, Row, Col, Table, ListGroup, Container } from "react-bootstrap";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import TourismData from "../../classes/TouristArrival"; // your model

// 🌍 Region and country data
const regionCountryData = [
  {
    regionName: "Southeast Asia",
    continent: "Asia",

    countries: [
      "Brunei",
      "Cambodia",
      "Indonesia",
      "Laos",
      "Malaysia",
      "Myanmar",
      "Philippines",
      "Singapore",
      "Thailand",
      "Timor-Leste",
      "Vietnam",
    ],
  },

  {
    regionName: "East Asia",
    continent: "Asia",

    countries: [
      "China",
      "Japan",
      "Mongolia",
      "North Korea",
      "South Korea",
      "Taiwan",
      "Hong Kong",
      "Macau"
    ],
  },

  {
    regionName: "South Asia",
    continent: "Asia",
    countries: [
      "Afghanistan",
      "Bangladesh",
      "Bhutan",
      "India",
      "Maldives",
      "Nepal",
      "Pakistan",
      "Sri Lanka"
    ],
  },


  {
    regionName: "Oceanian Territories",
    continent: "Oceania",
    countries: [
      "Cook Islands",
      "Niue",
      "Tokelau",
      "Norfolk Island",
      "Pitcairn Islands"
    ]
  },
  {
    regionName: "Polynesia",
    continent: "Oceania",
    countries: [
      "Samoa",
      "Tonga",
      "Tuvalu",

    ]
  },
  {
    regionName: "Micronesia",
    continent: "Oceania",
    countries: [
      "Federated States of Micronesia",
      "Kiribati",
      "Marshall Islands",
      "Nauru",
      "Palau",

    ]
  },
  {
    regionName: "Melanesia",
    continent: "Oceania",
    countries: [
      "Fiji",
      "Papua New Guinea",
      "Solomon Islands",
      "Vanuatu",
    ]
  },
  {
    regionName: "Australasia",
    continent: "Oceania",
    countries: [
      "Australia",
      "New Zealand",
    ]
  },

  {
    regionName: "Central America",
    continent: "North America",
    countries: [
      "Belize",
      "Costa Rica",
      "El Salvador",
      "Guatemala",
      "Honduras",
      "Nicaragua",
      "Panama"
    ]
  },
  {
    regionName: "North American Territories",
    continent: "North America",
    countries: [
      "Cayman Islands", "Puerto Rico", "Aruba", "Curacao", "Sint Maarten",
      "Turks and Caicos Islands", "British Virgin Islands"
    ]
  },
  {
    regionName: "Caribbean",
    continent: "North America",
    countries: [
      "Antigua and Barbuda",
      "Bahamas",
      "Barbados",
      "Cuba",
      "Dominica",
      "Dominican Republic",
      "Grenada",
      "Haiti",
      "Jamaica",
      "Saint Kitts and Nevis",
      "Saint Lucia",
      "Saint Vincent and the Grenadines",
      "Trinidad and Tobago",
    ]
  },
  {
    regionName: "Northern America",
    continent: "North America",
    countries: [
      "Canada",
      "United States",
      "Mexico",
      "Greenland",
      "Bermuda",
      "Saint Pierre and Miquelon",
    ]
  },
  {
    regionName: "Western Europe",
    continent: "Europe",
    countries: [
      "Austria",
      "Belgium",
      "France",
      "Germany",
      "Liechtenstein",
      "Luxembourg",
      "Monaco",
      "Netherlands",
      "Switzerland",
    ]
  },
  {
    regionName: "Northern Europe",
    continent: "Europe",
    countries: [
      "Denmark",
      "Estonia",
      "Finland",
      "Iceland",
      "Ireland",
      "Latvia",
      "Lithuania",
      "Norway",
      "Sweden",
      "United Kingdom",
    ]
  },
  {
    regionName: "Southern Europe",
    continent: "Europe",
    countries: [
      "Albania",
      "Andorra",
      "Bosnia and Herzegovina",
      "Croatia",
      "Greece",
      "Holy See",
      "Italy",
      "Malta",
      "Montenegro",
      "North Macedonia",
      "Portugal",
      "San Marino",
      "Serbia",
      "Slovenia",
      "Spain"
    ]
  },
  {
    regionName: "Eastern Europe",
    continent: "Europe",
    countries: [
      "Belarus",
      "Bulgaria",
      "Czechia",
      "Hungary",
      "Moldova",
      "Poland",
      "Romania",
      "Russia",
      "Slovakia",
      "Ukraine"
    ]
  },


  {
    regionName: "Middle East",
    countries: [
      "Bahrain",
      "Cyprus",
      "Egypt",
      "Iran",
      "Iraq",
      "Israel",
      "Jordan",
      "Kuwait",
      "Lebanon",
      "Oman",
      "Palestine",
      "Qatar",
      "Saudi Arabia",
      "Syria",
      "Turkey",
      "United Arab Emirates",
      "Yemen"
    ],
  },
  {
    regionName: "Northern Africa",
    continent: "Africa",
    countries: [
      "Algeria",
      "Egypt",
      "Libya",
      "Morocco",
      "Sudan",
      "Tunisia",
      "Western Sahara"
    ]
  },
  {
    regionName: "Western Africa",
    continent: "Africa",
    countries: [
      "Benin",
      "Burkina Faso",
      "Cabo Verde",
      "Ivory Coast",
      "Gambia",
      "Ghana",
      "Guinea",
      "Guinea-Bissau",
      "Liberia",
      "Mali",
      "Mauritania",
      "Niger",
      "Nigeria",
      "Senegal",
      "Sierra Leone",
      "Togo"
    ]
  },
  {
    regionName: "Central Africa",
    continent: "Africa",
    countries: [
      "Angola",
      "Cameroon",
      "Central African Republic",
      "Chad",
      "Republic of the Congo",
      "Democratic Republic of the Congo",
      "Equatorial Guinea",
      "Gabon",
      "Sao Tome and Principe"
    ]
  },
  {
    regionName: "Eastern Africa",
    continent: "Africa",
    countries: [
      "Burundi",
      "Comoros",
      "Djibouti",
      "Eritrea",
      "Ethiopia",
      "Kenya",
      "Madagascar",
      "Malawi",
      "Mauritius",
      "Mozambique",
      "Rwanda",
      "Seychelles",
      "Somalia",
      "South Sudan",
      "Tanzania",
      "Uganda",
      "Zambia",
      "Zimbabwe"
    ]
  },
  {
    regionName: "Southern Africa",
    continent: "Africa",
    countries: [
      "Botswana",
      "Eswatini",
      "Lesotho",
      "Namibia",
      "South Africa"
    ]
  },
  {
    regionName: "Southern Cone",
    continent: "South America",
    countries: [
      "Argentina", "Chile", "Uruguay", "Paraguay"
    ]
  },
  {
    regionName: "Andean States",
    continent: "South America",
    countries: [
      "Bolivia", "Colombia", "Ecuador", "Peru", "Venezuela"
    ]
  },
  {
    regionName: "Guianas",
    continent: "South America",
    countries: [
      "Guyana", "Suriname", "French Guiana"
    ]
  },
  {
    regionName: "Brazil",
    continent: "South America",
    countries: [
      "Brazil"
    ]
  },
];
const allCountries = regionCountryData.flatMap((r) =>
  r.countries.map((c) => ({
    name: c,
    region: r.regionName,
    continent: r.continent,
  }))
);

export default function TourismDataAdmin() {
  const [records, setRecords] = useState([]);
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [continent, setContinent] = useState("");
  const [suggestions, setSuggestions] = useState([]);

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

  useEffect(() => {
    const fetchRecords = async () => {
      const snapshot = await getDocs(tourismCollectionRef);
      setRecords(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchRecords();
  }, []);

  const handleCountryChange = (value) => {
    setCountry(value);
    if (value.trim() === "") {
      setSuggestions([]);
      setRegion("");
      setContinent("");
      return;
    }
    const filtered = allCountries.filter((c) =>
      c.name.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 5));
  };

  const handleSuggestionClick = (countryItem) => {
    setCountry(countryItem.name);
    setRegion(countryItem.region);
    setContinent(countryItem.continent);
    setSuggestions([]);
  };

  const handleChange = (path, value) => {
    setFormData((prev) => {
      const updated = { ...prev };
      const keys = path.split(".");
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = Number(value);
      return { ...updated };
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!country || !region || !continent) {
      alert("Please select a valid country (auto-fills region and continent)");
      return;
    }

    const totalVisitors =
      formData.visitorTypeBreakdown.foreign +
      formData.visitorTypeBreakdown.domestic +
      formData.visitorTypeBreakdown.ofw +
      formData.visitorTypeBreakdown.immigrants;

    const dataToSave = {
      ...formData,
      address: { continent, region, country },
      totalVisitors,
    };

    await addDoc(tourismCollectionRef, dataToSave);
    setRecords((prev) => [...prev, dataToSave]);
    alert("Tourism data added successfully!");
    setCountry("");
    setRegion("");
    setContinent("");
    setSuggestions([]);
  };

  return (
    <Container fluid className="py-4">
      <Card className="shadow-sm mb-4 mx-auto" style={{ maxWidth: "1200px" }}>
        <Card.Body>
          <h5 className="mb-4 fw-bold text-center text-primary">
            Add Tourist Arrival Data (Monthly)
          </h5>

          <Form onSubmit={handleAdd} className="text-center">
            {/* 🌍 Address Section */}
            <Row className="justify-content-center mb-3 text-center">
              <Col xs={12} md={3}>
                <Form.Group>
                  <Form.Label>Continent</Form.Label>
                  <Form.Control
                    type="text"
                    value={continent}
                    readOnly
                    placeholder="Auto-filled"
                    className="text-center"
                  />
                </Form.Group>
              </Col>

              <Col xs={12} md={3}>
                <Form.Group>
                  <Form.Label>Region</Form.Label>
                  <Form.Control
                    type="text"
                    value={region}
                    readOnly
                    placeholder="Auto-filled"
                    className="text-center"
                  />
                </Form.Group>
              </Col>

              <Col xs={12} md={4} className="position-relative">
                <Form.Group>
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    value={country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    placeholder="Type to search..."
                    autoComplete="off"
                    className="text-center"
                  />
                  {suggestions.length > 0 && (
                    <ListGroup
                      className="position-absolute w-100 shadow-sm"
                      style={{
                        zIndex: 10,
                        maxHeight: "150px",
                        overflowY: "auto",
                      }}
                    >
                      {suggestions.map((c, idx) => (
                        <ListGroup.Item
                          key={idx}
                          action
                          onClick={() => handleSuggestionClick(c)}
                          className="text-center"
                        >
                          {c.name} —{" "}
                          <small className="text-muted">
                            {c.region}, {c.continent}
                          </small>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Form.Group>
              </Col>

              <Col xs={6} md={2}>
                <Form.Group>
                  <Form.Label>Year</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                    className="text-center"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Visitor Type */}
            <h6 className="mt-4 text-primary fw-semibold">
              Visitor Type Breakdown
            </h6>
            <Row className="justify-content-center">
              {Object.keys(formData.visitorTypeBreakdown).map((key) => (
                <Col xs={6} sm={4} md={2} key={key} className="mb-3">
                  <Form.Group>
                    <Form.Label className="text-capitalize">{key}</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.visitorTypeBreakdown[key]}
                      onChange={(e) =>
                        handleChange(`visitorTypeBreakdown.${key}`, e.target.value)
                      }
                      className="text-center"
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>

            {/* Sex Segregation */}
            <h6 className="mt-4 text-primary fw-semibold">Sex Segregation</h6>
            <Row className="justify-content-center">
              {Object.keys(formData.sexSegregation).map((key) => (
                <Col xs={6} sm={4} md={3} key={key} className="mb-3">
                  <Form.Group>
                    <Form.Label className="text-capitalize">{key}</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.sexSegregation[key]}
                      onChange={(e) =>
                        handleChange(`sexSegregation.${key}`, e.target.value)
                      }
                      className="text-center"
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>

            {/* Age Group */}
            <h6 className="mt-4 text-primary fw-semibold">Age Group</h6>
            <Row className="justify-content-center">
              {Object.keys(formData.ageGroup).map((key) => (
                <Col xs={6} sm={4} md={3} key={key} className="mb-3">
                  <Form.Group>
                    <Form.Label>{key}</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.ageGroup[key]}
                      onChange={(e) =>
                        handleChange(`ageGroup.${key}`, e.target.value)
                      }
                      className="text-center"
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>

            {/* Transportation */}
            <h6 className="mt-4 text-primary fw-semibold">
              Mode of Transportation
            </h6>
            <Row className="justify-content-center">
              {Object.keys(formData.modeOfTransportation).map((key) => (
                <Col xs={6} sm={4} md={3} key={key} className="mb-3">
                  <Form.Group>
                    <Form.Label className="text-capitalize">{key}</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.modeOfTransportation[key]}
                      onChange={(e) =>
                        handleChange(`modeOfTransportation.${key}`, e.target.value)
                      }
                      className="text-center"
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>

            <div className="mt-4 text-center">
              <Button variant="primary" type="submit">
                Add Record
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Records Table */}
      <div className="table-responsive">
        <h5 className="fw-bold text-center mb-3">Tourism Records</h5>
        <Table bordered hover responsive className="text-center align-middle">
          <thead className="table-primary">
            <tr>
              <th>Continent</th>
              <th>Region</th>
              <th>Country</th>
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
                <td>{rec.address?.continent}</td>
                <td>{rec.address?.region}</td>
                <td>{rec.address?.country}</td>
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
    </Container>
  );
}