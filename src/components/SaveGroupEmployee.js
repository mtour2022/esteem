import React, { useState, useRef } from "react";
import { collection, addDoc, updateDoc, doc, arrayUnion } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../config/firebase";
import { Button } from "react-bootstrap";
import { docreateUserWithEmailAndPassword } from "../config/auth";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import download from "downloadjs";
import jsPDF from "jspdf";
import logo from "../assets/images/lgu.png";
import QRCode from "qrcode"; // for rendering QR code into canvas

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
  const [logoLoaded, setLogoLoaded] = useState(false);
  const navigate = useNavigate();
  const qrRef = useRef(null);
  const dateNow = new Date().toLocaleString("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
    hour12: true,
  });


  const groupCollectionRef = collection(db, collectionName);

  const generateAndDownloadQR = async (quickStatusId) => {
    const node = qrRef.current;
    if (!node) return;

    if (!logoLoaded) {
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (logoLoaded) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    }

    const dataUrl = await toPng(node);

    const link = `https://esteem.com/quickstatus/${quickStatusId}`;

    Swal.fire({
      title: "Download QR Certificate",
      html: `
        <p>Choose your preferred format to download your QR Certificate.</p>
        <div class="text-start mb-2"><strong>QR Status Link:</strong></div>
        <input id="qr-link" type="text" class="swal2-input" readonly value="${link}" style="font-size: 12px;"/>
        <button onclick="navigator.clipboard.writeText(document.getElementById('qr-link').value)" class="swal2-confirm swal2-styled" style="background:#3085d6; margin-top:5px;">Copy Link</button>
      `,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Download PNG",
      denyButtonText: `Download PDF`
    }).then((result) => {
      if (result.isConfirmed) {
        download(dataUrl, `EmployeeQR_${quickStatusId}.png`);
      } else if (result.isDenied) {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [node.offsetWidth, node.offsetHeight]
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, node.offsetWidth, node.offsetHeight);
        pdf.save(`EmployeeQR_${quickStatusId}.pdf`);
      }
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
      Swal.fire({
        title: "Uploading...",
        text: `Please wait while your ${fileType} is being uploaded.`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const groupObject =
        groupData instanceof ModelClass
          ? groupData.toObject()
          : new ModelClass(groupData).toObject();

      const docRef = await addDoc(groupCollectionRef, groupObject);
      const groupDoc = doc(db, collectionName, docRef.id);

      const userCredential = await docreateUserWithEmailAndPassword(groupData.email, password);
      const userUID = userCredential.user.uid;

      await updateDoc(groupDoc, {
        [idName]: docRef.id,
        userUID: userUID,
        quickstatus_id: docRef.id,
        status: "under review",
        status_history: arrayUnion({
          date: new Date().toISOString(),
          status: "under review",
          changedBy: groupData.employeeId || "system"
        })
      });

      if (groupData.companyId) {
        const companyRef = doc(db, "company", groupData.companyId);
        await updateDoc(companyRef, {
          employee: arrayUnion(docRef.id)
        });
      }

      setGroupData(new ModelClass({}));

      Swal.fire({
        title: "Success!",
        html: `
          <div id="qr-preview" style="padding: 20px; text-align: center; background: #fff; border: 1px solid #ccc; font-family: Arial;">
            <img src="${logo}" alt="Logo" height="80" style="margin-bottom: 10px;" />
            <div style="font-size: 12px; font-weight: bold; line-height: 18px; margin-bottom: 10px;">
              Republic of the Philippines<br />
              Province of Aklan<br />
              Municipality of Malay<br />
              Municipal Tourism Office
            </div>
             
            <p style="font-size: 11px; margin-bottom: 10px; margin-top: 5px;">
              ${docRef.id} - ${groupData.firstname} ${groupData.middlename} ${groupData.surname}
            </p>
            <div style="display: flex; justify-content: center;">
              <canvas id="generatedQR"></canvas>
            </div>
            <p style="font-size: 11px; margin-top: 10px;">
              Scan this QR code to check your application status.<br />
              All information is protected and complies with the Data Privacy Act.
            </p>
            
             <p style="font-size: 10px; margin-top: 10px;">
              Issued by the Municipal Tourism Office, Malay Aklan<br />
              Registered on: ${dateNow}
            </p>
          </div>
          <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
            <button id="downloadImageBtn" class="swal2-confirm swal2-styled">Download as Image</button>
            <button id="proceedBtn" class="swal2-confirm swal2-styled" style="background: #28a745;">Proceed</button>
          </div>
        `,
        showConfirmButton: false,
        didOpen: () => {
          const qrCanvas = document.getElementById("generatedQR");
          QRCode.toCanvas(
            qrCanvas,
            `https://esteem.com/application-status-check/${docRef.id}`,
            { width: 300 },
            (err) => {
              if (err) console.error("QR generation error:", err);
            }
          );

          const qrPreview = document.getElementById("qr-preview");

          document.getElementById("downloadImageBtn").addEventListener("click", () => {
            if (!qrPreview) return;

            Swal.fire({
              title: "Downloading...",
              text: "Your image is being prepared for download.",
              allowOutsideClick: false,
              didOpen: () => Swal.showLoading()
            });

            toPng(qrPreview).then((dataUrl) => {
              download(dataUrl, `TourismStatusQR_${groupData.firstname}_${groupData.surname}_${docRef.id}.png`);

              Swal.fire({
                icon: "success",
                title: "Downloaded!",
                text: "The image has been saved to your device.",
                timer: 2000,
                showConfirmButton: false
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
                });
              });

            }).catch((err) => {
              console.error("Image download error:", err);
              Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to generate image. Please try again."
              });
            });
          });


          // document.getElementById("downloadPdfBtn").addEventListener("click", () => {
          //   if (!qrPreview) return;
          //   toPng(qrPreview).then((dataUrl) => {
          //     const pdf = new jsPDF({
          //       orientation: "portrait",
          //       unit: "px",
          //       format: [qrPreview.offsetWidth, qrPreview.offsetHeight]
          //     });
          //     pdf.addImage(dataUrl, 'PNG', 0, 0, qrPreview.offsetWidth, qrPreview.offsetHeight);
          //     pdf.save(`EmployeeQR_${docRef.id}.pdf`);
          //   });
          // });

          document.getElementById("proceedBtn").addEventListener("click", () => {
            Swal.fire({
              title: "Next Steps",
              icon: "info",
              html: `
                <p>Your submission is under review.</p>
                <p><strong>Please wait up to 24 hours</strong> for validation, or <strong>up to 48 hours during weekends</strong>.</p>
                <p>You will be <strong>notified via email</strong> at <em>${groupData.email}</em>.</p>
              `,
              confirmButtonText: "Okay, got it!"
            }).then(() => navigate("/home"));
          });
        }
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
      <div style={{ display: 'none' }}>
        <div
          ref={qrRef}
          style={{
            padding: 20,
            textAlign: 'center',
            background: '#fff',
            width: 300,
            border: '1px solid #ccc',
            fontFamily: 'Arial'
          }}
        >
          <img
            src={logo}
            alt="Logo"
            height="50"
            className="mb-2"
            onLoad={() => setLogoLoaded(true)}
          />
          <div style={{ fontSize: "14px", fontWeight: "bold", lineHeight: "18px", marginBottom: "10px" }}>
            Republic of the Philippines<br />
            Province of Aklan<br />
            Municipality of Malay<br />
            Municipal Tourism Office
          </div>

          <QRCodeCanvas
            value={`https://esteem.com/quickstatus/${groupData.employeeId || 'temp'}`}
            size={200}
          />
          <p style={{ fontSize: "11px", marginTop: "10px" }}>
            Scan this QR code to check your application status.<br />
            All information is protected and complies with the Data Privacy Act.
          </p>
          <p style={{ fontSize: "10px", marginTop: "10px" }}>
            Issued by the Municipal Tourism Office, Malay Aklan<br />
            Registered on: {dateNow}
          </p>


        </div>
      </div>

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
