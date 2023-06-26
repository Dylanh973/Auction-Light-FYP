import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Navbar from "./Navbar";
import { db, storage } from "../firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import "../styles/sharedStyles.css";
import "../styles/homePage.css";
import "../styles/createAuction.css";

function CreateAuction() {
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [auctionLengthDays, setAuctionLengthDays] = useState(0);
  const [auctionLengthHours, setAuctionLengthHours] = useState(0);
  const [auctionStartDate, setAuctionStartDate] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [reserveBid, setReserveBid] = useState("");
  const [condition, setCondition] = useState("");
  const [delivery, setDelivery] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { user } = UserAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);

  const [thumbnailPreview, setThumbnailPreview] = useState(
    "https://via.placeholder.com/300x300?text=Thumbnail"
  );
  const [photosPreview, setPhotosPreview] = useState(
    Array(4).fill("https://via.placeholder.com/75x75?text=Photo")
  );
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (index) => {
    setSelectedImage(photosPreview[index]);
  };

  const handleThumbnailUpload = (event) => {
    const file = event.target.files[0];
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handlePhotosUpload = (event) => {
    const files = Array.from(event.target.files).slice(0, 4);
    if (files.length > 0) {
      setPhotos(files);
      setPhotosPreview(files.map((file) => URL.createObjectURL(file)));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === " ") {
      e.preventDefault();
    }
  };

  function ErrorMessage({ message }) {
    return (
      <div style={{ backgroundColor: "red", color: "white", padding: "10px" }}>
        {message}
      </div>
    );
  }

  const uploadThumbnail = async () => {
    const thumbnailRef = ref(storage, `thumbnails/${thumbnail.name}`);
    const thumbnailSnapshot = await uploadBytesResumable(
      thumbnailRef,
      thumbnail
    );
    const thumbnailURL = await getDownloadURL(thumbnailRef);
    return thumbnailURL;
  };

  const uploadPhotos = async () => {
    const photoURLs = await Promise.all(
      photos.map(async (photo) => {
        const photoRef = ref(storage, `photos/${photo.name}`);
        const photoSnapshot = await uploadBytesResumable(photoRef, photo);
        const photoURL = await getDownloadURL(photoRef);
        return photoURL;
      })
    );
    return photoURLs;
  };

  const addAuctionToDatabase = async (auctionData) => {
    try {
      const auctionRef = await addDoc(collection(db, "auctions"), {
        ...auctionData,
        auctionFinished: false,
      });
      return auctionRef.id;
    } catch (error) {
      console.error("Error adding auction data: ", error);
    }
  };

  const resetForm = () => {
    setTitle("");
    setThumbnail(null);
    setPhotos([]);
    setAuctionLengthDays("");
    setAuctionLengthHours("");
    setAuctionStartDate("");
    setItemDescription("");
    setStartingBid("");
    setReserveBid("");
    setCondition("");
    setDelivery("");
    setLocation("");
    setThumbnailPreview("https://via.placeholder.com/300x300?text=Thumbnail");
    setPhotosPreview(
      Array(4).fill("https://via.placeholder.com/75x75?text=Photo")
    );
    setSelectedImage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    setSubmitDisabled(true);

    const totalAuctionLengthInHours =
      Math.floor(auctionLengthDays) * 24 +
      Math.floor(Number(auctionLengthHours));
    if (totalAuctionLengthInHours > 132) {
      console.log("total hours", totalAuctionLengthInHours);
      setErrorMessage(
        "Auction length cannot be longer than 5 days and 12 hours."
      );
      setSubmitDisabled(false);
      return;
    }
    const now = new Date();
    const auctionStartDateObject = new Date(auctionStartDate);
    const minStartDate = new Date(now.getTime() + 1 * 60 * 1000);
    const maxStartDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    if (
      auctionStartDateObject < minStartDate ||
      auctionStartDateObject > maxStartDate
    ) {
      setErrorMessage(
        "Auction must start in a minimum of 1 hour and a maximum of 5 days."
      );
      setSubmitDisabled(false);
      return;
    }

    const startingBidNumber = Number(startingBid);
    const reserveBidNumber = Number(reserveBid);
    if (
      isNaN(startingBidNumber) ||
      isNaN(reserveBidNumber) ||
      startingBidNumber < 0 ||
      reserveBidNumber < 0
    ) {
      setErrorMessage("Starting bid and reserve bid must be positive numbers.");
      setSubmitDisabled(false);
      return;
    }

    const auctionEndDate = new Date(
      auctionStartDateObject.getTime() +
        totalAuctionLengthInHours * 60 * 60 * 1000
    ).toISOString();

    const thumbnailURL = await uploadThumbnail();
    const photoURLs = await uploadPhotos();
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    const isVerified = userDoc.exists() ? userDoc.data().isVerified : false;

    const auctionData = {
      title,
      thumbnailURL,
      photoURLs,
      auctionLengthDays,
      auctionLengthHours,
      auctionStartDate,
      auctionEndDate,
      itemDescription,
      startingBid,
      reserveBid,
      condition,
      delivery,
      location,
      createdBy: user.uid,
      isVerified,
      onlyVerified,
    };

    const auctionId = await addAuctionToDatabase(auctionData);
    navigate(`/auction/${auctionId}`);

    resetForm();
    setSuccessMessage("Successfully posted your auction!");
    setSubmitDisabled(false);
  };

  return (
    <>
      <Navbar hideSearchBar />
      <div className="container">
        <h2>Create Auction</h2>
        <form onSubmit={handleSubmit}>
          <div className="title-input">
            <label>Title:</label>
            <input
              className="title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="underline"></div>
          <div className="thumbnail-preview">
            {thumbnailPreview && (
              <img src={thumbnailPreview} alt="Thumbnail preview" />
            )}
          </div>
          <div className="photos-preview">
            {photosPreview.map((preview, index) => (
              <img
                key={index}
                src={preview}
                alt={`Preview ${index + 1}`}
                className="photo-preview"
                onClick={() => handleImageClick(index)}
              />
            ))}
          </div>
          <div className="underline"></div>
          <div>
            <label>Thumbnail:</label>
            <input
              type="file"
              onChange={handleThumbnailUpload}
              required
              accept="image/jpeg, image/png, image/webp"
            />
          </div>
          <div>
            <label>Photos:</label>
            <input
              type="file"
              multiple
              onChange={handlePhotosUpload}
              required
              accept="image/jpeg, image/png, image/webp"
            />
          </div>
          <div className="underline"></div>
          <div>
            <label>Auction Length:</label>
            <div>
              <input
                type="number"
                value={auctionLengthDays}
                onChange={(e) => setAuctionLengthDays(e.target.value)}
                onKeyPress={handleKeyPress}
                required
              />
              <span> Days </span>
              <input
                type="number"
                value={auctionLengthHours}
                onChange={(e) => setAuctionLengthHours(e.target.value)}
                onKeyPress={handleKeyPress}
                required
              />
              <span> Hours </span>
            </div>
          </div>
          <div className="underline"></div>
          <div>
            <label>Auction Start Date:</label>
            <input
              type="datetime-local"
              value={auctionStartDate}
              onChange={(e) => setAuctionStartDate(e.target.value)}
              onKeyPress={handleKeyPress}
              required
            />
          </div>
          <div className="underline"></div>
          <div>
            <label>Item Description:</label>
            <textarea
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              required
            />
          </div>
          <div className="underline"></div>
          <div className="bid-inputs">
            <div>
              <label>Starting Bid:</label>
              <input
                type="number"
                value={startingBid}
                onChange={(e) => setStartingBid(e.target.value)}
                onKeyPress={handleKeyPress}
                required
              />
            </div>
          </div>
          <div className="bid-inputs">
            <div>
              <label>Reserve Bid:</label>
              <input
                type="number"
                value={reserveBid}
                onChange={(e) => setReserveBid(e.target.value)}
                onKeyPress={handleKeyPress}
                required
              />
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={() => setOnlyVerified(!onlyVerified)}
                />
                Only allow verified users to bid
              </label>
            </div>
          </div>
          <div className="underline"></div>
          <div>
            <label>Condition:</label>
            <div className="underline"></div>
            <div>
              <input
                type="radio"
                name="condition"
                value="brandNewWithPackaging"
                onChange={(e) => setCondition(e.target.value)}
                required
              />
              <label>Brand new with packaging</label>
            </div>
            <div>
              <input
                type="radio"
                name="condition"
                value="brandNewWithNoPackaging"
                onChange={(e) => setCondition(e.target.value)}
                required
              />
              <label>Brand new without packaging</label>
            </div>
            <div>
              <input
                type="radio"
                name="condition"
                value="Used"
                onChange={(e) => setCondition(e.target.value)}
                required
              />
              <label>Used</label>
            </div>
          </div>
          <div>
            <label>Delivery:</label>
            <div className="underline"></div>
            <div>
              <input
                type="radio"
                name="delivery"
                value="Collection"
                onChange={(e) => setDelivery(e.target.value)}
                required
              />
              <label>Collection</label>
            </div>
            <div>
              <input
                type="radio"
                name="delivery"
                value="Postage"
                onChange={(e) => setDelivery(e.target.value)}
                required
              />
              <label>Postage</label>
            </div>
            <div>
              <input
                type="radio"
                name="delivery"
                value="Both"
                onChange={(e) => setDelivery(e.target.value)}
                required
              />
              <label>Both</label>
            </div>
          </div>
          <div>
            <label>Location:</label>
            <div className="underline"></div>
            <div>
              <input
                type="radio"
                name="location"
                value="Ireland"
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              <label>Ireland</label>
            </div>
            <div>
              <input
                type="radio"
                name="location"
                value="Ireland-uk"
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              <label>Ireland & UK</label>
            </div>
            <div>
              <input
                type="radio"
                name="location"
                value="Europe"
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              <label>Europe</label>
            </div>
          </div>
          {selectedImage && (
            <div className="enlarged-photo-container">
              <img
                src={selectedImage}
                alt="Enlarged Preview"
                className="enlarged-photo"
              />
              <button onClick={() => setSelectedImage(null)}>Close</button>
            </div>
          )}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
          {errorMessage && <ErrorMessage message={errorMessage} />}
          <div>
            <button type="submit" disabled={submitDisabled}>
              Create Auction
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default CreateAuction;
