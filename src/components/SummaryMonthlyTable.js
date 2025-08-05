import React, { useEffect, useState, useRef } from "react";
import { Table, Spinner, Button, Dropdown, Card, Row, Col } from "react-bootstrap";
import { db } from "../config/firebase";
import { doc, getDoc, collection } from "firebase/firestore";
import dayjs from "dayjs";
import { toPng } from "html-to-image";
import download from "downloadjs";
import * as XLSX from "xlsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

export default function TourismCertSummaryTable({ employees = [], loading = false }) {
    const [groupedData, setGroupedData] = useState({});
    const chartRef = useRef(null);
    const lineChartRef = useRef(null);
    const barChartRef = useRef(null);
    useEffect(() => {
        const fetchCertData = async () => {
            try {
                const allCertIds = employees.flatMap(emp => emp.tourism_certificate_ids || []);
                const uniqueIds = [...new Set(allCertIds)];

                const results = [];
                for (const id of uniqueIds) {
                    const certRef = doc(db, "tourism_cert", id);
                    const certSnap = await getDoc(certRef);
                    if (certSnap.exists()) {
                        results.push({ id: certSnap.id, ...certSnap.data() });
                    }
                }

                const now = dayjs();
                const grouped = {};

                // Initialize months with empty day entries
                for (let i = 0; i < 12; i++) {
                    const date = dayjs(new Date(now.year(), i, 1));
                    const monthLabel = date.format("MMMM YYYY");
                    grouped[monthLabel] = {};
                }

                // Populate data
                for (const cert of results) {
                    const issued = cert.date_Issued;
                    let date;

                    if (issued instanceof Date) {
                        date = dayjs(issued);
                    } else if (issued?.toDate) {
                        date = dayjs(issued.toDate());
                    } else if (typeof issued === "string" || typeof issued === "number") {
                        date = dayjs(issued);
                    } else {
                        console.warn("Invalid or missing date_Issued in certificate:", cert);
                        continue; // skip this cert
                    }

                    if (!date.isValid()) {
                        console.warn("Invalid date format for certificate:", cert);
                        continue;
                    }
                    const monthLabel = date.format("MMMM YYYY");
                    const day = date.date();
                    if (!grouped[monthLabel]) grouped[monthLabel] = {};
                    grouped[monthLabel][day] = (grouped[monthLabel][day] || 0) + 1;
                }

                setGroupedData(grouped);
            } catch (error) {
                console.error("Error fetching tourism certificate data:", error);
            }
        };

        if (employees.length > 0) {
            fetchCertData();
        }
    }, [employees]);

    const handleDownloadImage = async () => {
        if (!chartRef.current) return;
        try {
            const dataUrl = await toPng(chartRef.current, { backgroundColor: "#ffffff" });
            download(dataUrl, "tourism_cert_summary.png", "image/png");
        } catch (err) {
            console.error("Failed to download image:", err);
        }
    };

    const handleDownloadExcel = () => {
        const headers = ["Month", ...Array.from({ length: 31 }, (_, i) => i + 1), "Total"];
        const rows = Object.entries(groupedData).map(([month, days]) => {
            const row = [month];
            let total = 0;
            for (let day = 1; day <= 31; day++) {
                const count = days[day] || 0;
                row.push(count);
                total += count;
            }
            row.push(total);
            return row;
        });

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");
        XLSX.writeFile(workbook, "tourism_cert_summary.xlsx");
    };

    const getMonthTotal = days => Object.values(days).reduce((sum, val) => sum + val, 0);
    const getGrandTotal = () =>
        Object.values(groupedData).reduce((acc, days) => acc + getMonthTotal(days), 0);

    if (loading) {
        return (
            <div className="text-center my-5">
                <Spinner animation="border" />
                <p>Loading tourism certificates...</p>
            </div>
        );
    }

    const daysInMonth = 31;
    const months = Object.keys(groupedData);



    const handleChartDownload = async (ref, filename) => {
        if (!ref.current) return;
        try {
            const dataUrl = await toPng(ref.current, { backgroundColor: '#ffffff' });
            download(dataUrl, `${filename}.png`, 'image/png');
        } catch (error) {
            console.error("Error downloading PNG:", error);
        }
    };

    return (
        <>


            <Card className="summary-card border rounded p-3 text-muted mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-center w-100">Monthly Certificate Totals (Bar Chart)</h6>
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => handleChartDownload(barChartRef, 'monthly_cert_bar_chart')}
                        title="Download bar chart"
                        className="position-absolute end-0 me-3"
                    >
                        <FontAwesomeIcon icon={faDownload} />
                    </Button>
                </div>
                <div ref={barChartRef}>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                            data={Object.entries(groupedData).map(([month, days]) => ({
                                month,
                                total: Object.values(days).reduce((a, b) => a + b, 0),
                            }))}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="total" fill="#28a745" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>



            <Card className="summary-card border rounded p-3 text-muted mb-4">
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">Tourism Certificates Summary by Month</h6>
                        {months.length > 0 && (
                            <Dropdown>
                                <Dropdown.Toggle variant="light" size="sm">
                                    <FontAwesomeIcon icon={faDownload} /> Download
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={handleDownloadImage}>Download as PNG</Dropdown.Item>
                                    <Dropdown.Item onClick={handleDownloadExcel}>Download as Excel</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        )}
                    </div>

                    <div ref={chartRef}>
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
                                {months.length === 0 ? (
                                    <tr>
                                        <td colSpan={daysInMonth + 2} className="text-center">
                                            No data available.
                                        </td>
                                    </tr>
                                ) : (
                                    months.map(month => {
                                        const days = groupedData[month] || {};
                                        const total = getMonthTotal(days);
                                        return (
                                            <tr key={month}>
                                                <td>{month}</td>
                                                {[...Array(daysInMonth)].map((_, i) => (
                                                    <td key={i + 1}>{days[i + 1] || ""}</td>
                                                ))}
                                                <td className="fw-bold">{total}</td>
                                            </tr>
                                        );
                                    })
                                )}
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
                </div>
            </Card>
        </>

    );
}
