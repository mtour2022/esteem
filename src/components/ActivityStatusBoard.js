import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { useState, useEffect, useRef, useMemo } from "react";
import { Card, Table, Badge, Row, Col, Form, Tabs, Tab } from "react-bootstrap";
import { FormControl, Button, Dropdown } from "react-bootstrap";
import { db } from "../config/firebase"; // adjust path as needed
import { toPng } from "html-to-image";
import download from "downloadjs";
import useResolvedActivities from "../services/GetActivitiesDetails";
import useResolvedProviders from "../services/GetProvidersDetails"
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import useDeleteTicket from "../services/DeleteTicket"; // adjust path
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TopRankingChart from "../components/RankTable";
import TicketsSummaryTable from "../components/TicketsSummaryTable";
import PaymentPaxLineChart from "../components/TicketExpectedVsActual";
import ExpectedSaleForecastChart from "../components/TicketSaleForecast";
import TicketPaxVsTicket from "../components/TicketPaxVsTicket";
import TicketLocalVsForeign from "./TicketLocalVsForeign";
import TicketStatusLineChart from "./TicketScannedVsCreated";
import AgeGenderLineChart from "./TicketAgeSexComparative";
import ActivitiesHeatmapChart from "./TicketActivitiesHeatMap.js"
import Select from "react-select";

import {
  faMagnifyingGlass,
  faDownload,
  faPrint,
  faTrash,
  faLayerGroup, faCalendarDays, faColumns,
  faCopy,
  faRefresh,
  faTable,

} from "@fortawesome/free-solid-svg-icons";
import SummaryPieChart from './PieChart';
import useResolvedAllActivitiesFromTickets from "../services/GetAllActivitiesDetails";

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



