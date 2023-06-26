import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { onSnapshot, query, where, collection } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "./Navbar";
import "../styles/homePage.css";
import "../styles/MyAuctions.css";
import { useSearch } from "../context/SearchContext";

const AuctionItem = ({ auction }) => {
  const {
    id,
    title,
    thumbnailURL,
    startingBid,
    auctionStartDate,
    auctionEndDate,
    currentBid,
    reserveBid,
    condition,
    isVerified,
    auctionFinished,
  } = auction;

  const [timerText, setTimerText] = useState("");

  const updateTimerText = () => {
    const now = new Date();
    const startDate = new Date(auctionStartDate);
    const endDate = new Date(auctionEndDate);

    if (now < startDate) {
      const timeRemaining = Math.floor((startDate - now) / 1000);
      setTimerText(`Bidding Begins In: ${formatTime(timeRemaining)}`);
    } else if (now >= startDate && now < endDate) {
      const timeRemaining = Math.floor((endDate - now) / 1000);
      setTimerText(`Auction Ends In: ${formatTime(timeRemaining)}`);
    } else {
      setTimerText("Auction Ended");
    }
  };

  const formatTime = (timeRemainingInSeconds) => {
    const hours = Math.floor(timeRemainingInSeconds / 3600);
    const minutes = Math.floor((timeRemainingInSeconds % 3600) / 60);
    const seconds = timeRemainingInSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    updateTimerText();
    const intervalId = setInterval(updateTimerText, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const formatCondition = (condition) => {
    return (
      condition
        .split(/(?=[A-Z])/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") || "N/A"
    );
  };

  const bidText = () => {
    if (auctionFinished) {
      if (currentBid >= reserveBid) {
        return `Winning Bid: €${currentBid}`;
      } else {
        return "Item Didn't Meet the Reserve Bid";
      }
    } else {
      if (currentBid && currentBid > 0) {
        return `Current Bid: €${currentBid}`;
      } else {
        return "Item Had No Bids";
      }
    }
  };

  return (
    <div className="auction-item">
      <img src={thumbnailURL} alt="Thumbnail" className="thumbnail" />
      <div className="auction-item-details">
        <Link to={`/auction/${id}`}>
          <div className="title-auction">
            <h3>{title}</h3>
          </div>
        </Link>
        <div className="cond-bid-start">
          <p>Condition: {formatCondition(condition)}</p>
          <p>Starting Bid: €{startingBid}</p>
          <p>{timerText}</p>
        </div>
        <div className="bid-verify">
          <p>{bidText()}</p>
          <p>Verification Status: {isVerified ? "Verified" : "Not Verified"}</p>
        </div>
      </div>
    </div>
  );
};

const MyAuctions = () => {
  const { user } = UserAuth();
  const navigate = useNavigate();
  const [myAuctions, setMyAuctions] = useState([]);

  const { searchQuery } = useSearch();

  const searchFilter = (auction) => {
    return (
      searchQuery === "" ||
      auction.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchMyAuctions = async () => {
      const auctionsRef = collection(db, "auctions");
      const q = query(auctionsRef, where("createdBy", "==", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedAuctions = [];
        querySnapshot.forEach((doc) => {
          fetchedAuctions.push({ id: doc.id, ...doc.data() });
        });
        setMyAuctions(fetchedAuctions);
      });

      return () => unsubscribe();
    };

    fetchMyAuctions();
  }, [user, navigate]);

  return (
    <>
      <Navbar hideSearchBar />
      <div className="main-content">
        <div className="auctions-list">
          {myAuctions.filter(searchFilter).map((auction) => (
            <AuctionItem key={auction.id} auction={auction} />
          ))}
        </div>
      </div>
    </>
  );
};

export default MyAuctions;
