import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Container, Button, Col, Form, Modal, Row, Image } from 'react-bootstrap';
import Webcam from 'react-webcam';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera,
  faUpload,
  faFilePdf,
  faFileWord,
  faBan as faCancel,
} from '@fortawesome/free-solid-svg-icons';
import { storage } from '../config/firebase';
import Spinner from 'react-bootstrap/Spinner'; // Add this to your imports at the top

export default function FileUploader({
  label,
  fileKey,
  storagePath,
  formData,
  setFormData,
  acceptedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  useCamera = true,
  onAutoUploadRef
}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const [file, setFile] = useState(null);
  const fileURL = formData[fileKey] || "";
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef(null);
  const [fileType, setFileType] = useState(null);

  useEffect(() => {
    if (fileURL) {
      fetch(fileURL, { method: "HEAD" })
        .then((res) => {
          const type = res.headers.get("Content-Type");
          setFileType(type);
        })
        .catch((err) => console.error("Failed to fetch headers:", err));
    }
  }, [fileURL]);

  useEffect(() => {
    if (onAutoUploadRef) {
      onAutoUploadRef.current = uploadFile;
    }
  }, [file]);

  const onFileDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (acceptedTypes.includes(file.type)) {
        setFile(file);
      } else {
        Swal.fire({
          icon: "error",
          title: "Invalid File Type",
          text: "Unsupported file format.",
        });
      }
    }
  }, [acceptedTypes]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: onFileDrop,
    accept: acceptedTypes.join(','),
    disabled: !!fileURL,
  });

  const uploadFile = async () => {
    if (!file) return;

    Swal.fire({
      title: "Uploading...",
      text: "Please wait while your file is being uploaded.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const filesFolderRef = ref(storage, `${storagePath}/${file.name}`);

    try {
      await uploadBytes(filesFolderRef, file);
      const downloadURL = await getDownloadURL(filesFolderRef);

      setFormData((prev) => ({ ...prev, [fileKey]: downloadURL }));

      Swal.fire({
        title: "Upload Complete!",
        text: "File uploaded successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Upload Failed!", "Something went wrong. Please try again.", "error");
    }
  };

  const resetFile = async () => {
    if (!fileURL) return;
    try {
      const fileRef = ref(storage, fileURL);
      await deleteObject(fileRef);
      setFile(null);
      setFormData((prev) => ({ ...prev, [fileKey]: "" }));
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
        const fileName = `captured_${fileKey}_${timestamp}.jpg`;
        const newFile = new File([blob], fileName, { type: "image/jpeg" });
        setFile(newFile);
        setShowCamera(false);
      });
  };

  const renderPreview = () => {
    const displayFile = file || fileURL;

    if (!displayFile) {
      return (
        <p className="text-muted">
          Drag & Drop your file here or <span className="text-primary text-decoration-underline">Choose File</span>
        </p>
      );
    }

    // New local file selected
    if (file) {
      if (file.type.startsWith("image/")) {
        return (
          <Image
            src={URL.createObjectURL(file)}
            alt="Preview"
            fluid
            className="mt-2"
            style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
          />
        );
      }

      if (file.type === "application/pdf") {
        return (
          <p className="fw-bold text-muted">
            <FontAwesomeIcon icon={faFilePdf} className="text-danger me-2" /> PDF: {file.name}
          </p>
        );
      }

      if (
        file.type === "application/msword" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return (
          <p className="fw-bold text-muted">
            <FontAwesomeIcon icon={faFileWord} className="text-primary me-2" /> DOC: {file.name}
          </p>
        );
      }

      return <p className="fw-bold text-muted">File: {file.name}</p>;
    }

    // Already uploaded file URL (image)
    if (typeof fileURL === "string" && fileURL.match(/\.(jpeg|jpg|png|webp|gif)$/i)) {
      return (
        <>
          {!imgLoaded && (
            <div className="d-flex justify-content-center align-items-center mt-3" style={{ height: "200px" }}>
              <Spinner animation="border" variant="primary" />
            </div>
          )}
          <Image
            src={fileURL}
            alt="Uploaded"
            onLoad={() => setImgLoaded(true)}
            fluid
            style={{
              display: imgLoaded ? "block" : "none",
              maxWidth: "100%",
              maxHeight: "200px",
              objectFit: "contain",
              marginTop: "10px",
            }}
          />
        </>
      );
    }

    // Fallback for non-image uploaded file (PDF/DOC/Other)
    return (
      <p className="fw-bold text-muted">
        <a href={fileURL} target="_blank" rel="noopener noreferrer">
          View Uploaded File
        </a>
      </p>
    );
  };



  return (
    <>
      <Form.Group className="my-2">
        <Form.Label className="fw-bold">{label}</Form.Label>

        <Container {...getRootProps()} className={`dropzone-container text-center w-100 ${fileURL ? "border-success" : ""}`}>
          <input {...getInputProps()} />
          {renderPreview()}
        </Container>

        <Container className="d-flex flex-wrap justify-content-between mt-2">
          <p className="sub-title me-3">Supported: PNG, JPG, JPEG, PDF, DOC</p>
          <p className="sub-title">Max size: 25MB</p>
        </Container>

        <Container className="d-flex justify-content-center gap-2 flex-wrap">
          {useCamera && (
            <Button variant="outline-secondary" onClick={() => {
              if (fileURL) resetFile();
              setShowCamera(!showCamera);
            }}>
              <FontAwesomeIcon icon={faCamera} /> {fileURL ? "Retake Photo" : showCamera ? "Cancel Camera" : "Use Camera"}
            </Button>
          )}

          {/* {file ? (
            <Button variant="outline-success" onClick={uploadFile}>
              <FontAwesomeIcon icon={faUpload} size="xs" fixedWidth /> Upload File
            </Button>
          ) : fileURL && (
            <Button variant="outline-danger" onClick={resetFile}>
              <FontAwesomeIcon icon={faCancel} size="xs" fixedWidth /> Replace File
            </Button>
          )} */}
          {fileURL && (
            <Button variant="outline-danger" onClick={resetFile}>
              <FontAwesomeIcon icon={faCancel} size="xs" fixedWidth /> Replace File
            </Button>
          )}


        </Container>

        {fileURL && (
          <Container className="d-flex justify-content-center mt-2">
            <p className='sub-title text-success'>Successfully uploaded!</p>
          </Container>
        )}
      </Form.Group>

      <Modal show={showCamera} onHide={() => setShowCamera(false)} centered fullscreen>
        <Modal.Body className="d-flex flex-column justify-content-center align-items-center">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-100 h-100"
            onUserMedia={() => console.log("Webcam access granted")}
            onUserMediaError={err => console.error("Webcam error:", err)}
          />

          <Container className="mt-3">
            <Row className="justify-content-center">
              <Col xs="auto">
                <Button variant="outline-primary" onClick={capturePhoto}>Capture</Button>
              </Col>
              <Col xs="auto">
                <Button variant="outline-danger" onClick={() => setShowCamera(false)}>Cancel</Button>
              </Col>
            </Row>
          </Container>
        </Modal.Body>
      </Modal>
    </>
  );
}
