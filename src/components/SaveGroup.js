import React, { useState } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../config/firebase"; // Adjust this import based on your Firebase configuration
import { Button } from "react-bootstrap";
import { docreateUserWithEmailAndPassword } from '../config/auth';

const SaveGroupToCloud = ({ 
    fileType = "file", 
    collectionName = "", 
    idName = "", 
    ModelClass,
    disabled, // New prop to disable button
    groupData,
    password,
    email,
    setGroupData,
    onSuccess

}) => {
    // const [groupData, setGroupData] = useState(new ModelClass({}));
    const [errorMessage, setErrorMessage] = useState("");

    const groupCollectionRef = collection(db, collectionName);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        try {
            // Show Swal loading
            Swal.fire({
                title: "Uploading...",
                text: `Please wait while your ${fileType} is being uploaded.`,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Ensure groupData is an instance of ModelClass before calling toObject
            const groupObject = groupData instanceof ModelClass 
                ? groupData.toObject() 
                : new ModelClass(groupData).toObject();

            const docRef = await addDoc(groupCollectionRef, groupObject);
            const groupDoc = doc(db, collectionName, docRef.id);
            await updateDoc(groupDoc, { [idName]: docRef.id }).then(async () => {
                await docreateUserWithEmailAndPassword(groupData.email, password);
            });
            setGroupData(new ModelClass({})); // Reset form data
            // Close loading Swal and show success message
            Swal.fire({ 
                title: "Success!", 
                icon: "success", 
                text: `${fileType} Successfully Created` 
            });

            if (onSuccess) {
                onSuccess();
            }

        } catch (error) {
            console.error("Error submitting form:", error);
            setErrorMessage(error.message);

            // Close loading Swal and show error message
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
                disabled = {disabled}
                onClick={handleSubmit}
                type="submit"
                onSuccess={onSuccess}
            >
                Submit
                
            </Button>
        </div>
    );
};

export default SaveGroupToCloud;
