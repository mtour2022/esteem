import React, { useState } from "react";
import { collection, addDoc, doc, updateDoc, arrayUnion  } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../config/firebase";
import { Button } from "react-bootstrap";
import TicketModel from "../classes/tickets";

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
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      Swal.fire({
        title: "Saving...",
        text: `Please wait while your ${fileType} is being saved.`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      // Use TicketModel instance to ensure class methods
      const ticket = groupData instanceof TicketModel
        ? groupData
        : new TicketModel(groupData);
      const now = new Date();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(now.getMonth() + 1);
      // ⏱ Assign default values before saving
      ticket.status = "created";
      ticket.date_created = now.toISOString();
      ticket.valid_until = oneMonthLater.toISOString();
      ticket.scan_logs = [
        {
          status: "created",
          date_updated: now.toISOString(),
          remarks: "",
          userId: currentUserUID || "", // make sure userUID is already set
        }
      ];
      // 👥 total_pax
      const totalLocals = ticket.address?.reduce((sum, addr) => {
        return sum + (parseInt(addr.locals || "0") || 0);
      }, 0) || 0;
      const totalForeigns = ticket.address?.reduce((sum, addr) => {
        return sum + (parseInt(addr.foreigns || "0") || 0);
      }, 0) || 0;
      ticket.total_pax = totalLocals + totalForeigns;
      ticket.isSingleGroup =
  (totalLocals > 0 && totalForeigns === 0) ||
  (totalForeigns > 0 && totalLocals === 0);

ticket.isMixedGroup = totalLocals > 0 && totalForeigns > 0;
      
      
      // 🕓 total_duration
      let totalDuration = 0;
      ticket.activities?.forEach(group => {
        group.activities_availed?.forEach(act => {
          const duration = parseInt(act.activity_duration || "0"); // in minutes
          totalDuration += isNaN(duration) ? 0 : duration;
        });
      });
      ticket.total_duration = totalDuration; // raw number in minutes
      // Format to "X hr Y min"
      const formatDuration = (minutes) => {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hrs > 0 && mins > 0) return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}`;
        if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
        return `${mins} min${mins !== 1 ? 's' : ''}`;
      };
ticket.total_duration_readable = formatDuration(totalDuration);
      // 💰 total_expected_payment
      let totalExpected = 0;
      ticket.activities?.forEach(group => {
        const expected = parseFloat(group.activity_expected_price || "0");
        totalExpected += isNaN(expected) ? 0 : expected;
      });
      ticket.total_expected_payment = totalExpected;
      // 💵 total_payment (agreed)
      let totalAgreed = 0;
      ticket.activities?.forEach(group => {
        const agreed = parseFloat(group.activity_agreed_price || "0");
        totalAgreed += isNaN(agreed) ? 0 : agreed;
      });
      ticket.total_payment = totalAgreed;
      // 🕑 Determine start_date_time and end_date_time
      const starts = ticket.activities.map(a => new Date(a.activity_date_time_start || null)).filter(Boolean);
      const ends = ticket.activities.map(a => new Date(a.activity_date_time_end || null)).filter(Boolean);
      ticket.start_date_time = starts.length > 0 ? new Date(Math.min(...starts)).toISOString() : "";
      ticket.end_date_time = ends.length > 0 ? new Date(Math.max(...ends)).toISOString() : "";
      // ✅ Convert to plain object
      // Sanitize nested models
      ticket.userUID = currentUserUID;
      ticket.company_id = companyID;
      ticket.activities = ticket.activities?.map(group => ({
        ...group,
        activities_availed: group.activities_availed?.map(act => ({ ...act }))
      }));
      // ✅ Convert to plain object
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



      // 🔥 Save to Firestore
const docRef = await addDoc(ticketCollectionRef, ticketObject);
await updateDoc(doc(ticketCollectionRef, docRef.id), {
  ticket_id: docRef.id,
});

// ✅ Also update company's ticket array
const companyDocRef = doc(db, "company", companyID);
await updateDoc(companyDocRef, {
  ticket: arrayUnion(docRef.id),
});


      setGroupData(new TicketModel({}));

      Swal.fire({
        title: "Success!",
        icon: "success",
        text: `${fileType} successfully saved.`
      });

      if (onSuccess) {
        onSuccess({ ...ticketObject, ticket_id: docRef.id }); // Pass saved ticket data
      }


    } catch (error) {
      console.error("Error saving ticket:", error);
      setErrorMessage(error.message);

      Swal.fire({
        title: "Error!",
        icon: "error",
        text: "Something went wrong. Please try again."
      });
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
