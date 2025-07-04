import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import { Card, Table, Badge, Row, Col, Form } from "react-bootstrap";
import { InputGroup, FormControl, Button, Dropdown } from "react-bootstrap";
import { db } from "../config/firebase"; // adjust path as needed
import { toPng } from "html-to-image";
import download from "downloadjs";
import useResolvedActivities from "../services/GetActivitiesDetails";
import useResolvedProviders from "../services/GetProvidersDetails"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import {
  faMagnifyingGlass,
  faDownload,
  faPrint,
  faFilter,
  faLayerGroup, faCalendarDays, faColumns
} from "@fortawesome/free-solid-svg-icons";

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
  const [isDownloading, setIsDownloading] = useState(false);
  const tableRef = useRef();
  const [tickets, setTickets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  // 🔧 Make sure this state is defined
  const [searchText, setSearchText] = useState("");
  const [searchType, setSearchType] = useState("name"); // 'name' or 'employeeName'
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTextInput, setSearchTextInput] = useState("");
  const scrollRef = useRef();
  useMouseDragScroll(scrollRef);

  const rowsPerPage = 10;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const dataToRender = filteredTickets.length > 0 ? filteredTickets : tickets;
  const totalPages = Math.ceil(dataToRender.length / rowsPerPage);
  const currentTickets = dataToRender.slice(indexOfFirstRow, indexOfLastRow);
  const [showDateSearchDropdown, setShowDateSearchDropdown] = useState(false);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(""); // Format: YYYY-MM
  const [selectedYear, setSelectedYear] = useState("");   // Example: 2024
  const [selectedDateFilter, setSelectedDateFilter] = useState(""); // e.g. "today", "thisMonth", etc.
  const [triggerSearch, setTriggerSearch] = useState(false);

  useEffect(() => {
    if (triggerSearch) {
      handleSearch();
      setTriggerSearch(false);
    }
  }, [startDateInput, endDateInput, selectedMonth, selectedYear, triggerSearch]);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!ticket_ids || ticket_ids.length === 0) {
        setTickets([]);
        return;
      }

      setIsLoading(true);
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
      setIsLoading(false);
    };

    fetchTickets();
  }, [ticket_ids]);



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

  const allActivityIds = tickets.flatMap(t =>
    t.activities?.flatMap(a => a.activities_availed || []) || []
  );
  const uniqueActivityIds = Array.from(new Set(allActivityIds));
  const resolvedActivities = useResolvedActivities({
    activities: [{ activities_availed: uniqueActivityIds }]
  });
  const getActivityDetails = (id) => resolvedActivities.find(a => a.id === id);

  const allProviderIds = tickets.flatMap(t =>
    t.activities?.flatMap(a => a.activity_selected_providers || []) || []
  );
  const uniqueProviderIds = Array.from(new Set(allProviderIds));
  const resolvedProviders = useResolvedProviders([
    { activity_selected_providers: uniqueProviderIds }
  ]);
  const getProviderName = id => resolvedProviders.find(p => p.id === id)?.name;

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2); // getMonth is 0-based
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
  };
  const applyQuickFilter = (type) => {
    setSelectedMonth("");
    setSelectedYear("");
    setSelectedDateFilter(type);

    const formatDateLocal = (date) => date.toLocaleDateString("en-CA");
    const today = new Date();

    if (type === "today") {
      const formatted = formatDateLocal(today);
      setStartDateInput(formatted);
      setEndDateInput(formatted);
    }

    if (type === "thisWeek") {
      const day = today.getDay(); // Sunday = 0
      const start = new Date(today);
      start.setDate(today.getDate() - day);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      setStartDateInput(formatDateLocal(start));
      setEndDateInput(formatDateLocal(end));
    }

    if (type === "thisMonth") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);

      setStartDateInput(formatDateLocal(start));
      setEndDateInput(formatDateLocal(end));
    }

    if (type === "thisHalfOfTheMonth") {
      const year = today.getFullYear();
      const month = today.getMonth();
      const date = today.getDate();

      let start, end;
      if (date <= 15) {
        start = new Date(year, month, 1);
        end = new Date(year, month, 15);
      } else {
        start = new Date(year, month, 16);
        end = new Date(year, month + 1, 0);
      }

      end.setHours(23, 59, 59, 999);

      setStartDateInput(formatDateLocal(start));
      setEndDateInput(formatDateLocal(end));
    }

    if (type === "thisYear") {
      const start = new Date(today.getFullYear(), 0, 1); // Jan 1
      const end = new Date(today.getFullYear(), 11, 31); // Dec 31
      end.setHours(23, 59, 59, 999);

      setStartDateInput(formatDateLocal(start));
      setEndDateInput(formatDateLocal(end));
    }
  };




  const handleSearch = () => {
    setIsLoading(true);

    setTimeout(() => {
      let result = [...tickets]; // <-- THIS LINE is essential

      // Apply filters (searchTextInput, searchType, etc.)
      if (searchTextInput.trim()) {
        const lower = searchTextInput.toLowerCase();

        result = result.filter((t) => {
          if (searchType === "name") {
            return t.name?.toLowerCase().includes(lower) || t.contact?.toLowerCase().includes(lower);
          }

          if (searchType === "employeeName") {
            const emp = employeeMap[t.employee_id];
            const fullName = `${emp?.name?.first || ""} ${emp?.name?.last || ""}`.toLowerCase();
            return fullName.includes(lower);
          }

          return false;
        });
      }

      if (startDateInput && endDateInput) {
        const start = new Date(startDateInput);
        const end = new Date(endDateInput);
        end.setHours(23, 59, 59, 999);

        result = result.filter((t) => {
          const tStart = new Date(t.start_date_time);
          return tStart >= start && tStart <= end;
        });
      }

      // Filter by selected month
      if (selectedMonth) {
        const [year, month] = selectedMonth.split("-").map(Number);
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        lastDay.setHours(23, 59, 59, 999);

        result = result.filter((t) => {
          const tStart = new Date(t.start_date_time);
          return tStart >= firstDay && tStart <= lastDay;
        });
      }

      // Filter by selected year
      if (selectedYear) {
        result = result.filter((t) => {
          const tStart = new Date(t.start_date_time);
          return tStart.getFullYear().toString() === selectedYear.toString();
        });
      }

      // ...continue with your other filters like date, sorting, etc.

      setFilteredTickets(result);
      setSearchText(searchTextInput);
      setCurrentPage(1);
      setIsLoading(false);
    }, 0);
  };

  const ticketsToRender = isDownloading ? dataToRender : currentTickets;
  const handleDownloadTable = async () => {
    try {
      setIsDownloading(true);

      // Show loading modal
      Swal.fire({
        title: "Generating full image...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const scrollEl = scrollRef.current;
      const tableEl = tableRef.current;

      if (scrollEl && tableEl) {
        // Backup original styles
        const originalOverflow = scrollEl.style.overflow;
        const originalWidth = scrollEl.style.width;

        // Expand scroll wrapper to full width temporarily
        scrollEl.style.overflow = "visible";
        scrollEl.style.width = `${scrollEl.scrollWidth}px`;

        // Wait for layout to update
        await new Promise(resolve => setTimeout(resolve, 300));

        // Capture the full table
        const dataUrl = await toPng(tableEl, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#fff"
        });

        // Restore original styles
        scrollEl.style.overflow = originalOverflow;
        scrollEl.style.width = originalWidth;

        download(dataUrl, "tourist-activity-status-board.png");
      }

      Swal.close();
    } catch (err) {
      console.error("Download failed", err);
      Swal.fire("Error", "Failed to download table image.", "error");
    } finally {
      setIsDownloading(false);
    }
  };


  const exportToExcel = () => {
    const exportData = (filteredTickets.length > 0 ? filteredTickets : tickets).map(t => {
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
      const scannedBy = t.scan_logs?.find((log) => log.status === "scanned")?.updated_by || "";

      return {
        Status: status,
        TicketID: t.id,
        Name: t.name,
        Contact: t.contact,
        StartTime: new Date(t.start_date_time).toLocaleString(),
        EndTime: new Date(t.end_date_time).toLocaleString(),
        TotalPax: t.total_pax,
        Locals: locals,
        Foreigns: foreigns,
        Males: males,
        Females: females,
        "Prefered Not To Say": preferNotToSay,
        Kids: kids,
        Teens: teens,
        Adults: adults,
        Seniors: seniors,
        "Assigned To": employeeName,
       "Activities Availed": Array.isArray(t.activities)
  ? t.activities.map((a) => {
      const providerNames = Array.isArray(a.activity_selected_providers)
        ? a.activity_selected_providers
            .map(pid => getProviderName(pid))
            .filter(Boolean)
            .join(", ")
        : "N/A";

      if (!Array.isArray(a.activities_availed)) return null;

      return a.activities_availed.map((id) => {
        const activity = getActivityDetails(id);
        if (!activity) return "Loading activity...";

        return `${activity.activity_name} – ${a.activity_num_pax || 0} pax / ${a.activity_num_unit || 0} unit(s) – ${activity.activity_duration} – BP ₱${Number(activity.activity_base_price).toLocaleString()} | SRP ₱${Number(activity.activity_price).toLocaleString()} – provider(s): ${providerNames}`;
      }).join("\n");
    }).filter(Boolean).join("\n\n")
  : "-"

,
        // duration
        ExpectedPayment: t.total_expected_payment || 0,
        ActualPayment: t.total_payment || 0,
        Markup: `${t.total_markup.toFixed(2)}%`,
        ScannedBy: scannedBy,

      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
    XLSX.writeFile(workbook, "tourist-activity-status-board.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF("landscape");
    const exportData = (filteredTickets.length > 0 ? filteredTickets : tickets).map(t => {
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
      const scannedBy = t.scan_logs?.find((log) => log.status === "scanned")?.updated_by || "";

      return [
        status,
        t.id,
        t.name,
        t.contact,
        new Date(t.start_date_time).toLocaleString(),
        new Date(t.end_date_time).toLocaleString(),
        t.total_pax,
        locals,
        foreigns,
        employeeName,
        scannedBy,
        `₱${t.total_expected_payment?.toLocaleString() || "0"}`,
        `₱${t.total_payment?.toLocaleString() || "0"}`,
        `${t.total_markup.toFixed(2)}%`
      ];
    });

    autoTable(doc, {
      head: [[
        "Status", "Ticket ID", "Name", "Contact", "Start Time", "End Time", "Pax",
        "Locals", "Foreigns", "Employee", "Scanned By", "Expected", "Actual", "Markup"
      ]],
      body: exportData,
      styles: { fontSize: 7 },
    });

    doc.save("tourist-activity-status-board.pdf");
  };



  return (
    <>
      <p className="barabara-label text-start mt-5">TOURIST ACTIVITY STATUS BOARD</p>
      <p className="m-1 mt-3 text-muted small text-start">
        A quick overview of all tourist activities, bookings, and group status in real-time.
      </p>

      <Card.Body className="mt-4">
        <Card.Title><h3><strong>Recent Tickets</strong></h3></Card.Title>
        <Row className="align-items-end mb-3">
          {/* LEFT SIDE: Search Field */}
          <Col md={6} sm={12} className="d-flex justify-content-end gap-2 mb-2">

          </Col>


          {/* RIGHT SIDE: Icon Buttons */}
          <Col md={6} sm={12} className="d-flex justify-content-end gap-2 mb-2">
            <Dropdown show={showSearchDropdown} onToggle={() => setShowSearchDropdown(!showSearchDropdown)}>
              <Dropdown.Toggle variant="outline-secondary" as={Button}>
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </Dropdown.Toggle>

              <Dropdown.Menu align="end" style={{ minWidth: "300px" }}>
                <Form className="px-3 py-2">
                  <Form.Label className="small text-muted mb-1">Search Filter</Form.Label>
                  <Form.Select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="mb-2"
                  >
                    <option value="name">Name / Contact</option>
                    <option value="employeeName">Employee Name</option>
                  </Form.Select>

                  <FormControl
                    type="text"
                    placeholder={`Search by ${searchType === "name" ? "name or contact" : "employee name"}`}
                    value={searchTextInput}
                    onChange={(e) => setSearchTextInput(e.target.value)}
                    className="mb-2"
                  />

                  <Button variant="primary" size="sm" onClick={() => {
                    setShowSearchDropdown(false);
                    handleSearch();
                  }}>
                    Search
                  </Button>
                </Form>
              </Dropdown.Menu>
            </Dropdown>
            <Dropdown show={showDateSearchDropdown} onToggle={() => setShowDateSearchDropdown(!showDateSearchDropdown)}>
              <Dropdown.Toggle as={Button} variant="outline-secondary" title="Date Range Search">
                <FontAwesomeIcon icon={faCalendarDays} />
              </Dropdown.Toggle>

              <Dropdown.Menu className="p-3" style={{ minWidth: "250px" }}>
                <Form.Group className="mb-2">
                  <Form.Label className="small mb-1 text-muted">Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small mb-1 text-muted">End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDateInput}
                    min={startDateInput}
                    onChange={(e) => setEndDateInput(e.target.value)}
                  />
                </Form.Group>
                <Form.Label className="small text-muted mt-3">Quick Date Filters</Form.Label>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("today")}>Today</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("thisWeek")}>This Week</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("thisMonth")}>This Month</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("thisHalfOfTheMonth")}>This Half Month</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => applyQuickFilter("thisYear")}>This Year</Button>

                </div>


                <Button
                  variant="primary"
                  size="sm"
                  className="w-100 mt-2 mb-4"
                  onClick={() => {
                    setShowDateSearchDropdown(false);
                    handleSearch(); // ⬅️ This re-renders the filtered table
                  }}
                >
                  Apply Date Filter
                </Button>

                {/* Select Month Filter */}
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Select Month</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => {
                        if (selectedMonth) {
                          const [year, month] = selectedMonth.split("-");
                          const start = new Date(year, month - 1, 1);
                          const end = new Date(year, month, 0, 23, 59, 59, 999);

                          setStartDateInput(start.toISOString().slice(0, 10));
                          setEndDateInput(end.toISOString().slice(0, 10));
                          setSelectedDateFilter("");
                          setSelectedYear("");
                          setShowSearchDropdown(false);

                          // ✅ trigger the search after state settles
                          setTriggerSearch(true);
                        }
                      }}

                    >
                      Apply
                    </Button>

                  </InputGroup>
                </Form.Group>

                {/* Select Year Filter */}
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Select Year</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      placeholder="e.g. 2025"
                      value={selectedYear}
                      min="2000"
                      max="2100"
                      onChange={(e) => setSelectedYear(e.target.value)}
                    />
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => {
                        if (selectedYear) {
                          const start = new Date(selectedYear, 0, 1);
                          const end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);

                          setStartDateInput(start.toISOString().slice(0, 10));
                          setEndDateInput(end.toISOString().slice(0, 10));
                          setSelectedDateFilter("");
                          setSelectedMonth("");
                          setShowSearchDropdown(false);
                          setTriggerSearch(true); // ✅
                        }
                      }}

                    >
                      Apply
                    </Button>
                  </InputGroup>
                </Form.Group>
              </Dropdown.Menu>
            </Dropdown>

            <Button variant="outline-secondary" title="Download" onClick={handleDownloadTable}>
              <FontAwesomeIcon icon={faDownload} />
            </Button>


            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" title="Export">
                <FontAwesomeIcon icon={faPrint} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={exportToPDF}>Export as PDF</Dropdown.Item>
                <Dropdown.Item onClick={exportToExcel}>Export as Excel</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Button variant="outline-secondary" title="Column Filter">
              <FontAwesomeIcon icon={faColumns} />
            </Button>
            <Button variant="outline-secondary" title="Group Filter">
              <FontAwesomeIcon icon={faLayerGroup} />
            </Button>
          </Col>
        </Row>

        {isLoading ? (
          <div className="text-center my-5">
            <span className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Loading results...</p>
          </div>
        ) : (
          <div ref={scrollRef} className="custom-scroll-wrapper">
            <div ref={tableRef}>
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
                    <th>Total Markup %</th>
                    <th>Total Expected Sale %</th>
                    <th>Scanned By</th>
                  </tr>
                </thead>

                <tbody>
                  {currentTickets.length === 0 ? (
                    <tr>
                      <td colSpan="25" className="text-center text-muted">
                        No results found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    ticketsToRender.map((t) => {
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
                      const scannedBy = t.scan_logs?.find((log) => log.status === "scanned")?.updated_by || "";

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

                                        return activity ? (
                                          <div key={idx}>
                                            <strong>{activity.activity_name}</strong> –{" "}
                                            {a.activity_num_pax || 0} pax / {a.activity_num_unit || 0} unit(s) –{" "}
                                            {activity.activity_duration} – BP ₱{Number(activity.activity_base_price).toLocaleString()} | SRP ₱{Number(activity.activity_price).toLocaleString()} – provider(s): {providerNames}
                                          </div>
                                        ) : (
                                          <div key={idx} className="text-muted">Loading activity...</div>
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
                    })
                  )}
                </tbody>

              </Table>
            </div>
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