const TouristActivityStatusBoard = ({ ticket_ids = [], refreshKey }) => {
  const tableRefSummary = useRef();
  const tableRefSummaryImage = useRef();

  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
  const [showFullSummary, setShowFullSummary] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);



  const allColumns = [
    { key: "actions", label: "Actions" },

    { key: "status", label: "Status" },
    { key: "ticketId", label: "Ticket ID" },
    { key: "name", label: "Name" },
    { key: "contact", label: "Contact" },
    { key: "accommodation", label: "Accommodation" },
    { key: "address", label: "Address" },
    { key: "startTime", label: "Start Time" },
    { key: "endTime", label: "End Time" },
    { key: "totalPax", label: "Total Pax" },
    { key: "locals", label: "Locals" },
    { key: "foreigns", label: "Foreigns" },
    { key: "males", label: "Males" },
    { key: "females", label: "Females" },
    { key: "preferNotToSay", label: "Prefer Not To Say" },
    { key: "kids", label: "Kids" },
    { key: "teens", label: "Teens" },
    { key: "adults", label: "Adults" },
    { key: "seniors", label: "Seniors" },
    { key: "assignedTo", label: "Assigned To" },
    { key: "assigneeContact", label: "Assignee's Contact" },
    { key: "activityNames", label: "Activity Names" },
    { key: "totalDuration", label: "Total Duration" },
    { key: "expectedPayment", label: "Expected Payment" },
    { key: "totalPayment", label: "Total Payment" },
    { key: "markup", label: "Total Markup %" },
    { key: "expectedSale", label: "Total Expected Sale %" },
    { key: "scannedBy", label: "Scanned By" },
  ];

  const [visibleColumns, setVisibleColumns] = useState(allColumns.map(col => col.key));
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

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
  const now = new Date();

  const sortedTickets = [...tickets].sort((a, b) => {
    const aTime = new Date(a.start_date_time);
    const bTime = new Date(b.start_date_time);
    return Math.abs(aTime - now) - Math.abs(bTime - now);
  });
  const reportRef = useRef(null);
  const summaryRef = useRef(null);


  const [rowsPerPage, setRowsPerPage] = useState(5);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const [hasFiltered, setHasFiltered] = useState(false);

  const dataToRender =
    hasFiltered ? filteredTickets : sortedTickets; const totalPages = Math.ceil(dataToRender.length / rowsPerPage);
  const currentTickets = dataToRender.slice(indexOfFirstRow, indexOfLastRow);
  const [showDateSearchDropdown, setShowDateSearchDropdown] = useState(false);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(""); // Format: YYYY-MM
  const [selectedYear, setSelectedYear] = useState("");   // Example: 2024
  const [selectedDateFilter, setSelectedDateFilter] = useState(""); // e.g. "today", "thisMonth", etc.
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [allFilteredTickets, setAllFilteredTickets] = useState([]);
  const [showGroupFilter, setShowGroupFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterResidency, setFilterResidency] = useState("");
  const [filterSex, setFilterSex] = useState("");
  const [filterAgeBracket, setFilterAgeBracket] = useState("");
  const [summaryFilter, setSummaryFilter] = useState("all"); // 'all' or 'scanned'
  const [showSummary, setShowSummary] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterTown, setFilterTown] = useState("");
  const [employeeMap, setEmployeeMap] = useState({});

  useEffect(() => {
    const today = new Date();
    const formatDateLocal = (date) => date.toLocaleDateString("en-CA"); // YYYY-MM-DD

    const formatted = formatDateLocal(today);
    setStartDateInput(formatted);
    setEndDateInput(formatted);

    // Trigger after both dates are set
    setTimeout(() => {
      setTriggerSearch(true);
    }, 0);
  }, []);

  // const handleRefresh = () => {
  //   setTickets([]);
  //   setAllFilteredTickets([]);
  //   setFilteredTickets([]);
  //   setHasFiltered(false);
  //   setTriggerSearch(prev => !prev); // Toggle to ensure re-run even if already true
  // };

  const handleRefresh = () => {
    window.location.reload(); // 🔄 Refresh the whole page
  };


  useEffect(() => {
    const fetchTickets = async () => {
      setTickets([]);
      setAllFilteredTickets([]);
      setFilteredTickets([]);
      setSearchText(searchTextInput);

      if (!ticket_ids || ticket_ids.length === 0) return;

      Swal.fire({
        title: "Fetching data...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
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

        const start = new Date(startDateInput);
        const end = new Date(endDateInput);
        end.setHours(23, 59, 59, 999);

        const filtered = allTickets.filter((t) => {
          const tStart = new Date(t.start_date_time);
          return tStart >= start && tStart <= end;
        });

        setTickets(filtered);
        setAllFilteredTickets(filtered);

      } catch (err) {
        console.error("Error fetching tickets:", err);
        Swal.fire("Error", "Failed to fetch tickets", "error");
      } finally {
        Swal.close();
        setIsLoading(false);
      }
    };

    if (triggerSearch) {
      fetchTickets();
      setTriggerSearch(false); // Reset after triggering
    }
  }, [triggerSearch, ticket_ids, startDateInput, endDateInput, searchTextInput]);




  const { deleteTicket } = useDeleteTicket();

  const handleDeleteTicket = async (ticketId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the ticket.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      const res = await deleteTicket(ticketId);
      if (res.success) {
        Swal.fire("Deleted!", "Ticket has been deleted.", "success");
        handleRefresh();
        // Optionally trigger a refetch or remove from state
      } else {
        Swal.fire("Error", res.error?.message || "Delete failed", "error");
      }
    }
  };

  const ticketsToRender = isDownloading ? dataToRender : currentTickets;

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
    setTriggerSearch(false);
    setHasFiltered(true);

    setTimeout(() => {
      let result = [...allFilteredTickets];

      // 🔍 Text Search Filter
      if (searchTextInput.trim()) {
        const lower = searchTextInput.toLowerCase();

        result = result.filter((t) => {
          if (searchType === "name") {
            return (
              t.name?.toLowerCase().includes(lower) ||
              t.contact?.toLowerCase().includes(lower) ||
              t.accommodation?.toLowerCase().includes(lower)
            );
          }

          // if (searchType === "employeeName") {
          //   const emp = employeeMap[t.employee_id];
          //   const fullName = `${emp?.firstname || ""} ${emp?.middlename || ""} ${emp?.surname || ""}`.toLowerCase();
          //   return fullName.includes(lower);
          // }
          if (searchType === "employeeName") {
            return t.employee_id === searchTextInput;
          }


          if (searchType === "accommodation") {
            return t.accommodation?.toLowerCase().includes(lower);
          }

          return false;
        });
      }

      // 📅 Date Range Filter
      if (startDateInput && endDateInput) {
        const start = new Date(startDateInput);
        const end = new Date(endDateInput);
        end.setHours(23, 59, 59, 999);

        result = result.filter((t) => {
          const tStart = new Date(t.start_date_time);
          return tStart >= start && tStart <= end;
        });
      }

      // 🗓️ Month Filter
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

      // 📆 Year Filter
      if (selectedYear) {
        result = result.filter((t) => {
          const tStart = new Date(t.start_date_time);
          return tStart.getFullYear().toString() === selectedYear.toString();
        });
      }

      // 🧪 Group Filters (Status, Residency, Sex, Age)

      // Status remains the same
      if (filterStatus) {
        result = result.filter((t) => computeStatus(t) === filterStatus);
      }

      // Residency: aggregate over address[]
      if (filterResidency === "local") {
        result = result.filter((t) =>
          (t.address || []).reduce((sum, a) => sum + (a.locals || 0), 0) > 0
        );
      }

      if (filterResidency === "foreign") {
        result = result.filter((t) =>
          (t.address || []).reduce((sum, a) => sum + (a.foreigns || 0), 0) > 0
        );
      }

      // Country Filter
      if (filterCountry) {
        result = result.filter((t) =>
          (t.address || []).some(a => a.country === filterCountry)
        );
      }

      // Town Filter
      if (filterTown) {
        result = result.filter((t) =>
          (t.address || []).some(a => a.town === filterTown)
        );
      }


      // Sex (males, females, prefer_not_to_say)
      if (filterSex) {
        result = result.filter((t) =>
          (t.address || []).reduce((sum, a) => sum + (a[filterSex] || 0), 0) > 0
        );
      }

      // Age brackets: kids, teens, adults, seniors
      if (filterAgeBracket) {
        result = result.filter((t) =>
          (t.address || []).reduce((sum, a) => sum + (a[filterAgeBracket] || 0), 0) > 0
        );
      }



      // ✅ Finalize
      setFilteredTickets(result);
      setSearchText(searchTextInput);
      setCurrentPage(1);
      setIsLoading(false);
    }, 0);
  };


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

  const countryOptions = useMemo(() => {
    const countries = allFilteredTickets.flatMap(t =>
      t.address?.map(a => a.country).filter(Boolean) || []
    );
    const unique = [...new Set(countries)];
    return [{ value: "", label: "All Countries" }, ...unique.map(c => ({ value: c, label: c }))];
  }, [allFilteredTickets]);

  const townOptions = useMemo(() => {
    const towns = allFilteredTickets.flatMap(t =>
      t.address?.map(a => a.town).filter(Boolean) || []
    );
    const unique = [...new Set(towns)];
    return [{ value: "", label: "All Towns" }, ...unique.map(t => ({ value: t, label: t }))];
  }, [allFilteredTickets]);


  function total(addresses, key) {
    return addresses?.reduce((sum, addr) => sum + (Number(addr[key]) || 0), 0) || 0;
  }
  function getEmployeeName(t) {
    const emp = employeeMap[t.employee_id];
    return emp ? `${emp.firstname} ${emp.surname}` : "-";
  }
  function getEmployeeContact(t) {
    return employeeMap[t.employee_id]?.contact || "-";
  }

  function getActivitiesText(t) {
    if (!Array.isArray(t.activities)) return '';

    return t.activities.map((a) => {
      if (!Array.isArray(a.activities_availed)) return '';

      return a.activities_availed.map((id) => {
        const activity = getActivityDetails(id);
        const providerNames = Array.isArray(a.activity_selected_providers)
          ? a.activity_selected_providers
            .map((pid) => getProviderName(pid))
            .filter(Boolean)
            .join(", ")
          : "N/A";

        if (!activity) return 'Loading activity...';

        return `${activity.activity_name} – ${a.activity_num_pax || 0} pax / ${a.activity_num_unit || 0} unit(s) – ${activity.activity_duration} – BP ₱${Number(activity.activity_base_price).toLocaleString()} | SRP ₱${Number(activity.activity_price).toLocaleString()} – provider(s): ${providerNames}`;
      }).join("\n");
    }).join("\n\n");
  }

  function renderActivities(t) {
    return (
      <div style={{ minWidth: "400px", whiteSpace: "normal", wordBreak: "break-word" }}>
        {Array.isArray(t.activities) &&
          t.activities.map((a, i) => (
            <div key={i} className="mb-2">
              {Array.isArray(a.activities_availed) &&
                a.activities_availed.map((id, idx) => {
                  const activity = getActivityDetails(id);
                  const providerNames = Array.isArray(a.activity_selected_providers)
                    ? a.activity_selected_providers.map(pid => getProviderName(pid)).filter(Boolean).join(", ")
                    : "N/A";

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
          ))}
      </div>
    );
  }
  function renderAddress(t) {
    return (
      <div style={{ minWidth: "300px", whiteSpace: "normal", wordBreak: "break-word" }}>
        {Array.isArray(t.address) && t.address.length > 0 ? (
          t.address.map((addr, i) => {
            const locals = parseInt(addr.locals || "0", 10);
            const foreigns = parseInt(addr.foreigns || "0", 10);

            if (foreigns > 0 && locals === 0) {
              return (
                <div key={i}>
                  <strong>Foreign:</strong> {addr.country || "-"}
                </div>
              );
            } else if (locals > 0 && foreigns === 0) {
              return (
                <div key={i}>
                  <strong>Local:</strong> {[addr.country, addr.town].filter(Boolean).join(", ")}
                </div>
              );
            } else {
              return null; // skip mixed or zero
            }
          })
        ) : (
          <div className="text-muted">No address data</div>
        )}
      </div>
    );
  }
  function renderAddressText(t) {
    if (!Array.isArray(t.address) || t.address.length === 0) {
      return "No address data";
    }

    return t.address
      .map((addr) => {
        const locals = parseInt(addr.locals || "0", 10);
        const foreigns = parseInt(addr.foreigns || "0", 10);

        if (foreigns > 0 && locals === 0) {
          return `Foreign: ${addr.country || "-"}`;
        } else if (locals > 0 && foreigns === 0) {
          return `Local: ${[addr.country, addr.town].filter(Boolean).join(", ")}`;
        } else {
          return null; // skip mixed or zero
        }
      })
      .filter(Boolean)
      .join(" | ");
  }



  const exportToExcel = () => {
    const exportData = allFilteredTickets.map(t => {
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
      const employeeName = employee ? `${employee.firstname || ""} ${employee.surname || ""}` : "-";
      const employeeContact = employee?.contact || "-";
      const scannedBy = t.scan_logs?.find((log) => log.status === "scanned")?.updated_by || "";

      return {
        Status: status,
        TicketID: t.id,
        Name: t.name,
        Contact: t.contact,
        Accommodation: t.accommodation,
        Address: Array.isArray(t.address)
          ? t.address
            .map(addr => {
              const locals = parseInt(addr.locals || "0", 10);
              const foreigns = parseInt(addr.foreigns || "0", 10);

              if (foreigns > 0 && locals === 0) {
                return addr.country || "";
              } else if (locals > 0 && foreigns === 0) {
                return [addr.country, addr.town].filter(Boolean).join(", ");
              } else {
                return null; // mixed or zero pax, ignore
              }
            })
            .filter(Boolean)
            .join(", ")
          : "-",
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
        "Assignee's Contact": employeeContact,
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
        "Total Markup": `${t.total_markup.toFixed(2)}%`,
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
    const exportData = allFilteredTickets.map(t => {
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
      const employeeName = employee ? `${employee.firstname || ""} ${employee.surname || ""}` : "-";
      const employeeContact = employee?.contact || "-";
      const scannedBy = t.scan_logs?.find((log) => log.status === "scanned")?.updated_by || "";

      return [
        status,
        t.id,
        t.name,
        t.contact,
        t.accommodation,
        Array.isArray(t.address)
          ? t.address
            .map(addr => {
              const locals = parseInt(addr.locals || "0", 10);
              const foreigns = parseInt(addr.foreigns || "0", 10);

              if (foreigns > 0 && locals === 0) {
                return addr.country || "";
              } else if (locals > 0 && foreigns === 0) {
                return [addr.country, addr.town].filter(Boolean).join(", ");
              } else {
                return null; // mixed or zero pax, ignore
              }
            })
            .filter(Boolean)
            .join(", ")
          : "-",
        new Date(t.start_date_time).toLocaleString(),
        new Date(t.end_date_time).toLocaleString(),
        t.total_pax,
        locals,
        foreigns,
        males,
        females,
        preferNotToSay, kids, teens, adults, seniors,
        employeeName, employeeContact,
        Array.isArray(t.activities)
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
        `₱${t.total_expected_payment?.toLocaleString() || "0"}`,
        `₱${t.total_payment?.toLocaleString() || "0"}`,
        `${t.total_markup.toFixed(2)}%`,
        scannedBy,

      ];
    });

    autoTable(doc, {
      head: [[
        "Status", "TicketID", "Name", "Contact", "Accommodation", "Addresses", "Start Time", "End Time", "Total Pax",
        "Locals", "Foreigns", "Males", "Females", "Prefered Not To Say",
        "Kids", "Teens", "Adults", "Seniors", "Assigned To", "Asignee's Contact", "Activities Availed",
        , "Expected Payment", "Actual Payment", "Total Markup", "Scanned By"
      ]],
      body: exportData,
      styles: { fontSize: 7, cellPadding: 1 },
      columnStyles: {
        5: { cellWidth: 20, overflow: 'linebreak' },
        20: { cellWidth: 50, overflow: 'linebreak' }
      },
      startY: 10,
    });

    doc.save("tourist-activity-status-board.pdf");
  };


  const filteredSummaryTickets = useMemo(() => {
    if (summaryFilter === "scanned") {
      return allFilteredTickets.filter(t => t.status === "scanned");
    }
    return allFilteredTickets;

  }, [allFilteredTickets, summaryFilter]);



  useEffect(() => {
    console.log("filteredSummaryTickets:", filteredSummaryTickets);
  }, [filteredSummaryTickets]);

  const [groupedData, setGroupedData] = useState({});
  const daysInMonth = 31;

  useEffect(() => {
    const tableGroup = {};

    for (const ticket of filteredSummaryTickets) {
      const rawDate = ticket.start_date_time?.toDate
        ? ticket.start_date_time.toDate()
        : new Date(ticket.start_date_time);

      const dateObj = new Date(rawDate);
      const month = dateObj.toLocaleString("default", { month: "long" });
      const day = dateObj.getDate();

      if (!tableGroup[month]) tableGroup[month] = {};
      if (!tableGroup[month][day]) tableGroup[month][day] = 0;

      // Use ticket.total_pax directly
      tableGroup[month][day] += Number(ticket.total_pax) || 0;
    }

    setGroupedData(tableGroup);
  }, [filteredSummaryTickets]);


  const months = Object.keys(groupedData);

  const getMonthTotal = (days) => Object.values(days).reduce((sum, val) => sum + val, 0);
  const getGrandTotal = () => Object.values(groupedData).reduce((acc, days) => acc + getMonthTotal(days), 0);


  const handleDownloadImageSummary = async () => {
    if (!tableRefSummaryImage.current) return;
    try {
      const dataUrl = await toPng(tableRefSummaryImage.current);
      download(dataUrl, `tickets_summary.png`);
    } catch (err) {
      console.error("Image download failed", err);
    }
  };


  const handleDownloadExcel = () => {
    const headers = ["Month", ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`), "Total"];
    const data = months.map(month => {
      const days = groupedData[month] || {};
      const total = getMonthTotal(days);
      const row = [month];
      for (let i = 1; i <= daysInMonth; i++) {
        row.push(days[i] || "");
      }
      row.push(total);
      return row;
    });

    if (months.length > 0) {
      const grandTotalRow = ["Grand Total", ...Array(daysInMonth).fill(""), getGrandTotal()];
      data.push(grandTotalRow);
    }

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets Summary");
    XLSX.writeFile(workbook, `tickets_summary.xlsx`);
  };





  const initialSummary = {
    totalTickets: 0,
    totalPax: 0,
    foreigns: 0,
    locals: 0,
    males: 0,
    females: 0,
    preferNotToSay: 0,
    kids: 0,
    teens: 0,
    adults: 0,
    seniors: 0,
    expectedPayment: 0,
    totalPayment: 0,
    totalExpectedSale: 0,
    totalMarkup: 0,
  };


  const summary = useMemo(() => {
    if (filteredSummaryTickets.length === 0) return initialSummary;
    return filteredSummaryTickets.reduce(
      (acc, t) => {
        acc.totalTickets += 1;
        acc.totalPax += t.total_pax || 0;
        acc.foreigns += total(t.address, 'foreigns');
        acc.locals += total(t.address, 'locals');

        acc.males += total(t.address, 'males');
        acc.females += total(t.address, 'females');
        acc.preferNotToSay += total(t.address, 'prefer_not_to_say');

        acc.kids += total(t.address, 'kids');
        acc.teens += total(t.address, 'teens');
        acc.adults += total(t.address, 'adults');
        acc.seniors += total(t.address, 'seniors');

        acc.expectedPayment += t.total_expected_payment || 0;
        acc.totalPayment += t.total_payment || 0;
        acc.totalExpectedSale += t.total_expected_sale || 0;
        acc.totalMarkup += t.total_markup || 0;

        return acc;
      },
      { ...initialSummary } // Use spread so it's clean
    );
  }, [filteredSummaryTickets]);

  // const summaryReady = filteredSummaryTickets.length > 0 && summary.totalPax > 0;
  const hasFilteredSummaryData = useMemo(() => {
    return filteredSummaryTickets.length > 0 && filteredSummaryTickets.some(t => t.total_pax > 0);
  }, [filteredSummaryTickets]);


  const residencyData = useMemo(() => {
    return [
      { name: 'Locals', value: summary.locals },
      { name: 'Foreigns', value: summary.foreigns },
    ];
  }, [summary]);

  const sexData = useMemo(() => {
    return [
      { name: 'Males', value: summary.males },
      { name: 'Females', value: summary.females },
      { name: 'Prefer not to say', value: summary.preferNotToSay },
    ];
  }, [summary]);

  const ageData = useMemo(() => {
    return [
      { name: 'Kids', value: summary.kids },
      { name: 'Teens', value: summary.teens },
      { name: 'Adults', value: summary.adults },
      { name: 'Seniors', value: summary.seniors },
    ];
  }, [summary]);

  const hasResidencyData = residencyData.some(d => d.value > 0);
  const hasSexData = sexData.some(d => d.value > 0);
  const hasAgeData = ageData.some(d => d.value > 0);


  const averageMarkup = summary.totalTickets > 0
    ? summary.totalMarkup / summary.totalTickets
    : 0;

  const averageSalePerTicket = summary.totalTickets > 0
    ? summary.totalExpectedSale / summary.totalTickets
    : 0;

  const statusCounts = filteredSummaryTickets.reduce((acc, t) => {
    const status = computeStatus(t);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});


  const allResolvedActivities = useResolvedAllActivitiesFromTickets(filteredSummaryTickets);

  const activityPaxCounts = {};

  filteredSummaryTickets.forEach(ticket => {
    if (!Array.isArray(ticket.activities)) return;

    ticket.activities.forEach(act => {
      const availedIds = act.activities_availed || [];
      const pax = Number(act.activity_num_pax || 0);

      availedIds.forEach(id => {
        if (!id) return;
        if (!activityPaxCounts[id]) activityPaxCounts[id] = 0;
        activityPaxCounts[id] += pax;
      });
    });
  });


  const activityNameMap = allResolvedActivities.reduce((acc, a) => {
    acc[a.id] = a.activity_name || "Unknown Activity";
    return acc;
  }, {});

  const topActivities = Object.entries(activityPaxCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([activityId, value]) => ({
      name: activityNameMap[activityId] || activityId,
      value,
    }));

  // NEW: Base price map
  const activityBasePriceMap = allResolvedActivities.reduce((acc, a) => {
    acc[a.id] = Number(a.activity_base_price) || 0;
    return acc;
  }, {});

  const activitySaleTotals = {};

  filteredSummaryTickets.forEach(ticket => {
    if (!Array.isArray(ticket.activities)) return;

    ticket.activities.forEach(act => {
      const availedIds = act.activities_availed || [];
      const pax = Number(act.activity_num_pax || 0);

      availedIds.forEach(id => {
        if (!id) return;

        const expectedPrice = Number(activityBasePriceMap[id] || 0);
        const activitySale = Number(ticket.total_payment || 0) - (expectedPrice * pax);

        if (!activitySaleTotals[id]) activitySaleTotals[id] = 0;
        activitySaleTotals[id] += activitySale;
      });
    });
  });

  const topActivitiesBySale = Object.entries(activitySaleTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([activityId, value]) => ({
      name: activityNameMap[activityId] || activityId,
      value,
    }));

  // Count country appearances across all addresses in all tickets
  const countryCounts = {};

  filteredSummaryTickets.forEach(ticket => {
    if (!Array.isArray(ticket.address)) return;

    ticket.address.forEach(addr => {
      const country = addr?.country?.trim();
      if (!country) return;

      if (!countryCounts[country]) countryCounts[country] = 0;
      countryCounts[country] += 1;
    });
  });

  // Get Top 5 countries
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // changed from 5 to 10
    .map(([country, value]) => ({
      name: country,
      value,
    }));

  // Count town appearances only for addresses in the Philippines
  const townCounts = {};

  filteredSummaryTickets.forEach(ticket => {
    if (!Array.isArray(ticket.address)) return;

    ticket.address.forEach(addr => {
      const country = addr?.country?.trim();
      const town = addr?.town?.trim();

      if (country !== "Philippines" || !town) return;

      if (!townCounts[town]) townCounts[town] = 0;
      townCounts[town] += 1;
    });
  });

  // Get Top 5 towns (domestic only)
  const topTowns = Object.entries(townCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // changed from 5 to 10
    .map(([town, value]) => ({
      name: town,
      value,
    }));
  const employeeTicketCounts = {};

  filteredSummaryTickets.forEach(ticket => {
    const empId = ticket.employee_id;
    if (!empId) return;

    // Initialize count if not set
    if (!employeeTicketCounts[empId]) employeeTicketCounts[empId] = 0;

    // Increment ticket count for this employee
    employeeTicketCounts[empId] += 1;
  });

  // Map employee IDs to their names (from employeeMap)
  const employeeNameMap = Object.values(employeeMap || {}).reduce((acc, emp) => {
    acc[emp.employeeId] = emp.firstname || "Unknown Employee";
    return acc;
  }, {});

  // Create a top employees array
  const topEmployees = Object.entries(employeeTicketCounts)
    .sort((a, b) => b[1] - a[1]) // sort by ticket count descending
    .slice(0, 10) // top 10
    .map(([empId, value]) => ({
      name: employeeNameMap[empId] || empId,
      value,
    }));

  const employeePaxCounts = {};

  filteredSummaryTickets.forEach(ticket => {
    const empId = ticket.employee_id;
    if (!empId) return;

    // Calculate pax for this ticket
    let pax = 0;
    if (Array.isArray(ticket.address)) {
      ticket.address.forEach(addr => {
        pax += Number(addr?.males || 0) + Number(addr?.females || 0);
      });
    }

    // Add pax to this employee's total
    if (!employeePaxCounts[empId]) employeePaxCounts[empId] = 0;
    employeePaxCounts[empId] += pax;
  });

  // Create top employees array
  const topEmployeesByPax = Object.entries(employeePaxCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([empId, value]) => {
      const emp = Array.isArray(employeeMap)
        ? employeeMap.find(e => String(e.employeeId) === String(empId))
        : employeeMap?.[empId] || employeeMap?.[String(empId)];

      const name = emp
        ? `${emp.firstname ?? ""} ${emp.surname ?? ""}`.trim() || String(empId)
        : String(empId);

      return { name, value };
    });
  // 🔹 Compute total expected sale per employee
  const employeeSaleTotals = {};

  filteredSummaryTickets.forEach(ticket => {
    const empId = ticket.employee_id;
    if (!empId) return;

    const sale = Number(ticket.total_expected_sale || 0);

    if (!employeeSaleTotals[empId]) employeeSaleTotals[empId] = 0;
    employeeSaleTotals[empId] += sale;
  });

  // 🔹 Create Top Employees by Expected Sale
  const topEmployeesBySale = Object.entries(employeeSaleTotals)
    .sort((a, b) => b[1] - a[1]) // highest sale first
    .slice(0, 10)
    .map(([empId, value]) => ({
      name: employeeNameMap[empId] || empId,
      value,
    }));

  // Aggregate total expected sale per country
  const countrySaleTotals = {};

  filteredSummaryTickets.forEach(ticket => {
    if (!Array.isArray(ticket.address)) return;

    ticket.address.forEach(addr => {
      const country = addr?.country?.trim();
      if (!country) return;

      const sale = Number(ticket.total_expected_sale || 0);

      if (!countrySaleTotals[country]) countrySaleTotals[country] = 0;
      countrySaleTotals[country] += sale;
    });
  });

  // Create Top 10 Countries by Expected Sale
  const topCountriesBySale = Object.entries(countrySaleTotals)
    .sort((a, b) => b[1] - a[1]) // highest sale first
    .slice(0, 10)
    .map(([country, value]) => ({
      name: country,
      value,
    }));

  // Aggregate total expected sale per town (Philippines only)
  const townSaleTotals = {};

  filteredSummaryTickets.forEach(ticket => {
    if (!Array.isArray(ticket.address)) return;

    ticket.address.forEach(addr => {
      const country = addr?.country?.trim();
      const town = addr?.town?.trim();
      if (country !== "Philippines" || !town) return;

      const sale = Number(ticket.total_expected_sale || 0);

      if (!townSaleTotals[town]) townSaleTotals[town] = 0;
      townSaleTotals[town] += sale;
    });
  });

  // Create Top 10 Philippine Towns by Expected Sale
  const topTownsBySale = Object.entries(townSaleTotals)
    .sort((a, b) => b[1] - a[1]) // highest sale first
    .slice(0, 10)
    .map(([town, value]) => ({
      name: town,
      value,
    }));


  const handleDownloadImage = () => {
    if (summaryRef.current === null) return;

    Swal.fire({
      title: "Preparing image...",
      text: "Please wait while we generate your report.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    toPng(summaryRef.current, { cacheBust: true })
      .then((dataUrl) => {
        download(dataUrl, "tourism_summary.png");
        Swal.close(); // close the loading alert
      })
      .catch((err) => {
        console.error("Image download failed", err);
        Swal.fire("Error", "Failed to generate the image.", "error");
      });
  };


  const toggleSummary = () => {
    if (showSummary) {
      setShowSummary(false);
    } else {
      setLoadingSummary(true);
      setTimeout(() => {
        setShowSummary(true);
        setLoadingSummary(false);
      }, 500); // simulate a short load delay
    }
  };

  const handleSearchReset = () => {
    setFilteredTickets(allFilteredTickets); // or whatever your original dataset state is
    setHasFiltered(false);
  };

  return (
    <>

      <p className="barabara-label text-start mt-5">TOURIST ACTIVITY STATUS BOARD</p>
      <p className="m-1 mt-3 text-muted small text-start">
        A quick overview of all tourist activities, bookings, and group status in real-time.
      </p>

      <Card.Body className="mt-5">
        <Row className="align-items-end mb-3">
          {/* LEFT SIDE: Search Field */}
          <Col lg={6} md={12} sm={12} xs={12} className="d-flex justify-content-start gap-2 mb-2">

          </Col>


          {/* RIGHT SIDE: Icon Buttons */}
          <Col lg={6} md={12} sm={12} xs={12} className="d-flex justify-content-lg-end justify-content-start gap-2 mb-2 me-0 pe-0 ps-0 ms-0">
            <Button
              variant="outline-secondary"
              title="Refresh Tickets"
              size="sm"
              onClick={handleRefresh}
            >
              <FontAwesomeIcon icon={faRefresh} /> Refresh
            </Button>

            <Dropdown
              show={showSearchDropdown}
              onToggle={() => setShowSearchDropdown(!showSearchDropdown)}
            >
              <Dropdown.Toggle variant="outline-secondary" as={Button} size="sm">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </Dropdown.Toggle>

              <Dropdown.Menu align="end" style={{ minWidth: "300px" }}>
                <Form className="px-3 py-2">
                  <Form.Label className="small text-muted mb-1">Search Filter</Form.Label>
                  <Form.Select
                    value={searchType}
                    onChange={(e) => {
                      setSearchType(e.target.value);
                      setSearchTextInput(""); // clear text when switching type
                    }}
                    className="mb-2"
                    size="sm"
                  >
                    <option value="name">Name / Contact</option>
                    <option value="employeeName">Employee Name</option>
                    <option value="accommodation">Accommodation</option>
                  </Form.Select>

                  {searchType === "employeeName" ? (
                    <Form.Select
                      value={searchTextInput}
                      onChange={(e) => setSearchTextInput(e.target.value)}
                      className="mb-2"
                      size="sm"
                    >
                      <option value="">Select Employee</option>
                      {Object.values(employeeMap).map((emp) => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.firstname} {emp.surname}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <FormControl
                      type="text"
                      placeholder={
                        searchType === "name"
                          ? "Search by name or contact"
                          : "Search by accommodation"
                      }
                      value={searchTextInput}
                      onChange={(e) => setSearchTextInput(e.target.value)}
                      className="mb-2"
                      size="sm"
                    />
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setShowSearchDropdown(false);
                      handleSearch();
                    }}
                  >
                    Search
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="ms-2"
                    onClick={() => {
                      setSearchTextInput(""); // clear input
                      setSearchType("name"); // reset dropdown
                      setShowSearchDropdown(false);
                      handleSearchReset?.();      // optional custom reset function

                      // setFilteredTickets(allFilteredTickets);
                    }}
                  >
                    Reset
                  </Button>
                </Form>

              </Dropdown.Menu>
            </Dropdown>

            <Dropdown
              show={showGroupFilter}
              onToggle={() => setShowGroupFilter(!showGroupFilter)}
            >
              <Dropdown.Toggle
                variant="outline-secondary"
                title="Group Filter"
                size="sm"
              >
                <FontAwesomeIcon icon={faLayerGroup} />
              </Dropdown.Toggle>

              <Dropdown.Menu
                style={{ minWidth: "280px", padding: "15px", maxHeight: "400px", overflowY: "auto" }}
              >
                <Form>
                  {/* Status Filter */}
                  <Form.Group controlId="filter-status" className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      size="sm"
                    >
                      <option value="">All</option>
                      <option value="Queued">Queued</option>
                      <option value="On Time">On Time</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Done">Done</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Canceled">Canceled</option>
                      <option value="Schedule Change">Schedule Change</option>
                      <option value="Reassigned">Reassigned</option>
                      <option value="Relocate">Relocate</option>
                      <option value="On Emergency">On Emergency</option>
                    </Form.Select>

                  </Form.Group>

                  {/* Country Filter */}
                  <Form.Group controlId="filter-country" className="mb-3">
                    <Form.Label>Country</Form.Label>
                    <Select
                      options={countryOptions}
                      value={
                        filterCountry
                          ? { value: filterCountry, label: filterCountry }
                          : { value: "", label: "All Countries" }
                      }
                      onChange={(selected) => setFilterCountry(selected?.value || "")}
                      isClearable
                      placeholder="Select Country"
                      styles={{ control: (base) => ({ ...base, minHeight: "31px", fontSize: "0.875rem" }) }}
                    />
                  </Form.Group>

                  {/* Town Filter */}
                  <Form.Group controlId="filter-town" className="mb-3">
                    <Form.Label>Town</Form.Label>
                    <Select
                      options={townOptions}
                      value={
                        filterTown
                          ? { value: filterTown, label: filterTown }
                          : { value: "", label: "All Towns" }
                      }
                      onChange={(selected) => setFilterTown(selected?.value || "")}
                      isClearable
                      placeholder="Select Town"
                      styles={{ control: (base) => ({ ...base, minHeight: "31px", fontSize: "0.875rem" }) }}
                    />
                  </Form.Group>

                  {/* Residency Filter */}
                  <Form.Group controlId="filter-residency" className="mb-3">
                    <Form.Label>Residency</Form.Label>
                    <Form.Select
                      value={filterResidency}
                      onChange={(e) => setFilterResidency(e.target.value)}
                      size="sm"
                    >
                      <option value="">All</option>
                      <option value="local">Local</option>
                      <option value="foreign">Foreign</option>
                    </Form.Select>
                  </Form.Group>

                  {/* Sex Filter */}
                  <Form.Group controlId="filter-sex" className="mb-3">
                    <Form.Label>Sex</Form.Label>
                    <Form.Select
                      value={filterSex}
                      onChange={(e) => setFilterSex(e.target.value)}
                      size="sm"
                    >
                      <option value="">All</option>
                      <option value="males">Male</option>
                      <option value="females">Female</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </Form.Select>
                  </Form.Group>

                  {/* Age Bracket Filter */}
                  <Form.Group controlId="filter-age" className="mb-3">
                    <Form.Label>Age Bracket</Form.Label>
                    <Form.Select
                      value={filterAgeBracket}
                      onChange={(e) => setFilterAgeBracket(e.target.value)}
                      size="sm"
                    >
                      <option value="">All</option>
                      <option value="kids">Kids</option>
                      <option value="teens">Teens</option>
                      <option value="adults">Adults</option>
                      <option value="seniors">Seniors</option>
                    </Form.Select>
                  </Form.Group>

                  <div className="d-grid gap-2 mt-3">
                    <Button variant="primary" size="sm" onClick={() => handleSearch()}>
                      Apply Filters
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setFilterStatus("");
                        setFilterResidency("");
                        setFilterSex("");
                        setFilterAgeBracket("");
                        setFilterCountry("");
                        setFilterTown("");
                        setFilteredTickets(allFilteredTickets);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </Form>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown
              show={showDateSearchDropdown}
              onToggle={() => setShowDateSearchDropdown(!showDateSearchDropdown)}
            >
              <Dropdown.Toggle
                as={Button}
                variant="outline-secondary"
                title="Date Range Search"
                size="sm"
              >
                <FontAwesomeIcon icon={faCalendarDays} />
              </Dropdown.Toggle>

              <Dropdown.Menu className="p-3" style={{ minWidth: "250px" }}>
                <Form.Group className="mb-2">
                  <Form.Label className="small mb-1 text-muted">Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    size="sm"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small mb-1 text-muted">End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDateInput}
                    min={startDateInput}
                    onChange={(e) => setEndDateInput(e.target.value)}
                    size="sm"
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

                {/* Select Month Filter */}
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Select Month</Form.Label>
                  <Form.Control
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      if (e.target.value) {
                        const [year, month] = e.target.value.split("-");
                        const start = new Date(year, month - 1, 1);
                        const end = new Date(year, month, 0);
                        end.setHours(23, 59, 59, 999);
                        const formatDateLocal = (date) => date.toLocaleDateString("en-CA");
                        setStartDateInput(formatDateLocal(start));
                        setEndDateInput(formatDateLocal(end));
                        setSelectedDateFilter("");
                        setSelectedYear("");
                      }
                    }}
                    size="sm"
                  />
                </Form.Group>

                {/* Select Year Filter */}
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Select Year</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g. 2025"
                    value={selectedYear}
                    min="2000"
                    max="2100"
                    onChange={(e) => {
                      const input = e.target.value;
                      setSelectedYear(input);
                      if (input.length === 4 && !isNaN(input)) {
                        const start = new Date(input, 0, 1);
                        const end = new Date(input, 11, 31, 23, 59, 59, 999);
                        const formatDateLocal = (date) => date.toLocaleDateString("en-CA");
                        setStartDateInput(formatDateLocal(start));
                        setEndDateInput(formatDateLocal(end));
                        setSelectedDateFilter("");
                        setSelectedMonth("");
                      }
                    }}
                    size="sm"
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-100 mt-2 mb-4"
                  onClick={() => {
                    setShowDateSearchDropdown(false);
                    setTriggerSearch(true);
                  }}
                >
                  Apply Date Filter
                </Button>
              </Dropdown.Menu>
            </Dropdown>

            <Button
              variant="outline-secondary"
              title="Download"
              onClick={handleDownloadTable}
              size="sm"
            >
              <FontAwesomeIcon icon={faDownload} />
            </Button>

            <Dropdown>
              <Dropdown.Toggle
                variant="outline-secondary"
                title="Export"
                size="sm"
              >
                <FontAwesomeIcon icon={faPrint} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={exportToPDF}>Export as PDF</Dropdown.Item>
                <Dropdown.Item onClick={exportToExcel}>Export as Excel</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown
              show={showColumnDropdown}
              onToggle={() => setShowColumnDropdown(!showColumnDropdown)}
            >
              <Dropdown.Toggle
                variant="outline-secondary"
                title="Customize Columns"
                size="sm"
              >
                <FontAwesomeIcon icon={faColumns} />
              </Dropdown.Toggle>

              <Dropdown.Menu
                style={{ maxHeight: "300px", overflowY: "auto", padding: "10px 15px", minWidth: "220px" }}
              >
                <div className="d-flex justify-content-between mb-2">
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0"
                    onClick={() => setVisibleColumns(allColumns.map(col => col.key))}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0"
                    onClick={() => setVisibleColumns([])}
                  >
                    Unselect All
                  </Button>
                </div>

                <Form>
                  {allColumns.map(col => (
                    <Form.Check
                      key={col.key}
                      type="checkbox"
                      id={`toggle-${col.key}`}
                      label={col.label}
                      checked={visibleColumns.includes(col.key)}
                      onChange={() => {
                        setVisibleColumns(prev =>
                          prev.includes(col.key)
                            ? prev.filter(k => k !== col.key)
                            : [...prev, col.key]
                        );
                      }}
                      size="sm"
                    />
                  ))}
                </Form>
              </Dropdown.Menu>
            </Dropdown>


          </Col>
        </Row>





        {isLoading ? (
          <div ref={scrollRef} className="custom-scroll-wrapper table-border">
            {startDateInput && endDateInput && (
              <div className="mb-3 text-muted mt-2">
                Showing data from{" "}
                <strong>{new Date(startDateInput).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</strong>{" "}
                to{" "}
                <strong>{new Date(endDateInput).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</strong>
              </div>
            )}
            <div className="text-center my-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="mt-2 text-muted">Loading results...</p>
            </div>
          </div>

        ) : dataToRender.length === 0 && hasFiltered ? (
          <div ref={scrollRef} className="custom-scroll-wrapper table-border">
            {startDateInput && endDateInput && (
              <div className="mb-3 text-muted mt-2">
                Showing data from{" "}
                <strong>{new Date(startDateInput).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</strong>{" "}
                to{" "}
                <strong>{new Date(endDateInput).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</strong>
              </div>
            )}
            <div className="text-center my-5 text-muted">
              No data available.
            </div>
          </div>

        ) : (
          <div ref={scrollRef} className="custom-scroll-wrapper table-border">
            <div ref={tableRef} className="mt-2">
              {startDateInput && endDateInput && (
                <div className="mb-3 text-muted">
                  Showing data from{" "}
                  <strong>{new Date(startDateInput).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</strong>{" "}
                  to{" "}
                  <strong>{new Date(endDateInput).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</strong>
                </div>
              )}

              <Table bordered hover style={{ minWidth: "1400px" }}>
                <thead>
                  <tr>
                    {allColumns.map(col =>
                      visibleColumns.includes(col.key) && (
                        <th key={col.key}>{col.label}</th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {ticketsToRender.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length} className="text-center text-muted">
                        No results found for today.
                      </td>
                    </tr>
                  ) : (
                    ticketsToRender.map(t => {

                      const getRowText = (t) => {
                        return [
                          `ticketId: ${t.id}`,
                          `name: ${t.name}`,
                          `contact: ${t.contact}`,
                          `address: ${renderAddressText(t)}`,
                          `startTime: ${new Date(t.start_date_time).toLocaleString()}`,
                          `endTime: ${new Date(t.end_date_time).toLocaleString()}`,
                          `totalPax: ${t.total_pax}`,
                          `locals: ${total(t.address, 'locals')}`,
                          `foreigns: ${total(t.address, 'foreigns')}`,
                          `males: ${total(t.address, 'males')}`,
                          `females: ${total(t.address, 'females')}`,
                          `preferNotToSay: ${total(t.address, 'prefer_not_to_say')}`,
                          `kids: ${total(t.address, 'kids')}`,
                          `teens: ${total(t.address, 'teens')}`,
                          `adults: ${total(t.address, 'adults')}`,
                          `seniors: ${total(t.address, 'seniors')}`,
                          `assignedTo: ${getEmployeeName(t)}`,
                          `assigneeContact: ${getEmployeeContact(t)}`,
                          `activityAvailed: ${getActivitiesText(t)}`,
                          `totalDuration: ${t.total_duration || 0}`,
                          `expectedPayment: ₱${t.total_expected_payment?.toLocaleString() || "0.00"}`,
                          `totalPayment: ₱${t.total_payment?.toLocaleString() || "0.00"}`,
                          `markup: ${t.total_markup.toFixed(2)}%`,
                          `expectedSale: ₱${t.total_expected_sale?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                          `scannedBy: ${t.scan_logs?.find(l => l.status === 'scanned')?.updated_by || '-'}`,
                        ].join("\n");
                      };

                      const rowData = {
                        actions: (
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteTicket(t.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>

                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => {
                                const text = getRowText(t);
                                navigator.clipboard.writeText(text).then(() => {
                                  Swal.fire("Copied!", "Row data has been copied to clipboard.", "success");
                                }).catch(() => {
                                  Swal.fire("Failed", "Unable to copy to clipboard.", "error");
                                });
                              }}
                            >
                              <FontAwesomeIcon icon={faCopy} />
                            </Button>
                          </div>
                        ),



                        status: <Badge bg={getStatusBadgeVariant(computeStatus(t))}>{computeStatus(t)}</Badge>,

                        ticketId: t.id,
                        name: t.name,
                        contact: t.contact,
                        accommodation: t.accommodation,

                        address: renderAddress(t),

                        startTime: new Date(t.start_date_time).toLocaleString(),
                        endTime: new Date(t.end_date_time).toLocaleString(),
                        totalPax: t.total_pax,
                        locals: total(t.address, 'locals'),
                        foreigns: total(t.address, 'foreigns'),
                        males: total(t.address, 'males'),
                        females: total(t.address, 'females'),
                        preferNotToSay: total(t.address, 'prefer_not_to_say'),
                        kids: total(t.address, 'kids'),
                        teens: total(t.address, 'teens'),
                        adults: total(t.address, 'adults'),
                        seniors: total(t.address, 'seniors'),
                        assignedTo: getEmployeeName(t),
                        assigneeContact: getEmployeeContact(t),
                        activityNames: renderActivities(t),
                        totalDuration: `${t.total_duration || 0} min`,
                        expectedPayment: `₱${t.total_expected_payment?.toLocaleString() || "0.00"}`,
                        totalPayment: `₱${t.total_payment?.toLocaleString() || "0.00"}`,
                        markup: `${t.total_markup.toFixed(2)}%`,
                        expectedSale: `₱${t.total_expected_sale?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`,
                        scannedBy: t.scan_logs?.find(l => l.status === 'scanned')?.updated_by || '-',
                      };



                      return (
                        <tr key={t.id}>
                          {allColumns.map(col =>
                            visibleColumns.includes(col.key) && (
                              <td key={col.key}>{rowData[col.key]}</td>
                            )
                          )}
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

      <div className="d-flex justify-content-between align-items-center mt-3 px-2 flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">


          {/* ⬇️ Rows per Page Selector */}
          <Form.Group className="d-flex align-items-center gap-2 mb-0">
            <Form.Label className="mb-0 small">Rows per page</Form.Label>
            <Form.Select
              style={{ width: "auto" }}
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page on change
              }}
            >
              {[5, 10, 20, 50, 100].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>




        <div>
          <span className="me-3">
            Page {currentPage} of {totalPages}
          </span>
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
      {/* <div className="d-flex justify-content-center mt-4 mb-5">
        <Button
          variant={showSummary ? "outline-danger" : "outline-secondary"}
          onClick={toggleSummary}
          disabled={loadingSummary}
        >
          {loadingSummary
            ? "Loading..."
            : showSummary
              ? "Hide Summary"
              : "Show Summary"}
        </Button>
      </div> */}
      <>

        <div className="d-flex justify-content-between align-items-center mb-3 mt-5">
          {/* Filter Buttons */}
          <div>
            <Form.Group controlId="statusFilter" style={{ display: "inline-block" }}>
              <Form.Label className="me-2 ms-2">Status Filter:</Form.Label>
              <Form.Select
                size="sm"
                value={summaryFilter}
                onChange={(e) => setSummaryFilter(e.target.value)}
                style={{ width: "200px", display: "inline-block" }}
              >
                <option value="all">All Tickets</option>
                <option value="scanned">Scanned Tickets Only</option>
              </Form.Select>
            </Form.Group>
          </div>




        </div>


        <div className="mt-2 bg-white p-2" ref={reportRef}>
          <Tabs defaultActiveKey="summary" className="mb-4">

            {/* Summary Tab */}
            <Tab eventKey="summary" title="Summary" className="bg-white" ref={summaryRef}>
              <div className="d-flex align-items-center justify-content-between mt-4 mx-2">
                <h6 className="mb-0">Summary</h6>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleDownloadImage}
                >
                  <FontAwesomeIcon icon={faDownload} />
                </Button>
              </div>

              <small className="text-muted mx-2">
                Overview of key metrics with charts, tables, and rankings, including data segmentation and bracket breakdowns.
              </small>
              <br></br>
              <small className="text-muted mb-5 mx-2">
                <Badge bg="secondary" className="me-1 mt-2">
                  {summary.totalTickets}
                </Badge>{" "}
                ticket(s) from{" "}
                <strong>
                  {new Date(startDateInput).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </strong>{" "}
                to{" "}
                <strong>
                  {new Date(endDateInput).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </strong>
              </small>

              {(!isSmallScreen || showFullSummary) && (
                <>
                  <Row className="mb-3 g-3 mt-3">
                    {Object.entries(statusCounts).map(([status, count], idx) => (
                      <Col key={idx} md={2} sm={6} xs={6}>
                        <div className="summary-card border rounded bg-white text-muted p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center">
                          <div>
                            <p className="mb-1 fw-semibold">{status}</p>
                            <h6 className="mb-0 text-dark">
                              <Badge bg={getStatusBadgeVariant(status)}>{count}</Badge>
                            </h6>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>

                  <Row className="mb-2 g-3">
                    {[
                      { label: "Total Pax", value: summary.totalPax?.toLocaleString() || "0" },
                      { label: "Expected Payment", value: `₱${summary.expectedPayment?.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                      { label: "Actual Payment", value: `₱${summary.totalPayment?.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                      { label: "Expected Sale", value: `₱${summary.totalExpectedSale?.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                      { label: "Avg. Markup", value: `${averageMarkup?.toFixed(2)}%` },
                      { label: "Avg. Sale per Ticket", value: `₱${averageSalePerTicket?.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                    ].map((item, idx) => (
                      <Col key={idx} md={2} sm={6} xs={6}>
                        <div className="summary-card border rounded bg-white text-muted p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center">
                          <div>
                            <p className="mb-1 fw-semibold">{item.label}</p>
                            <Badge bg="light" text="dark"><h6 className="mb-0 text-dark">{item.value}</h6></Badge>

                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                  <Row className="g-3 mt-2">
                    <Col md={12}>
                      <Card className="summary-card border rounded p-3 text-muted h-100 bg-white" ref={tableRefSummaryImage}>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="text-muted small fw-semibold">
                            <h6 className="text-muted mt-2">
                              Pax Summary from{" "}
                              {new Date(startDateInput).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                              })}
                              {" "}
                              to{" "}
                              {new Date(endDateInput).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                              })}
                            </h6>

                          </div>
                          <div>
                            <Button variant="light" size="sm" className="me-2" onClick={handleDownloadImageSummary}>
                              <FontAwesomeIcon icon={faDownload} />
                            </Button>
                            <Button variant="light" size="sm" onClick={handleDownloadExcel}>
                              <FontAwesomeIcon icon={faTable} />
                            </Button>
                          </div>

                        </div>

                        <Table striped bordered hover responsive ref={tableRefSummary}>
                          <thead>
                            <tr>
                              <th>Month</th>
                              {[...Array(daysInMonth)].map((_, i) => (
                                <th key={i + 1}>{i + 1}</th>
                              ))}
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {months.map(month => {
                              const days = groupedData[month] || {};
                              return (
                                <tr key={month}>
                                  <td>{month}</td>
                                  {[...Array(daysInMonth)].map((_, i) => (
                                    <td key={i + 1}>{days[i + 1] || ""}</td>
                                  ))}
                                  <td className="fw-bold">{getMonthTotal(days)}</td>
                                </tr>
                              );
                            })}
                            {months.length > 0 && (
                              <tr>
                                <td colSpan={daysInMonth + 1} className="text-end fw-bold">
                                  Grand Total
                                </td>
                                <td className="fw-bold">{getGrandTotal()}</td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </Card>


                    </Col>
                  </Row>
                  <Row className="g-3 mt-2">
                    <Col md={4}>
                      <SummaryPieChart
                        title="Residency Breakdown"
                        loading={false}
                        data={hasResidencyData ? residencyData : []}
                      />
                    </Col>
                    <Col md={4}>
                      <SummaryPieChart
                        title="Sex Breakdown"
                        loading={false}
                        data={hasSexData ? sexData : []}
                      />
                    </Col>
                    <Col md={4}>
                      <SummaryPieChart
                        title="Age Breakdown"
                        loading={false}
                        data={hasAgeData ? ageData : []}
                      />
                    </Col>
                  </Row>

                  <Row className="g-3 mt-2">

                    <Col md={4}>
                      <TopRankingChart
                        title="Top Countries by Pax"
                        data={topCountries}
                        loading={filteredSummaryTickets.length === 0}
                      />
                    </Col>
                    <Col md={4}>
                      <TopRankingChart
                        title="Top Domestic Towns by Pax (Philippines)"
                        data={topTowns}
                        loading={filteredSummaryTickets.length === 0}
                      />
                    </Col>
                    <Col md={4}>
                      <TopRankingChart
                        title="Top Generating Countries (by Expected Sale)"
                        data={topCountriesBySale}
                        loading={filteredSummaryTickets.length === 0}
                      />
                    </Col>
                  </Row>
                  <Row className="g-3 mt-2">
                    <Col md={4}>
                      <TopRankingChart
                        title="Top Generating Philippine Towns (by Expected Sale)"
                        data={topTownsBySale}
                        loading={filteredSummaryTickets.length === 0}
                      />
                    </Col>
                    <Col md={4}>
                      <TopRankingChart
                        title="Top Activities Availed (by Pax)"
                        data={topActivities}
                        loading={allResolvedActivities.length === 0}
                      />
                    </Col>
                    <Col md={4}>
                      <TopRankingChart
                        title="Top Generating Activities (by Expected Sale)"
                        data={topActivitiesBySale}
                        loading={allResolvedActivities.length === 0}
                      />
                    </Col>
                  </Row>

                  <Row className="g-3 mt-2">


                    <Col md={4}>
                      <TopRankingChart
                        title="Top Performing Employees (by Tickets)"
                        data={topEmployees}
                        loading={filteredSummaryTickets.length === 0}
                      />
                    </Col>
                    <Col md={4}>
                      <TopRankingChart
                        title="TopPerforming Employees (by Pax)"
                        data={topEmployeesByPax}
                        loading={filteredSummaryTickets.length === 0}
                      />
                    </Col>
                    <Col md={4}>
                      <TopRankingChart
                        title="Top Employees (by Expected Sale)"
                        data={topEmployeesBySale}
                        loading={filteredSummaryTickets.length === 0}
                      />
                    </Col>


                  </Row>


                </>
              )}
            </Tab>

            {/* Performance Tab */}
            <Tab eventKey="performance" title="Performance">
              <h6 className="mt-4 mx-2">Performance</h6>
              <small className="text-muted  mx-2">
                This section shows performance metrics compared to previous data, helping identify trends and changes over time.
              </small>

              <Row className="g-3 mt-2">
                <Col md={12}>
                  <TicketsSummaryTable
                    loading={!hasFilteredSummaryData}
                    filterType={summaryFilter}
                  />
                </Col>
              </Row>
            </Tab>

            {/* Insights Tab */}
            <Tab eventKey="insights" title="Insights">
              <h6 className="mt-4  mx-2">Insights</h6>
              <small className="text-muted  mx-2">
                Provides forecasts and side-by-side comparisons of different datasets to uncover patterns and opportunities.
              </small>
              <br></br>
              <small className="text-muted mt-2  mx-2">
                Insights from data dated{" "}
                <strong>
                  {new Date(startDateInput).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </strong>{" "}
                to{" "}
                <strong>
                  {new Date(endDateInput).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </strong>
              </small>


              <Row className="mb-4 mt-2 g-3">
                <Col md={12}>
                  <Tabs defaultActiveKey="ticketVsPax" id="dashboard-tabs" className="mb-3">

                    <Tab eventKey="expectedSales" title="Expected Sale Forecast">
                      <ExpectedSaleForecastChart
                        title="Expected Sale Forecast"
                        tickets={filteredSummaryTickets}
                        startDate={startDateInput}
                        endDate={endDateInput}
                      />
                    </Tab>
                    <Tab eventKey="timeHeatMap" title="Activity Time Heat Map">
                      <ActivitiesHeatmapChart
                        title="Activity Time Heat Map"
                        tickets={filteredSummaryTickets}
                        startDate={startDateInput}
                        endDate={endDateInput}
                        filterType={summaryFilter}

                      />
                    </Tab>
                    <Tab eventKey="ageGenderComp" title="Age Gender Comparative">
                      <AgeGenderLineChart
                        title="Age Gender Comparative"
                        tickets={filteredSummaryTickets}
                        startDate={startDateInput}
                        endDate={endDateInput}
                        filterType={summaryFilter}

                      />
                    </Tab>

                    <Tab eventKey="paymentVsActual" title="Expected vs Actual Payment">
                      <PaymentPaxLineChart
                        title="Expected vs Actual Payment"
                        tickets={filteredSummaryTickets}
                        startDate={startDateInput}
                        endDate={endDateInput}
                      />
                    </Tab>

                    <Tab eventKey="localVsForeign" title="Local vs Foreign">
                      <TicketLocalVsForeign
                        title="Local vs Foreign"
                        tickets={filteredSummaryTickets}
                        startDate={startDateInput}
                        endDate={endDateInput}
                      />
                    </Tab>
                    <Tab eventKey="scannedVsCreated" title="Tickets Generated vs Scanned">
                      <TicketStatusLineChart
                        title="Ticket Generate vs Scanned"
                        tickets={filteredSummaryTickets}
                        startDate={startDateInput}
                        endDate={endDateInput}
                        filterType={summaryFilter}

                      />
                    </Tab>
                    <Tab eventKey="ticketVsPax" title="Ticket Vs Pax Forecast">
                      <TicketPaxVsTicket
                        title="Ticket Vs Pax Forecast"
                        tickets={filteredSummaryTickets}
                        startDate={startDateInput}
                        endDate={endDateInput}
                      />
                    </Tab>





                  </Tabs>
                </Col>
              </Row>

            </Tab>




          </Tabs>

          {isSmallScreen && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="link"
                onClick={() => setShowFullSummary(prev => !prev)}
              >
                {showFullSummary ? "Read less" : "Read more"}
              </Button>
            </div>
          )}
          <p className="mt-5 mb-5 text-muted small text-center">
            <strong>Reminder:</strong> All information displayed is handled in compliance with the
            <a href="https://www.privacy.gov.ph/data-privacy-act/" target="_blank" rel="noopener noreferrer"> Data Privacy Act of 2012 (RA 10173)</a> of the Philippines.
            Please ensure that personal data is accessed and used only for authorized and lawful purposes.
          </p>
        </div>

      </>




    </>
  );
};

export default TouristActivityStatusBoard;
