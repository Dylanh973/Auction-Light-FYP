import { useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import { UserAuth } from "../context/AuthContext";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  onSnapshot,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import "../styles/BidHistory.css";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";

const ItemsWon = () => {
  const { user } = UserAuth();
  const [wonAuctions, setWonAuctions] = useState([]);

  useEffect(() => {
    const fetchWonAuctions = async () => {
      const auctionsQuerySnapshot = await getDocs(
        query(
          collection(db, "auctions"),
          where("winningBidder", "==", user.uid)
        )
      );

      const wonAuctions = auctionsQuerySnapshot.docs
        .filter(
          (doc) =>
            doc.data().auctionFinished &&
            doc.data().currentBid >= doc.data().reserveBid
        )
        .map((doc) => ({ id: doc.id, ...doc.data() }));

      setWonAuctions(wonAuctions);
    };

    fetchWonAuctions();
  }, [user.uid]);

  return (
    <>
      <Navbar hideSearchBar />
      <div className="bid-history">
        <h1>Items Won by {user.displayName}</h1>
        {wonAuctions.length === 0 ? (
          <p>You haven't won any items.</p>
        ) : (
          wonAuctions.map((auction) => (
            <div className="bid" key={auction.id}>
              <img
                src={auction.thumbnailURL}
                alt={auction.title}
                className="bid-thumbnail"
              />
              <div className="bid-details">
                <h3>
                  <Link to={`/auction/${auction.id}`}>
                    Auction: {auction.title}
                  </Link>
                </h3>
                <p>Winning Bid Amount: €{auction.currentBid}</p>
                <p>Delivery: {auction.delivery}</p>
                <p>Item Description: {auction.itemDescription}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default ItemsWon;
