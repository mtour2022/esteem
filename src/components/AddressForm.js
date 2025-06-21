import React, { useState, useEffect } from "react";
import { Form, Dropdown, Container } from "react-bootstrap";
import {
    regions,
    provinces,
    cities,
    barangays,
} from "select-philippines-address";

const AddressForm = ({ groupData, setGroupData }) => {
    const [regionList, setRegionList] = useState([]);
    const [provinceList, setProvinceList] = useState([]);
    const [cityList, setCityList] = useState([]);
    const [barangayList, setBarangayList] = useState([]);

    const [selectedRegion, setSelectedRegion] = useState(groupData?.address?.region || "");
    const [selectedProvince, setSelectedProvince] = useState(groupData?.address?.province || "");
    const [selectedCity, setSelectedCity] = useState(groupData?.address?.town || "");
    const [selectedBarangay, setSelectedBarangay] = useState(groupData?.address?.barangay || "");
    const [street, setStreet] = useState(groupData?.address?.street || "");
    const [country, setCountry] = useState(groupData?.address?.country || "");


    useEffect(() => {
        regions().then(setRegionList);
        handleCountryChange();
    }, []);

    const handleRegionChange = (region) => {
        setSelectedRegion(region.region_name);
        setSelectedProvince("");
        setSelectedCity("");
        setSelectedBarangay("");
        provinces(region.region_code).then(setProvinceList);
        setGroupData({ ...groupData, address: { ...groupData.address, region: region.region_name, province: "", town: "", barangay: "", street } });
    };

    const handleProvinceChange = (province) => {
        setSelectedProvince(province.province_name);
        setSelectedCity("");
        setSelectedBarangay("");
        cities(province.province_code).then(setCityList);
        setGroupData({ ...groupData, address: { ...groupData.address, province: province.province_name, town: "", barangay: "", street } });
    };

    const handleCityChange = (city) => {
        setSelectedCity(city.city_name);
        setSelectedBarangay("");
        barangays(city.city_code).then(setBarangayList);
        setGroupData({ ...groupData, address: { ...groupData.address, town: city.city_name, barangay: "", street } });
    };

    const handleBarangayChange = (barangay) => {
        setSelectedBarangay(barangay);
        setGroupData({ ...groupData, address: { ...groupData.address, barangay, street } });
    };

    const handleStreetChange = (e) => {
        setStreet(e.target.value);
        setGroupData({ ...groupData, address: { ...groupData.address, street: e.target.value } });
    };

    const handleCountryChange = () => {
        setCountry("Philippines");
        setGroupData({ ...groupData, address: { ...groupData.address, country: "Philippines" } });
    };


    return (
        <Container>
            <Form.Group className="my-2">
                <Form.Label className="fw-bold">Local Office Address</Form.Label>
                <Form.Control 
                    className="my-2"
                    type="text" 
                    name="address.country"
                    placeholder="Country"
                    onChange={handleCountryChange}
                    value="Philippines" 
                    readOnly
                />
                <Form.Select className="my-2"
                    value={selectedRegion} onChange={(e) => handleRegionChange(regionList.find(r => r.region_name === e.target.value))}>
                    <option value="">Select Region</option>
                    {regionList.map((region) => (
                        <option key={region.region_code} value={region.region_name}>{region.region_name}</option>
                    ))}
                </Form.Select>
                <Form.Select className="my-2"
                    value={selectedProvince} onChange={(e) => handleProvinceChange(provinceList.find(p => p.province_name === e.target.value))} disabled={!selectedRegion}>
                    <option value="">Select Province</option>
                    {provinceList.map((province) => (
                        <option key={province.province_code} value={province.province_name}>{province.province_name}</option>
                    ))}
                </Form.Select>
                <Form.Select className="my-2"
                    value={selectedCity} onChange={(e) => handleCityChange(cityList.find(c => c.city_name === e.target.value))} disabled={!selectedProvince}>
                    <option value="">Select City/Municipality/Town</option>
                    {cityList.map((city) => (
                        <option key={city.city_code} value={city.city_name}>{city.city_name}</option>
                    ))}
                </Form.Select>
                <Form.Select className="my-2"
                    value={selectedBarangay} onChange={(e) => handleBarangayChange(e.target.value)} disabled={!selectedCity}>
                    <option value="">Select Barangay</option>
                    {barangayList.map((barangay) => (
                        <option key={barangay.brgy_code} value={barangay.brgy_name}>{barangay.brgy_name}</option>
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