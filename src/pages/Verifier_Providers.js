import React, { useEffect, useState } from "react";
import { Table, Button, Form, Card, Row, Col, InputGroup } from "react-bootstrap";
import Swal from "sweetalert2";
import { db } from "../config/firebase"; // adjust path as needed
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc, setDoc,
    doc,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";

const ProviderAdminPage = () => {
    const [providers, setProviders] = useState([]);
    const [formData, setFormData] = useState({ provider_id: "", provider_name: "" });
    const [isEditing, setIsEditing] = useState(false);
    const [editDocId, setEditDocId] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);


    // Fetch providers
    useEffect(() => {
        const fetchProviders = async () => {
            const snapshot = await getDocs(collection(db, "providers"));
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setProviders(data);
        };
        fetchProviders();
    }, []);

    // Filtered + paginated data
    const filteredProviders = providers.filter(p =>
        p.provider_name.toLowerCase().includes(searchText.toLowerCase())
    );

    const paginatedProviders = filteredProviders.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
        setCurrentPage(1);
    };
    const fetchProviders = async () => {
        const snapshot = await getDocs(collection(db, "providers"));
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setProviders(data);
    };

    useEffect(() => {
        fetchProviders();
    }, []);

    const handleEdit = (provider) => {
        setFormData({
            provider_id: provider.provider_id,
            provider_name: provider.provider_name,
        });
        setIsEditing(true);
        setEditDocId(provider.id);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "This provider will be deleted permanently.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
        });

        if (result.isConfirmed) {
            await deleteDoc(doc(db, "providers", id));
            Swal.fire("Deleted!", "The provider has been deleted.", "success");
            fetchProviders();
        }
    };

const handleSubmit = async (e) => {
  e.preventDefault();
  const result = await Swal.fire({
    title: "Are you sure?",
    text: isEditing ? "Update this provider?" : "Add new provider?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: isEditing ? "Yes, update it!" : "Yes, add it!",
  });

  if (result.isConfirmed) {
    if (isEditing) {
      await updateDoc(doc(db, "providers", editDocId), formData);
      Swal.fire("Updated!", "Provider updated successfully.", "success");
    } else {
      // Create the document first to get its ID
      const docRef = await addDoc(collection(db, "providers"), {});
      const newDocId = docRef.id;

      // Add the document with provider_id
      await setDoc(doc(db, "providers", newDocId), {
        ...formData,
        provider_id: newDocId,
      });

      Swal.fire("Added!", "Provider added successfully.", "success");
    }
    fetchProviders();
    handleClear();
  }
};


    const handleClear = () => {
        setFormData({ provider_id: "", provider_name: "" });
        setIsEditing(false);
        setEditDocId(null);
    };

    return (
        <div className="container py-4">
            <p id="toppage" className="barabara-label text-start">FULL LIST OF TOURISM SERVICE PROVIDERS</p>
            <p className="mt-1 mb-4 text-muted small text-start">
                Full list of seasports and tourism service providers.
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



            {/* Table */}
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Provider Name</th>
                        <th style={{ width: 150 }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedProviders.map((provider) => (
                        <tr key={provider.id}>
                            <td>{provider.provider_name}</td>
                            <td>
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => setFormData(provider)}
                                    title="Edit"
                                >
                                    <FontAwesomeIcon icon={faPen} />
                                </Button>{" "}
                                <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => handleDelete(provider.id)}
                                    title="Delete"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {paginatedProviders.length === 0 && (
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
                        Page {currentPage} of {Math.ceil(filteredProviders.length / rowsPerPage)}
                    </span>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled={currentPage >= Math.ceil(filteredProviders.length / rowsPerPage)}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>




            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row className="mb-3">
                           
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Provider Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.provider_name}
                                        onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="text-end my-3">
                            <Button type="submit" variant="primary">
                                {isEditing ? "Update Provider" : "Add Provider"}
                            </Button>
                        </div>

                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ProviderAdminPage;
