import React, { useState, useEffect } from "react";
import { Form, Container } from "react-bootstrap";
import {
    regions,
    provinces,
    cities,
    barangays,
} from "select-philippines-address";

const AddressForm = ({ groupData, setGroupData }) => {
    const [barangayList, setBarangayList] = useState([]);

    const fixedCountry = "Philippines";
    const fixedRegion = "Region VI (Western Visayas)";
    const fixedProvince = "Aklan";
    const fixedCity = "Malay";

    const [selectedBarangay, setSelectedBarangay] = useState(groupData?.address?.barangay || "");
    const [street, setStreet] = useState(groupData?.address?.street || "");

    useEffect(() => {
        // Fetch barangays for Malay only
        cities("0604").then((cityData) => {
            const malayCity = cityData.find(c => c.city_name === fixedCity);
            if (malayCity) {
                barangays(malayCity.city_code).then(setBarangayList);

                // Set default values in groupData
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
                <Form.Control
                    className="my-2"
                    type="text"
                    name="address.country"
                    value={fixedCountry}
                    readOnly
                />
                <Form.Control
                    className="my-2"
                    type="text"
                    name="address.region"
                    value={fixedRegion}
                    readOnly
                />
                <Form.Control
                    className="my-2"
                    type="text"
                    name="address.province"
                    value={fixedProvince}
                    readOnly
                />
                <Form.Control
                    className="my-2"
                    type="text"
                    name="address.town"
                    value={fixedCity}
                    readOnly
                />
                <Form.Select
                    className="my-2"
                    value={selectedBarangay}
                    onChange={(e) => handleBarangayChange(e.target.value)}
                    required
                >
                    <option value="">Select Barangay</option>
                    {barangayList.map((barangay) => (
                        <option key={barangay.brgy_code} value={barangay.brgy_name}>
                            {barangay.brgy_name}
                        </option>
                    ))}
                </Form.Select>
                <Form.Control
                    className="my-2"
                    type="text"
                    name="address.street"
                    placeholder="Street Name / Zone (Optional)"
                    value={street}
                    onChange={handleStreetChange}
                />
            </Form.Group>
        </Container>
    );
};

export default AddressForm;
