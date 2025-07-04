import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import { Card, Table, Badge, Row, Col, Form } from "react-bootstrap";
import { db } from "../config/firebase"; // adjust path as needed
import { InputGroup, FormControl, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useMemo } from 'react';
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import useResolvedActivities from "../services/GetActivitiesDetails";
import useResolvedProviders from "../services/GetProvidersDetails"


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
      const walk = (x - startX) * 2; // scroll speed
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
// Helper: Compute ticket status
const computeStatus = (ticket) => {
  const now = new Date();
  const start = new Date(ticket.start_date_time);
  const end = new Date(ticket.end_date_time);

  if (ticket.status === "created") {
    if (now < start) return "Queued";
    const oneMonthAfterEnd = new Date(end);
    oneMonthAfterEnd.setMonth(end.getMonth() + 1);
    if (now > oneMonthAfterEnd) return "Invalid";
    return "Queued";
  }

  if (ticket.status === "scanned") {
    const scannedLog = Array.isArray(ticket.scan_logs)
      ? ticket.scan_logs.find((log) => log.status === "scanned")
      : null;

    if (scannedLog?.date_updated) {
      const scannedTime = new Date(scannedLog.date_updated);
      const diffMinutes = (scannedTime - start) / 60000;
      const afterEnd = scannedTime > end;

      // ✅ Fix: Check if activity already ended
      if (now > end) {
        return "Done";
      }

      if (afterEnd) return "Done";
      if (diffMinutes >= 15 && diffMinutes <= 30) return "Ongoing";
      if (diffMinutes > 30) return "Delayed";
      if (diffMinutes >= -5 && diffMinutes < 15) return "On Time";
      if (diffMinutes >= -30 && diffMinutes < -15) return "Early";
    }

    return "scanned";
  }


  const statusMap = {
    canceled: "Canceled",
    reschedule: "Schedule Change",
    reassigned: "Reassigned",
    relocate: "Relocate",
    emergency: "On Emergency",
  };

  if (statusMap[ticket.status]) return statusMap[ticket.status];

  const hasScanned =
    Array.isArray(ticket.scan_logs) &&
    ticket.scan_logs.some((log) => log.status === "scanned");

  if (!hasScanned) return "Queued";

  if (now < start) {
    const diff = start - now;
    return diff > 15 * 60000 ? "Queued" : "On Time";
  } else if (now >= start && now <= end) {
    return "Ongoing";
  } else if (now > end) {
    return now < end.getTime() + 15 * 60000 ? "Done" : "Delayed";
  }

  return "Unknown";
};

// Helper: Badge variant
const getStatusBadgeVariant = (status) => {
  return {
    Queued: "secondary",
    "On Time": "primary",
    Early: "info",
    Ongoing: "success",
    Done: "dark",
    Delayed: "danger",
    Scanned: "warning",
    created: "secondary",
    Invalid: "danger",
    Canceled: "dark",
    "Schedule Change": "info",
    Reassigned: "warning",
    Relocate: "warning",
    "On Emergency": "danger",
  }[status] || "secondary";
};



