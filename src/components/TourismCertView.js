import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import TourismCert from "./TourismCert";
import CompanyTourismCert from "../components/CompanyTourismCert";

// Hooks
import useEmployeeInfo from "../services/GetEmployeesDetails";
import useVerifierInfo from "../services/GetVerifierDetail";
import useCompanyInfo from "../services/GetCompanyDetails";

const TourismCertView = ({ currentUser }) => {
  const { tourism_cert_id } = useParams();
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const emp = useEmployeeInfo(certData?.employee_id);
  const verifier = useVerifierInfo(certData?.verifier_id);
  const company = useCompanyInfo(certData?.company_id);

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

  if (loading) {
    return <p className="text-center mt-5">Loading tourism certificate...</p>;
  }

  if (notFound || !certData) {
    return <p className="text-center mt-5 text-danger">Tourism certificate not found.</p>;
  }

  // If employee_id exists, show TourismCert
  if (certData.employee_id) {
    if (!emp || !verifier || !company) {
      return <p className="text-center mt-5">Loading referenced employee, company, or verifier...</p>;
    }

    return <TourismCert emp={emp} company={company} />;
  }

  // If no employee_id, show CompanyTourismCert
  if (company) {
    return (
      <CompanyTourismCert
        company={company}
      />
    );
  }

  return <p className="text-center mt-5">Loading company information...</p>;
};

export default TourismCertView;
