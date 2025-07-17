import React, { useState } from "react";
import { collection, addDoc, updateDoc, doc, arrayUnion } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../config/firebase";
import { Button } from "react-bootstrap";
import { docreateUserWithEmailAndPassword } from "../config/auth";
import { useNavigate } from "react-router-dom";

const UpdateGroupEmployee = ({
  fileType = "file",
  collectionName = "",
  idName = "",
  ModelClass,
  disabled,
  groupData,
  password,
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
        title: "Saving...",
        text: `Please wait while your ${fileType} is being saved.`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const groupObject =
        groupData instanceof ModelClass
          ? groupData.toObject()
          : new ModelClass(groupData).toObject();

      let docRef;
      let isNew = false;

      if (groupData[idName]) {
        // Update existing
        docRef = doc(db, collectionName, groupData[idName]);
        await updateDoc(docRef, groupObject);
      } else {
        // Create new
        const createdDoc = await addDoc(groupCollectionRef, groupObject);
        docRef = createdDoc;
        isNew = true;

        const userCredential = await docreateUserWithEmailAndPassword(groupData.email, password);
        const userUID = userCredential.user.uid;

        await updateDoc(doc(db, collectionName, docRef.id), {
          [idName]: docRef.id,
          userUID,
          quickstatus_id: docRef.id,
          status: "under review",
          status_history: arrayUnion({
            date: new Date().toISOString(),
            status: "under review",
            changedBy: groupData.employeeId || "system"
          })
        });

        // Update company record if present
        if (groupData.companyId) {
          const companyRef = doc(db, "company", groupData.companyId);
          await updateDoc(companyRef, {
            employee: arrayUnion(docRef.id)
          });
        }
      }

      // Reset form if newly created
      if (isNew) {
        setGroupData(new ModelClass({}));
      }

      Swal.fire({
        icon: "success",
        title: isNew ? "Employee Added!" : "Employee Updated!",
        text: isNew ? "A new employee was successfully added." : "Employee data has been updated.",
        confirmButtonText: "OK"
      }).then(() => {
        if (onSuccess) onSuccess();
        navigate("/home");
      });

    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMessage(error.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "An error occurred. Please try again."
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

export default UpdateGroupEmployee;
