import React, { useRef, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faX } from "@fortawesome/free-solid-svg-icons";
import { toPng } from "html-to-image";
import download from "downloadjs";
import dayjs from "dayjs";

const PaxVsTicketLineChart = ({ title = "Pax vs Ticket Report", tickets = [], startDate, endDate }) => {
  const chartRef = useRef(null);
  const [showChart, setShowChart] = useState(false);

  const chartData = useMemo(() => {
    if (!startDate || !endDate || !tickets.length) return [];

    const start = dayjs(startDate).startOf("day");
    const end = dayjs(endDate).endOf("day");

    const dateMap = {};
    for (let d = start.clone(); d.isBefore(end) || d.isSame(end, "day"); d = d.add(1, "day")) {
      const label = d.format("YYYY-MM-DD");
      dateMap[label] = {
        date: label,
        totalPax: 0,
        totalTickets: 0,
      };
    }

    tickets.forEach(ticket => {
      let rawDate = ticket.start_date_time;

      if (rawDate && typeof rawDate.toDate === "function") {
        rawDate = rawDate.toDate();
      }

      const startTime = dayjs(rawDate);

      // Optional: skip if invalid
      if (!startTime.isValid()) return;

      const label = startTime.format("YYYY-MM-DD");

      if (!dateMap[label]) return;

      const addresses = Array.isArray(ticket.address) ? ticket.address : [];
      const paxCount = addresses.reduce((sum, addr) => {
        const locals = Number(addr.locals || 0);
        const foreigns = Number(addr.foreigns || 0);
        return sum + locals + foreigns;
      }, 0);

      dateMap[label].totalPax += paxCount;
      dateMap[label].totalTickets += 1;
    });

    return Object.values(dateMap);
  }, [tickets, startDate, endDate]);

  const handleDownload = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, { backgroundColor: "#ffffff" });
      download(dataUrl, `${title.replace(/\s+/g, "-").toLowerCase()}.png`, "image/png");
    } catch (error) {
      console.error("Failed to download chart image:", error);
    }
  };

  if (!showChart) {
    return (
      <div className="text-center my-2">
        <Button variant="outline-secondary" size="sm" onClick={() => setShowChart(true)}>
          Generate Pax vs Ticket Chart
        </Button>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="summary-card border rounded p-3 text-muted h-100 bg-white my-2">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">{title}</h6>
          <Button variant="light" size="sm" onClick={() => setShowChart(false)} title="Hide chart">
            <FontAwesomeIcon icon={faX} />
          </Button>
        </div>
        <div className="text-center text-muted my-5">No data available</div>
      </Card>
    );
  }

  return (
    <Card className="summary-card border rounded p-3 text-muted h-100 bg-white my-2 " ref={chartRef}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">{title}</h6>
        <div className="d-flex gap-2">
          <Button variant="light" size="sm" onClick={handleDownload} title="Download chart">
            <FontAwesomeIcon icon={faDownload} />
          </Button>
          <Button variant="light" size="sm" onClick={() => setShowChart(false)} title="Hide chart">
            <FontAwesomeIcon icon={faX} />
          </Button>
        </div>
      </div>

      <div style={{ width: "100%", minHeight: 300 }}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              minTickGap={20}
              interval="preserveStartEnd"
              tickFormatter={(d) => dayjs(d).format("MMM D")}
            />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value) => Number(value).toLocaleString()} />
            <Legend />
            <Line
              type="monotone"
              dataKey="totalPax"
              name="Total Pax"
              stroke="#17a2b8"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="totalTickets"
              name="Total Tickets"
              stroke="#6f42c1"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default React.memo(PaxVsTicketLineChart);
