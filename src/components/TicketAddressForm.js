import React, { useState, useEffect, useMemo } from "react";
import { Form, Container, Row, Col } from "react-bootstrap";
import { regions, provinces, cities } from "select-philippines-address";
import countryList from "react-select-country-list";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";

const TicketAddressForm = ({ groupData, setGroupData }) => {
    const countryOptions = useMemo(
        () => countryList().getData().filter((c) => c.label !== "Philippines"),
        []
    );

    const [regionList, setRegionList] = useState([]);
    const [provinceLists, setProvinceLists] = useState([]);
    const [cityLists, setCityLists] = useState([]);

    const [townOptions, setTownOptions] = useState([]);

useEffect(() => {
  const fetchAll = async () => {
    const regionList = await regions();
    let allOptions = [];

    for (const region of regionList) {
      const provs = await provinces(region.region_code);
      for (const prov of provs) {
        const cts = await cities(prov.province_code);
        allOptions.push(
          ...cts.map(city => ({
            value: city.city_name,
            label: `${city.city_name}, ${prov.province_name}, ${region.region_name}`,
            region_code: region.region_code,
            region_name: region.region_name,
            province_code: prov.province_code,
            province_name: prov.province_name,
            city_name: city.city_name
          }))
        );
      }
    }
    setTownOptions(allOptions);
  };

  fetchAll();
}, []);


    useEffect(() => {
        if (!groupData.address || groupData.address.length === 0) {
            setGroupData((prev) => ({
                ...prev,
                address: [
                    {
                        country: "Philippines",
                        region: "",
                        province: "",
                        town: "",
                        street: "",
                        barangay: "",
                        isForeign: false,
                        locals: "",
                        foreigns: "",
                        males: "",
                        females: "",
                        prefer_not_to_say: "",
                        kids: "",
                        teens: "",
                        seniors: "",
                        adults: "",
                    },
                ],
            }));
        }
    }, [groupData.address, setGroupData]);

    useEffect(() => {
        regions().then(setRegionList);
    }, []);

    useEffect(() => {
        if (!groupData.address) return;

        const fetchProvincesAndCities = async () => {
            const newProvinceLists = [];
            const newCityLists = [];

            for (const addr of groupData.address) {
                const provinceList = addr.region ? await provinces(addr.region) : [];
                newProvinceLists.push(provinceList);

                const cityList = addr.province ? await cities(addr.province) : [];
                newCityLists.push(cityList);
            }

            setProvinceLists(newProvinceLists);
            setCityLists(newCityLists);
        };

        fetchProvincesAndCities();
    }, [groupData.address]);

    const handleAddressChange = (index, updatedFields) => {
        setGroupData((prev) => {
            const updatedAddresses = [...prev.address];
            updatedAddresses[index] = {
                ...updatedAddresses[index],
                ...updatedFields,
            };
            return {
                ...prev,
                address: updatedAddresses,
            };
        });
    };

    const handleAddMoreAddress = () => {
        const lastAddress = groupData.address[groupData.address.length - 1];

        const isValid =
            (!lastAddress.isForeign && lastAddress.locals?.trim() !== "") ||
            (lastAddress.isForeign && lastAddress.foreigns?.trim() !== "");

        if (!isValid) {
            alert(
                lastAddress.isForeign
                    ? "Please enter the number of foreigners before adding another address."
                    : "Please enter the number of locals before adding another address."
            );
            return;
        }

        setGroupData((prev) => ({
            ...prev,
            address: [
                ...prev.address,
                {
                    country: "Philippines",
                    region: "",
                    province: "",
                    town: "",
                    street: "",
                    barangay: "",
                    locals: "",
                    foreigns: "",
                    males: "",
                    females: "",
                    prefer_not_to_say: "",
                    kids: "",
                    teens: "",
                    seniors: "",
                    adults: "",
                },
            ],
        }));
    };


    const handleRemoveAddress = (index) => {
        setGroupData((prev) => {
            const updatedAddresses = [...prev.address];
            updatedAddresses.splice(index, 1);
            return {
                ...prev,
                address: updatedAddresses,
            };
        });
    };



    return (
        <Container>
            <Form.Group className="my-3">
                <Form.Label className="fw-bold">Address/es</Form.Label>

                {groupData.address?.map((addr, index) => {

                    const targetCount = parseInt(addr.isForeign ? addr.foreigns : addr.locals) || 0;

                    const sexTotal =
                        (parseInt(addr.males) || 0) +
                        (parseInt(addr.females) || 0) +
                        (parseInt(addr.prefer_not_to_say) || 0);

                    const ageTotal =
                        (parseInt(addr.kids) || 0) +
                        (parseInt(addr.teens) || 0) +
                        (parseInt(addr.seniors) || 0) +
                        (parseInt(addr.adults) || 0);

                    return (
                        <React.Fragment key={index}>
                            <div key={index} className="border p-3 mb-4 rounded bg-light">
                                <Form.Label className="fw-semibold">Address {index + 1}</Form.Label>

                                <div className="d-flex align-items-center gap-4 my-2">
                                    <Form.Check
                                        type="radio"
                                        name={`addressMode-${index}`}
                                        label="Local Address"
                                        checked={!addr.isForeign}
                                        onChange={() =>
                                            handleAddressChange(index, {
                                                isForeign: false,
                                                country: "Philippines",
                                                region: "",
                                                province: "",
                                                town: "",
                                                foreigns: "",
                                                males: "",
                                                females: "",
                                                prefer_not_to_say: "",
                                                kids: "",
                                                teens: "",
                                                seniors: "",
                                                adults: "",
                                            })
                                        }
                                    />
                                    <Form.Check
                                        type="radio"
                                        name={`addressMode-${index}`}
                                        label="Foreign Country"
                                        checked={addr.isForeign}
                                        onChange={() =>
                                            handleAddressChange(index, {
                                                isForeign: true,
                                                country: "",
                                                region: "",
                                                province: "",
                                                town: "",
                                                street: "",
                                                barangay: "",
                                                locals: "",
                                                males: "",
                                                females: "",
                                                prefer_not_to_say: "",
                                                kids: "",
                                                teens: "",
                                                seniors: "",
                                                adults: "",
                                            })
                                        }
                                    />
                                </div>

                                {addr.isForeign ? (
                                 

                                    <div className="my-2">
                                        <Select
                                            placeholder="Select or type a country"
                                            options={countryOptions}
                                            value={countryOptions.find(option => option.label === addr.country) || null}
                                            onChange={(selectedOption) =>
                                                handleAddressChange(index, { country: selectedOption?.label || "" })
                                            }
                                            isClearable
                                            isSearchable
                                        />
                                    </div>

                                ) : (
                                    <>
                                        <Form.Control
                                            className="my-2"
                                            type="text"
                                            value="Philippines"
                                            readOnly
                                        />

                                        {/* Region */}
                                        <Select
                                            className="my-2"
                                            placeholder="Select Region"
                                            isSearchable
                                            isClearable
                                            options={regionList.map((region) => ({
                                                value: region.region_code,
                                                label: region.region_name,
                                            }))}
                                            value={
                                                regionList
                                                    .map((region) => ({
                                                        value: region.region_code,
                                                        label: region.region_name,
                                                    }))
                                                    .find((option) => option.value === addr.region) || null
                                            }
                                            onChange={(selectedOption) =>
                                                handleAddressChange(index, {
                                                    region: selectedOption?.value || "",
                                                    province: "",
                                                    town: "",
                                                })
                                            }
                                        />

                                        {/* Province */}
                                        <Select
                                            className="my-2"
                                            placeholder="Select Province"
                                            isSearchable
                                            isClearable
                                            isDisabled={!addr.region}
                                            options={(provinceLists[index] || []).map((province) => ({
                                                value: province.province_code,
                                                label: province.province_name,
                                            }))}
                                            value={
                                                (provinceLists[index] || [])
                                                    .map((province) => ({
                                                        value: province.province_code,
                                                        label: province.province_name,
                                                    }))
                                                    .find((option) => option.value === addr.province) || null
                                            }
                                            onChange={(selectedOption) =>
                                                handleAddressChange(index, {
                                                    province: selectedOption?.value || "",
                                                    town: "",
                                                })
                                            }
                                        />

                                        {/* City/Municipality */}
                                        <Select
  className="my-2"
  placeholder="Type town/city name"
  isSearchable
  options={townOptions}
  value={
    townOptions.find(option => option.city_name === addr.town) || null
  }
  onChange={(selectedOption) => {
    if (selectedOption) {
      handleAddressChange(index, {
        town: selectedOption.city_name,
        province: selectedOption.province_code,
        region: selectedOption.region_code,
        country: "Philippines",
      });
    }
  }}
/>

                                        {/* <Select
                                            className="my-2"
                                            placeholder="Select City/Municipality"
                                            isSearchable
                                            isClearable
                                            isDisabled={!addr.province}
                                            options={(cityLists[index] || []).map((city) => ({
                                                value: city.city_name,
                                                label: city.city_name,
                                            }))}
                                            value={
                                                (cityLists[index] || [])
                                                    .map((city) => ({
                                                        value: city.city_name,
                                                        label: city.city_name,
                                                    }))
                                                    .find((option) => option.value === addr.town) || null
                                            }
                                            onChange={(selectedOption) =>
                                                handleAddressChange(index, {
                                                    town: selectedOption?.value || "",
                                                })
                                            }
                                        /> */}
                                    </>
                                )}



                                {/* Other fields remain unchanged... */}
                                <Form.Label className="fw-semibold mt-2">Number of Pax</Form.Label>

                                <Form.Control
                                    type="text"
                                    className="my-2"
                                    required
                                    placeholder={addr.isForeign ? "Number/s of foreigners" : "Number/s of locals"}
                                    value={addr.isForeign ? addr.foreigns : addr.locals}
                                    onChange={(e) => {
                                        const numericOnly = e.target.value.replace(/\D/g, "");
                                        handleAddressChange(index, addr.isForeign
                                            ? { foreigns: numericOnly }
                                            : { locals: numericOnly });
                                    }}
                                />

                                {/* Sex and Age breakdown fields */}
                                <Form.Label className="fw-semibold mt-2">Sex Segregation</Form.Label>
                                <Row className="gap-2">
                                    <Col>
                                        <Form.Label className="mb-1" style={{ fontSize: "0.7rem" }}>
                                            Males
                                        </Form.Label>
                                        <Form.Control
                                            className="my-1"
                                            type="number"
                                            placeholder="Males"
                                            value={addr.males || ""}
                                            onChange={(e) => handleAddressChange(index, { males: e.target.value })}
                                        />

                                    </Col>
                                    <Col>
                                        <Form.Label className="mb-1 ms-1" style={{ fontSize: "0.7rem" }}>
                                            Females
                                        </Form.Label>
                                        <Form.Control
                                            className="my-1"
                                            type="number"
                                            placeholder="Females"
                                            value={addr.females || ""}
                                            onChange={(e) => handleAddressChange(index, { females: e.target.value })}
                                        />

                                    </Col>
                                </Row>
                                <Form.Label className="mb-1" style={{ fontSize: "0.7rem" }}>
                                    Prefer Not To Say
                                </Form.Label>
                                <Form.Control className="my-1" type="number" placeholder="Prefer not to say" value={addr.prefer_not_to_say || ""} onChange={(e) => handleAddressChange(index, { prefer_not_to_say: e.target.value })} />
                                {sexTotal !== targetCount && <div className="text-danger">Sex total ({sexTotal}) must equal {targetCount}</div>}

                                <Form.Label className="fw-semibold mt-2">Age Bracket</Form.Label>
                                <Row className="gap-2">
                                    <Col>
                                        <Form.Label className="mb-1" style={{ fontSize: "0.7rem" }}>
                                            Kids (0-12 y.o.)
                                        </Form.Label>
                                        <Form.Control className="my-1" type="number" placeholder="Kids" value={addr.kids || ""} onChange={(e) => handleAddressChange(index, { kids: e.target.value })} />


                                    </Col>
                                    <Col>
                                        <Form.Label className="mb-1 ms-1" style={{ fontSize: "0.7rem" }}>
                                            Teens (13-19 y.o.)
                                        </Form.Label>
                                        <Form.Control className="my-1" type="number" placeholder="Teens" value={addr.teens || ""} onChange={(e) => handleAddressChange(index, { teens: e.target.value })} />


                                    </Col>
                                </Row>
                                <Row className="gap-2">
                                    <Col>
                                        <Form.Label className="mb-1" style={{ fontSize: "0.7rem" }}>
                                            Adults (20-59 y.o.)
                                        </Form.Label>
                                        <Form.Control className="my-1" type="number" placeholder="Adults" value={addr.adults || ""} onChange={(e) => handleAddressChange(index, { adults: e.target.value })} />



                                    </Col>
                                    <Col>
                                        <Form.Label className="mb-1 ms-1" style={{ fontSize: "0.7rem" }}>
                                            Seniors (60 y.o. up)
                                        </Form.Label>
                                        <Form.Control className="my-1" type="number" placeholder="Seniors" value={addr.seniors || ""} onChange={(e) => handleAddressChange(index, { seniors: e.target.value })} />


                                    </Col>
                                </Row>
                                {ageTotal !== targetCount && <div className="text-danger">Age total ({ageTotal}) must equal {targetCount}</div>}

                                <div className="d-flex justify-content-between">
                                    {groupData.address.length > 1 ? (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger mt-2"
                                                onClick={() => handleRemoveAddress(index)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} className="text-danger" />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-light border border-secondary text-secondary mt-2 d-flex align-items-center gap-2"
                                                onClick={handleAddMoreAddress}
                                            >
                                                <FontAwesomeIcon icon={faCirclePlus} className="text-secondary" />
                                                Add another address
                                            </button>
                                        </>
                                    ) : (
                                        <div className="ms-auto">
                                            <button
                                                type="button"
                                                className="btn btn-light border border-secondary text-secondary mt-2 d-flex align-items-center gap-2"
                                                onClick={handleAddMoreAddress}
                                            >
                                                <FontAwesomeIcon icon={faCirclePlus} className="text-secondary" />
                                                Add another address
                                            </button>
                                        </div>
                                    )}
                                </div>


                            </div>
                        </React.Fragment>
                    )

                })}
            </Form.Group>
        </Container>
    );
};

export default TicketAddressForm;
