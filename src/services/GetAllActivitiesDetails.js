import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

const useResolvedAllActivitiesFromTickets = (allFilteredTickets) => {
  const [resolvedActivities, setResolvedActivities] = useState([]);

  useEffect(() => {
    const fetchActivityDetails = async () => {
      try {
        const allActivityIds = allFilteredTickets
          .flatMap(ticket =>
            ticket.activities?.flatMap(act => act.activities_availed || []) || []
          )
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

    const hasActivities = allFilteredTickets.some(t =>
      t.activities?.some(act => Array.isArray(act.activities_availed) && act.activities_availed.length > 0)
    );

    if (hasActivities) {
      fetchActivityDetails();
    }
  }, [allFilteredTickets]);

  return resolvedActivities;
};

export default useResolvedAllActivitiesFromTickets;
