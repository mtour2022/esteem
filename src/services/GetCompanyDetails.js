// src/hooks/useCompanyInfo.js
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase"; // Adjust if needed

const useCompanyInfo = (companyId) => {
  const [companyInfo, setCompanyInfo] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return;
      try {
        const docRef = doc(db, "company", companyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCompanyInfo(docSnap.data());
        } else {
          console.warn("No such company!");
        }
      } catch (error) {
        console.error("Error fetching company:", error);
      }
    };

    fetchCompany();
  }, [companyId]);

  return companyInfo;
};

export default useCompanyInfo;
