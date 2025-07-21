// import React, { useEffect, useState, useRef } from "react";
// import {
//   Spinner, Button, Card, Form
// } from "react-bootstrap";
// import dayjs from "dayjs";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faDownload } from "@fortawesome/free-solid-svg-icons";
// import { toPng } from "html-to-image";
// import download from "downloadjs";
// import * as XLSX from "xlsx";
// import {
//   LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
//   CartesianGrid, Legend
// } from "recharts";

// const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// export default function TicketPaxChart({ allFilteredTickets = [], loading = false }) {
//   const [mode, setMode] = useState("frequency");
//   const [paxFilter, setPaxFilter] = useState("all");
//   const [chartData, setChartData] = useState([]);
//   const chartRef = useRef();

//   useEffect(() => {
//     const grouped = {};

//     for (const ticket of allFilteredTickets) {
//       const date = dayjs(ticket.created_at instanceof Date ? ticket.created_at : ticket.created_at?.toDate?.());
//       const label = date.format("MMM"); // Month name (Jan, Feb, etc.)

//       if (!grouped[label]) grouped[label] = 0;

//       if (mode === "pax") {
//         const addresses = ticket.address || [];
//         for (const addr of addresses) {
//           const locals = Number(addr.locals || 0);
//           const foreigns = Number(addr.foreigns || 0);
//           if (paxFilter === "locals") {
//             grouped[label] += locals;
//           } else if (paxFilter === "foreigns") {
//             grouped[label] += foreigns;
//           } else {
//             grouped[label] += locals + foreigns;
//           }
//         }
//       } else {
//         grouped[label] += 1;
//       }
//     }

//     const result = MONTH_LABELS.map(month => ({
//       month,
//       value: grouped[month] || 0
//     }));

//     setChartData(result);
//   }, [allFilteredTickets, mode, paxFilter]);

//   const handleDownloadChart = async () => {
//     if (!chartRef.current) return;
//     try {
//       const dataUrl = await toPng(chartRef.current);
//       download(dataUrl, `tickets_chart_${mode}_${paxFilter}.png`);
//     } catch (err) {
//       console.error("Image download failed", err);
//     }
//   };

//   const handleDownloadExcel = () => {
//     const headers = ["Month", "Total"];
//     const data = chartData.map(row => [row.month, row.value]);
//     const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Chart Summary");
//     XLSX.writeFile(workbook, `ticket_chart_${mode}_${paxFilter}.xlsx`);
//   };

//   return (
//     <Card className="border rounded p-3 text-muted bg-white mb-5">
//       <div className="d-flex justify-content-between align-items-center mb-3">
//         <div className="d-flex gap-2 flex-wrap">
//           <Form.Select size="sm" value={mode} onChange={e => setMode(e.target.value)}>
//             <option value="frequency">Ticket Frequency</option>
//             <option value="pax">Pax Summary</option>
//           </Form.Select>
//           {mode === "pax" && (
//             <Form.Select size="sm" value={paxFilter} onChange={e => setPaxFilter(e.target.value)}>
//               <option value="all">All</option>
//               <option value="locals">Locals Only</option>
//               <option value="foreigns">Foreigns Only</option>
//             </Form.Select>
//           )}
//         </div>
//         <div className="d-flex gap-2">
//           <Button variant="light" size="sm" onClick={handleDownloadChart}>
//             <FontAwesomeIcon icon={faDownload} />
//           </Button>
//           <Button variant="light" size="sm" onClick={handleDownloadExcel}>
//             <FontAwesomeIcon icon={faDownload} /> XLSX
//           </Button>
//         </div>
//       </div>

//       <h6 className="fw-bold text-dark mb-3">
//         {mode === "pax" ? "Monthly Pax Summary" : "Monthly Ticket Frequency"}
//       </h6>

//       <div ref={chartRef} style={{ width: "100%", height: 300 }}>
//         {loading ? (
//           <Spinner animation="border" />
//         ) : (
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart data={chartData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="month" />
//               <YAxis allowDecimals={false} />
//               <Tooltip />
//               <Legend />
//               <Line
//                 type="monotone"
//                 dataKey="value"
//                 name={mode === "pax" ? "Pax" : "Frequency"}
//                 stroke="#007bff"
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         )}
//       </div>
//     </Card>
//   );
// }
