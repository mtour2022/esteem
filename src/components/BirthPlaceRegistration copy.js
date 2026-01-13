import React, { useEffect, useState } from "react";
import { Form, Container } from "react-bootstrap";
import Select from "react-select";
import { regions, provinces, cities } from "select-philippines-address";
import countryList from "react-select-country-list";

const BirthPlaceForm = ({ type = "local", address = {}, onChange }) => {
  const [regionList, setRegionList] = useState([]);
  const [provinceList, setProvinceList] = useState([]);
  const [townOptions, setTownOptions] = useState([]);
  const countries = countryList().getData();

  // Force Philippines for local
  useEffect(() => {
    if (type === "local" && address.country !== "Philippines") {
      onChange("country", "Philippines");
    }
  }, [type, address.country, onChange]);

  // Load regions
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

  // Load provinces when region changes (for display only)
  useEffect(() => {
    if (type === "local" && address.region) {
      provinces(address.region).then((data) => {
        const options = data.map((p) => ({
          value: p.province_code,
          label: p.province_name,
        }));
        setProvinceList(options);
      });
    }
  }, [type, address.region]);

  // 🔥 Load ALL towns for auto-fill
  useEffect(() => {
    const fetchAll = async () => {
      const regionData = await regions();
      let allOptions = [];

      for (const region of regionData) {
        const provs = await provinces(region.region_code);
        for (const prov of provs) {
          const cts = await cities(prov.province_code);
          allOptions.push(
            ...cts.map((city) => ({
              value: city.city_name,
              label: `${city.city_name}, ${prov.province_name}, ${region.region_name}`,
              region_code: region.region_code,
              province_code: prov.province_code,
              city_name: city.city_name,
            }))
          );
        }
      }

      setTownOptions(allOptions);
    };

    if (type === "local") fetchAll();
  }, [type]);

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
          {/* Country */}
          <Form.Group className="my-2">
            <Form.Label>Country</Form.Label>
            <Form.Control type="text" value="Philippines" readOnly />
          </Form.Group>

           {/* Region (Auto-filled) */}
          <Form.Group className="my-2">
            <Form.Label>Region (auto-filled)</Form.Label>
            <Select
              options={regionList}
              value={regionList.find((r) => r.value === address.region) || null}
              isDisabled
              placeholder="Auto-filled from town/city"
            />
          </Form.Group>

          {/* Province (Auto-filled) */}
          <Form.Group className="my-2">
            <Form.Label>Province (auto-filled)</Form.Label>
            <Select
              options={provinceList}
              value={
                provinceList.find((p) => p.value === address.province) || null
              }
              isDisabled
              placeholder="Auto-filled from town/city"
            />
          </Form.Group>

          {/* Town/City Auto-fill */}
          <Form.Group className="my-2">
            <Form.Label>Town/City</Form.Label>
            <Select
              placeholder="Type your town/city (auto-fills region & province)"
              isSearchable
              options={townOptions}
              value={
                townOptions.find((option) => option.city_name === address.town) ||
                null
              }
              onChange={(selectedOption) => {
                if (selectedOption) {
                  onChange("town", selectedOption.city_name);
                  onChange("province", selectedOption.province_code);
                  onChange("region", selectedOption.region_code);
                  onChange("country", "Philippines");
                }
              }}
            />
          </Form.Group>

         
        </>
      )}
    </Container>
  );
};

export default BirthPlaceForm;
