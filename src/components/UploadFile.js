import React, { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Container, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { storage } from '../config/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faFileWord, faUpload, faCamera, faCancel } from '@fortawesome/free-solid-svg-icons';
import Webcam from 'react-webcam';

export default function UploadField({
  label,
  storagePath,
  file,
  setFile,
  fileURL,
  formDataKey,
  setFormData,
  preview = true,
}) {
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    const accepted = acceptedFiles[0];
    const validTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (accepted && validTypes.includes(accepted.type)) {
      setFile(accepted);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Only PNG, JPG, JPEG, PDF, and DOC files are allowed.',
      });
    }
  }, [setFile]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: 'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    disabled: !!fileURL,
  });

  const uploadFile = async () => {
    if (!file) return;
    Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const fileRef = ref(storage, `${storagePath}/${file.name}`);
    try {
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      
      if (formDataKey && setFormData) {
        setFormData(prev => ({ ...prev, [formDataKey]: downloadURL }));
      }

      Swal.fire({ title: 'Upload Complete!', icon: 'success', timer: 2000, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire({ title: 'Upload Failed!', icon: 'error' });
    }
  };

  const resetFile = async () => {
    if (!fileURL) return;
    try {
      await deleteObject(ref(storage, fileURL));
      setFile(null);
      if (formDataKey && setFormData) {
        setFormData(prev => ({ ...prev, [formDataKey]: '' }));
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const imageFile = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFile(imageFile);
        setShowCamera(false);
      });
  };

  const renderPreview = () => {
    if (!file) return (
      <p className="text-muted">
        Drag & Drop your file here or <span className="text-primary text-decoration-underline">Choose File</span>
      </p>
    );

    if (file.type?.startsWith('image/') && preview) {
      return (
        <img
          src={URL.createObjectURL(file)}
          alt="Uploaded Preview"
          className="img-fluid mt-2"
          style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
        />
      );
    } else if (file.type === 'application/pdf') {
      return (
        <p className="fw-bold text-muted">
          <FontAwesomeIcon icon={faFilePdf} className="text-danger me-2" />
          PDF Selected: {file.name}
        </p>
      );
    } else if (
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return (
        <p className="fw-bold text-muted">
          <FontAwesomeIcon icon={faFileWord} className="text-primary me-2" />
          DOC File Selected: {file.name}
        </p>
      );
    }

    return <p className="fw-bold text-muted">File selected: {file.name}</p>;
  };

  return (
    <Container className="my-3">
      <label className="fw-bold mb-2">{label}</label>

      {showCamera ? (
        <Container className="text-center">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'user' }}
            style={{ width: "100%", maxHeight: "300px", borderRadius: "10px" }}
          />
          <Button variant="success" className="mt-2" onClick={capturePhoto}>
            <FontAwesomeIcon icon={faCamera} /> Capture Photo
          </Button>
        </Container>
      ) : (
        <div {...getRootProps({ className: `dropzone-container text-center w-100 ${fileURL ? 'border-success' : ''}` })}
          style={{ border: "2px dashed #ccc", padding: "20px", borderRadius: "10px" }}
        >
          <input {...getInputProps()} />
          {renderPreview()}
        </div>
      )}

      <Container className="d-flex flex-wrap justify-content-between mt-2">
        <p className="sub-title me-3">Supported Files: PNG, JPG, JPEG, PDF, DOC</p>
        <p className="sub-title">Max Size: 25MB</p>
      </Container>

      <Container className="d-flex justify-content-center gap-2 flex-wrap">
        <Button
          className="my-2"
          variant="outline-secondary"
          onClick={() => {
            if (fileURL) resetFile();
            setShowCamera(prev => !prev);
          }}
        >
          <FontAwesomeIcon icon={faCamera} /> {fileURL ? "Retake Photo" : showCamera ? "Cancel Camera" : "Use Camera"}
        </Button>

        {file && !fileURL && (
          <Button className="my-2" variant="outline-success" onClick={uploadFile}>
            <FontAwesomeIcon icon={faUpload} /> Upload File
          </Button>
        )}

        {fileURL && (
          <Button className="my-2" variant="outline-danger" onClick={resetFile}>
            <FontAwesomeIcon icon={faCancel} /> Reupload
          </Button>
        )}
      </Container>

      {fileURL && (
        <Container className="d-flex justify-content-center mt-2">
          <p className='sub-title text-success'>File Successfully Uploaded!</p>
        </Container>
      )}
    </Container>
  );
}
