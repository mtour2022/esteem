import React, { useEffect, useRef, useState } from "react";
import { Card, Spinner, Button } from "react-bootstrap";
import { db } from "../config/firebase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { collection, doc, getDoc } from "firebase/firestore";
import dayjs from "dayjs";
import { toPng } from "html-to-image";
import download from "downloadjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTable } from "@fortawesome/free-solid-svg-icons";
const CertificateIssuanceForecastChart = ({ title, employees = [] }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const certIdSet = new Set(
          employees.flatMap((emp) => emp.tourism_certificate_ids || [])
        );

        const promises = [...certIdSet].map((id) =>
          getDoc(doc(db, "tourism_cert", id))
        );

        const results = await Promise.all(promises);
        const certs = results
          .map((snap) => (snap.exists() ? snap.data() : null))
          .filter(Boolean);

        const grouped = {};

        certs.forEach((cert) => {
          const issued = dayjs(cert.date_Issued).format("YYYY-MM-DD");
          grouped[issued] = (grouped[issued] || 0) + 1;
        });

        const chartData = Object.entries(grouped)
          .sort(([a], [b]) => new Date(a) - new Date(b))
          .map(([date, count]) => ({ date, count }));

        setData(chartData);
      } catch (err) {
        console.error("Failed to fetch certificates:", err);
      } finally {
        setLoading(false);
      }
    };

    if (employees.length) fetchCertificates();
  }, [employees]);

  const handleDownload = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, { backgroundColor: "#ffffff" });
      download(dataUrl, `${title.replace(/\s+/g, "-").toLowerCase()}.png`, "image/png");
    } catch (error) {
      console.error("Failed to download chart image:", error);
    }
  };

  return (
    <>
    <Card
      className="summary-card border rounded p-3 text-muted h-100 bg-white mx-0 mt-2 mb-5" ref={chartRef}
        
      >
      <div className="d-flex justify-content-between align-items-center my-2" >
        <h6 className="mb-0">{title}</h6>
        <Button variant="light" size="sm" onClick={handleDownload} title="Download chart">
                    <FontAwesomeIcon icon={faDownload} />
                  </Button>
      </div>
      
        {loading ? (
          <Spinner animation="border" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </>
  );
};

export default CertificateIssuanceForecastChart;
