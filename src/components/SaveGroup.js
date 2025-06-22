import React, { useState } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../config/firebase";
import { Button } from "react-bootstrap";
import { docreateUserWithEmailAndPassword } from "../config/auth";
import { useNavigate } from "react-router-dom"; // <-- Import this

const SaveGroupToCloud = ({
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
  const navigate = useNavigate(); // <-- Hook for redirect

  const groupCollectionRef = collection(db, collectionName);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
      Swal.fire({
        title: "Uploading...",
        text: `Please wait while your ${fileType} is being uploaded.`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const groupObject =
        groupData instanceof ModelClass
          ? groupData.toObject()
          : new ModelClass(groupData).toObject();

      const docRef = await addDoc(groupCollectionRef, groupObject);
const groupDoc = doc(db, collectionName, docRef.id);

// Step 1: Create the Auth user and get UID
const userCredential = await docreateUserWithEmailAndPassword(groupData.email, password);
const userUID = userCredential.user.uid;

// Step 2: Update Firestore with document ID + Auth UID
await updateDoc(groupDoc, {
  [idName]: docRef.id,
  userUID: userUID // ✅ save the Auth UID for later login lookup
});


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
              <p>You will be <strong>notified via email</strong> at <em>${groupData.email}</em> or may receive a call via your company contact for further instructions.</p>
        `,
          confirmButtonText: "Okay, got it!"
        }).then(() => {
          navigate("/home"); // ✅ Redirect after confirmation
        });
      });

      if (onSuccess) {
        onSuccess();
      }
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

export default SaveGroupToCloud;
