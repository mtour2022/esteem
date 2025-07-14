// src/hooks/useTourismCertificate.js
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { TourismCertificateModel } from "../classes/tourism_certificate";

const useTourismCertificate = (certId) => {
  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!certId) return;
      try {
        const certRef = doc(db, "tourism_cert", certId);
        const certSnap = await getDoc(certRef);

        if (certSnap.exists()) {
          const data = certSnap.data();
          const certModel = new TourismCertificateModel({ ...data, tourism_cert_id: certSnap.id });
          console.log("✅ Fetched certificate:", certModel); // ⬅️ This will log the certificate data
          setCertificate(certModel);
        } else {
          console.warn("⚠️ No such certificate found for certId:", certId);
        }
      } catch (error) {
        console.error("❌ Error fetching tourism certificate:", error);
      }
    };

    fetchCertificate();
  }, [certId]);

  return certificate;
};

export default useTourismCertificate;
