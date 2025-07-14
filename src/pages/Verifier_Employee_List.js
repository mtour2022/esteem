import React, { useEffect, useRef, useState } from "react";
import { Table, Card, Dropdown, Button } from "react-bootstrap";
import { doc, getDoc, addDoc, updateDoc, getDocs, collection, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../config/firebase";
import { useAuth } from '../auth/authentication';
import Employee from "../classes/employee";
import Swal from "sweetalert2";

import { storage } from "../config/firebase";

import TourismCert from "../components/TourismCert";
import FooterCustomized from "../components/Footer";
import { faEye, faEyeSlash, faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const STATUSES = ["under review", "approved", "incomplete", "resigned", "change company", "invalid"];

const useMouseDragScroll = (ref) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    const mouseDown = (e) => {
      isDown = true;
      el.classList.add("active");
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const mouseLeave = () => {
      isDown = false;
      el.classList.remove("active");
    };
    const mouseUp = () => {
      isDown = false;
      el.classList.remove("active");
    };
    const mouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 2;
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener("mousedown", mouseDown);
    el.addEventListener("mouseleave", mouseLeave);
    el.addEventListener("mouseup", mouseUp);
    el.addEventListener("mousemove", mouseMove);

    return () => {
      el.removeEventListener("mousedown", mouseDown);
      el.removeEventListener("mouseleave", mouseLeave);
      el.removeEventListener("mouseup", mouseUp);
      el.removeEventListener("mousemove", mouseMove);
    };
  }, [ref]);
};

const getStatusBadgeVariant = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "success";
    case "under review":
      return "warning";
    case "incomplete":
      return "secondary";
    case "resigned":
      return "dark";
    case "change company":
      return "info";
    case "invalid":
      return "danger";
    default:
      return "light";
  }
};

