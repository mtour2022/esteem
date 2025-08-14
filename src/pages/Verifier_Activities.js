import React, { useEffect, useState } from "react";
import {
    Table,
    Button,
    Form,
    Card,
    Row,
    Col,
    InputGroup
} from "react-bootstrap";
import Swal from "sweetalert2";
import { db } from "../config/firebase";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";

const ActivityAdminPage = () => {
    const [activities, setActivities] = useState([]);
    const [providers, setProviders] = useState([]);
    const [formData, setFormData] = useState({
        activity_id: "",
        activity_image: "",
        activity_name: "",
        activity_description: "",
        activity_maxpax: "",
        activity_price: "",
        activity_sold_by: "",
        activity_duration: "",
        activity_base_price: "",
        activity_providers: []
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editDocId, setEditDocId] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchActivities();
        fetchProviders();
    }, []);

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
        setCurrentPage(1);
    };

    const fetchActivities = async () => {
        const snapshot = await getDocs(collection(db, "activities"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setActivities(data);
    };

    const fetchProviders = async () => {
        const snapshot = await getDocs(collection(db, "providers"));
        const data = snapshot.docs.map((doc) => ({ label: doc.data().provider_name, value: doc.data().provider_id }));
        setProviders(data);
    };

    const handleEdit = (activity) => {
        setFormData({
            ...activity,
            activity_providers: activity.activity_providers.map(pid => {
                const match = providers.find(p => p.value === pid);
                return match || { label: pid, value: pid };
            })
        });
        setIsEditing(true);
        setEditDocId(activity.id);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "This activity will be deleted permanently.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!"
        });
        if (result.isConfirmed) {
            await deleteDoc(doc(db, "activities", id));
            Swal.fire("Deleted!", "The activity has been deleted.", "success");
            fetchActivities();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await Swal.fire({
            title: "Are you sure?",
            text: isEditing ? "Update this activity?" : "Add new activity?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: isEditing ? "Yes, update it!" : "Yes, add it!"
        });

        if (!result.isConfirmed) return;

        if (isEditing) {
            const payload = {
                ...formData,
                activity_id: editDocId, // ensure id is saved in model
                activity_providers: formData.activity_providers.map(p => p.value)
            };
            await updateDoc(doc(db, "activities", editDocId), payload);
            Swal.fire("Updated!", "Activity updated successfully.", "success");
        } else {
            // First add the document without activity_id
            const docRef = await addDoc(collection(db, "activities"), {
                ...formData,
                activity_providers: formData.activity_providers.map(p => p.value)
            });

            // Then update it with the generated doc ID
            await updateDoc(doc(db, "activities", docRef.id), {
                activity_id: docRef.id
            });

            Swal.fire("Added!", "Activity added successfully.", "success");
        }

        fetchActivities();
        handleClear();
    };


    // Filtered + paginated data
    const filteredActivities = activities.filter(p =>
        p.activity_name.toLowerCase().includes(searchText.toLowerCase())
    );

    const paginatedActivities = filteredActivities.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );


    const handleClear = () => {
        setFormData({
            activity_id: "",
            activity_image: "",
            activity_name: "",
            activity_description: "",
            activity_maxpax: "",
            activity_price: "",
            activity_sold_by: "",
            activity_duration: "",
            activity_base_price: "",
            activity_providers: []
        });
        setIsEditing(false);
        setEditDocId(null);
    };



    return (
        <div className="container py-4">
            <p id="toppage" className="barabara-label text-start">FULL LIST OF TOURISM ACTIVITIES</p>
            <p className="mt-1 mb-4 text-muted small text-start">
                Full list of watersports, sea sports, tours, tourism services, and packages.
            </p>
            {/* Search */}
            <div className="mb-3 d-flex justify-content-between align-items-center" style={{ maxWidth: '100%' }}>
                <InputGroup style={{ maxWidth: 300 }}>
                    <Form.Control
                        size="sm"
                        placeholder="Search by provider name"
                        value={searchText}
                        onChange={handleSearchChange}
                    />
                </InputGroup>

                <Button variant="outline-success" size="sm" onClick={handleClear}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Add New
                </Button>
            </div>

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>NET/Base/Cost Price</th>
                        <th>Published Rate (SRP)</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedActivities.map((act) => (
                        <tr key={act.id}>
                            <td>{act.activity_name}</td>
                            <td>{act.activity_description}</td>
                            <td>{act.activity_base_price}</td>
                            <td>{act.activity_price}</td>
                            <td>
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => handleEdit(act)}
                                >
                                    <FontAwesomeIcon icon={faPen} />
                                </Button>{" "}
                                <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => handleDelete(act.id)}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {paginatedActivities.length === 0 && (
                        <tr>
                            <td colSpan="2" className="text-center text-muted">
                                No data found
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>

            {/* Pagination controls */}
            <div className="d-flex justify-content-between align-items-center mt-2 mb-5 flex-wrap">
                {/* Left: Rows per page */}
                <Form.Group className="d-flex align-items-center gap-2 mb-2 mb-md-0">
                    <Form.Label className="mb-0 small">Rows per page</Form.Label>
                    <Form.Select
                        size="sm"
                        style={{ width: "auto" }}
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        {[5, 10, 50, 100].map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </Form.Select>
                </Form.Group>

                {/* Right: Pagination buttons */}
                <div className="d-flex align-items-center gap-2">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                    >
                        Prev
                    </Button>
                    <span className="small">
                        Page {currentPage} of {Math.ceil(filteredActivities.length / rowsPerPage)}
                    </span>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled={currentPage >= Math.ceil(filteredActivities.length / rowsPerPage)}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>


            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={12}><Form.Group className="mb-3">
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    value={formData.activity_name}
                                    onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
                                    required
                                />
                            </Form.Group></Col>

                        </Row>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        value={formData.activity_description}
                                        onChange={(e) => setFormData({ ...formData, activity_description: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>


                        <Row>
                            <Col md={4}><Form.Group className="mb-3">
                                <Form.Label>Max Pax</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.activity_maxpax}
                                    onChange={(e) => setFormData({ ...formData, activity_maxpax: e.target.value })}
                                />
                            </Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3">
                                <Form.Label>Price (SRP)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.activity_price}
                                    onChange={(e) => setFormData({ ...formData, activity_price: e.target.value })}
                                />
                            </Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3">
                                <Form.Label>Base/Cost Price</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.activity_base_price}
                                    onChange={(e) => setFormData({ ...formData, activity_base_price: e.target.value })}
                                />
                            </Form.Group></Col>
                        </Row>

                        <Row>
                            <Col md={6}><Form.Group className="mb-3">
                                <Form.Label>Sold By</Form.Label>
                                <Form.Select
                                    value={formData.activity_sold_by}
                                    onChange={(e) => setFormData({ ...formData, activity_sold_by: e.target.value })}
                                >
                                    <option value="">Select option</option>
                                    <option value="pax">pax</option>
                                    <option value="unit">unit</option>
                                    <option value="packaged">packaged</option>
                                </Form.Select>
                            </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Duration</Form.Label>
                                    <Form.Select
                                        value={formData.activity_duration}
                                        onChange={(e) => setFormData({ ...formData, activity_duration: e.target.value })}
                                    >
                                        <option value="">Select duration</option>
                                        <option>10 minutes</option>
                                        <option>15 minutes</option>
                                        <option>20 minutes</option>
                                        <option>30 minutes</option>
                                        <option>45 minutes</option>
                                        <option>1 hour</option>
                                        <option>1 hour and a half</option>
                                        <option>2 hours and a half</option>
                                        <option>3 hours</option>
                                        <option>4 hours</option>
                                        <option>6 hours</option>
                                        <option>N/A</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>


                        </Row>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Providers</Form.Label>
                                    <Select
                                        isMulti
                                        value={formData.activity_providers}
                                        onChange={(selected) => setFormData({ ...formData, activity_providers: selected })}
                                        options={providers}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>


                        <div className="text-end my-3">
                            <Button type="submit" variant="primary" className="mt-5">
                                {isEditing ? "Update Activity" : "Add Activity"}
                            </Button>
                        </div>


                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ActivityAdminPage;
