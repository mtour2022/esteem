import React, { useEffect, useState } from "react";
import { Form, Container, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";
import { ActivityModel } from "../classes/activities";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import useResolvedActivities from "../services/GetActivitiesDetails";


const TicketActivitiesForm = ({ groupData, setGroupData, isPackaged }) => {


    const [activityOptions, setActivityOptions] = useState([]);

    useEffect(() => {
        const fetchActivities = async () => {
            const snapshot = await getDocs(collection(db, "activities"));
            const options = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    value: doc.id,
                    label: data.activity_name,
                    data,
                };
            });
            setActivityOptions(options);
        };

        fetchActivities();
    }, []);

    const [providerOptions, setProviderOptions] = useState([]);



    const updateStartAndEndTimeFromActivities = (activities) => {
        const startTimes = activities
            .map(a => new Date(a.activity_date_time_start))
            .filter(date => !isNaN(date)); // Only valid dates

        const endTimes = activities
            .map(a => new Date(a.activity_date_time_end))
            .filter(date => !isNaN(date));

        const earliestStart = startTimes.length > 0 ? new Date(Math.min(...startTimes)) : "";
        const latestEnd = endTimes.length > 0 ? new Date(Math.max(...endTimes)) : "";

        setGroupData(prev => ({
            ...prev,
            start_date_time: earliestStart ? earliestStart.toISOString().slice(0, 16) : "",
            end_date_time: latestEnd ? latestEnd.toISOString().slice(0, 16) : "",
        }));


    };


    const handleActivityGroupChange = (index, updates) => {
        const updated = [...groupData.activities];
        updated[index] = { ...updated[index], ...updates };

        const selected = updated[index].activities_availed?.[0];
        if (selected) {
            const price = parseFloat(selected.activity_price || 0);
            const pax = parseInt(updated[index].activity_num_pax || 0);
            const unit = parseInt(updated[index].activity_num_unit || 0);

            if (selected.activity_sold_by === "pax") {
                updated[index].activity_expected_price = price * pax || "";
            } else if (selected.activity_sold_by === "unit") {
                updated[index].activity_expected_price = price * unit || "";
            }
        }

        setGroupData({ ...groupData, activities: updated });
        updateStartAndEndTimeFromActivities(updated); // ✅ Auto-update ticket start/end

    };
    const handleActivitySelect = async (index, selectedOption) => {
        const data = selectedOption.data;
        const newActivity = new ActivityModel();

        newActivity.activity_id = selectedOption.value;
        newActivity.activity_name = data.activity_name;
        newActivity.activity_description = data.activity_description;
        newActivity.activity_image = data.activity_image;
        newActivity.activity_price = data.activity_price;
        newActivity.activity_maxpax = data.activity_maxpax;
        newActivity.activity_sold_by = data.activity_sold_by;
        newActivity.activity_duration = data.activity_duration;
        newActivity.activity_base_price = data.activity_base_price;
        newActivity.activity_providers = data.activity_providers || [];

        // 🔁 Fetch provider names from Firestore
        const providerIds = data.activity_providers || [];
        const providerChunks = [];

        for (let i = 0; i < providerIds.length; i += 10) {
            providerChunks.push(providerIds.slice(i, i + 10));
        }

        const fetchedProviders = [];

        for (const chunk of providerChunks) {
            const q = query(collection(db, "providers"), where("__name__", "in", chunk));
            const snapshot = await getDocs(q);
            snapshot.forEach((doc) => {
                const providerData = doc.data();
                fetchedProviders.push({
                    label: providerData.provider_name || "Unnamed",
                    value: doc.id,
                });
            });
        }

        // ✅ Store per-activity provider options in groupData
        newActivity.providerOptions = fetchedProviders;

        const updated = [...groupData.activities];
        updated[index].activities_availed = [newActivity];
        updated[index].activity_selected_providers = []; // reset selection

        // Update groupData with new selected activity
        updated[index].activities_availed = [newActivity];
        updated[index].activity_num_pax = "";
        updated[index].activity_num_unit = "";
        updated[index].activity_agreed_price = "";
        updated[index].activity_expected_price = "";
        updated[index].activity_date_time_start = "";
        updated[index].activity_date_time_end = "";
        updated[index].activity_area = "";



        setGroupData({ ...groupData, activities: updated });
    };




    const handleAddActivityGroup = () => {
        setGroupData(prev => ({
            ...prev,
            activities: [
                ...prev.activities,
                {
                    activity_area: "",
                    activity_date_time_start: "",
                    activity_date_time_end: "",
                    activities_availed: [],
                    activity_num_pax: "",
                    activity_num_unit: "",
                    activity_agreed_price: "",
                    activity_expected_price: "",
                    activity_selected_providers: "", // ✅ Add this line
                    activity_base_price: "", // ✅ Add this line
                },
            ],
        }));
    };

    const handleRemoveActivityGroup = (index) => {
        const updated = [...groupData.activities];
        updated.splice(index, 1);
        setGroupData({ ...groupData, activities: updated });
    };

    const resolvedActivities = useResolvedActivities(groupData);
    const getActivityDetails = (id) => resolvedActivities.find(act => act.id === id);


    return (
        <Container>
            <Form.Group className="my-3">
                <Form.Label className="fw-bold">Availed Activities</Form.Label>

                {groupData.activities?.map((actGroup, index) => {
                    const selected = actGroup.activities_availed?.[0];
                    return (
                        <div key={index} className="border p-3 mb-4 rounded bg-light">
                            <Form.Label className="fw-semibold">Activity Set {index + 1}</Form.Label>
                            <br></br>

                            <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>
                                Activity Name
                            </Form.Label>

                            <Select
                                className="my-2"
                                options={activityOptions}
                                isSearchable
                                placeholder="Search and select an activity"
                                value={
                                    activityOptions.find(
                                        (opt) =>
                                            actGroup.activities_availed?.[0]?.activity_id === opt.value
                                    ) || null
                                }
                                onChange={(selectedOption) =>
                                    handleActivitySelect(index, selectedOption)
                                }
                            />

                            {/* ✅ Display activity price */}
                            {actGroup.activities_availed?.[0] && (
                                <Form.Label
                                    className="mb-2 text-muted"
                                    style={{ fontSize: "0.7rem" }}
                                >
                                    SRP Php{" "}
                                    {Number(
                                        actGroup.activities_availed[0].activity_price || 0
                                    ).toLocaleString()}{" "}
                                    sold by {actGroup.activities_availed[0].activity_sold_by}, up to{" "}
                                    {actGroup.activities_availed[0].activity_maxpax} pax for{" "}
                                    {actGroup.activities_availed[0].activity_duration || ""}
                                </Form.Label>
                            )}
                            <br></br>

                            <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>
                                Activity Area
                            </Form.Label>
                            <Form.Select
                                className="my-2"
                                value={actGroup.activity_area}
                                onChange={(e) =>
                                    handleActivityGroupChange(index, {
                                        activity_area: e.target.value,
                                    })
                                }
                            >
                                <option value="">Select Activity Area</option>
                                <option value="Mainland Malay">Mainland Malay</option>
                                <option value="Boracay Island">Boracay Island</option>
                            </Form.Select>

                            {/* ✅ Provider Select */}
                            {selected?.providerOptions?.length > 0 && (
                                <>
                                    <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>
                                        Select Provider
                                    </Form.Label>
                                    <Select
                                        options={selected.providerOptions}
                                        isMulti
                                        value={selected.providerOptions.filter((opt) =>
                                            actGroup.activity_selected_providers?.includes(opt.value)
                                        )}
                                        onChange={(selectedOptions) => {
                                            const selectedIds = selectedOptions.map((opt) => opt.value);
                                            handleActivityGroupChange(index, {
                                                activity_selected_providers: selectedIds,
                                            });
                                        }}
                                    />
                                </>
                            )}

                            <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>
                                Activity Start Date & Time
                            </Form.Label>
                            <Form.Control
                                type="datetime-local"
                                className="my-2"
                                value={actGroup.activity_date_time_start || ""}
                                onChange={(e) =>
                                    handleActivityGroupChange(index, {
                                        activity_date_time_start: e.target.value,
                                        activity_date_time_end: "",
                                    })
                                }
                            />

                            <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>
                                Activity End Date & Time
                            </Form.Label>
                            <Form.Control
                                type="datetime-local"
                                className="my-2"
                                value={actGroup.activity_date_time_end || ""}
                                min={actGroup.activity_date_time_start || ""}
                                disabled={!actGroup.activity_date_time_start}
                                onChange={(e) =>
                                    handleActivityGroupChange(index, {
                                        activity_date_time_end: e.target.value,
                                    })
                                }
                            />

                            <br></br>

                            {selected?.activity_sold_by === "unit" ? (
                                <Row className="gap-2">
                                    <Col>
                                        <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>
                                            Number of Units
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            className="my-2"
                                            required
                                            min="0"
                                            placeholder="Number of Units"
                                            value={actGroup.activity_num_unit}
                                            onChange={(e) =>
                                                handleActivityGroupChange(index, {
                                                    activity_num_unit: e.target.value,
                                                })
                                            }
                                        />
                                    </Col>

                                    <Col>
                                        <Form.Control
                                            type="number"
                                            className="my-2"
                                            min="0"
                                            required
                                            placeholder={`Number of Pax (Max ${selected.activity_maxpax *
                                                (parseInt(actGroup.activity_num_unit || "0") || 1)
                                                })`}
                                            value={actGroup.activity_num_pax || ""}
                                            onChange={(e) => {
                                                const input = parseInt(e.target.value || "0", 10);
                                                const baseMax = parseInt(
                                                    selected.activity_maxpax || "0",
                                                    10
                                                );
                                                const unit = parseInt(
                                                    actGroup.activity_num_unit || "0",
                                                    10
                                                );
                                                const dynamicMax = baseMax * (unit || 1);

                                                if (input < 0) {
                                                    alert("Pax cannot be negative.");
                                                    return;
                                                }

                                                if (input <= dynamicMax) {
                                                    handleActivityGroupChange(index, {
                                                        activity_num_pax: isNaN(input) ? "" : input,
                                                    });
                                                } else {
                                                    alert(
                                                        `You cannot exceed the maximum allowed pax of ${dynamicMax}.`
                                                    );
                                                }
                                            }}
                                        />
                                    </Col>
                                </Row>
                            ) : (
                                selected?.activity_sold_by === "pax" && (
                                    <>
                                        <Form.Label
                                            className="mb-0"
                                            style={{ fontSize: "0.7rem" }}
                                        >
                                            Number of Pax
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            className="my-2"
                                            min="0"
                                            required
                                            placeholder={`Number of Pax (Max ${selected.activity_maxpax})`}
                                            value={actGroup.activity_num_pax || ""}
                                            onChange={(e) => {
                                                const input = parseInt(e.target.value || "0");
                                                const max = parseInt(selected.activity_maxpax || "0");

                                                if (input < 0) {
                                                    alert("Pax cannot be negative.");
                                                    return;
                                                }

                                                const totalDeclaredPax = (groupData.address || []).reduce(
                                                    (sum, addr) => {
                                                        const locals = parseInt(addr.locals || "0");
                                                        const foreigns = parseInt(addr.foreigns || "0");
                                                        return sum + locals + foreigns;
                                                    },
                                                    0
                                                );

                                                if (input > totalDeclaredPax) {
                                                    alert(
                                                        `The number of pax (${input}) cannot exceed the total declared pax (${totalDeclaredPax}) from the address/es.`
                                                    );
                                                    return;
                                                }

                                                if (input <= max) {
                                                    handleActivityGroupChange(index, {
                                                        activity_num_pax: input,
                                                    });
                                                } else {
                                                    alert(
                                                        `You cannot exceed the maximum allowed pax of ${max}.`
                                                    );
                                                }
                                            }}
                                        />
                                    </>
                                )
                            )}

                            {/* ✅ PRICING SECTION START */}
                            {!isPackaged ? (
                                <>
                                    <Form.Label
                                        className="mb-0"
                                        style={{ fontSize: "0.7rem" }}
                                    >
                                        Expected Pricing
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="my-2"
                                        placeholder="Expected Pricing"
                                        value={actGroup.activity_expected_price || ""}
                                        readOnly
                                    />

                                    <Form.Label
                                        className="mb-0"
                                        style={{ fontSize: "0.7rem" }}
                                    >
                                        Agreed Price
                                    </Form.Label>

                                    {(() => {
                                        const expected = Number(actGroup.activity_expected_price || 0);
                                        const agreedRaw = actGroup.activity_agreed_price ?? "";
                                        const agreedNum = Number(agreedRaw);
                                        const isBelow =
                                            agreedRaw !== "" && expected > 0 && agreedNum < expected;

                                        return (
                                            <>
                                                <Form.Control
                                                    type="number"
                                                    min="0"
                                                    className="my-2"
                                                    required
                                                    placeholder="Agreed Price"
                                                    value={agreedRaw}
                                                    isInvalid={isBelow}
                                                    onChange={(e) =>
                                                        handleActivityGroupChange(index, {
                                                            activity_agreed_price: e.target.value,
                                                        })
                                                    }
                                                    onBlur={(e) => {
                                                        const num = Number(e.target.value);
                                                        if (
                                                            e.target.value !== "" &&
                                                            expected > 0 &&
                                                            num < expected
                                                        ) {
                                                            handleActivityGroupChange(index, {
                                                                activity_agreed_price: "",
                                                            });
                                                        }
                                                    }}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    Agreed Price cannot be lower than Expected Pricing (
                                                    {expected}).
                                                </Form.Control.Feedback>

                                                <Form.Label
                                                    className="mb-0"
                                                    style={{ fontSize: "0.7rem" }}
                                                >
                                                    {(() => {
                                                        if (!expected || expected === 0) return "";
                                                        if (agreedRaw === "" || Number.isNaN(agreedNum))
                                                            return "";
                                                        const markup =
                                                            ((agreedNum - expected) / expected) * 100;
                                                        return `Additional Markup: ${markup.toFixed(2)}%`;
                                                    })()}
                                                </Form.Label>
                                            </>
                                        );
                                    })()}

                                    {(() => {
                                        const pax = parseInt(actGroup.activity_num_pax || "1");
                                        const agreedPrice = parseFloat(
                                            actGroup.activity_agreed_price || "0"
                                        );
                                        let baseTotal = 0;

                                        actGroup.activities_availed?.forEach((activity) => {
                                            const activityId =
                                                typeof activity === "string"
                                                    ? activity
                                                    : activity.activity_id;
                                            const resolved = resolvedActivities.find(
                                                (act) => act.id === activityId
                                            );
                                            if (!resolved) return;
                                            const basePrice = parseFloat(
                                                resolved.activity_base_price || "0"
                                            );
                                            if (!isNaN(basePrice)) baseTotal += basePrice * pax;
                                        });

                                        const expectedSale = Math.max(agreedPrice - baseTotal, 0);
                                        const markup =
                                            baseTotal > 0 ? (expectedSale / baseTotal) * 100 : 0;
                                        const formattedMarkup = markup.toFixed(1);

                                        if (markup >= 30 && markup <= 50) {
                                            return (
                                                <Form.Label
                                                    className="text-warning mb-0"
                                                    style={{ fontSize: "0.7rem" }}
                                                >
                                                    ⚠️ Additional Markup is {formattedMarkup}%.
                                                    Additional Markup between 30–50% is high for tourism
                                                    services. Ensure value is justified to avoid guest
                                                    dissatisfaction or refund disputes.
                                                </Form.Label>
                                            );
                                        } else if (markup > 50) {
                                            return (
                                                <Form.Label
                                                    className="text-danger mb-0"
                                                    style={{ fontSize: "0.7rem" }}
                                                >
                                                    ⚠️ Additional Markup is {formattedMarkup}%.
                                                    Additional Markup above 50% in tourism services may be
                                                    considered excessive pricing. Ensure transparency to
                                                    avoid complaints under fair trade and tourism
                                                    regulations.
                                                </Form.Label>
                                            );
                                        }

                                        return null;
                                    })()}
                                </>
                            ) : (
                                <>
                                    <p className="text-warning" style={{ fontSize: "0.85rem" }}>
                                        ⚠️ Packaged Tour — SRP and markup validations are disabled.
                                        Please enter the actual amount charged.
                                    </p>

                                    <Form.Label
                                        className="mb-0"
                                        style={{ fontSize: "0.7rem" }}
                                    >
                                        Actual Agreed Price
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        className="my-2"
                                        required
                                        placeholder="Enter Actual Agreed Price"
                                        value={actGroup.activity_agreed_price || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            handleActivityGroupChange(index, {
                                                activity_agreed_price: val,
                                                activity_expected_price: val,
                                            });
                                        }}
                                    />
                                </>
                            )}
                            {/* ✅ PRICING SECTION END */}

                            <div className="d-flex justify-content-between">
                                {groupData.activities.length > 1 && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger mt-2"
                                        onClick={() => handleRemoveActivityGroup(index)}
                                    >
                                        <FontAwesomeIcon icon={faTrash} className="text-danger" />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="btn btn-light border border-secondary text-secondary mt-2 d-flex align-items-center gap-2"
                                    onClick={() => {
                                        const last =
                                            groupData.activities[groupData.activities.length - 1];
                                        if (
                                            !last.activity_agreed_price ||
                                            last.activity_agreed_price === "0"
                                        ) {
                                            alert(
                                                "Please enter the agreed pricing before adding another activity."
                                            );
                                            return;
                                        }
                                        handleAddActivityGroup();
                                    }}
                                >
                                    <FontAwesomeIcon
                                        icon={faCirclePlus}
                                        className="text-secondary"
                                    />
                                    Add Another Activity
                                </button>
                            </div>
                        </div>
                    );
                })}
            </Form.Group>
        </Container>
    );

};

export default TicketActivitiesForm;
