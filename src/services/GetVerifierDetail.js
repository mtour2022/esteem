// src/hooks/useVerifierInfo.js
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase"; // Adjust if needed
import VerifierModel from "../classes/verifiers"; // Adjust the path if your VerifierModel is stored elsewhere

const useVerifierInfo = (verifierId) => {
  const [verifierInfo, setVerifierInfo] = useState(null);

  useEffect(() => {
    const fetchVerifier = async () => {
      if (!verifierId) return;

      try {
        const docRef = doc(db, "verifier", verifierId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setVerifierInfo(new VerifierModel({ verifierId: docSnap.id, ...docSnap.data() }));
        } else {
          console.warn("No such verifier!");
        }
      } catch (error) {
        console.error("Error fetching verifier:", error);
      }
    };

    fetchVerifier();
  }, [verifierId]);

  return verifierInfo;
};

export default useVerifierInfo;


