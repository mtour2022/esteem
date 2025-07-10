import React, { useEffect, useRef, useState } from "react";
import { Table, Card, Dropdown } from "react-bootstrap";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from '../auth/authentication';
import Employee from "../classes/employee";
import Swal from "sweetalert2";

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


export default function CompanyEmployeeListPage({ employeeIds = [], companyId = "", companyName = "" }) {
  const [expandedRows, setExpandedRows] = useState([]);
  const now = new Date().toISOString();

  const toggleExpand = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const tableRef = useRef();
  const [employees, setEmployees] = useState([]);
  const { currentUser } = useAuth();
  const scrollRef = useRef();
  useMouseDragScroll(scrollRef);

  const fetchEmployeeDetails = async () => {
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) return;

    try {
      Swal.fire({
        title: "Fetching data...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const employeeDocs = await Promise.all(
        employeeIds.map(async (employeeId) => {
          try {
            const docRef = doc(db, "employee", employeeId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: employeeId, ...docSnap.data() } : null;
          } catch (error) {
            console.error(`Error fetching ${employeeId}:`, error);
            return null;
          }
        })
      );

      setEmployees(employeeDocs.filter(Boolean));
    } catch (err) {
      console.error("Error fetching employees:", err);
      Swal.fire("Error", "Failed to load employee data.", "error");
    } finally {
      Swal.close();
    }
  };

  useEffect(() => {
    fetchEmployeeDetails();
  }, [employeeIds]);

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
        company_status: newStatus,
        date_updated: new Date().toISOString(),
        remarks: formValues.remarks || "",
        userId: currentUser?.email || "system",
      };

      const updates = {
        company_status: newStatus,
        company_status_history: [...(employee.company_status_history || []), historyEntry],
      };

      // ✅ If status is approved, push to work_history
      if (newStatus.toLowerCase() === "approved") {
        const newWork = {
          work_history_id: crypto.randomUUID(),
          date_start: new Date().toISOString(),
          date_end: "",
          company_name: companyName,
          company_id: companyId,
          remarks: formValues.remarks || "",
        };
        updates.work_history = [...(employee.work_history || []), newWork];
      }

      // ✅ If status is resigned, update current work_history entry's date_end
      if (newStatus.toLowerCase() === "resigned" && Array.isArray(employee.work_history)) {
        const updatedWorkHistory = employee.work_history.map(entry => {
          if (entry.company_id === companyId && !entry.date_end) {
            return { ...entry, date_end: new Date().toISOString() };
          }
          return entry;
        });
        updates.work_history = updatedWorkHistory;
      }

      const employeeRef = doc(db, "employee", employee.id);
      await updateDoc(employeeRef, updates);
      await fetchEmployeeDetails();

      Swal.fire("Success", "Company status updated successfully.", "success");
    } catch (err) {
      console.error("Error updating status:", err);
      Swal.fire("Error", "Failed to update status.", "error");
    }
  };



  return (
    <Card.Body className="mt-5">
      <p className="barabara-label text-start mt-5">COMPANY EMPLOYEE LIST</p>
      <p className="m-1 mt-3 text-muted small text-start">
        Full list of current employees and applicants.
      </p>

      <div ref={scrollRef} className="custom-scroll-wrapper table-border">
        <div ref={tableRef} className="mt-2">
          <Table bordered hover style={{ minWidth: "1400px" }}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Actions</th>
                                <th>History</th>
                <th>Application Type (new/renewal)</th>
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
                <th>Notarized COE / Signed Endorsement</th>
                <th>Working Permit</th>
              </tr>
            </thead>
            <tbody>

              {employees.filter(emp => emp.status?.toLowerCase() === "approved").length === 0 ? (
                <tr>
                  <td colSpan={24} className="text-center text-muted">No approved employees found.</td>
                </tr>

              ) : (
                employees
                  .filter(emp => emp.status?.toLowerCase() === "approved")
                  .map((empData) => {

                    const emp = new Employee({ id: empData.id, ...empData });
                    const openInNewTab = (url) => {
                      if (url) window.open(url, "_blank");
                    };

                    const viewDocLink = (url) =>
                      url ? (
                        <a href="#" onClick={(e) => { e.preventDefault(); openInNewTab(url); }}>
                          View Doc
                        </a>
                      ) : (
                        <span className="text-muted">N/A</span>
                      );

                    return (
                      <React.Fragment key={emp.id}>
                        <tr>
                          <td>
                            <span className={`badge bg-${getStatusBadgeVariant(emp.company_status)}`}>
                              {emp.company_status}
                            </span>
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
                          <tr>
                            <td colSpan={24}>
                              <Card className="bg-light border mb-3">
                                <Card.Body>
                                  <p className="fw-bold mb-2">Status History:</p>
                                  {empData.company_status_history?.length > 0 ? (
                                    <Table size="sm" bordered className="mb-0">
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
                                    <p className="text-muted">No history available.</p>
                                  )}

                                  {/* Work History */}
                                  <p className="fw-bold mb-2 mt-4">Work History:</p>
                                  {empData.work_history?.length > 0 ? (
                                    <Table size="sm" bordered>
                                      <thead>
                                        <tr>
                                          <th>Company</th>
                                          <th>Remarks</th>
                                          <th>Date Start</th>
                                          <th>Date End</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {empData.work_history.map((work, index) => (
                                          <tr key={index}>
                                            <td>{work.company_name}</td>
                                            <td>{work.remarks || "—"}</td>
                                            <td>{new Date(work.date_start).toLocaleString()}</td>
                                            <td>{work.date_end ? new Date(work.date_end).toLocaleString() : "Present"}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  ) : (
                                    <p className="text-muted">No work history available.</p>
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
    </Card.Body>
  );
}