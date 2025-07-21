// src/hooks/useResolvedProviders.js
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase"; // Adjust path if needed

const useResolvedProviders = (activities) => {
  const [resolvedProviders, setResolvedProviders] = useState([]);

 useEffect(() => {
  if (!activities?.length) return;

  const fetchProviderDetails = async () => {
    try {
      const allProviderIds = activities
        .flatMap(a => a.activity_selected_providers || [])
        .filter(id => typeof id === "string");

      const uniqueIds = [...new Set(allProviderIds)];
      if (uniqueIds.length === 0) {
        setResolvedProviders([]);
        return;
      }

      const chunks = [];
      for (let i = 0; i < uniqueIds.length; i += 10) {
        chunks.push(uniqueIds.slice(i, i + 10));
      }

      const results = [];
      for (const chunk of chunks) {
        const q = query(collection(db, "providers"), where("__name__", "in", chunk));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          results.push({ id: doc.id, name: doc.data().provider_name });
        });
      }

      setResolvedProviders(results);
    } catch (err) {
      console.error("Error fetching providers:", err);
    }
  };

  fetchProviderDetails();
}, [activities]);

  return resolvedProviders;
};

export default useResolvedProviders;
