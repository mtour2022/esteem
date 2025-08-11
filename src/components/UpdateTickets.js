import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../config/firebase";
import { Button } from "react-bootstrap";
import TicketModel from "../classes/tickets";
import useResolvedActivities from "../services/GetActivitiesDetails";

const UpdateTicketToCloud = ({
  fileType = "ticket",
  disabled,
  groupData,
  setGroupData,
  onSuccess,
  currentUserUID,
  companyID
}) => {
  const [errorMessage, setErrorMessage] = useState("");

  // Prepare Ticket
  const rawTicket = groupData instanceof TicketModel
    ? groupData
    : new TicketModel(groupData);

  rawTicket.activities = rawTicket.activities?.map(group => ({
    ...group,
    activities_availed: group.activities_availed?.map(act =>
      typeof act === "string" ? act : act.activity_id
    )
  }));

  const resolvedActivities = useResolvedActivities(rawTicket);

  const getActivityDetails = (id) => {
    return resolvedActivities.find(a => a.activity_id === id);
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();

    if (!rawTicket.ticket_id) {
      Swal.fire("Error", "No ticket ID found for update.", "error");
      return;
    }

    if (!resolvedActivities || resolvedActivities.length === 0) {
      Swal.fire("Please wait", "Activities are still loading...", "info");
      return;
    }

    try {
      Swal.fire({
        title: "Updating...",
        text: `Please wait while your ${fileType} is being updated.`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const ticket = rawTicket;
      const now = new Date();

      ticket.status = ticket.status || "updated";
      ticket.date_updated = now.toISOString();

      ticket.scan_logs = [
        ...(ticket.scan_logs || []),
        {
          status: "updated",
          date_updated: now.toISOString(),
          remarks: "",
          userId: currentUserUID || "",
        }
      ];

      // Pax totals
      const totalLocals = ticket.address?.reduce((sum, addr) => sum + (parseInt(addr.locals || "0") || 0), 0) || 0;
      const totalForeigns = ticket.address?.reduce((sum, addr) => sum + (parseInt(addr.foreigns || "0") || 0), 0) || 0;
      ticket.total_pax = totalLocals + totalForeigns;
      ticket.isSingleGroup = (totalLocals > 0 && totalForeigns === 0) || (totalForeigns > 0 && totalLocals === 0);
      ticket.isMixedGroup = totalLocals > 0 && totalForeigns > 0;

      // Total duration
      let totalDuration = 0;
      ticket.activities?.forEach(group => {
        group.activities_availed?.forEach(id => {
          const act = getActivityDetails(id);
          const duration = parseInt(act?.activity_duration || "0");
          totalDuration += isNaN(duration) ? 0 : duration;
        });
      });
      ticket.total_duration = totalDuration;

      const formatDuration = (minutes) => {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0 && mins > 0) return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}`;
        if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
        return `${mins} min${mins !== 1 ? 's' : ''}`;
      };

      ticket.total_duration_readable = formatDuration(totalDuration);

      // Expected and agreed payment
      let totalExpected = 0;
      let totalAgreed = 0;
      ticket.activities?.forEach(group => {
        totalExpected += parseFloat(group.activity_expected_price || "0") || 0;
        totalAgreed += parseFloat(group.activity_agreed_price || "0") || 0;
      });

      ticket.total_expected_payment = totalExpected;
      ticket.total_payment = totalAgreed;

      // Start/End timestamps
      const starts = ticket.activities.map(a => new Date(a.activity_date_time_start || null)).filter(Boolean);
      const ends = ticket.activities.map(a => new Date(a.activity_date_time_end || null)).filter(Boolean);
      ticket.start_date_time = starts.length > 0 ? new Date(Math.min(...starts)).toISOString() : "";
      ticket.end_date_time = ends.length > 0 ? new Date(Math.max(...ends)).toISOString() : "";

      // Markup calculations
      let baseTotal = 0;
      let agreedTotal = 0;

      ticket.activities?.forEach(group => {
        const pax = parseInt(group.activity_num_pax || "1");
        const agreed = parseFloat(group.activity_agreed_price || "0");
        if (!isNaN(agreed)) agreedTotal += agreed;

        group.activities_availed?.forEach(id => {
          const activity = getActivityDetails(id);
          if (!activity) return;
          const basePrice = parseFloat(activity.activity_base_price || "0");
          if (!isNaN(basePrice)) baseTotal += basePrice * pax;
        });
      });

      ticket.total_expected_sale = Math.max(agreedTotal - baseTotal, 0);
      ticket.total_markup = baseTotal > 0 ? (ticket.total_expected_sale / baseTotal) * 100 : 0;

      ticket.userUID = currentUserUID;
      ticket.company_id = companyID;

      // Prepare object for Firestore
      const ticketObject = ticket.toObject();

      // Update existing ticket in Firestore
      const ticketRef = doc(db, "tickets", ticket.ticket_id);
      await updateDoc(ticketRef, ticketObject);

      Swal.fire({
        title: "Success!",
        icon: "success",
        text: `${fileType} successfully updated.`
      });

      if (onSuccess) {
        onSuccess(ticketObject);
      }

    } catch (error) {
      console.error("Error updating ticket:", error);
      setErrorMessage(error.message);
      Swal.fire("Error!", "Something went wrong. Please try again.", "error");
    }
  };

  return (
    <div>
      <Button
        className="color-blue-button"
        disabled={disabled}
        onClick={handleUpdate}
        type="submit"
      >
        Update QR
      </Button>
    </div>
  );
};

export default UpdateTicketToCloud;
