// src/hooks/useDeleteTicket.js
import { useState } from "react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase"; // adjust path if needed

const useDeleteTicket = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteTicket = async (ticketId) => {
    setLoading(true);
    setError(null);

    try {
      if (!ticketId) throw new Error("Ticket ID is required");

      const docRef = doc(db, "tickets", ticketId); // replace "tickets" with your collection name
      await deleteDoc(docRef);

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
