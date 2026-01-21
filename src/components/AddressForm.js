import React, { useState, useEffect } from "react";
import { Form, Container, Spinner } from "react-bootstrap"; // Added Spinner
import { cities, barangays } from "select-philippines-address";

const AddressForm = ({ groupData, setGroupData }) => {
    const [barangayList, setBarangayList] = useState([]);
    const [isLoadingBarangays, setIsLoadingBarangays] = useState(false); // New Loading State

    const fixedCountry = "Philippines";
    const fixedRegion = "Region VI (Western Visayas)";
    const fixedProvince = "Aklan";
    const fixedCity = "Malay";

    const [selectedBarangay, setSelectedBarangay] = useState(groupData?.address?.barangay || "");
    const [street, setStreet] = useState(groupData?.address?.street || "");

    useEffect(() => {
        setIsLoadingBarangays(true); // Start Loading
        
        // Fetch barangays for Malay only
        cities("0604").then((cityData) => {
            const malayCity = cityData.find(c => c.city_name === fixedCity);
            if (malayCity) {
                barangays(malayCity.city_code)
                    .then((data) => {
                        setBarangayList(data);
                        setIsLoadingBarangays(false); // Stop Loading
                    })
                    .catch(() => setIsLoadingBarangays(false));

                setGroupData(prev => ({
                    ...prev,
                    address: {
                        ...prev.address,
                        country: fixedCountry,
                        region: fixedRegion,
                        province: fixedProvince,
                        town: fixedCity,
                        barangay: selectedBarangay,
                        street: street || ""
                    }
                }));
            }
        });
    }, []);

    const handleBarangayChange = (barangay) => {
        setSelectedBarangay(barangay);
        setGroupData((prev) => ({
            ...prev,
            address: { ...prev.address, barangay, street }
        }));
    };

    const handleStreetChange = (e) => {
        setStreet(e.target.value);
        setGroupData((prev) => ({
            ...prev,
            address: { ...prev.address, street: e.target.value }
        }));
    };

    return (
        <Container>
            <Form.Group className="my-2">
                <Form.Label className="fw-bold">Local Office Address</Form.Label>
                
                {/* Fixed Address Fields */}
                <Form.Control className="my-2 bg-light" type="text" value={fixedCountry} readOnly />
                <Form.Control className="my-2 bg-light" type="text" value={fixedRegion} readOnly />
                <Form.Control className="my-2 bg-light" type="text" value={fixedProvince} readOnly />
                <Form.Control className="my-2 bg-light" type="text" value={fixedCity} readOnly />

                {/* Barangay Selection with Loading Notification */}
                <div className="position-relative">
                    <Form.Select
                        className="my-2"
                        value={selectedBarangay}
                        onChange={(e) => handleBarangayChange(e.target.value)}
                        required
                        disabled={isLoadingBarangays} // Disable while loading
                    >
                        <option value="">
                            {isLoadingBarangays ? "Loading Barangays..." : "Select Barangay"}
                        </option>
                        {barangayList.map((barangay) => (
                            <option key={barangay.brgy_code} value={barangay.brgy_name}>
                                {barangay.brgy_name}
                            </option>
                        ))}
                    </Form.Select>
                    
                    {/* Optional: Small Spinner inside the selection area */}
                    {isLoadingBarangays && (
                        <div className="position-absolute end-0 top-50 translate-middle-y me-5">
                            <Spinner animation="border" size="sm" variant="primary" />
                        </div>
                    )}
                </div>

                <Form.Control
                    className="my-2"
                    type="text"
                    placeholder="Street Name / Zone (Optional)"
                    value={street}
                    onChange={handleStreetChange}
                />
            </Form.Group>
        </Container>
    );
};

export default AddressForm;