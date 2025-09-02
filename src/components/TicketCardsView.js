import { useState, useMemo } from "react";
import { Card, Button, Form, Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode } from "@fortawesome/free-solid-svg-icons";

// ✅ Helper: Map status → Bootstrap variant
const getStatusBadgeVariant = (status) => {
  return {
    Queued: "secondary",
    "On Time": "primary",
    Early: "info",
    Ongoing: "success",
    Done: "dark",
    Delayed: "danger",
    Scanned: "warning",
    created: "secondary",
    Invalid: "danger",
    Canceled: "dark",
    "Schedule Change": "info",
    Reassigned: "warning",
    Relocate: "warning",
    "On Emergency": "danger",
  }[status] || "secondary";
};

// ✅ Compute ticket status
const computeStatus = (ticket) => {
  const now = new Date();
  const start = new Date(ticket.start_date_time);
  const end = new Date(ticket.end_date_time);

  if (ticket.status === "created") {
    if (now < start) return "Queued";
    const oneMonthAfterEnd = new Date(end);
    oneMonthAfterEnd.setMonth(end.getMonth() + 1);
    if (now > oneMonthAfterEnd) return "Invalid";
    return "Queued";
  }

  if (ticket.status === "scanned") {
    const scannedLog = Array.isArray(ticket.scan_logs)
      ? ticket.scan_logs.find((log) => log.status === "scanned")
      : null;

    if (scannedLog?.date_updated) {
      const scannedTime = new Date(scannedLog.date_updated);
      const diffMinutes = (scannedTime - start) / 60000;
      const afterEnd = scannedTime > end;

      if (now > end) return "Done";
      if (afterEnd) return "Done";
      if (diffMinutes >= 15 && diffMinutes <= 30) return "Ongoing";
      if (diffMinutes > 30) return "Delayed";
      if (diffMinutes >= -5 && diffMinutes < 15) return "On Time";
      if (diffMinutes >= -30 && diffMinutes < -15) return "Early";
    }

    return "Scanned";
  }

  const statusMap = {
    canceled: "Canceled",
    reschedule: "Schedule Change",
    reassigned: "Reassigned",
    relocate: "Relocate",
    emergency: "On Emergency",
  };

  if (statusMap[ticket.status]) return statusMap[ticket.status];

  const hasScanned =
    Array.isArray(ticket.scan_logs) &&
    ticket.scan_logs.some((log) => log.status === "scanned");

  if (!hasScanned) return "Queued";

  if (now < start) {
    const diff = start - now;
    return diff > 15 * 60000 ? "Queued" : "On Time";
  } else if (now >= start && now <= end) {
    return "Ongoing";
  } else if (now > end) {
    return now < end.getTime() + 15 * 60000 ? "Done" : "Delayed";
  }

  return "Unknown";
};

const TicketRankingList = ({ tickets = [], onViewQR }) => {
  const [rowsToShow, setRowsToShow] = useState(5);
  const [statusFilter, setStatusFilter] = useState("All");

  // ✅ All possible statuses for dropdown
  const allStatuses = [
    "All",
    "Queued",
    "On Time",
    "Early",
    "Ongoing",
    "Done",
    "Delayed",
    "Scanned",
    "Invalid",
    "Canceled",
    "Schedule Change",
    "Reassigned",
    "Relocate",
    "On Emergency",
  ];

  // ✅ Sort & filter tickets
  const filteredTickets = useMemo(() => {
    const sorted = [...tickets].sort(
      (a, b) => new Date(a.start_date_time) - new Date(b.start_date_time)
    );
    if (statusFilter === "All") return sorted;
    return sorted.filter((t) => computeStatus(t) === statusFilter);
  }, [tickets, statusFilter]);

  const displayedTickets = filteredTickets.slice(0, rowsToShow);

  return (
    <Card
      className="border rounded p-0"
      style={{ backgroundColor: "#f8f9fa", borderColor: "#dee2e6" }}
    >
      {/* Header */}
      <Card.Header className="d-flex justify-content-between align-items-center bg-transparent border-0">
        <h5 className="mb-0 fw-bold">Your Most Recent Tickets</h5>
      </Card.Header>

      {/* Body */}
      <Card.Body>
        <div className="d-flex flex-column gap-2">
          {displayedTickets.length === 0 ? (
            <p className="text-muted text-center">No tickets found.</p>
          ) : (
            displayedTickets.map((t) => {
              const status = computeStatus(t);

              return (
                <Card
                  key={t.id}
                  className="border rounded"
                  style={{
                    borderColor: "#dee2e6",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <Card.Body className="d-flex justify-content-between align-items-center">
                    {/* Left content */}
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <h6 className="fw-bold mb-0">{t.name}</h6>
                        {status && (
                          <Badge bg={getStatusBadgeVariant(status)}>
                            {status}
                          </Badge>
                        )}
                      </div>

                      <p className="mb-1 text-muted">
                        {new Date(t.start_date_time).toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>

                      <p className="mb-1">
                        <strong>Contact:</strong> {t.contact || "-"}
                      </p>
                      <p className="mb-1">
                        <strong>Accommodation:</strong> {t.accommodation || "-"}
                      </p>
                      <p className="mb-0">
                        <strong>Total Pax:</strong> {t.total_pax || 0}
                      </p>
                    </div>

                    {/* Right aligned button */}
                    <div className="ms-3 text-end">
                      <Button
                        variant="outline-secondary"
                        size="md"
                        onClick={() => onViewQR && onViewQR(t)}
                      >
                        <FontAwesomeIcon icon={faQrcode} />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              );
            })
          )}
        </div>
      </Card.Body>

      {/* Footer Controls */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 m-2">
        {/* Rows per page */}
        <Form.Group className="d-flex align-items-center gap-2 mb-0">
          <Form.Label className="small mb-0">Rows</Form.Label>
          <Form.Select
            size="sm"
            value={rowsToShow}
            onChange={(e) => setRowsToShow(Number(e.target.value))}
            style={{ width: "90px" }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={tickets.length}>All</option>
          </Form.Select>
        </Form.Group>

        {/* Status filter */}
        <Form.Group className="d-flex align-items-center gap-2 mb-0">
          <Form.Label className="small mb-0">Status</Form.Label>
          <Form.Select
            size="sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: "170px" }}
          >
            {allStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </div>

    </Card>
  );
};

export default TicketRankingList;
