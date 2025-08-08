import React, { useRef, useMemo } from "react";
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
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { toPng } from "html-to-image";
import download from "downloadjs";
import dayjs from "dayjs";

const ExpectedSaleForecastChart = ({
  title = "Expected Sale Forecast",
  tickets = [],
  startDate,
  endDate,
}) => {
  const chartRef = useRef(null);

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
        expectedSale: 0,
      };
    }

    tickets.forEach((ticket) => {
      let rawDate = ticket.start_date_time;
      if (rawDate && typeof rawDate.toDate === "function") {
        rawDate = rawDate.toDate();
      }

      const startTime = dayjs(rawDate);
      if (!startTime.isValid()) return;

      const label = startTime.format("YYYY-MM-DD");
      if (!dateMap[label]) return;

      dateMap[label].expectedSale += ticket.total_expected_sale || 0;
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

  if (chartData.length === 0) {
    return (
      <Card className="summary-card border rounded p-3 text-muted h-100 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">{title}</h6>
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
        <Button
          variant="light"
          size="sm"
          onClick={handleDownload}
          title="Download chart"
        >
          <FontAwesomeIcon icon={faDownload} />
        </Button>
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
              dataKey="expectedSale"
              name="Expected Sale"
              stroke="#ff9900"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default React.memo(ExpectedSaleForecastChart);
