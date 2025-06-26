// src/hooks/useEmployeeInfo.js
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase"; // adjust if needed

const useEmployeeInfo = (employeeId) => {
  const [employeeInfo, setEmployeeInfo] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!employeeId) return;
      try {
        const docRef = doc(db, "employee", employeeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEmployeeInfo(docSnap.data());
        } else {
          console.warn("No such employee!");
        }
      } catch (error) {
        console.error("Error fetching employee:", error);
      }
    };

    fetchEmployee();
  }, [employeeId]);

  return employeeInfo;
};

export default useEmployeeInfo;
