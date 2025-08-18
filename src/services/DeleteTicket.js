import { useState } from "react";
import { doc, deleteDoc, updateDoc, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const useDeleteTicket = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteTicket = async (ticketId) => {
    setLoading(true);
    setError(null);

    try {
      if (!ticketId) throw new Error("Ticket ID is required");

      // Get the ticket document first to retrieve employee_id
      const ticketRef = doc(db, "tickets", ticketId);
      const ticketSnap = await getDoc(ticketRef); // ✅ use getDoc
      if (!ticketSnap.exists()) throw new Error("Ticket not found");

      const ticketData = ticketSnap.data();
      const employeeId = ticketData?.employee_id;

      // Delete the ticket document
      await deleteDoc(ticketRef);

      // Remove the ticket ID from employee.tickets array if employeeId exists
      if (employeeId) {
        const employeeRef = doc(db, "employee", employeeId);
        await updateDoc(employeeRef, {
          tickets: arrayRemove(ticketId),
        });
      }

      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error("Failed to delete ticket:", err);
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }
  };

  return { deleteTicket, loading, error };
};

export default useDeleteTicket;
