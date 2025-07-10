import React, { useEffect, useState } from "react";
import { Form, Container } from "react-bootstrap";
import Select from "react-select";
import { regions, provinces, cities } from "select-philippines-address";
import countryList from "react-select-country-list";

const BirthPlaceForm = ({ type = "local", address = {}, onChange }) => {
  const [regionList, setRegionList] = useState([]);
  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const countries = countryList().getData();

  useEffect(() => {
    if (type === "local") {
      regions().then((data) => {
        const options = data.map((r) => ({
          value: r.region_code,
          label: r.region_name,
        }));
        setRegionList(options);
      });
    }
  }, [type]);

  useEffect(() => {
    if (type === "local" && address.region) {
      provinces(address.region).then((data) => {
        const options = data.map((p) => ({
          value: p.province_code,
          label: p.province_name,
        }));
        setProvinceList(options);
        setCityList([]); // reset city list when province changes
      });
    }
  }, [type, address.region]);

  useEffect(() => {
    if (type === "local" && address.province) {
      cities(address.province).then((data) => {
        const options = data.map((c) => ({
          value: c.city_name,
          label: c.city_name,
        }));
        setCityList(options);
      });
    }
  }, [type, address.province]);

  return (
    <Container>
      {type === "foreign" ? (
        <Form.Group className="my-2">
          <Form.Label>Country</Form.Label>
          <Select
            options={countries}
            value={countries.find((c) => c.label === address.country) || null}
            onChange={(selected) => onChange("country", selected?.label || "")}
            placeholder="Select Country"
          />
        </Form.Group>
      ) : (
        <>
          <Form.Group className="my-2">
            <Form.Label>Region</Form.Label>
            <Select
              options={regionList}
              value={regionList.find((r) => r.value === address.region) || null}
              onChange={(selected) => {
                onChange("region", selected?.value || "");
                onChange("province", ""); // reset downstream
                onChange("town", "");
              }}
              placeholder="Select Region"
            />
          </Form.Group>

          <Form.Group className="my-2">
            <Form.Label>Province</Form.Label>
            <Select
              options={provinceList}
              value={provinceList.find((p) => p.value === address.province) || null}
              onChange={(selected) => {
                onChange("province", selected?.value || "");
                onChange("town", ""); // reset downstream
              }}
              placeholder="Select Province"
              isDisabled={!address.region}
            />
          </Form.Group>

          <Form.Group className="my-2">
            <Form.Label>Town/City</Form.Label>
            <Select
              options={cityList}
              value={cityList.find((c) => c.value === address.town) || null}
              onChange={(selected) => onChange("town", selected?.value || "")}
              placeholder="Select Town/City"
              isDisabled={!address.province}
            />
          </Form.Group>
        </>
      )}
    </Container>
  );
};

export default BirthPlaceForm;
