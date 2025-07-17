import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import TourismCert from "./TourismCert";

// Hooks
import useEmployeeInfo from "../services/GetEmployeesDetails";
import useVerifierInfo from "../services/GetVerifierDetail";
import useCompanyInfo from "../services/GetCompanyDetails";

const TourismCertView = () => {
  const { tourism_cert_id } = useParams();
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const emp = useEmployeeInfo(certData?.employee_id);
  const verifier = useVerifierInfo(certData?.verifier_id);
  const company = useCompanyInfo(certData?.company_id); // ✅ You forgot this

  useEffect(() => {
    const fetchTourismCert = async () => {
      try {
        const certDoc = await getDoc(doc(db, "tourism_cert", tourism_cert_id));
        if (!certDoc.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = certDoc.data();
        setCertData({ id: certDoc.id, ...data });
      } catch (error) {
        console.error("Error fetching tourism certificate:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTourismCert();
  }, [tourism_cert_id]);

  useEffect(() => {
  console.log("📦 tourism_cert_id:", tourism_cert_id);
  console.log("📄 certData:", certData);
  console.log("👤 emp:", emp);
  console.log("🏢 company:", company);
  console.log("✅ verifier:", verifier);
}, [certData, emp, company, verifier]);


  if (loading) {
    return <p className="text-center mt-5">Loading tourism certificate...</p>;
  }

  if (notFound || !certData) {
    return <p className="text-center mt-5 text-danger">Tourism certificate not found.</p>;
  }

  if (!emp || !verifier || !company) {
    return <p className="text-center mt-5">Loading referenced employee, company, or verifier...</p>;
  }

  return <TourismCert emp={emp} company={company} />;
};

export default TourismCertView;
