import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Table,
  Spinner,
  Card,
  Button, Col,
  Form,
} from "react-bootstrap";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTable } from "@fortawesome/free-solid-svg-icons";
import { toPng } from "html-to-image";
import download from "downloadjs";
import * as XLSX from "xlsx";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar,
  CartesianGrid, Legend
} from "recharts";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const daysInMonth = 31;

export default function TicketsSummaryTable({ allFilteredTickets = [], loading = false }) {
  const [mode, setMode] = useState("frequency");
  const [paxFilter, setPaxFilter] = useState("all");
  const [groupedData, setGroupedData] = useState({});
  const [chartData, setChartData] = useState([]);
  const tableRef = useRef();
  const chartRef = useRef();



  // Grouping data for table + chart together
  useEffect(() => {

    const now = dayjs();
    const chartGroup = {};
    const tableGroup = {};

    for (let i = 0; i < 12; i++) {
      const fullMonth = dayjs(new Date(now.year(), i, 1)).format("MMMM");
      const shortMonth = dayjs(new Date(now.year(), i, 1)).format("MMM");
      tableGroup[fullMonth] = {};
      chartGroup[shortMonth] = 0;
    }

    for (const ticket of allFilteredTickets) {
      const createdAt = ticket.created_at;
      const date = dayjs(createdAt instanceof Date ? createdAt : createdAt?.toDate?.());
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
      }

      tableGroup[month][day] += valueToAdd;
      chartGroup[shortMonth] += valueToAdd;
    }
    const chartFormatted = MONTH_LABELS.map(m => ({
      month: m,
      value: chartGroup[m] ?? 0,
    }));

    setGroupedData(tableGroup);
    setChartData(chartFormatted);



  }, [allFilteredTickets, mode, paxFilter]);

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

  return (
    <Card className="border rounded p-3 text-muted bg-white mb-5" ref={tableRef}>
      {/* Header / Controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex gap-2 align-items-center">
          <Form.Select size="sm" value={mode} onChange={e => setMode(e.target.value)}>
            <option value="frequency">Ticket Frequency</option>
            <option value="pax">Pax Summary</option>
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
          <Button variant="light" size="sm" onClick={handleDownloadImage}>
            <FontAwesomeIcon icon={faDownload} />
          </Button>
          <Button variant="light" size="sm" onClick={handleDownloadExcel}>
            <FontAwesomeIcon icon={faTable} />
          </Button>
        </div>
      </div>

      {/* Table Title */}
      <h6 className="fw-bold text-dark mb-3">
        {mode === "pax"
          ? "Summary per pax per month"
          : "Summary per ticket per month"}
      </h6>

      {/* Table */}
      <div>
        <Table striped bordered hover responsive>
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

      <div className="mt-4 bg-white" ref={chartRef}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="fw-bold text-dark mb-0">
            {mode === "pax" ? "Monthly Pax Summary" : "Monthly Ticket Frequency"}
          </h6>
          <Button variant="light" size="sm" onClick={handleDownloadChart}>
            <FontAwesomeIcon icon={faDownload} />
          </Button>
        </div>

        {/* ✅ No need for inline style div wrapper here */}
  <ResponsiveContainer width="100%" height={300}>
    <BarChart
      data={chartData}
      style={{ backgroundColor: "#ffffff" }} // Ensures white background for chart
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" interval={0} />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Legend />
      <Bar
        dataKey="value"
        name={mode === "pax" ? "Pax" : "Frequency"}
        fill="#007bff"
      />
    </BarChart>
  </ResponsiveContainer>


      </div>
    </Card>
  );
}
