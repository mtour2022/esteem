import React, { useEffect, useState } from "react";
import { Form, Container, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase"; // adjust as needed
import { ActivityModel } from "../classes/activities";

const TicketActivitiesForm = ({ groupData, setGroupData }) => {
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

    const handleActivityGroupChange = (index, updates) => {
        const updated = [...groupData.activities];
        updated[index] = { ...updated[index], ...updates };

        const selected = updated[index].activities_availed?.[0];
        if (selected) {
            const price = parseFloat(selected.activity_price || 0);
            const pax = parseInt(updated[index].activity_num_pax || 0);
            const unit = parseInt(updated[index].activity_num_unit || 0);

            if (selected.activity_sold_by === "pax") {
                updated[index].expected_payment = price * pax || "";
            } else if (selected.activity_sold_by === "unit") {
                updated[index].expected_payment = price * unit || "";
            }
        }

        setGroupData({ ...groupData, activities: updated });
    };

    const handleActivitySelect = (index, selectedOption) => {
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


        const updated = [...groupData.activities];
        updated[index].activities_availed = [newActivity];

        // ✅ Reset pax and unit when new activity is selected
        updated[index].activity_num_pax = "";
        updated[index].activity_num_unit = "";
        updated[index].activity_subtotal = "";
        updated[index].activity_date_time_start = "";
        updated[index].activity_date_time_end = "";
         


        // Recalculate expected_payment based on reset values
        updated[index].expected_payment = "";

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
                    activity_subtotal: "",
                    expected_payment: "",
                },
            ],
        }));
    };

    const handleRemoveActivityGroup = (index) => {
        const updated = [...groupData.activities];
        updated.splice(index, 1);
        setGroupData({ ...groupData, activities: updated });
    };

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
                            <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>Activity Area</Form.Label>
                            <Form.Select
                                className="my-2"
                                value={actGroup.activity_area}
                                onChange={(e) =>
                                    handleActivityGroupChange(index, { activity_area: e.target.value })
                                }
                            >
                                <option value="">Select Activity Area</option>
                                <option value="Mainland Malay">Mainland Malay</option>
                                <option value="Boracay Island">Boracay Island</option>
                                <option value="Nearby Malay">Nearby Malay</option>
                            </Form.Select>
                            <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>Activity Name</Form.Label>

                            <Select
                                className="my-2"
                                options={activityOptions}
                                isSearchable
                                placeholder="Search and select an activity"
                                value={activityOptions.find(
                                    (opt) => actGroup.activities_availed?.[0]?.activity_id === opt.value
                                ) || null}
                                onChange={(selectedOption) => handleActivitySelect(index, selectedOption)}
                            />
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
      activity_date_time_end: "", // Reset end time when start time changes
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



                            {/* ✅ Display activity price (and more if needed) */}
                            {actGroup.activities_availed?.[0] && (
                                <Form.Label className="mb-2 text-muted" style={{ fontSize: "0.7rem" }}>
                                    SRP Php {Number(actGroup.activities_availed[0].activity_price || 0).toLocaleString()} sold by {actGroup.activities_availed[0].activity_sold_by}, up to {actGroup.activities_availed[0].activity_maxpax} pax
                                    for {actGroup.activities_availed[0].activity_duration || ""}
                                </Form.Label>
                            )}

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
                                        <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>
                                            Number of Pax
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            className="my-2"
                                            min="0"
                                            required
                                            placeholder={`Number of Pax (Max ${selected.activity_maxpax * (parseInt(actGroup.activity_num_unit || "0") || 1)})`}
                                            value={actGroup.activity_num_pax}
                                            onChange={(e) => {
                                                const input = parseInt(e.target.value || "0");
                                                const baseMax = parseInt(selected.activity_maxpax || "0");
                                                const unit = parseInt(actGroup.activity_num_unit || "0");
                                                const dynamicMax = baseMax * (unit || 1);

                                                if (input < 0) {
                                                    alert("Pax cannot be negative.");
                                                    return;
                                                }

                                                if (input <= dynamicMax) {
                                                    handleActivityGroupChange(index, {
                                                        activity_num_pax: input,
                                                    });
                                                } else {
                                                    alert(`You cannot exceed the maximum allowed pax of ${dynamicMax}.`);
                                                }
                                            }}
                                        />
                                    </Col>
                                </Row>
                            ) : (
                                selected?.activity_sold_by === "pax" && (
                                    <>
                                        <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>
                                            Number of Pax
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            className="my-2"
                                            min="0"
                                            required
                                            placeholder={`Number of Pax (Max ${selected.activity_maxpax})`}
                                            value={actGroup.activity_num_pax}
                                            onChange={(e) => {
                                                const input = parseInt(e.target.value || "0");
                                                const max = parseInt(selected.activity_maxpax || "0");

                                                if (input < 0) {
                                                    alert("Pax cannot be negative.");
                                                    return;
                                                }

                                                if (input <= max) {
                                                    handleActivityGroupChange(index, {
                                                        activity_num_pax: input,
                                                    });
                                                } else {
                                                    alert(`You cannot exceed the maximum allowed pax of ${max}.`);
                                                }
                                            }}
                                        />
                                    </>
                                )
                            )}





                            <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>Expected Pricing</Form.Label>
                            <Form.Control
                                type="text"
                                className="my-2"
                                placeholder="Expected Pricing"
                                value={actGroup.expected_payment || ""}
                                readOnly
                            />

                            <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>Agreed Price</Form.Label>
                            {/* ✅ Input Field */}
                            <Form.Control
                                min="0"
                                type="number"
                                className="my-2"
                                required
                                placeholder="Agreed Price"
                                value={actGroup.activity_subtotal}
                                onChange={(e) =>
                                    handleActivityGroupChange(index, {
                                        activity_subtotal: e.target.value,
                                    })
                                }
                            />

                            {/* ✅ Markup Percentage */}
                            <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>
                                {(() => {
                                    const agreed = Number(actGroup.activity_subtotal || 0);
                                    const expected = Number(actGroup.expected_payment || 0);

                                    if (!expected || expected === 0) return "";

                                    const markup = ((agreed - expected) / expected) * 100;
                                    return `Markup: ${markup.toFixed(2)}%`;
                                })()}
                            </Form.Label>

                            {/* ✅ Markup Warning (30–50% and >50%) */}
                            {(() => {
                                const agreed = Number(actGroup.activity_subtotal || 0);
                                const expected = Number(actGroup.expected_payment || 0);
                                const markup = expected > 0 ? ((agreed - expected) / expected) * 100 : 0;

                                if (markup >= 30 && markup <= 50) {
                                    return (
                                        <Form.Label className="text-warning mb-0" style={{ fontSize: "0.7rem" }}>
                                            ⚠️ Markup beyond 30–50% may attract scrutiny or complaints, especially if there's public necessity or price manipulation.
                                        </Form.Label>
                                    );
                                } else if (markup > 50) {
                                    return (
                                        <Form.Label className="text-danger mb-0" style={{ fontSize: "0.7rem" }}>
                                            ⚠️ Markup above 50% may be subject to penalties under the <strong>Price Act (RA No. 7581)</strong> and other consumer protection laws in the Philippines.
                                        </Form.Label>
                                    );
                                }

                                return null;
                            })()}


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
                                        const last = groupData.activities[groupData.activities.length - 1];
                                        if (!last.activity_subtotal || last.activity_subtotal === "0") {
                                            alert("Please enter the agreed pricing before adding another activity.");
                                            return;
                                        }
                                        handleAddActivityGroup();
                                    }}
                                >
                                    <FontAwesomeIcon icon={faCirclePlus} className="text-secondary" />
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
