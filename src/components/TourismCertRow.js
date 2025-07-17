import React from "react";
import { Spinner, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { doc, updateDoc, arrayRemove, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import useTourismCertificate from "../services/GetTourismCertDetails"; // adjust path if needed
import useVerifierInfo from "../services/GetVerifierDetail"; // 👈 import the hook

const TourismCertRow = ({ certId, empId }) => {
  const cert = useTourismCertificate(certId);
  const verifier = useVerifierInfo(cert?.verifier_id); // 👈 use the hook

  const handleDeleteCert = async () => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the certificate.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        // 1. Remove reference from employee
        await updateDoc(doc(db, "employee", empId), {
          tourism_certificate_ids: arrayRemove(certId),
        });

        // 2. Delete the certificate document itself
        await deleteDoc(doc(db, "tourism_cert", certId));

        Swal.fire("Deleted!", "The certificate has been removed.", "success");
      } catch (error) {
        console.error("Error deleting certificate:", error);
        Swal.fire("Error", "Something went wrong while deleting.", "error");
      }
    }
  };

  if (!cert) {
    return (
      <tr>
        <td colSpan="7" className="text-center text-muted">
          <Spinner size="sm" animation="border" className="me-2" />
          Loading certificate...
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{cert.tourism_cert_id}</td>
       <td>
        <Button variant="outline-danger" size="sm" onClick={handleDeleteCert}>
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      </td>
      <td>{cert.type}</td>
      <td>{new Date(cert.date_Issued).toLocaleDateString()}</td>
      <td>{new Date(cert.date_Expired).toLocaleDateString()}</td>
<td>
  {verifier
    ? `${verifier.getFullName()} - ${verifier.designation}`
    : "Loading..."}
</td>

      <td>
        <a
          href={`/tourism-certificate/${cert.tourism_cert_id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View Certificate
        </a>
      </td>
     
    </tr>
  );
};

export default TourismCertRow;
