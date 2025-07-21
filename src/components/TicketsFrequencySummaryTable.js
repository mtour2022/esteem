// import React, { useEffect, useState, useRef } from "react";
// import { Table, Spinner, Card, Button } from "react-bootstrap";
// import { toPng } from "html-to-image";
// import download from "downloadjs";
// import * as XLSX from "xlsx";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faDownload, faTable } from "@fortawesome/free-solid-svg-icons";
// import dayjs from "dayjs";

// export default function TicketsFrequencySummaryTable({ allFilteredTickets = [], loading = false }) {
//   const [groupedData, setGroupedData] = useState({});
//   const tableRef = useRef();

//   useEffect(() => {
//     if (!allFilteredTickets.length) {
//       setGroupedData({});
//       return;
//     }

//     const grouped = {};
//     const now = dayjs();

//     for (let i = 0; i < 12; i++) {
//       const month = dayjs(new Date(now.year(), i, 1)).format("MMMM");
//       grouped[month] = {};
//     }

//     for (const ticket of allFilteredTickets) {
//       const createdAt = ticket.created_at;
//       const date = dayjs(createdAt instanceof Date ? createdAt : createdAt?.toDate?.());
//       const month = date.format("MMMM");
//       const day = date.date();

//       if (!grouped[month][day]) grouped[month][day] = 0;
//       grouped[month][day] += 1;
//     }

//     setGroupedData(grouped);
//   }, [allFilteredTickets]);

//   const getMonthTotal = days => Object.values(days).reduce((sum, val) => sum + val, 0);
//   const getGrandTotal = () =>
//     Object.values(groupedData).reduce((acc, days) => acc + getMonthTotal(days), 0);

//   const daysInMonth = 31;
//   const months = Object.keys(groupedData);

//   const handleDownloadImage = () => {
//     if (tableRef.current) {
//       toPng(tableRef.current)
//         .then(dataUrl => {
//           download(dataUrl, `Tickets-Frequency-Summary-${dayjs().format("YYYY-MM-DD")}.png`);
//         })
//         .catch(err => {
//           console.error("Image download failed", err);
//         });
//     }
//   };

//   const handleDownloadExcel = () => {
//     const headers = ["Month", ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`), "Total"];
//     const data = months.map(month => {
//       const days = groupedData[month] || {};
//       const total = getMonthTotal(days);
//       const row = [month];
//       for (let i = 1; i <= daysInMonth; i++) {
//         row.push(days[i] || "");
//       }
//       row.push(total);
//       return row;
//     });

//     // Add grand total
//     if (months.length > 0) {
//       const grandTotalRow = ["Grand Total"];
//       for (let i = 1; i <= daysInMonth; i++) {
//         grandTotalRow.push("");
//       }
//       grandTotalRow.push(getGrandTotal());
//       data.push(grandTotalRow);
//     }

//     const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets Frequency");

//     XLSX.writeFile(workbook, `Tickets-Frequency-Summary-${dayjs().format("YYYY-MM-DD")}.xlsx`);
//   };

//   if (loading && !allFilteredTickets.length) {
//     return (
//       <div className="text-center my-5">
//         <Spinner animation="border" />
//         <p>Loading summary...</p>
//       </div>
//     );
//   }

//   if (!loading && allFilteredTickets.length === 0) {
//     return (
//       <Card className="border rounded p-3 text-muted mb-5 text-center">
//         <h6>No data available.</h6>
//       </Card>
//     );
//   }

//   return (
//     <Card className="border rounded p-3 text-muted mb-5 bg-white"  ref={tableRef}>
//       <div className="d-flex justify-content-between align-items-center mb-3">
//         <h6 className="mb-0">Tickets Frequency Summary (Per Day)</h6>
//         <div className="d-flex gap-2">
//           <Button
//             variant="light"
//             size="sm"
//             onClick={handleDownloadImage}
//             title="Download chart as image"
//           >
//             <FontAwesomeIcon icon={faDownload} />
//           </Button>
//           <Button
//             variant="light"
//             size="sm"
//             onClick={handleDownloadExcel}
//             title="Download chart as Excel"
//           >
//             <FontAwesomeIcon icon={faTable} />
//           </Button>
//         </div>
//       </div>

//       <div>
//         <Table striped bordered hover responsive>
//           <thead>
//             <tr>
//               <th>Month</th>
//               {[...Array(daysInMonth)].map((_, i) => (
//                 <th key={i + 1}>{i + 1}</th>
//               ))}
//               <th>Total</th>
//             </tr>
//           </thead>
//           <tbody>
//             {months.length === 0 ? (
//               <tr>
//                 <td colSpan={daysInMonth + 2} className="text-center">
//                   No data available.
//                 </td>
//               </tr>
//             ) : (
//               months.map(month => {
//                 const days = groupedData[month] || {};
//                 const total = getMonthTotal(days);
//                 return (
//                   <tr key={month}>
//                     <td>{month}</td>
//                     {[...Array(daysInMonth)].map((_, i) => (
//                       <td key={i + 1}>{days[i + 1] || ""}</td>
//                     ))}
//                     <td className="fw-bold">{total}</td>
//                   </tr>
//                 );
//               })
//             )}
//             {months.length > 0 && (
//               <tr>
//                 <td colSpan={daysInMonth + 1} className="text-end fw-bold">
//                   Grand Total
//                 </td>
//                 <td className="fw-bold">{getGrandTotal()}</td>
//               </tr>
//             )}
//           </tbody>
//         </Table>
//       </div>
//     </Card>
//   );
// }
