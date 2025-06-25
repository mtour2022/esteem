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

  // Filtering logic
  // useEffect(() => {
  //   let result = [...tickets];

  //   if (searchText.trim()) {
  //     const lower = searchText.toLowerCase();
  //     result = result.filter((t) =>
  //       t.name?.toLowerCase().includes(lower) || t.contact?.toLowerCase().includes(lower)
  //     );
  //   }

  //   if (startDate && endDate) {
  //     const start = new Date(startDate);
  //     const end = new Date(endDate);
  //     end.setHours(23, 59, 59, 999); // extend to end of day

  //     result = result.filter((t) => {
  //       const tDate = new Date(t.start_date_time);
  //       return tDate >= start && tDate <= end;
  //     });
  //   }


  //   setFilteredTickets(result);
  //   setCurrentPage(1);
  // }, [tickets, searchText, startDate, endDate]);
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
                  <th>Ticket ID</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Total Pax</th>
                  <th>Locals</th>
                  <th>Foreigns</th>
                  <th>Males</th>
                  <th>Females</th>
                  <th>Prefer Not To Say</th>
                  <th>Kids</th>
                  <th>Teens</th>
                  <th>Adults</th>
                  <th>Seniors</th>
                  <th>Assigned To</th>
                  <th>Assignee's Contact</th>
                  <th>Activity Names</th>
                  <th>Total Duration</th>
                  <th>Expected Payment</th>
                  <th>Total Payment</th>
                  <th>Scanned By</th>
                </tr>
              </thead>
              <tbody>
                {currentTickets.map((t) => {
                  const status = computeStatus(t);
                  const locals = t.address?.reduce((sum, addr) => sum + (addr.locals || 0), 0) || 0;
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


                  const activityNames = Array.isArray(t.activities)
                    ? t.activities
                      .flatMap((a) =>
                        Array.isArray(a.activities_availed)
                          ? a.activities_availed.map((item) => item.activity_name || "")
                          : []
                      )
                      .filter(Boolean)
                      .join(", ")
                    : "";
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
                      <td>{activityNames}</td>
                      <td>{t.total_duration || 0} min</td>
                      <td>₱ {t.total_expected_payment?.toLocaleString() || "0.00"}</td>
                      <td>₱ {t.total_payment?.toLocaleString() || "0.00"}</td>
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