export default function VerifierEmployeeListPage() {
  const [expandedRows, setExpandedRows] = useState([]);
  const [showCertificateFor, setShowCertificateFor] = useState(null);
  const tableRef = useRef();
  const scrollRef = useRef();
  const [employees, setEmployees] = useState([]);
  const { currentUser } = useAuth();
  const [companyDataMap, setCompanyDataMap] = useState({});

  useMouseDragScroll(scrollRef);

  const toggleExpand = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const fetchEmployeeDetails = async () => {
    try {
      Swal.fire({
        title: "Fetching data...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const snapshot = await getDocs(collection(db, "employee"));
      const employeeDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setEmployees(employeeDocs);
    } catch (err) {
      console.error("Error fetching employees:", err);
      Swal.fire("Error", "Failed to load employee data.", "error");
    } finally {
      Swal.close();
    }
  };

  useEffect(() => {
    fetchEmployeeDetails();
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      const newMap = {};
      for (const emp of employees) {
        if (emp.companyId && !newMap[emp.companyId]) {
          const docSnap = await getDoc(doc(db, "company", emp.companyId));
          if (docSnap.exists()) newMap[emp.companyId] = docSnap.data();
        }
      }
      setCompanyDataMap(newMap);
    };

    if (employees.length) fetchCompanies();
  }, [employees]);

  const handleChangeStatus = async (employee, newStatus) => {
    const { value: formValues, isConfirmed } = await Swal.fire({
      title: `Change status to "${newStatus}"?`,
      html: `
      <p class="text-start">You may add remarks about this status change.</p>
      <input id="remarks" class="swal2-input" placeholder="Remarks (optional)">
    `,
      showCancelButton: true,
      confirmButtonText: "Confirm",
      preConfirm: () => {
        const remarks = document.getElementById("remarks").value.trim();
        return { remarks };
      },
    });

    if (!isConfirmed) return;

    try {
      const historyEntry = {
        status: newStatus,
        date_updated: new Date().toISOString(),
        remarks: formValues.remarks || "",
        userId: currentUser?.email || "system",
      };

      const updates = {
        status: newStatus,
        status_history: [...(employee.status_history || []), historyEntry],
      };

      const employeeRef = doc(db, "employee", employee.employeeId);

      if (newStatus.toLowerCase() === "approved") {
        const dateNow = new Date();
        const oneYearLater = new Date(dateNow.getFullYear(), 11, 31);
        const certRef = doc(collection(db, "tourism_cert"));
        const certId = certRef.id;


        setShowCertificateFor(employee.employeeId);

        await new Promise(resolve => setTimeout(resolve, 500));

        const imageBlob = await generateCertificateImageBlob(employee);
        const pdfBlob = await generateCertificatePdfBlob(employee);

        const imageRef = ref(storage, `certificates/${certId}.png`);
        const pdfRef = ref(storage, `certificates/${certId}.pdf`);

        await uploadBytes(imageRef, imageBlob);
        await uploadBytes(pdfRef, pdfBlob);

        // const imageUrl = await getDownloadURL(imageRef);
        // const pdfUrl = await getDownloadURL(pdfRef);

        const cert = {
          tourism_cert_id: certId,
          type: employee.trainingCert ? "Endorsement" : "Recommendation",
          date_Issued: dateNow.toISOString(),
          date_Expired: oneYearLater.toISOString(),
          // image_link: imageUrl,
          // pdf_link: pdfUrl,
          employee_id: employee.employeeId,
          verifier_id: currentUser?.uid || "system",
          tourism_cert_history: "",
        };

        await setDoc(certRef, cert);

        updates.tourism_certificate = [...(employee.tourism_certificate || []), cert];
        updates.tourism_certificate_history = [...(employee.tourism_certificate_history || []), cert];
      }

      await updateDoc(employeeRef, updates);
      await fetchEmployeeDetails();
      await new Promise(res => setTimeout(res, 500));

      if (newStatus.toLowerCase() === "approved") {
        setShowCertificateFor(employee.employeeId);
      }


      Swal.fire("Success", "Status updated successfully.", "success");
    } catch (err) {
      console.error("Error updating status:", err);
      Swal.fire("Error", "Failed to update status.", "error");
    }
  };

  const getStatusBadgeVariant = (status) => {
    if (!status) return "secondary";
    switch (status.toLowerCase()) {
      case "approved": return "success";
      case "under review": return "warning";
      case "incomplete": return "danger";
      case "resigned": return "dark";
      default: return "secondary";
    }
  };

  async function generateCertificateImageBlob(employee) { }
  async function generateCertificatePdfBlob(employee) { }

  const viewDocLink = (url) =>
    url ? (
      <a href="#" onClick={(e) => { e.preventDefault(); window.open(url, "_blank"); }}>
        View Doc
      </a>
    ) : (
      <span className="text-muted">N/A</span>
    );

  return (
    <>
      <Card.Body className="mt-5">
        <p className="barabara-label text-start mt-5">EMPLOYEE LIST</p>
        <p className="m-1 mt-3 text-muted small text-start">
          Full list of current employees and applicants.
        </p>

        <div ref={scrollRef} className="custom-scroll-wrapper table-border">
          <div ref={tableRef} className="mt-2">
            <Table bordered hover style={{ minWidth: "1400px" }}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Company Status</th>
                  <th>Tourism Certificate</th>
                  <th>Actions</th>
                  <th>History</th>
                  <th>Application Type</th>
                  <th>Full Name</th>
                  <th>Sex</th>
                  <th>Birthday</th>
                  <th>Age</th>
                  <th>Marital Status</th>
                  <th>Type of Residency</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Designation</th>
                  <th>Education</th>
                  <th>Emergency Contact</th>
                  <th>Present Address</th>
                  <th>Birth Place</th>
                  <th>Height (ft)</th>
                  <th>Weight (kg)</th>
                  <th>Profile Photo</th>
                  <th>Training Cert</th>
                  <th>Diploma</th>
                  <th>Notarized COE / Endorsement</th>
                  <th>Working Permit</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={26} className="text-center text-muted">No employees found.</td>
                  </tr>
                ) : (
                  employees.map((empData) => {
                    const emp = new Employee({ id: empData.id, ...empData });
                    const company = companyDataMap[emp.companyId];

                    return (
                      <React.Fragment key={emp.id}>
                        <tr>
                          <td>
                            <span className={`badge bg-${getStatusBadgeVariant(emp.status)}`}>{emp.status}</span>
                          </td>
                          <td>
                            <span className={`badge bg-${getStatusBadgeVariant(emp.company_status)}`}>{emp.company_status || "N/A"}</span>
                          </td>
                          <td>
                            {emp.tourism_certificate?.length > 0 ? (() => {
                              const latestCert = emp.tourism_certificate[emp.tourism_certificate.length - 1];
                              return (
                                <div className="d-flex flex-column gap-1">


                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    disabled={!emp.tourism_certificate || emp.tourism_certificate.length === 0}
                                    onClick={() => setShowCertificateFor(emp.employeeId)}
                                  >
                                    <FontAwesomeIcon icon={faEye} className="me-2" />
                                    View
                                  </Button>


                                </div>
                              );
                            })() : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>


                          <td>
                            <Dropdown>
                              <Dropdown.Toggle size="sm" variant="outline-secondary">
                                Change Status
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                {STATUSES.map((status) => (
                                  <Dropdown.Item
                                    key={status}
                                    onClick={() => handleChangeStatus(empData, status)}
                                  >
                                    {status}
                                  </Dropdown.Item>
                                ))}
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => toggleExpand(emp.id)}
                            >
                              {expandedRows.includes(emp.id) ? "Hide History" : "View History"}
                            </button>
                          </td>
                          <td>{emp.application_type}</td>
                          <td>{emp.getFullName()}</td>
                          <td>{emp.sex}</td>
                          <td>{emp.birthday}</td>
                          <td>{emp.age}</td>
                          <td>{emp.maritalStatus}</td>
                          <td>{emp.nationality}</td>
                          <td>{emp.contact}</td>
                          <td>{emp.email}</td>
                          <td>{emp.designation}</td>
                          <td>{emp.education}</td>
                          <td>{emp.emergencyContactName} / {emp.emergencyContactNumber}</td>
                          <td>{`${emp.presentAddress.street}, ${emp.presentAddress.barangay}, ${emp.presentAddress.town}, ${emp.presentAddress.province}, ${emp.presentAddress.region}, ${emp.presentAddress.country}`}</td>
                          <td>{`${emp.birthPlace.town}, ${emp.birthPlace.province}, ${emp.birthPlace.country}`}</td>
                          <td>{emp.height}</td>
                          <td>{emp.weight}</td>
                          <td>{viewDocLink(emp.profilePhoto)}</td>
                          <td>{viewDocLink(emp.trainingCert)}</td>
                          <td>{viewDocLink(emp.diploma)}</td>
                          <td>{viewDocLink(emp.additionalRequirement)}</td>
                          <td>{viewDocLink(emp.workingPermit)}</td>
                        </tr>
                        {expandedRows.includes(emp.id) && (
                          <tr key={`${emp.id}-expanded`}>

                            <td colSpan={26}>
                              <Card className="bg-light border mb-3">
                                <Card.Body>
                                  <p className="fw-bold mb-2">Status History:</p>
                                  {empData.status_history?.length > 0 ? (
                                    <Table size="sm" bordered className="mb-3">
                                      <thead>
                                        <tr>
                                          <th>Status</th>
                                          <th>Remarks</th>
                                          <th>User</th>
                                          <th>Date Updated</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {empData.status_history.map((entry, index) => (
                                          <tr key={index}>
                                            <td>{entry.status}</td>
                                            <td>{entry.remarks || "—"}</td>
                                            <td>{entry.userId}</td>
                                            <td>{new Date(entry.date_updated).toLocaleString()}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  ) : (
                                    <p className="text-muted">No status history available.</p>
                                  )}

                                  <p className="fw-bold mb-2">Company Status History:</p>
                                  {empData.company_status_history?.length > 0 ? (
                                    <Table size="sm" bordered>
                                      <thead>
                                        <tr>
                                          <th>Status</th>
                                          <th>Remarks</th>
                                          <th>User</th>
                                          <th>Date Updated</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {empData.company_status_history.map((entry, index) => (
                                          <tr key={index}>
                                            <td>{entry.company_status}</td>
                                            <td>{entry.remarks || "—"}</td>
                                            <td>{entry.userId}</td>
                                            <td>{new Date(entry.date_updated).toLocaleString()}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  ) : (
                                    <p className="text-muted">No company status history available.</p>
                                  )}

                                  <p className="fw-bold mb-2">Tourism Certificate History:</p>
                                  {empData.tourism_certificate_history?.length > 0 ? (
                                    <Table size="sm" bordered>
                                      <thead>
                                        <tr>
                                          <th>Tourism ID</th>
                                          <th>Type</th>
                                          <th>Date Issued</th>
                                          <th>Date Expired</th>
                                          <th>Verifier</th>
                                          <th>Link</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {empData.tourism_certificate_history.map((cert, idx) => (
                                          <tr key={idx}>
                                            <td>{cert.tourism_cert_id}</td>
                                            <td>{cert.type}</td>
                                            <td>{cert.date_Issued}</td>
                                            <td>{cert.date_Expired}</td>
                                            <td>{cert.verifier_id}</td>
                                            <td>{viewDocLink(cert.image_link)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  ) : (
                                    <p className="text-muted">No tourism certificate history available.</p>
                                  )}
                                </Card.Body>
                              </Card>
                            </td>
                          </tr>
                        )}


                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>

        </div>
        {/* OUTSIDE of map, and below the table */}
        {showCertificateFor && (() => {
          const selectedEmp = employees.find(e => e.id === showCertificateFor);
          const company = companyDataMap[selectedEmp?.companyId];

          if (!selectedEmp) return null;

          return (
            <React.Fragment key={selectedEmp.id}>
              <TourismCert
                emp={new Employee(selectedEmp)}
                company={company}
                currentUser={currentUser}
              />
              <div className="text-center mt-3 mb-5">
                <Button
                  variant="outline-danger"
                  size="md"
                  onClick={() => setShowCertificateFor(null)}
                >
                  <FontAwesomeIcon icon={faEyeSlash} className="me-2" />
                  Hide
                </Button>
              </div>

            </React.Fragment>

          );
        })()}


      </Card.Body>
      <FooterCustomized scrollToId="toppage" />

    </>
  );
}