const TouristActivityStatusBoard = ({ ticket_ids = [] }) => {
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc"); // or 'desc'
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const getToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const [searchTextInput, setSearchTextInput] = useState("");
  const [startDateInput, setStartDateInput] = useState(getToday());
  const [endDateInput, setEndDateInput] = useState(getToday());
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef();
  useMouseDragScroll(scrollRef);

  const rowsPerPage = 10;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);

  // Fetch tickets from Firestore using ticket_ids
  useEffect(() => {
    const fetchTickets = async () => {
      if (!ticket_ids || ticket_ids.length === 0) {
        setTickets([]);
        return;
      }

      const chunks = [];
      for (let i = 0; i < ticket_ids.length; i += 10) {
        chunks.push(ticket_ids.slice(i, i + 10));
      }

      const allTickets = [];
      for (const chunk of chunks) {
        const q = query(collection(db, "tickets"), where("__name__", "in", chunk));
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          allTickets.push({ id: doc.id, ...doc.data() });
        });
      }

      setTickets(allTickets);
    };

    fetchTickets();
  }, [ticket_ids]);


  useEffect(() => {
    handleSearch(); // ensure sorting applies after initial fetch
  }, [tickets]);

  const handleSearch = () => {
    setIsLoading(true);

    setTimeout(() => {
      let result = [...tickets];

      if (searchTextInput.trim()) {
        const lower = searchTextInput.toLowerCase();
        result = result.filter((t) =>
          t.name?.toLowerCase().includes(lower) || t.contact?.toLowerCase().includes(lower)
        );
      }

      if (startDateInput && endDateInput) {
        const start = new Date(startDateInput);
        const end = new Date(endDateInput);
        end.setHours(23, 59, 59, 999);
        result = result.filter((t) => {
          const tDate = new Date(t.start_date_time);
          return tDate >= start && tDate <= end;
        });
      }

      if (sortField) {
        result.sort((a, b) => {
          const getVal = (obj, key) => {
            switch (key) {
              case "start_date_time":
              case "end_date_time":
                return new Date(obj[key]);
              case "total_duration":
              case "total_pax":
              case "total_expected_payment":
              case "total_expected_sale":
              case "total_markup":
              case "total_payment":
                return Number(obj[key]) || 0;
              case "name":
              case "scanned_by":
                return (obj[key] || "").toLowerCase();
              case "assigned_to":
                const empA = employeeMap[obj.employee_id];
                const empB = employeeMap[b.employee_id];
                const nameA = empA ? `${empA.name?.first || ""} ${empA.name?.last || ""}`.toLowerCase() : "";
                const nameB = empB ? `${empB.name?.first || ""} ${empB.name?.last || ""}`.toLowerCase() : "";
                return nameA.localeCompare(nameB);
              default:
                // dynamic demographic fields like "locals", "males", etc.
                const sum = (obj, key) => obj.address?.reduce((acc, addr) => acc + (Number(addr[key]) || 0), 0) || 0;
                return sum(obj, key);
            }
          };

          const aVal = getVal(a, sortField);
          const bVal = getVal(b, sortField);

          if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
          if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
          return 0;
        });
      }


      setFilteredTickets(result);
      setSearchText(searchTextInput);
      setStartDate(startDateInput);
      setEndDate(endDateInput);
      setCurrentPage(1);
      setIsLoading(false);
    }, 0); // optional delay, can be 300ms to simulate load
  };


  // Fetch employee data as in your original
  const [employeeMap, setEmployeeMap] = useState({});
  useEffect(() => {
    const fetchEmployees = async () => {
      const snapshot = await getDocs(collection(db, "employee"));
      const map = {};
      snapshot.forEach((doc) => {
        map[doc.id] = doc.data();
      });
      setEmployeeMap(map);
    };
    fetchEmployees();
  }, []);

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;

    return (
      <FontAwesomeIcon
        icon={sortDirection === "asc" ? faArrowUp : faArrowDown}
        className="ms-1"
        style={{ fontSize: "0.65rem", color: "#6c757d" }}
      />
    );
  };


  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    handleSearch(); // reapply filtering + sorting
  };
  const allActivityIds = tickets.flatMap(t =>
    t.activities?.flatMap(a => a.activities_availed || []) || []
  );
  const uniqueActivityIds = Array.from(new Set(allActivityIds));

  // ✅ Wrap the IDs as a mock 'ticket' object
  const resolvedActivities = useResolvedActivities({
    activities: [{ activities_availed: uniqueActivityIds }]
  });

  const getActivityDetails = (id) => {
    return resolvedActivities.find(a => a.id === id);
  };

  const allProviderIds = tickets.flatMap(t =>
    t.activities?.flatMap(a => a.activity_selected_providers || []) || []
  );
  const uniqueProviderIds = Array.from(new Set(allProviderIds));

  // ✅ Fix: Wrap in mock activities array
  const resolvedProviders = useResolvedProviders([
    { activity_selected_providers: uniqueProviderIds }
  ]);

  const getProviderName = id => {
    return resolvedProviders.find(p => p.id === id)?.name;
  };

  return (
    <>
      <p className="barabara-label text-start mt-5">TOURIST ACTIVITY STATUS BOARD</p>
      <p className="m-1 mt-3 text-muted small text-start">
        A quick overview of all tourist activities, bookings, and group status in real-time.
      </p>

      <Card.Body className="mt-4">
        <Card.Title><h3><strong>Recent Tickets</strong></h3></Card.Title>

        {/* Filter Section */}
        <Form className="mb-3">
          <Row className="row gap-2">
            <Col md={6} sm={12} xs={12} className="col">
              <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>
                Name Search
              </Form.Label>
              <InputGroup>
                <FormControl
                  type="text"
                  placeholder="Search by name or contact"
                  value={searchTextInput}
                  onChange={(e) => setSearchTextInput(e.target.value)}
                />
                <Button
                  variant="light"
                  style={{ backgroundColor: "#fff", borderColor: "#ced4da", color: "#6c757d" }}
                  onClick={handleSearch}
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} style={{ color: "#6c757d" }} />
                </Button>


              </InputGroup>


            </Col>
            <Col md={5} sm={12} xs={12} className="col">
              <Form.Label className="mb-0" style={{ fontSize: "0.7rem" }}>
                Date Range
              </Form.Label>
              <InputGroup>
                {/* Start Date */}
                <Form.Control
                  type="date"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                />

                {/* End Date */}
                <Form.Control
                  type="date"
                  value={endDateInput}
                  min={startDateInput} // ⬅️ Prevent selecting earlier than start
                  onChange={(e) => setEndDateInput(e.target.value)}
                />

                {/* Search Button on the Right */}
                <Button
                  variant="light"
                  style={{ backgroundColor: "#fff", borderColor: "#ced4da", color: "#6c757d" }}
                  onClick={handleSearch}
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} style={{ color: "#6c757d" }} />
                </Button>

              </InputGroup>
            </Col>



          </Row>

        </Form>

        {/* SCROLL WRAPPER */}
        {isLoading ? (
          <div className="text-center my-5">
            <span className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Loading results...</p>
          </div>
        ) : (
          <div ref={scrollRef} className="custom-scroll-wrapper">
            <Table bordered hover style={{ minWidth: "1400px" }}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th onClick={() => handleSort("id")}>Ticket ID</th>
                  <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                    Name {renderSortIcon("name")}
                  </th>
                  <th>Contact</th>
                  <th onClick={() => handleSort("start_date_time")} style={{ cursor: "pointer" }}>
                    Start Time {renderSortIcon("start_date_time")}
                  </th>
                  <th onClick={() => handleSort("end_date_time")} style={{ cursor: "pointer" }}>
                    End Time {renderSortIcon("end_date_time")}
                  </th>
                  <th onClick={() => handleSort("total_pax")} style={{ cursor: "pointer" }}>
                    Total Pax {renderSortIcon("total_pax")}
                  </th>
                  <th onClick={() => handleSort("locals")} style={{ cursor: "pointer" }}>
                    Locals{renderSortIcon("locals")}
                  </th>
                  <th onClick={() => handleSort("foreigns")} style={{ cursor: "pointer" }}>
                    Foreigns{renderSortIcon("foreigns")}
                  </th>
                  <th onClick={() => handleSort("males")} style={{ cursor: "pointer" }}>
                    Males{renderSortIcon("males")}
                  </th>
                  <th onClick={() => handleSort("females")} style={{ cursor: "pointer" }}>
                    Females{renderSortIcon("females")}
                  </th>
                  <th onClick={() => handleSort("prefer_not_to_say")} style={{ cursor: "pointer" }}>
                    Prefer Not To Say{renderSortIcon("prefer_not_to_say")}
                  </th>
                  <th onClick={() => handleSort("kids")} style={{ cursor: "pointer" }}>
                    Kids{renderSortIcon("kids")}
                  </th>
                  <th onClick={() => handleSort("teens")} style={{ cursor: "pointer" }}>
                    Teens{renderSortIcon("teens")}
                  </th>
                  <th onClick={() => handleSort("adults")} style={{ cursor: "pointer" }}>
                    Adults{renderSortIcon("adults")}
                  </th>
                  <th onClick={() => handleSort("seniors")} style={{ cursor: "pointer" }}>
                    Seniors{renderSortIcon("seniors")}
                  </th>
                  <th onClick={() => handleSort("assigned_to")} style={{ cursor: "pointer" }}>
                    Assigned To {renderSortIcon("assigned_to")}
                  </th>

                  <th>Assignee's Contact</th>
                  <th>Activity Names</th>
                  <th onClick={() => handleSort("total_duration")} style={{ cursor: "pointer" }}>
                    Total Duration{renderSortIcon("total_duration")}
                  </th>
                  <th onClick={() => handleSort("total_expected_payment")} style={{ cursor: "pointer" }}>
                    Expected Payment{renderSortIcon("total_expected_payment")}
                  </th>
                  <th onClick={() => handleSort("total_payment")} style={{ cursor: "pointer" }}>
                    Total Payment{renderSortIcon("total_payment")}
                  </th>
                  <th onClick={() => handleSort("total_markup")} style={{ cursor: "pointer" }}>
                    Total Markup %{renderSortIcon("total_markup")}
                  </th>
                  <th onClick={() => handleSort("total_expected_sale")} style={{ cursor: "pointer" }}>
                    Total Expected Sale %{renderSortIcon("total_expected_sale")}
                  </th>
                  <th onClick={() => handleSort("scanned_by")} style={{ cursor: "pointer" }}>
                    Scanned By{renderSortIcon("scanned_by")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentTickets.map((t) => {
                  const status = computeStatus(t);
                  const locals = t.address?.reduce((sum, addr) => sum + (Number(addr.locals) || 0), 0) || 0;
                  const foreigns = t.address?.reduce((sum, addr) => sum + (Number(addr.foreigns) || 0), 0) || 0;
                  const males = t.address?.reduce((sum, addr) => sum + (Number(addr.males) || 0), 0) || 0;
                  const females = t.address?.reduce((sum, addr) => sum + (Number(addr.females) || 0), 0) || 0;
                  const preferNotToSay = t.address?.reduce((sum, addr) => sum + (Number(addr.prefer_not_to_say) || 0), 0) || 0;
                  const kids = t.address?.reduce((sum, addr) => sum + (Number(addr.kids) || 0), 0) || 0;
                  const teens = t.address?.reduce((sum, addr) => sum + (Number(addr.teens) || 0), 0) || 0;
                  const adults = t.address?.reduce((sum, addr) => sum + (Number(addr.adults) || 0), 0) || 0;
                  const seniors = t.address?.reduce((sum, addr) => sum + (Number(addr.seniors) || 0), 0) || 0;
                  const employee = employeeMap[t.employee_id];
                  const employeeName = employee ? `${employee.name?.first || ""} ${employee.name?.last || ""}` : "-";
                  const employeeContact = employee?.contact || "-";
                  const scannedBy =
                    t.scan_logs?.find((log) => log.status === "scanned")?.updated_by || "";

                  return (
                    <tr key={t.id}>
                      <td><Badge bg={getStatusBadgeVariant(status)}>{status}</Badge></td>
                      <td>{t.id}</td>
                      <td>{t.name}</td>
                      <td>{t.contact}</td>
                      <td>{new Date(t.start_date_time).toLocaleString()}</td>
                      <td>{new Date(t.end_date_time).toLocaleString()}</td>
                      <td>{t.total_pax}</td>
                      <td>{locals}</td>
                      <td>{foreigns}</td>
                      <td>{males}</td>
                      <td>{females}</td>
                      <td>{preferNotToSay}</td>
                      <td>{kids}</td>
                      <td>{teens}</td>
                      <td>{adults}</td>
                      <td>{seniors}</td>
                      <td>{employeeName}</td>
                      <td>{employeeContact}</td>
                      <td style={{ minWidth: "400px", whiteSpace: "normal", wordBreak: "break-word" }}>

                        {Array.isArray(t.activities) &&
                          t.activities.map((a, i) => {
                            const providerNames = Array.isArray(a.activity_selected_providers)
                              ? a.activity_selected_providers
                                .map(pid => getProviderName(pid))
                                .filter(Boolean)
                                .join(", ")
                              : "N/A";

                            return (
                              <div key={i} className="mb-2">
                                {Array.isArray(a.activities_availed) &&
                                  a.activities_availed.map((id, idx) => {
                                    const activity = getActivityDetails(id);

                                    if (!activity) {
                                      return (
                                        <div key={idx} className="text-muted">
                                          Loading activity...
                                        </div>
                                      );
                                    }

                                    return (
                                      <div key={idx}>
                                        <strong>{activity.activity_name}</strong> –{" "}
                                        {a.activity_num_pax || 0} pax / {a.activity_num_unit || 0} unit(s) –{" "}
                                        {activity.activity_duration} – BP ₱{Number(activity.activity_base_price).toLocaleString()} | SRP ₱{Number(activity.activity_price).toLocaleString()} – provider(s): {providerNames}
                                      </div>
                                    );
                                  })}
                              </div>
                            );
                          })}
                      </td>
                      <td>{t.total_duration || 0} min</td>
                      <td>₱ {t.total_expected_payment?.toLocaleString() || "0.00"}</td>
                      <td>₱ {t.total_payment?.toLocaleString() || "0.00"}</td>
                      <td>
                        <span
                          className={
                            t.total_markup >= 50
                              ? "text-danger"
                              : t.total_markup >= 31
                                ? "text-warning"
                                : t.total_markup >= 10
                                  ? "text-success"
                                  : ""
                          }
                        >
                          {t.total_markup.toFixed(2)}%
                        </span>
                      </td>
                      <td>₱ {t.total_expected_sale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>{scannedBy || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}

      </Card.Body>
      <div className="d-flex justify-content-between align-items-center mt-3 px-2">
        <div>
          Page {currentPage} of {totalPages}
        </div>
        <div>
          <button
            className="btn btn-sm btn-outline-primary me-2"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

    </>
  );
};

export default TouristActivityStatusBoard;
