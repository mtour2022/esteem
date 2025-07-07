import React, { useState } from "react";
import { collection, addDoc, updateDoc, doc, arrayUnion } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../config/firebase";
import { Button } from "react-bootstrap";
import { docreateUserWithEmailAndPassword } from "../config/auth";
import { useNavigate } from "react-router-dom";

const SaveGroupEmployee = ({
  fileType = "file",
  collectionName = "",
  idName = "",
  ModelClass,
  disabled,
  groupData,
  password,
  email,
  setGroupData,
  onSuccess
}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const groupCollectionRef = collection(db, collectionName);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
      Swal.fire({
        title: "Uploading...",
        text: `Please wait while your ${fileType} is being uploaded.`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // Step 1: Convert to plain object
      const groupObject =
        groupData instanceof ModelClass
          ? groupData.toObject()
          : new ModelClass(groupData).toObject();

      // Step 2: Add to Firestore
      const docRef = await addDoc(groupCollectionRef, groupObject);
      const groupDoc = doc(db, collectionName, docRef.id);

      // Step 3: Create Auth account
      const userCredential = await docreateUserWithEmailAndPassword(groupData.email, password);
      const userUID = userCredential.user.uid;

      // Step 4: Update Firestore with ID, UID, and status
    // Step 4: Update Firestore with ID, UID, and status
await updateDoc(groupDoc, {
  [idName]: docRef.id,
  userUID: userUID,
  status: "under review",
  status_history: arrayUnion({
    date: new Date().toISOString(),
    status: "under review",
    changedBy: groupData.employeeId || "system"
  })
});

      // Step 5: Add employeeId to /company/{companyId}.employees array
      if (groupData.companyId) {
        const companyRef = doc(db, "company", groupData.companyId);
        await updateDoc(companyRef, {
          employee: arrayUnion(docRef.id)
        });
      }

      setGroupData(new ModelClass({}));

      Swal.fire({
        title: "Success!",
        icon: "success",
        text: `${fileType} Successfully Created`
      }).then(() => {
        Swal.fire({
          title: "Next Steps",
          icon: "info",
          html: `
            <p>Your submission is under review.</p>
            <p><strong>Please wait up to 24 hours</strong> for validation, or <strong>up to 48 hours during weekends</strong>.</p>
            <p>You will be <strong>notified via email</strong> at <em>${groupData.email}</em>.</p>
          `,
          confirmButtonText: "Okay, got it!"
        }).then(() => {
          navigate("/home");
        });
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMessage(error.message);

      Swal.fire({
        title: "Error!",
        icon: "error",
        text: "Please Try Again"
      });
    }
  };

  return (
    <div>
      <Button
        className="color-blue-button"
        disabled={disabled}
        onClick={handleSubmit}
        type="submit"
      >
        Submit
      </Button>
    </div>
  );
};

export default SaveGroupEmployee;
