import React, { useEffect, useState } from "react";
import { Form, Container } from "react-bootstrap";
import Select from "react-select";
import { regions, provinces, cities, barangays } from "select-philippines-address";
import countryList from "react-select-country-list";

const AddressRegistrationForm = ({ type = "local", address = {}, onChange }) => {
  const [regionList, setRegionList] = useState([]);
  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [barangayList, setBarangayList] = useState([]);
  const countries = countryList().getData();

  // Fetch regions
  useEffect(() => {
    if (type === "local") {
      regions().then((data) =>
        setRegionList(data.map((r) => ({ value: r.region_code, label: r.region_name })))
      );
    }
  }, [type]);

  // Fetch provinces by region
  useEffect(() => {
    if (type === "local" && address.region) {
      provinces(address.region).then((data) =>
        setProvinceList(data.map((p) => ({ value: p.province_code, label: p.province_name })))
      );
    }
  }, [address.region]);

  // Fetch cities by province
  useEffect(() => {
    if (type === "local" && address.province) {
      cities(address.province).then((data) =>
        setCityList(data.map((c) => ({ value: c.city_name, label: c.city_name })))
      );
    }
  }, [address.province]);

  // Fetch barangays by city
  useEffect(() => {
    if (type === "local" && address.town && address.province) {
      cities(address.province).then((cityData) => {
        const selectedCity = cityData.find((c) => c.city_name === address.town);
        if (selectedCity) {
          barangays(selectedCity.city_code).then((data) =>
            setBarangayList(data.map((b) => ({ value: b.brgy_name, label: b.brgy_name })))
          );
        }
      });
    }
  }, [address.town, address.province]);

  return (
    <Container>
      {type === "foreign" ? (
        <>
          <Form.Group className="my-2">
            <Form.Label>Country</Form.Label>
            <Select
              options={countries}
              value={countries.find((c) => c.label === address.country) || null}
              onChange={(selected) => onChange("country", selected?.label || "")}
              placeholder="Select Country"
            />
          </Form.Group>

          <Form.Group className="my-2">
            <Form.Label>Street (Optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Street Name"
              value={address.street || ""}
              onChange={(e) => onChange("street", e.target.value)}
            />
          </Form.Group>
        </>
      ) : (
        <>
          <Form.Group className="my-2">
            <Form.Label>Region</Form.Label>
            <Select
              options={regionList}
              value={regionList.find((r) => r.value === address.region) || null}
              onChange={(selected) => onChange("region", selected?.value || "")}
              placeholder="Select Region"
            />
          </Form.Group>

          <Form.Group className="my-2">
            <Form.Label>Province</Form.Label>
            <Select
              options={provinceList}
              value={provinceList.find((p) => p.value === address.province) || null}
              onChange={(selected) => onChange("province", selected?.value || "")}
              placeholder="Select Province"
            />
          </Form.Group>

          <Form.Group className="my-2">
            <Form.Label>Town/City</Form.Label>
            <Select
              options={cityList}
              value={cityList.find((c) => c.value === address.town) || null}
              onChange={(selected) => onChange("town", selected?.value || "")}
              placeholder="Select Town/City"
            />
          </Form.Group>

          <Form.Group className="my-2">
            <Form.Label>Barangay</Form.Label>
            <Select
              options={barangayList}
              value={barangayList.find((b) => b.value === address.barangay) || null}
              onChange={(selected) => onChange("barangay", selected?.value || "")}
              placeholder="Select Barangay"
            />
          </Form.Group>

          <Form.Group className="my-2">
            <Form.Label>Street (Optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Street Name"
              value={address.street || ""}
              onChange={(e) => onChange("street", e.target.value)}
            />
          </Form.Group>
        </>
      )}
    </Container>
  );
};

export default AddressRegistrationForm;
