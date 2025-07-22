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

const PaymentPaxLineChart = ({ title = "Line Chart", tickets = [], startDate, endDate }) => {
  const chartRef = useRef(null);
  const [showChart, setShowChart] = useState(false);

  const chartData = useMemo(() => {
    if (!startDate || !endDate || !tickets.length) return [];

    const start = dayjs(startDate).startOf("day");
    const end = dayjs(endDate).endOf("day");

    const dateMap = {};
    for (
      let d = start.clone();
      d.isBefore(end) || d.isSame(end, "day");
      d = d.add(1, "day")
    ) {
      const label = d.format("YYYY-MM-DD");
      dateMap[label] = {
        date: label,
        expectedPayment: 0,
        actualPayment: 0,
      };
    }

    tickets.forEach((ticket) => {
      let rawDate = ticket.start_date_time;

      if (rawDate && typeof rawDate.toDate === "function") {
        rawDate = rawDate.toDate();
      }

      const startTime = dayjs(rawDate);

      if (!startTime.isValid()) {
        console.warn("Invalid start_date_time in ticket:", ticket);
        return;
      }

      const label = startTime.format("YYYY-MM-DD");

      if (!dateMap[label]) return;

      dateMap[label].expectedPayment += ticket.total_expected_payment || 0;
      dateMap[label].actualPayment += ticket.total_payment || 0;
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
          Generate Expected vs Actual Payment
        </Button>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="summary-card border rounded p-3 text-muted h-100 bg-white my-2">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">{title}</h6>
          <Button
            variant="light"
            size="sm"
            onClick={() => setShowChart(false)}
            title="Hide chart"
          >
            <FontAwesomeIcon icon={faX} />
          </Button>
        </div>
        <div className="text-center text-muted my-5">No data available</div>
      </Card>
    );
  }

  return (
    <Card
      className="summary-card border rounded p-3 text-muted h-100 bg-white my-2"
      ref={chartRef}
    >
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">{title}</h6>
        <div className="d-flex gap-2">
          <Button
            variant="light"
            size="sm"
            onClick={handleDownload}
            title="Download chart"
          >
            <FontAwesomeIcon icon={faDownload} />
          </Button>
          <Button
            variant="light"
            size="sm"
            onClick={() => setShowChart(false)}
            title="Hide chart"
          >
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
            <YAxis />
            <Tooltip formatter={(value) => Number(value).toLocaleString()} />
            <Legend />
            <Line
              type="monotone"
              dataKey="expectedPayment"
              name="Expected Payment"
              stroke="#007bff"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="actualPayment"
              name="Actual Payment"
              stroke="#28a745"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default React.memo(PaymentPaxLineChart);
