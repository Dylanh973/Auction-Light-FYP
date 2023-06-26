import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import Navbar from "./Navbar";
import "../styles/BidHistory.css";
import { UserAuth } from "../context/AuthContext";

const BidHistory = () => {
  const currentUser = UserAuth().user;
  const [bids, setBids] = useState([]);
  const [timeLefts, setTimeLefts] = useState({});

  const timeLeft = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) {
      return "The auction has ended.";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const updateTimeLeft = () => {
    const newTimeLefts = {};
    bids.forEach((bid) => {
      newTimeLefts[bid.id] = timeLeft(bid.auction.endTime);
    });
    setTimeLefts(newTimeLefts);
  };
  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      return;
    }
    const getBids = async () => {
      const q = query(
        collection(db, "bids"),
        where("userID", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetchedBids = [];
      for (const docRef of querySnapshot.docs) {
        const bid = docRef.data();
        const auctionRef = doc(db, "auctions", bid.auctionID);
        const auctionDoc = await getDoc(auctionRef);
        const auctionData = auctionDoc.data();

        if (!auctionData) {
          continue;
        }

        const auctionStartDate = new Date(auctionData.auctionStartDate);
        const auctionEndTime = new Date(
          auctionStartDate.getTime() +
            auctionData.auctionLengthDays * 86400000 +
            auctionData.auctionLengthHours * 3600000
        );

        const auction = {
          id: auctionDoc.id,
          ...auctionData,
          endTime: auctionEndTime,
        };

        const userRef = doc(db, "users", bid.userID);
        const userDoc = await getDoc(userRef);
        const user = { id: userDoc.id, ...userDoc.data() };

        const currentBidRef = query(
          collection(db, "auctions"),
          where("auctionID", "==", auction.id),
          orderBy("currentBid", "desc"),
          limit(1)
        );
        const currentBidSnapshot = await getDocs(currentBidRef);
        const currentBid =
          currentBidSnapshot.docs.length > 0
            ? currentBidSnapshot.docs[0].data().bidAmount
            : auction.startingPrice;

        fetchedBids.push({
          id: docRef.id,
          auction,
          user,
          currentBid,
          ...bid,
        });
      }

      fetchedBids.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setBids(fetchedBids);
    };

    getBids();
  }, [currentUser]);

  useEffect(() => {
    updateTimeLeft();
    const interval = setInterval(() => {
      updateTimeLeft();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [bids]);

  return (
    <>
      <Navbar hideSearchBar />
      <div className="bid-history">
        <h1>Bid History</h1>
        {bids.length === 0 ? (
          <p>You haven't made any bids.</p>
        ) : (
          bids.map((bid) => (
            <div className="bid" key={bid.id}>
              <img
                src={bid.auction.thumbnailURL}
                alt={bid.auction.title}
                className="bid-thumbnail"
              />
              <div className="bid-details">
                <h3>
                  <Link to={`/auction/${bid.auction.id}`}>
                    Auction: {bid.auction.title}
                  </Link>
                </h3>
                <p>Bid Amount: €{bid.bidAmount}</p>
                <p>Current Bid: €{bid.auction.currentBid}</p>
                <p>Date: {new Date(bid.timestamp).toLocaleString()}</p>
                <p>Time left: {timeLeft(bid.auction.endTime)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default BidHistory;
