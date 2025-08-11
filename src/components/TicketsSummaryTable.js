import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  Spinner,
  Card,
  Button, Badge,
  Form, Row, Col,
} from "react-bootstrap";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTable } from "@fortawesome/free-solid-svg-icons";
import { toPng } from "html-to-image";
import download from "downloadjs";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Tabs, Tab } from "react-bootstrap";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const daysInMonth = 31;

function TicketsSummaryTable({ allFilteredTickets = [], loading = false, filterType }) {
  const [mode, setMode] = useState("pax");
  const [paxFilter, setPaxFilter] = useState("all");
  const [groupedData, setGroupedData] = useState({});
  const [chartData, setChartData] = useState([]);
  const tableRef = useRef();
  const chartRef = useRef();
  const tableRefSummary = useRef();

  const [dateRangeOption, setDateRangeOption] = useState("This Month (the default)");
  const [dateRange, setDateRange] = useState({ start: dayjs().startOf("month"), end: dayjs() });
  const isDailyView = ["This Month (the default)", "This Week", "1st Half of the Month (1-15)", "2nd Half of the Month"].includes(dateRangeOption);


  useEffect(() => {
    const now = dayjs();
    let start, end;

    switch (dateRangeOption) {
      case "This Week":
        start = now.startOf("week");
        end = now.endOf("week");
        break;
      case "1st Half of the Month (1-15)":
        start = now.startOf("month");
        end = now.startOf("month").add(14, "day");
        break;
      case "2nd Half of the Month":
        start = now.startOf("month").add(15, "day");
        end = now.endOf("month");
        break;
      case "This Year":
        start = now.startOf("year");
        end = now;
        break;
      default:
        start = now.startOf("month");
        end = now;
    }

    setDateRange({ start, end });
  }, [dateRangeOption]);

  useEffect(() => {
    const now = dayjs();
    const chartGroup = {};
    const tableGroup = {};

    const startDate = dateRange.start;
    const endDate = dateRange.end;

    let tempDate = startDate;
    while (tempDate.isBefore(endDate) || tempDate.isSame(endDate)) {
      const label = isDailyView ? tempDate.format("MMM D") : tempDate.format("MMM");
      if (!chartGroup[label]) chartGroup[label] = 0;

      const monthLabel = tempDate.format("MMMM");
      if (!tableGroup[monthLabel]) tableGroup[monthLabel] = {};
      tableGroup[monthLabel][tempDate.date()] = 0;

      tempDate = tempDate.add(1, "day");
    }


    for (const ticket of allFilteredTickets) {
      let rawDate = ticket.start_date_time;
      if (rawDate && typeof rawDate.toDate === "function") {
        rawDate = rawDate.toDate();
      }

      const date = dayjs(rawDate);
      if (!date.isValid() || date.isBefore(dateRange.start) || date.isAfter(dateRange.end)) {
        continue;
      }

      const month = date.format("MMMM");
      const shortMonth = date.format("MMM");
      const day = date.date();

      if (!tableGroup[month][day]) tableGroup[month][day] = 0;

      let valueToAdd = 1;

      if (mode === "pax") {
        const addresses = ticket.address || [];
        valueToAdd = addresses.reduce((sum, addr) => {
          const locals = Number(addr.locals || 0);
          const foreigns = Number(addr.foreigns || 0);
          if (paxFilter === "locals") return sum + locals;
          if (paxFilter === "foreigns") return sum + foreigns;
          return sum + locals + foreigns;
        }, 0);
      } else if (mode === "payment") {
        valueToAdd = Number(ticket.total_payment || 0);
      } else if (mode === "expected_sale") {
        valueToAdd = Number(ticket.total_expected_sale || 0);
      }


      tableGroup[month][day] += valueToAdd;
      const chartLabel = isDailyView ? date.format("MMM D") : date.format("MMM");
      if (!chartGroup[chartLabel]) chartGroup[chartLabel] = 0;
      chartGroup[chartLabel] += valueToAdd;
    }



    const chartFormatted = Object.entries(chartGroup).map(([label, value]) => ({
      label,
      value,
    }));


    // Sort for chronological order
    chartFormatted.sort((a, b) => {
      const aDate = isDailyView
        ? dayjs(`${a.label} ${dayjs().year()}`, "MMM D YYYY")
        : dayjs(`${a.label} ${dayjs().year()}`, "MMM YYYY");
      const bDate = isDailyView
        ? dayjs(`${b.label} ${dayjs().year()}`, "MMM D YYYY")
        : dayjs(`${b.label} ${dayjs().year()}`, "MMM YYYY");
      return aDate.diff(bDate);
    });

    setGroupedData(tableGroup);
    setChartData(chartFormatted);
  }, [allFilteredTickets, mode, paxFilter, dateRange.start, dateRange.end]);

  const getMonthTotal = days => Object.values(days).reduce((sum, val) => sum + val, 0);
  const getGrandTotal = () =>
    Object.values(groupedData).reduce((acc, days) => acc + getMonthTotal(days), 0);

  const months = Object.keys(groupedData);

  const handleDownloadImage = async () => {
    if (!tableRef.current) return;
    try {
      const dataUrl = await toPng(tableRef.current);
      download(dataUrl, `tickets_summary_${mode}_${paxFilter}.png`);
    } catch (err) {
      console.error("Image download failed", err);
    }
  };
  const handleDownloadImageSummary = async () => {
    if (!tableRefSummary.current) return;
    try {
      const dataUrl = await toPng(tableRefSummary.current);
      download(dataUrl, `tickets_summary_${mode}_${paxFilter}.png`);
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
    XLSX.writeFile(workbook, `tickets_summary_${mode}_${paxFilter}.xlsx`);
  };

  const handleDownloadChart = async () => {
    if (!chartRef.current) return;

    const externalStyles = [...document.styleSheets].filter(
      sheet => sheet.href && sheet.href.includes("fonts.googleapis.com")
    );
    const backup = externalStyles.map(sheet => sheet.ownerNode);
    backup.forEach(node => node?.parentNode?.removeChild(node));

    try {
      const dataUrl = await toPng(chartRef.current);
      download(dataUrl, "chart.png");
    } catch (err) {
      console.error("Image download failed", err);
    } finally {
      backup.forEach(node => document.head.appendChild(node));
    }
  };

  if (loading && !allFilteredTickets.length) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <p>Loading summary...</p>
      </div>
    );
  }

  if (!loading && allFilteredTickets.length === 0) {
    return (
      <Card className="border rounded p-3 text-muted mb-5 text-center">
        <h6>No data available.</h6>
      </Card>
    );
  }

  const filteredTicketsInRange = allFilteredTickets.filter(ticket => {
    let rawDate = ticket.start_date_time;
    if (rawDate && typeof rawDate.toDate === "function") {
      rawDate = rawDate.toDate();
    }
    const date = dayjs(rawDate);
    return date.isValid() && !date.isBefore(dateRange.start) && !date.isAfter(dateRange.end);
  });

  const numberOfDays = dateRange.end.diff(dateRange.start, "day") + 1;

  // inside the component:

  // Step 1: Compute previous dateRange for comparison
  const getPreviousDateRange = (option) => {
    const now = dayjs();
    let start, end;

    switch (option) {
      case "This Week":
        start = now.startOf("week").subtract(1, "week");
        end = now.endOf("week").subtract(1, "week");
        break;
      case "1st Half of the Month (1-15)":
        // previous month first half
        start = now.startOf("month").subtract(1, "month");
        end = start.add(14, "day");
        break;
      case "2nd Half of the Month":
        // previous month second half
        start = now.startOf("month").subtract(1, "month").add(15, "day");
        end = start.endOf("month");
        break;
      case "This Year":
        start = now.startOf("year").subtract(1, "year");
        end = start.endOf("year");
        break;
      default: // "This Month (the default)"
        start = now.startOf("month").subtract(1, "month");
        end = start.endOf("month");
    }

    return { start, end };
  };

  const previousRange = getPreviousDateRange(dateRangeOption);

  // Step 2: Filter tickets for previous date range
  const filteredPreviousTickets = allFilteredTickets.filter(ticket => {
    let rawDate = ticket.start_date_time;
    if (rawDate && typeof rawDate.toDate === "function") {
      rawDate = rawDate.toDate();
    }
    const date = dayjs(rawDate);
    return date.isValid() && !date.isBefore(previousRange.start) && !date.isAfter(previousRange.end);
  });

  // Step 3: Number of days in previous range
  const previousNumberOfDays = previousRange.end.diff(previousRange.start, "day") + 1;

  // Step 4: Compute averages for previous period (pax, tickets, payment, expected sale)
  const getAvgPax = tickets => {
    if (tickets.length === 0) return 0;
    const totalPax = tickets.reduce((sum, ticket) => {
      const addresses = ticket.address || [];
      return sum + addresses.reduce((s, addr) => {
        const locals = Number(addr.locals || 0);
        const foreigns = Number(addr.foreigns || 0);
        return s + locals + foreigns;
      }, 0);
    }, 0);
    return totalPax / (tickets.length > 0 ? tickets.length : 1);
  };

  const getAvgPaxDaily = tickets => {
    if (tickets.length === 0) return 0;
    const totalPax = tickets.reduce((sum, ticket) => {
      const addresses = ticket.address || [];
      return sum + addresses.reduce((s, addr) => {
        const locals = Number(addr.locals || 0);
        const foreigns = Number(addr.foreigns || 0);
        return s + locals + foreigns;
      }, 0);
    }, 0);
    return totalPax / previousNumberOfDays;
  };

  const previousAvgPax = filteredPreviousTickets.length === 0 ? 0 :
    filteredPreviousTickets.reduce((sum, ticket) => {
      const addresses = ticket.address || [];
      return sum + addresses.reduce((s, addr) => {
        const locals = Number(addr.locals || 0);
        const foreigns = Number(addr.foreigns || 0);
        return s + locals + foreigns;
      }, 0);
    }, 0) / previousNumberOfDays;

  const previousAvgTickets = filteredPreviousTickets.length === 0 ? 0 : filteredPreviousTickets.length / previousNumberOfDays;

  const previousAvgPayment = filteredPreviousTickets.length === 0 ? 0 :
    filteredPreviousTickets.reduce((sum, ticket) => sum + (ticket.total_payment || 0), 0) / previousNumberOfDays;

  const previousAvgExpectedSale = filteredPreviousTickets.length === 0 ? 0 :
    filteredPreviousTickets.reduce((sum, ticket) => sum + (ticket.total_expected_sale || 0), 0) / previousNumberOfDays;

  // Step 5: Helper to compute percent difference and format it
  const getPercentDiffText = (current, previous) => {
    if (previous === 0) return ""; // Avoid division by zero or no comparison

    const diff = ((current - previous) / previous) * 100;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${diff.toFixed(1)}%`;
  };

  // Step 6: Map dateRangeOption to readable text for comparison phrase
  const previousLabelMap = {
    "This Month (the default)": "previous month",
    "This Week": "previous week",
    "1st Half of the Month (1-15)": "previous month (1st half)",
    "2nd Half of the Month": "previous month (2nd half)",
    "This Year": "previous year",
  };

  // Use previousLabelMap[dateRangeOption] for the "from previous ..." text
  const formatNumberK = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toLocaleString();
  };




  return (
    <div className="bg-white" ref={tableRef}>



      <Card className="border rounded p-3 text-muted bg-white mb-4">

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="text-muted small fw-semibold">
            {filterType === "all" ? "All Tickets" : "Scanned Tickets"} for {dateRange.start.format("MMM D")} - {dateRange.end.format("MMM D, YYYY")}
          </div>


          <div>
            <Button variant="light" size="sm" onClick={handleDownloadImage}>
              <FontAwesomeIcon icon={faDownload} />
            </Button>
          </div>

        </div>

        <Form.Select
          size="sm"
          value={dateRangeOption}
          onChange={e => setDateRangeOption(e.target.value)}
          style={{ maxWidth: "300px" }}
        >
          <option>This Month (the default)</option>
          <option>This Week</option>
          <option>1st Half of the Month (1-15)</option>
          <option>2nd Half of the Month</option>
          <option>This Year</option>
        </Form.Select>


        <Row className="mb-4 mt-1 g-3">
          <Col md={3}>
            <div className="summary-card border rounded bg-white text-muted p-3 h-100 d-flex flex-column justify-content-center align-items-start text-start">
              <div>
                <small className="mb-1 fw-semibold">Daily Avg. Pax</small>
                <h1 className="mb-0 d-flex align-items-center gap-2">
                  <Badge bg="light" text="dark" className="my-2">
                    {formatNumberK(
                      Math.round(
                        filteredTicketsInRange.reduce((sum, ticket) => {
                          const addresses = ticket.address || [];
                          return sum + addresses.reduce((s, addr) => {
                            const locals = Number(addr.locals || 0);
                            const foreigns = Number(addr.foreigns || 0);
                            return s + locals + foreigns;
                          }, 0);
                        }, 0) / numberOfDays
                      )
                    )}
                  </Badge>

                  <span
                    className={
                      getPercentDiffText(
                        filteredTicketsInRange.reduce((sum, ticket) => {
                          const addresses = ticket.address || [];
                          return sum + addresses.reduce((s, addr) => {
                            const locals = Number(addr.locals || 0);
                            const foreigns = Number(addr.foreigns || 0);
                            return s + locals + foreigns;
                          }, 0);
                        }, 0) / numberOfDays,
                        previousAvgPax
                      ).startsWith("+")
                        ? "text-success"
                        : "text-danger"
                    }
                    style={{ fontSize: "0.9rem", fontWeight: "normal" }}
                  >
                    {getPercentDiffText(
                      filteredTicketsInRange.reduce((sum, ticket) => {
                        const addresses = ticket.address || [];
                        return sum + addresses.reduce((s, addr) => {
                          const locals = Number(addr.locals || 0);
                          const foreigns = Number(addr.foreigns || 0);
                          return s + locals + foreigns;
                        }, 0);
                      }, 0) / numberOfDays,
                      previousAvgPax
                    )}
                  </span>
                </h1>

                <small className="text-muted">
                  from {previousLabelMap[dateRangeOption]}
                </small>
              </div>
            </div>
          </Col>



          <Col md={3}>
            <div className="summary-card border rounded bg-white text-muted p-3 h-100 d-flex flex-column justify-content-center align-items-start text-start">
              <div>
                <small className="mb-1 fw-semibold">Daily Avg. Tickets</small>
                <h1 className="mb-0 d-flex align-items-center gap-2">
                  <Badge bg="light" text="dark" className="my-2">
                    {Math.round(filteredTicketsInRange.length / numberOfDays).toLocaleString()}
                  </Badge>

                  <span
                    className={
                      getPercentDiffText(
                        filteredTicketsInRange.length / numberOfDays,
                        previousAvgTickets
                      ).startsWith("+")
                        ? "text-success"
                        : "text-danger"
                    }
                    style={{ fontSize: "0.9rem", fontWeight: "normal" }}
                  >
                    {getPercentDiffText(
                      filteredTicketsInRange.length / numberOfDays,
                      previousAvgTickets
                    )}
                  </span>
                </h1>

                <small className="text-muted">
                  from {previousLabelMap[dateRangeOption]}
                </small>
              </div>
            </div>
          </Col>

          <Col md={3}>
            <div className="summary-card border rounded bg-white text-muted p-3 h-100 d-flex flex-column justify-content-center align-items-start text-start">
              <div>
                <small className="mb-1 fw-semibold">Daily Avg. Actual Payment</small>
                <h1 className="mb-0 d-flex align-items-center gap-2">
                  <Badge bg="light" text="dark" className="my-2">
                    {Math.round(
                      filteredTicketsInRange.reduce(
                        (sum, ticket) => sum + (ticket.total_payment || 0),
                        0
                      ) / numberOfDays
                    ).toLocaleString()}
                  </Badge>

                  <span
                    className={
                      getPercentDiffText(
                        filteredTicketsInRange.reduce(
                          (sum, ticket) => sum + (ticket.total_payment || 0),
                          0
                        ) / numberOfDays,
                        previousAvgPayment
                      ).startsWith("+")
                        ? "text-success"
                        : "text-danger"
                    }
                    style={{ fontSize: "0.9rem", fontWeight: "normal" }}
                  >
                    {getPercentDiffText(
                      filteredTicketsInRange.reduce(
                        (sum, ticket) => sum + (ticket.total_payment || 0),
                        0
                      ) / numberOfDays,
                      previousAvgPayment
                    )}
                  </span>
                </h1>

                <small className="text-muted">
                  from {previousLabelMap[dateRangeOption]}
                </small>
              </div>
            </div>
          </Col>


          <Col md={3}>
            <div className="summary-card border rounded bg-white text-muted p-3 h-100 d-flex flex-column justify-content-center align-items-start text-start">
              <div>
                <small className="mb-1 fw-semibold">Daily Avg. Expected Sale</small>
                <h1 className="mb-0 d-flex align-items-center gap-2">
                  <Badge bg="light" text="dark" className="my-2">
                    {Math.round(
                      filteredTicketsInRange.reduce(
                        (sum, ticket) => sum + (ticket.total_expected_sale || 0),
                        0
                      ) / numberOfDays
                    ).toLocaleString()}
                  </Badge>

                  <span
                    className={
                      getPercentDiffText(
                        filteredTicketsInRange.reduce(
                          (sum, ticket) => sum + (ticket.total_expected_sale || 0),
                          0
                        ) / numberOfDays,
                        previousAvgExpectedSale
                      ).startsWith("+")
                        ? "text-success"
                        : "text-danger"
                    }
                    style={{ fontSize: "0.9rem", fontWeight: "normal" }}
                  >
                    {getPercentDiffText(
                      filteredTicketsInRange.reduce(
                        (sum, ticket) => sum + (ticket.total_expected_sale || 0),
                        0
                      ) / numberOfDays,
                      previousAvgExpectedSale
                    )}
                  </span>
                </h1>

                <small className="text-muted">
                  from {previousLabelMap[dateRangeOption]}
                </small>
              </div>
            </div>
          </Col>

        </Row>


        {/* <h6 className="fw-bold text-dark mb-3">
          {mode === "pax" ? "Summary per pax per month" : "Summary per ticket per month"}
        </h6> */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex gap-2 align-items-center">
            <Form.Select size="sm" value={mode} onChange={e => setMode(e.target.value)}>
              <option value="pax">Pax Summary</option>
              <option value="frequency">Ticket Frequency</option>

              <option value="payment">Total Payment</option>
              <option value="expected_sale">Total Expected Sale</option>

            </Form.Select>

            {mode === "pax" && (
              <Form.Select size="sm" value={paxFilter} onChange={e => setPaxFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="locals">Locals Only</option>
                <option value="foreigns">Foreigns Only</option>
              </Form.Select>
            )}
          </div>
          <div className="d-flex gap-2">


          </div>
        </div>

        {/* Tabbed Panel */}
        <Tabs defaultActiveKey="chart" id="summary-tabs" className="bg-white mb-3 ">
          {/* First Tab - Chart */}
          <Tab eventKey="chart" title="Chart" className="bg-white" ref={chartRef}>
            <div className="mt-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="text-muted small fw-semibold">

                  {mode === "pax"
                    ? "Pax Summary "
                    : mode === "payment"
                      ? "Total Payment "
                      : mode === "expected_sale"
                        ? "Expected Sale "
                        : "Ticket Frequency "}
                  ( {dateRange.start.format("MMM D")} - {dateRange.end.format("MMM D, YYYY")} ) ( {filterType === "all" ? "All Tickets" : "Scanned Tickets"} )

                </div>

                <Button variant="light" size="sm" onClick={handleDownloadChart}>
                  <FontAwesomeIcon icon={faDownload} />
                </Button>
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} style={{ backgroundColor: "#ffffff" }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" interval={0} />          <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={
                      mode === "pax"
                        ? "Pax"
                        : mode === "payment"
                          ? "Total Payment"
                          : mode === "expected_sale"
                            ? "Expected Sale"
                            : "Frequency"
                    }

                    stroke="#007bff"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>


            </div>
          </Tab>

          {/* Second Tab - Table */}
          <Tab eventKey="table" title="Table" className="bg-white">
            <div className="mt-4 bg-white" >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="text-muted small fw-semibold">
                  {mode === "pax"
                    ? "Pax Summary "
                    : mode === "payment"
                      ? "Total Payment "
                      : mode === "expected_sale"
                        ? "Expected Sale "
                        : "Ticket Frequency "}
                  ( {dateRange.start.format("MMM D")} - {dateRange.end.format("MMM D, YYYY")} ) ( {filterType === "all" ? "All Tickets" : "Scanned Tickets"} )
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
            </div>
            <div className="bg-white p-3 rounded">
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
            </div>
          </Tab>
        </Tabs>



      </Card>

    </div>

  );
}

export default React.memo(TicketsSummaryTable);
