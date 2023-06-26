import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { UserAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/MyProfile.css";
import countriesCities from "../jsons/countries.json";
import { Link, useNavigate } from "react-router-dom";

function MyProfile() {
  const { user } = UserAuth();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedData, setUpdatedData] = useState({});
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [errors, setErrors] = useState({});
  const [areDetailsComplete, setAreDetailsComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
          validateDetails(userDocSnap.data());
        }
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (userData) {
      setSelectedCountry(userData.country || "");
      setSelectedCity(userData.city || "");
    }
  }, [userData]);

  const handleInputChange = (e) => {
    setUpdatedData({
      ...updatedData,
      [e.target.name]: e.target.value !== "" ? e.target.value : "",
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === " ") {
      e.preventDefault();
    }
  };

  const toggleEditMode = () => {
    if (!isEditing) {
      setUpdatedData(userData);
    }
    setIsEditing(!isEditing);
  };
  const saveChanges = async () => {
    if (!validateInput()) {
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, updatedData, { merge: true });
      setIsEditing(false);
      setUserData({ ...userData, ...updatedData });
      validateDetails({ ...userData, ...updatedData });
    } catch (error) {
      console.log("Error updating user data:", error);
    }
  };

  const validateDetails = (data) => {
    if (
      data.firstName &&
      data.lastName &&
      data.phoneNumber &&
      data.addressLine1 &&
      data.country &&
      data.city &&
      data.firstName.trim() !== "" &&
      data.lastName.trim() !== "" &&
      data.phoneNumber.trim() !== "" &&
      data.addressLine1.trim() !== "" &&
      data.country.trim() !== "" &&
      data.city.trim() !== ""
    ) {
      setAreDetailsComplete(true);
    } else {
      setAreDetailsComplete(false);
    }
  };

  const handleCountryChange = (e) => {
    setSelectedCountry(e.target.value);
    setSelectedCity("");
    setUpdatedData({
      ...updatedData,
      country: e.target.value,
      city: "",
    });
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);

    setUpdatedData({
      ...updatedData,
      city: e.target.value,
    });
  };

  const renderCountryDropdown = () => (
    <select
      className="form-control"
      value={selectedCountry}
      onChange={handleCountryChange}
    >
      <option value="">Select Country</option>
      {Object.keys(countriesCities).map((country) => (
        <option key={country} value={country}>
          {country}
        </option>
      ))}
    </select>
  );

  const renderCityDropdown = () => {
    const cities = countriesCities[selectedCountry];

    if (!cities) return null;
    const uniqueCities = Array.from(new Set(cities));

    return (
      <select
        className="form-control"
        value={selectedCity}
        onChange={handleCityChange}
      >
        <option value="">Select City</option>
        {uniqueCities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    );
  };

  const handleVerification = () => {
    if (!areDetailsComplete) {
      alert("You must fill in your profile details");
    } else {
      navigate("/verify-id");
    }
  };

  const validateInput = () => {
    let isValid = true;
    let newErrors = {};

    if (
      updatedData.firstName &&
      !/^[a-zA-Z]+$/.test(updatedData.firstName.trim())
    ) {
      isValid = false;
      newErrors.firstName =
        "First name should be at least 2 characters long and contain no symbols";
    }

    if (
      updatedData.lastName &&
      !/^[a-zA-Z]+$/.test(updatedData.lastName.trim())
    ) {
      isValid = false;
      newErrors.lastName =
        "Last name should be at least 2 characters long and contain no symbols";
    }

    if (updatedData.phoneNumber && !/^\d+$/.test(updatedData.phoneNumber)) {
      isValid = false;
      newErrors.phoneNumber = "Phone number should contain only digits";
    }

    if (
      updatedData.addressLine1 &&
      !/^[a-zA-Z0-9\s]+$/.test(updatedData.addressLine1)
    ) {
      isValid = false;
      newErrors.addressLine1 = "Address Line 1 should not contain symbols";
    }

    if (
      updatedData.addressLine2 &&
      !/^[a-zA-Z0-9\s]+$/.test(updatedData.addressLine2)
    ) {
      isValid = false;
      newErrors.addressLine2 = "Address Line 2 should not contain symbols";
    }

    setErrors(newErrors);
    return isValid;
  };

  return (
    <>
      <Navbar hideSearchBar />
      <div className="container my-profile">
        <h2>My Profile</h2>
        {userData ? (
          <>
            <div className="user-info">
              <label>Username:</label>
              <span>{userData.username}</span>
            </div>
            <div className="verification-status">
              <label>Verification Status:</label>
              {userData.isVerified ? (
                <span className="text-success">Verified</span>
              ) : (
                <span className="error-message">Unverified</span>
              )}
            </div>
            <div className="contact-info">
              <label>Email:</label>
              <span>{userData.email}</span>
            </div>
            <div className="phone-number">
              <label>Phone Number:</label>
              {isEditing ? (
                <>
                  <input
                    className="form-control"
                    type="text"
                    name="phoneNumber"
                    value={updatedData.phoneNumber || ""}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                  />
                </>
              ) : (
                <span>{userData.phoneNumber}</span>
              )}
            </div>
            <div className="first-name">
              <label>First Name:</label>
              {isEditing ? (
                <>
                  <input
                    className="form-control"
                    type="text"
                    name="firstName"
                    value={updatedData.firstName || ""}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                  />
                </>
              ) : (
                <span>{userData.firstName}</span>
              )}
            </div>
            <div className="last-name">
              <label>Last Name:</label>
              {isEditing ? (
                <>
                  <input
                    className="form-control"
                    type="text"
                    name="lastName"
                    value={updatedData.lastName || ""}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                  />
                </>
              ) : (
                <span>{userData.lastName}</span>
              )}
            </div>
            <div className="address-line1">
              <label>Address Line 1:</label>
              {isEditing ? (
                <>
                  <input
                    className="form-control"
                    type="text"
                    name="addressLine1"
                    value={updatedData.addressLine1 || ""}
                    onChange={handleInputChange}
                  />
                </>
              ) : (
                <span>{userData.addressLine1}</span>
              )}
            </div>
            <div className="address-line2">
              <label>Address Line 2:</label>
              {isEditing ? (
                <>
                  <input
                    className="form-control"
                    type="text"
                    name="addressLine2"
                    value={updatedData.addressLine2 || ""}
                    onChange={handleInputChange}
                  />
                </>
              ) : (
                <span>{userData.addressLine2}</span>
              )}
            </div>

            <div className="country">
              <label>Country:</label>
              {isEditing ? (
                renderCountryDropdown()
              ) : (
                <span>{userData.country}</span>
              )}
            </div>
            <div className="city">
              <label>City:</label>
              {isEditing ? renderCityDropdown() : <span>{userData.city}</span>}
            </div>
            <br />
            <div className="error-messages">
              {Object.entries(errors).map(([key, message]) => (
                <div key={key} className="error-message">
                  {message}
                </div>
              ))}
            </div>
            {isEditing ? (
              <button className="save-changes-btn" onClick={saveChanges}>
                Save Changes
              </button>
            ) : (
              <>
                <button className="edit-profile-btn" onClick={toggleEditMode}>
                  Edit Profile Details
                </button>
                {!userData.isVerified && (
                  <button
                    className="verify-now-btn"
                    onClick={handleVerification}
                  >
                    Verify Now
                  </button>
                )}
              </>
            )}
          </>
        ) : (
          <p>Loading user data...</p>
        )}
      </div>
    </>
  );
}
export default MyProfile;
