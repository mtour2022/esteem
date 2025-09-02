import React, { useRef, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";
import { Card, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { toPng } from "html-to-image";
import download from "downloadjs";
import dayjs from "dayjs";

const AgeGenderBarChart = ({
  title = "Age & Gender",
  tickets = [],
  startDate,
  endDate,
  filterType,
}) => {
  const chartRef = useRef(null);
  const startDateObj = startDate ? dayjs(startDate).startOf("day") : null;
  const endDateObj = endDate ? dayjs(endDate).endOf("day") : null;

  // ✅ Prepare Chart Data
  const chartData = useMemo(() => {
    if (!tickets.length) return [];

    const ageGroups = [
      { label: "Kids", key: "kids" },
      { label: "Teens", key: "teens" },
      { label: "Adults", key: "adults" },
      { label: "Seniors", key: "seniors" },
    ];

    return ageGroups.map((group) => {
      let male = 0;
      let female = 0;
      let preferNot = 0;

      tickets.forEach((ticket) => {
        let rawDate = ticket.start_date_time;
        if (rawDate && typeof rawDate.toDate === "function") {
          rawDate = rawDate.toDate();
        }
        const startTime = dayjs(rawDate);

        // Debug logs
        if (!startTime.isValid()) {
          console.warn("Skipping ticket - invalid date:", ticket);
          return;
        }

        if (startDateObj && startTime.isBefore(startDateObj)) {
          console.warn("Skipping ticket - before start date:", ticket);
          return;
        }
        if (endDateObj && startTime.isAfter(endDateObj)) {
          console.warn("Skipping ticket - after end date:", ticket);
          return;
        }

        if (filterType && ticket.type && ticket.type !== filterType) {
          console.warn("Skipping ticket - filterType mismatch:", ticket);
          return;
        }

        if (Array.isArray(ticket.address)) {
          ticket.address.forEach((addr) => {
            const groupCount = parseInt(addr[group.key] || "0", 10) || 0;
            const malesCount = parseInt(addr.males || "0", 10) || 0;
            const femalesCount = parseInt(addr.females || "0", 10) || 0;
            const preferCount = parseInt(addr.prefer_not_to_say || "0", 10) || 0;
            const totalGender = malesCount + femalesCount + preferCount;

            if (groupCount > 0 && totalGender > 0) {
              male += Math.round((malesCount / totalGender) * groupCount);
              female += Math.round((femalesCount / totalGender) * groupCount);
              preferNot += Math.round((preferCount / totalGender) * groupCount);
            }
          });
        }
      });

      const total = male + female + preferNot;
      const percentage =
        total > 0 ? ((total / tickets.length) * 100).toFixed(1) : 0;

      return {
        ageGroup: group.label,
        male,
        female,
        preferNot,
        total,
        percentage: `${percentage}%`,
      };
    });
  }, [tickets, startDateObj, endDateObj, filterType]);

  // ✅ Download Chart
  const handleDownload = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, { backgroundColor: "#ffffff" });
      download(dataUrl, `${title.replace(/\s+/g, "-").toLowerCase()}.png`, "image/png");
    } catch (error) {
      console.error("Failed to download chart image:", error);
    }
  };

  // ✅ No Data State
  if (!tickets.length) {
    return (
      <Card className="summary-card rounded p-3 text-muted h-100 bg-white my-2 border-0">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">{title}</h6>
        </div>
        <div className="text-center text-muted my-5">No data available</div>
      </Card>
    );
  }

  // ✅ Chart Render
  return (
    <Card
      className="summary-card rounded p-1 text-muted h-100 bg-white my-2 border-0"
      ref={chartRef}
    >
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="text-muted small fw-semibold">{title}</div>
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
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 40, left: 10, bottom: 0 }}
          >
            <XAxis 
  type="number" 
  tick={{ fontSize: 12 }} 
/>

            <YAxis
              dataKey="ageGroup"
              type="category"
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip />
            <Legend verticalAlign="top" align="left" iconType="circle" />
            <Bar dataKey="female" name="Female" fill="#6C63FF" radius={[0, 4, 4, 0]} />
            <Bar dataKey="male" name="Male" fill="#66BFFF" radius={[0, 4, 4, 0]} />
            <Bar
              dataKey="preferNot"
              name="Prefer not to say"
              fill="#999999"
              radius={[0, 4, 4, 0]}
            />
            <LabelList
              dataKey="percentage"
              position="right"
              style={{ fontSize: 12, fill: "#000" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default React.memo(AgeGenderBarChart);
