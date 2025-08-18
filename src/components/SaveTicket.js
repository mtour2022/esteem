import React, { useState } from "react";
import { collection, addDoc, doc, updateDoc, arrayUnion } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../config/firebase";
import { Button } from "react-bootstrap";
import TicketModel from "../classes/tickets";
import useResolvedActivities from "../services/GetActivitiesDetails";

const SaveTicketToCloud = ({
  fileType = "ticket",
  disabled,
  groupData,
  setGroupData,
  onSuccess,
  currentUserUID,
  companyID
}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const ticketCollectionRef = collection(db, "tickets");

  // ✅ Prepare ticket and sanitize activities_availed BEFORE passing to hook
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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!resolvedActivities || resolvedActivities.length === 0) {
      Swal.fire("Please wait", "Activities are still loading...", "info");
      return;
    }

    try {
      Swal.fire({
        title: "Saving...",
        text: `Please wait while your ${fileType} is being saved.`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const ticket = rawTicket;
      const now = new Date();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(now.getMonth() + 1);

      ticket.status = "created";
      ticket.date_created = now.toISOString();
      ticket.valid_until = oneMonthLater.toISOString();
      ticket.scan_logs = [{
        status: "created",
        date_updated: now.toISOString(),
        remarks: "",
        userId: currentUserUID || "",
      }];

      // 👥 Pax totals
      const totalLocals = ticket.address?.reduce((sum, addr) => sum + (parseInt(addr.locals || "0") || 0), 0) || 0;
      const totalForeigns = ticket.address?.reduce((sum, addr) => sum + (parseInt(addr.foreigns || "0") || 0), 0) || 0;
      ticket.total_pax = totalLocals + totalForeigns;
      ticket.isSingleGroup = (totalLocals > 0 && totalForeigns === 0) || (totalForeigns > 0 && totalLocals === 0);
      ticket.isMixedGroup = totalLocals > 0 && totalForeigns > 0;

      // 🕓 Total duration
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

      // 💰 Expected and agreed payment
      let totalExpected = 0;
      let totalAgreed = 0;
      ticket.activities?.forEach(group => {
        totalExpected += parseFloat(group.activity_expected_price || "0") || 0;
        totalAgreed += parseFloat(group.activity_agreed_price || "0") || 0;
      });

      ticket.total_expected_payment = totalExpected;
      ticket.total_payment = totalAgreed;

      // 🕑 Start/End timestamps
      const starts = ticket.activities.map(a => new Date(a.activity_date_time_start || null)).filter(Boolean);
      const ends = ticket.activities.map(a => new Date(a.activity_date_time_end || null)).filter(Boolean);
      ticket.start_date_time = starts.length > 0 ? new Date(Math.min(...starts)).toISOString() : "";
      ticket.end_date_time = ends.length > 0 ? new Date(Math.max(...ends)).toISOString() : "";

      // 💵 Markup calculations
      let baseTotal = 0;
      let expectedSRP = 0;
      let agreedTotal = 0;

      ticket.activities?.forEach(group => {
  const pax = parseInt(group.activity_num_pax || "1"); // default to 1 if missing
  const agreed = parseFloat(group.activity_agreed_price || "0");
  if (!isNaN(agreed)) agreedTotal += agreed;

  group.activities_availed?.forEach(id => {
    const activity = getActivityDetails(id);

    if (!activity) {
      console.warn(`Missing activity for ID: ${id}`);
      return;
    }

    const price = parseFloat(activity.activity_price || "0");
    const basePrice = parseFloat(activity.activity_base_price || "0");

    if (!isNaN(basePrice)) baseTotal += basePrice * pax;
    if (!isNaN(price)) expectedSRP += price * pax;
  });
});

  // ✅ Total expected sale (no negative)
ticket.total_expected_sale = Math.max(agreedTotal - baseTotal, 0);

// ✅ Markup % calculation (safe divide)
ticket.total_markup =
  baseTotal > 0 ? (ticket.total_expected_sale / baseTotal) * 100 : 0;

      // Prepare for Firestore
      ticket.userUID = currentUserUID;
      ticket.company_id = companyID;

      const ticketObject = ticket.toObject({
        ticket_id: ticket.ticket_id,
        userUID: ticket.userUID,
        company_id: ticket.company_id,
        status: ticket.status,
        date_created: ticket.date_created,
        valid_until: ticket.valid_until,
        scan_logs: ticket.scan_logs,
        address: ticket.address,
        activities: ticket.activities,
        total_pax: ticket.total_pax,
        total_duration: ticket.total_duration_readable,
        total_expected_payment: ticket.total_expected_payment,
        total_payment: ticket.total_payment,
        total_expected_sale: ticket.total_expected_sale,
        total_markup: ticket.total_markup,
        start_date_time: ticket.start_date_time,
        end_date_time: ticket.end_date_time,
        name: ticket.name,
        contact: ticket.contact,
        accommodation: ticket.accommodation,
        isSingleGroup: ticket.isSingleGroup,
        isMixedGroup: ticket.isMixedGroup,
        scanned_by: ticket.scanned_by,
        employee_id: ticket.employee_id,
      });

      const docRef = await addDoc(ticketCollectionRef, ticketObject);
      await updateDoc(doc(ticketCollectionRef, docRef.id), { ticket_id: docRef.id });

      await updateDoc(doc(db, "company", companyID), {
        ticket: arrayUnion(docRef.id),
      });

      // Add the ticket.ticket_id to the employee document
if (ticket.employee_id) {
  await updateDoc(doc(db, "employee", ticket.employee_id), {
    tickets: arrayUnion(ticket.ticket_id),
  });
}

      setGroupData(new TicketModel({}));

      Swal.fire({
        title: "Success!",
        icon: "success",
        text: `${fileType} successfully saved.`
      });

      if (onSuccess) {
        onSuccess({ ...ticketObject, ticket_id: docRef.id });
      }

    } catch (error) {
      console.error("Error saving ticket:", error);
      setErrorMessage(error.message);
      Swal.fire("Error!", "Something went wrong. Please try again.", "error");
    }
  };

  return (
    <div>
      <Button
        className="color-blue-button"
        disabled={disabled}
        onClick={handleSubmit}
        type="submit"
      >
        Generate QR
      </Button>
    </div>
  );
};

export default SaveTicketToCloud;
