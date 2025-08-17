import React, { useRef, useMemo } from "react";
import { Card, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { toPng } from "html-to-image";
import download from "downloadjs";
import dayjs from "dayjs";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  CartesianGrid,
} from "recharts";

const ActivitiesHeatmapChart = ({
  title = "Activities Most Busy Time of the Day",
  tickets = [],
  startDate,
  endDate,
  filterType,
}) => {
  const chartRef = useRef(null);

  const startDateObj = dayjs(startDate).startOf("day");
  const endDateObj = dayjs(endDate).endOf("day");

  // Prepare heatmap data
const chartData = useMemo(() => {
  if (!startDate || !endDate || !tickets.length) return [];

  const hoursMap = {};
  for (let h = 0; h < 24; h++) {
    hoursMap[h] = { hour: h, count: 0 };
  }

  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).endOf("day");

  tickets.forEach((ticket) => {
    let rawDate = ticket.start_date_time;
    if (rawDate && typeof rawDate.toDate === "function") rawDate = rawDate.toDate();
    const dt = dayjs(rawDate);
    if (!dt.isValid()) return;
    if (dt.isBefore(start) || dt.isAfter(end)) return;

    const hour = dt.hour();
    hoursMap[hour].count += 1;
  });

  // Only keep hours with activity
  return Object.values(hoursMap).filter((h) => h.count > 0);
}, [tickets, startDate, endDate]);


  const getColor = (count) => {
    if (count === 0) return "#f0f0f0";
    if (count < 3) return "#ffeda0";
    if (count < 6) return "#feb24c";
    if (count < 10) return "#f03b20";
    return "#990000";
  };

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
      <Card className="summary-card rounded p-3 text-muted h-100 bg-white my-2 border-0">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">{title}</h6>
        </div>
        <div className="text-center text-muted my-5">No data available</div>
      </Card>
    );
  }

  return (
    <Card
      className="summary-card rounded p-3 text-muted h-100 bg-white my-2 border-0"
      ref={chartRef}
    >
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="text-muted small fw-semibold">
          {title} ({startDateObj.format("MMM D")} - {endDateObj.format("MMM D, YYYY")}) (
          {filterType === "all" ? "All Tickets" : "Scanned Tickets"})
        </div>

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
          <ComposedChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
  type="category"
  dataKey="hour"
  tickFormatter={(h) => {
    const hour = h % 12 === 0 ? 12 : h % 12;
    const suffix = h < 12 ? "AM" : "PM";
    return `${hour}${suffix}`;
  }}
  interval={0}
  tick={{ fontSize: 12 }} // smaller font
/>

            <Tooltip
              formatter={(value) => [`${value} activities`, "Count"]}
              labelFormatter={(label) => `Hour: ${label}:00`}
            />
            <Legend />
            <Bar
              dataKey="count"
              name="Activities Count"
              fill="#8884d8"
              shape={(props) => {
                const { x, y, width, height, payload } = props;
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={getColor(payload.count)}
                  />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default React.memo(ActivitiesHeatmapChart);
