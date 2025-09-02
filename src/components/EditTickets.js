import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../config/firebase";
import { Button } from "react-bootstrap";
import useResolvedActivities from "../services/GetActivitiesDetails";

const EditTickets = ({
  fileType = "ticket",
  disabled,
  groupData,
  onSuccess,
  currentUserUID,
  companyID
}) => {
  const [errorMessage, setErrorMessage] = useState("");

  // Prepare Ticket
  const rawTicket = { ...groupData }; // clone to avoid direct mutation

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
      const { value: formValues } = await Swal.fire({
        title: "Update Ticket",
        html: `
          <small for="swal-status" style="display:block; text-align:left; font-weight:bold;">Status</small>
          <select id="swal-status" class="swal2-input" style="width:100%; box-sizing:border-box; margin:0;">
            <option value="updated">Update Data</option>
            <option value="canceled">Canceled</option>
            <option value="reschedule">Reschedule</option>
            <option value="reassigned">Reassigned</option>
            <option value="relocate">Relocate</option>
            <option value="emergency">Emergency</option>
          </select>

          <small for="swal-remarks" style="display:block; text-align:left; font-weight:bold; margin-top:10px;">Remarks</small>
          <textarea 
            id="swal-remarks" 
            class="swal2-textarea" 
            style="width:100%; box-sizing:border-box; margin:0; overflow-x:hidden; white-space:pre-wrap;" 
            placeholder="Enter remarks (optional)">
          </textarea>
        `,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
          return {
            status: document.getElementById("swal-status").value,
            remarks: document.getElementById("swal-remarks").value
          };
        }
      });

      if (!formValues) return; // user cancelled

      const { status, remarks } = formValues;

      Swal.fire({
        title: "Updating...",
        text: `Please wait while your ${fileType} is being updated.`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const ticket = { ...rawTicket };
      const now = new Date();

      ticket.status = ticket.status || "updated";
      ticket.date_updated = now.toISOString();

      // Append scan log
      ticket.scan_logs = [
        ...(ticket.scan_logs || []),
        {
          status,
          date_updated: now.toISOString(),
          remarks: remarks || "",
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
      ticket.scanned_by = currentUserUID;

      // Update in Firestore
      const ticketRef = doc(db, "tickets", ticket.ticket_id);
      await updateDoc(ticketRef, {
        ...ticket,
        status,
        scan_logs: ticket.scan_logs,
        scanned_by: currentUserUID
      });

      Swal.fire({
        title: "Success!",
        icon: "success",
        text: `${fileType} successfully updated.`
      });

      if (onSuccess) {
        onSuccess(ticket);
      }

    } catch (error) {
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
        Submit
      </Button>
    </div>
  );
};

export default EditTickets;
