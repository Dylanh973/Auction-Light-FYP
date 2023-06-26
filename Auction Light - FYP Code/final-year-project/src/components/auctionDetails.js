import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { deleteDoc } from "firebase/firestore";
import Navbar from "./Navbar";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";
import { Carousel } from "react-responsive-carousel";
import { UserAuth } from "../context/AuthContext";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import "../styles/auctionDetails.css";

const AuctionDetails = () => {
  const { id } = useParams();
  const currentUser = UserAuth().user;
  const [auction, setAuction] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [auctionCreatorId, setAuctionCreatorId] = useState(null);
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [timerText, setTimerText] = useState("");
  const [isAuctionOngoing, setIsAuctionOngoing] = useState(false);
  const [sellerUsername, setSellerUsername] = useState("");

  const navigate = useNavigate();

  const handleBidSubmit = async (e) => {
    e.preventDefault();

    if (!isAuctionOngoing) {
      alert("You cannot bid as the auction hasn't started yet.");
      return;
    }

    if (
      !auction.currentBid &&
      Number(bidAmount) < Number(auction.startingBid)
    ) {
      alert("Your first bid must be higher than the starting bid.");
      return;
    }

    if (Number(bidAmount) <= auction.currentBid) {
      alert("Your bid must be higher than the current bid.");
      return;
    }

    if (auction.onlyVerified) {
      if (!currentUser) {
        alert("Please sign in to bid.");
        return;
      }

      const userDoc = doc(db, "users", currentUser.uid);
      const userSnapshot = await getDoc(userDoc);
      if (!userSnapshot.exists()) {
        alert("User does not exist.");
        return;
      }

      if (!userSnapshot.data().isVerified) {
        alert("You must be a verified user to bid on this auction.");
        return;
      }
    }

    const auctionDoc = doc(db, "auctions", id);
    const auctionSnapshot = await getDoc(auctionDoc);
    const auctionData = auctionSnapshot.data();
    if (auctionData.auctionFinished) {
      alert("The auction has already finished.");
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      await updateDoc(doc(db, "auctions", id), {
        currentBid: bidAmount,
        currentBidder: currentUser.uid,
        winningBidder: currentUser.uid,
      });

      await addDoc(collection(db, "bids"), {
        userID: currentUser.uid,
        auctionID: id,
        bidAmount,
        timestamp,
      });

      alert("Your bid was successful!");
    } catch (error) {
      console.error(error);
    }
    setBidAmount("");
  };

  const fetchSellerUsername = async (userId) => {
    const userDoc = doc(db, "users", userId);
    const userSnapshot = await getDoc(userDoc);
    if (userSnapshot.exists()) {
      setSellerUsername(userSnapshot.data().username);
    }
  };

  useEffect(() => {
    if (auction) {
      fetchSellerUsername(auction.createdBy);
    }
  }, [auction]);

  const checkAuctionFinished = async () => {
    const now = new Date();
    const startDate = new Date(auction?.auctionStartDate);
    const endDate = new Date(
      startDate.getTime() +
        auction?.auctionLengthDays * 24 * 60 * 60 * 1000 +
        auction?.auctionLengthHours * 60 * 60 * 1000
    );
    if (now >= endDate) {
      try {
        await updateDoc(doc(db, "auctions", id), {
          auctionFinished: true,
        });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const fetchAuction = () => {
    const auctionDoc = doc(db, "auctions", id);
    const unsubscribe = onSnapshot(auctionDoc, (docSnapshot) => {
      const fetchedAuction = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
      };
      setAuction(fetchedAuction);
      setAuctionCreatorId(fetchedAuction.createdBy);

      if (fetchedAuction.auctionStartDate) {
        updateTimeRemaining(
          fetchedAuction.auctionStartDate,
          fetchedAuction.auctionLengthDays,
          fetchedAuction.auctionLengthHours
        );
      }
    });

    return () => {
      unsubscribe();
    };
  };

  const formatCondition = (condition) => {
    if (!condition) return "";
    const result = condition.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  const updateTimeRemaining = (
    auctionStartDate,
    auctionLengthDays,
    auctionLengthHours
  ) => {
    const now = new Date();
    const startDate = new Date(auctionStartDate);
    const endDate = new Date(
      startDate.getTime() +
        auctionLengthDays * 24 * 60 * 60 * 1000 +
        auctionLengthHours * 60 * 60 * 1000
    );

    setTimeRemaining(endDate - now);
  };

  useEffect(() => {
    const unsubscribe = fetchAuction();
    return () => {
      unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    const intervalId = setInterval(checkAuctionFinished, 1000 * 60);
    return () => clearInterval(intervalId);
  }, [auction]);

  useEffect(() => {
    if (auction) {
      const interval = setInterval(() => {
        updateTimeRemaining(
          auction.auctionStartDate,
          auction.auctionLengthDays,
          auction.auctionLengthHours
        );
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [auction]);

  const handleMessageButtonClick = () => {
    navigate(`/messages/${auctionCreatorId}`);
  };

  useEffect(() => {
    const updateTimerText = async () => {
      const now = new Date();
      const startDate = new Date(auction?.auctionStartDate);
      const endDate = new Date(
        startDate.getTime() +
          auction?.auctionLengthDays * 24 * 60 * 60 * 1000 +
          auction?.auctionLengthHours * 60 * 60 * 1000
      );

      if (now < startDate) {
        const timeRemaining = Math.floor((startDate - now) / 1000);
        setTimerText(`Bidding Begins In: ${formatTime(timeRemaining)}`);
      } else if (now >= startDate && now < endDate) {
        const timeRemaining = Math.floor((endDate - now) / 1000);
        setTimerText(`Auction Ends In: ${formatTime(timeRemaining)}`);
        setIsAuctionOngoing(true);
      } else {
        setTimerText("Auction Ended");
      }
    };

    updateTimerText();
    const intervalId = setInterval(updateTimerText, 1000);
    return () => clearInterval(intervalId);
  }, [auction]);

  const formatTime = (timeRemainingInSeconds) => {
    const hours = Math.floor(timeRemainingInSeconds / 3600);
    const minutes = Math.floor((timeRemainingInSeconds % 3600) / 60);
    const seconds = timeRemainingInSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <>
      <Navbar hideSearchBar />
      <div className="auction-details-page">
        <div className="auction-details-container">
          {auction ? (
            <>
              <div className="left-section">
                <Carousel>
                  <div>
                    <img src={auction.thumbnailURL} alt="thumbnail" />
                  </div>
                  {auction.photoURLs.map((photoURL, index) => (
                    <div key={index}>
                      <img src={photoURL} alt={`photo-${index}`} />
                    </div>
                  ))}
                </Carousel>
              </div>
              <div className="right-section">
                <h1>{auction.title}</h1>
                <div className="bidding-begins">
                  <p>{timerText}</p>
                </div>
                <div className="seller-details">
                  <p>Seller: {sellerUsername} </p>
                  {currentUser && currentUser.uid !== auction.createdBy && (
                    <button
                      className="message-button"
                      onClick={() => navigate(`/message/${auction.createdBy}`)}
                    >
                      Message
                    </button>
                  )}{" "}
                </div>
                {auction.onlyVerified && (
                  <div className="verificaiton-message123">
                    <p className="verification-message">
                      Must be verified to bid on this auction.
                    </p>
                  </div>
                )}
                <div className="location123">
                  <p>Location:{formatCondition(auction.location)}</p>
                </div>
                <div className="auction-details">
                  <div className="auction-details1">
                    <div className="condition">
                      <h3>Condition:</h3>
                      <p>{formatCondition(auction.condition)}</p>
                    </div>
                    <div className="starting-bid">
                      <h3>Starting Bid:</h3>
                      <p>€{auction.startingBid}</p>
                    </div>
                    <div className="current-bid">
                      <h3>
                        {auction.auctionFinished && auction.currentBid
                          ? "Winning Bid:"
                          : "Current Bid:"}
                      </h3>
                      <p>
                        {auction.currentBid
                          ? `€${auction.currentBid}`
                          : "Item had no bids"}
                      </p>
                      {auction.auctionFinished &&
                        auction.currentBid &&
                        Number(auction.currentBid) <
                          Number(auction.reserveBid) && (
                          <p>Item didn't meet the reserve bid.</p>
                        )}
                    </div>
                  </div>
                  <div className="auction-details2">
                    <div className="auction-length">
                      <h3>Auction Length:</h3>
                      <p>{`${auction.auctionLengthDays} days ${auction.auctionLengthHours} hours`}</p>
                    </div>
                    <div className="reserve-bid">
                      <h3>Reserve Bid:</h3>
                      <p>€{auction.reserveBid}</p>
                    </div>
                    <div className="delivery">
                      <h3>Delivery:</h3>
                      <p>{auction.delivery}</p>
                    </div>
                  </div>
                  <div className="item-desc">
                    <div className="item-description">
                      <h3>Item Description:</h3>
                      <p>{auction.itemDescription}</p>
                    </div>
                  </div>
                  <div className="verification-div">
                    <div className="verification-status">
                      <h3>Verification Status:</h3>
                      <p>{auction.isVerified ? "Verified" : "Not Verified"}</p>
                    </div>
                  </div>
                  <div className="place-bid">
                    {currentUser && currentUser.uid !== auction.createdBy ? (
                      <form onSubmit={handleBidSubmit}>
                        <input
                          className="input-bid"
                          type="number"
                          placeholder="Enter your bid in €"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          required
                        />
                        <button type="submit" disabled={auctionStarted}>
                          Submit Bid
                        </button>
                      </form>
                    ) : (
                      <p>
                        {!isAuctionOngoing
                          ? "Bidding has not started yet."
                          : currentUser && currentUser.uid === auction.createdBy
                          ? "You cannot bid on your own auction."
                          : "Please sign in to bid."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </>
  );
};

export default AuctionDetails;
