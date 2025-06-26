// src/hooks/useResolvedActivities.js
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase"; // Adjust path as needed

const useResolvedActivities = (ticket) => {
  const [resolvedActivities, setResolvedActivities] = useState([]);

  useEffect(() => {
    const fetchAllActivityDetails = async () => {
      try {
        const allActivityIds = ticket.activities
          .flatMap(a => a.activities_availed || [])
          .filter(id => typeof id === "string");

        const uniqueIds = [...new Set(allActivityIds)];
        const chunks = [];
        for (let i = 0; i < uniqueIds.length; i += 10) {
          chunks.push(uniqueIds.slice(i, i + 10));
        }

        const results = [];
        for (const chunk of chunks) {
          const q = query(collection(db, "activities"), where("__name__", "in", chunk));
          const snapshot = await getDocs(q);
          snapshot.forEach(doc => {
            results.push({ id: doc.id, ...doc.data() });
          });
        }

        setResolvedActivities(results);
      } catch (err) {
        console.error("Error fetching activity details:", err);
      }
    };

    if (ticket?.activities?.length > 0) {
      fetchAllActivityDetails();
    }
  }, [ticket]);

  return resolvedActivities;
};

export default useResolvedActivities;
