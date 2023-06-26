import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import axios from "axios";
import "../styles/verifyID.css";
import { db, storage, auth } from "../firebase";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

function Verify() {
  const [image, setImage] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  useEffect(() => {
    const fetchUserData = async (user) => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists) {
          setFirstName(userDocSnap.data().firstName);
          setLastName(userDocSnap.data().lastName);
          setAddressLine1(userDocSnap.data().addressLine1);
          setCity(userDocSnap.data().city);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user);
      } else {
        navigate("/login");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  const handleDocumentTypeChange = (e) => {
    setDocumentType(e.target.value);
  };

  const updateIsVerified = async (user, isVerified) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        isVerified,
      });
    } catch (error) {
      console.error("Error updating isVerified:", error);
    }
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("photo", image);
    formData.append("document_type", documentType);
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("address_line1", addressLine1);
    formData.append("city", city);
    console.log(firstName, lastName);

    setIsVerifying(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/api/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setVerificationResult(response.data.is_valid_id);

      // Update isVerified field in Firestore
      if (response.data.is_valid_id) {
        const user = auth.currentUser;
        if (user) {
          await updateIsVerified(user, true);
        }
      }
    } catch (error) {
      console.error(error);
      setVerificationResult(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const placeholderURL = "https://via.placeholder.com/200x300?text=ID+card";

  return (
    <>
      <Navbar hideSearchBar />
      <div className="container my-4">
        <div className="row">
          <div className="col-md-6">
            <div className="card verify-card">
              <div className="card-header">
                <h3 className="card-title">Verify Image</h3>
              </div>
              <div className="card-body">
                <form>
                  <div className="form-group">
                    <label htmlFor="image" className="label">
                      Choose an image:
                    </label>
                    <input
                      type="file"
                      className="input-file"
                      id="image"
                      onChange={handleImageChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="document-type" className="label">
                      Select document type:
                    </label>
                    <select
                      className="select123"
                      id="document-type"
                      value={documentType}
                      onChange={handleDocumentTypeChange}
                    >
                      <option value="">-- Select document type --</option>
                      <option value="Driving licence">Driving licence</option>
                      <option value="Passport">Passport</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className="button123"
                    onClick={handleUpload}
                    disabled={!image || !documentType || isVerifying}
                  >
                    {isVerifying ? "Verifying..." : "Upload"}
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Uploaded Image</h3>
              </div>
              <div className="card-body">
                <img
                  src={image ? URL.createObjectURL(image) : placeholderURL}
                  alt="Uploaded ID card"
                  className="image"
                />
              </div>
            </div>
          </div>
          {verificationResult !== null && (
            <div className="col-md-12 mt-4">
              <div
                className={`alert ${
                  verificationResult ? "alert-success" : "alert-danger"
                }`}
                role="alert"
              >
                {verificationResult
                  ? "Verification successful!"
                  : "Verification failed."}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Verify;
