import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { onSnapshot, query } from "firebase/firestore";
import { collection } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "./Navbar";
import "../styles/sharedStyles.css";
import "../styles/homePage.css";
import { useSearch } from "../context/SearchContext";

const HomePage = () => {
  const { user } = UserAuth();
  const [auctions, setAuctions] = useState([]);
  const [maxBidFilter, setMaxBidFilter] = useState(Infinity);
  const { searchQuery } = useSearch();
  const location = useLocation();

  const [conditionFilters, setConditionFilters] = useState({
    brandNewWithPackaging: false,
    brandNewWithoutPackaging: false,
    used: false,
  });
  const [durationFilters, setDurationFilters] = useState({
    moreThanDay: false,
    lessThan12Hours: false,
    lessThan1Hour: false,
  });
  const [locationFilters, setLocationFilters] = useState({
    irelandOnly: false,
    ukAndIreland: false,
    restOfEurope: false,
  });
  const [deliveryFilters, setDeliveryFilters] = useState({
    postage: false,
    collectInPerson: false,
    both: false,
  });
  const [verificationFilters, setVerificationFilters] = useState({
    verified: false,
    unverified: false,
  });

  useEffect(() => {
    const fetchAuctions = async () => {
      const auctionsRef = collection(db, "auctions");
      const q = query(auctionsRef);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedAuctions = [];
        querySnapshot.forEach((doc) => {
          fetchedAuctions.push({ id: doc.id, ...doc.data() });
        });
        setAuctions(fetchedAuctions);
      });

      return () => unsubscribe();
    };

    fetchAuctions();
  }, []);

  const handleCheckboxChange = (event, filterType, filterName) => {
    const isChecked = event.target.checked;
    if (filterType === "condition") {
      setConditionFilters({ ...conditionFilters, [filterName]: isChecked });
    } else if (filterType === "duration") {
      setDurationFilters({ ...durationFilters, [filterName]: isChecked });
    } else if (filterType === "location") {
      setLocationFilters({ ...locationFilters, [filterName]: isChecked });
    } else if (filterType === "delivery") {
      setDeliveryFilters({ ...deliveryFilters, [filterName]: isChecked });
    } else if (filterType === "verification") {
      setVerificationFilters({
        ...verificationFilters,
        [filterName]: isChecked,
      });
    }
  };

  const filterAuctions = (auctions) => {
    return auctions.filter((auction) => {
      const conditionFilterPassed =
        !conditionFilters.brandNewWithPackaging &&
        !conditionFilters.brandNewWithoutPackaging &&
        !conditionFilters.used
          ? true
          : (conditionFilters.brandNewWithPackaging &&
              auction.condition === "brandNewWithPackaging") ||
            (conditionFilters.brandNewWithoutPackaging &&
              auction.condition === "brandNewWithNoPackaging") ||
            (conditionFilters.used && auction.condition === "Used");

      const verificationFilterPassed =
        !verificationFilters.verified && !verificationFilters.unverified
          ? true
          : (verificationFilters.verified && auction.isVerified) ||
            (verificationFilters.unverified && !auction.isVerified);

      const locationFilterPassed =
        !locationFilters.irelandOnly &&
        !locationFilters.ukAndIreland &&
        !locationFilters.restOfEurope
          ? true
          : (locationFilters.irelandOnly && auction.location === "Ireland") ||
            (locationFilters.ukAndIreland &&
              auction.location === "Ireland-uk") ||
            (locationFilters.restOfEurope && auction.location === "Europe");

      const deliveryFilterPassed =
        !deliveryFilters.postage &&
        !deliveryFilters.collectInPerson &&
        !deliveryFilters.both
          ? true
          : (deliveryFilters.postage && auction.delivery === "Postage") ||
            (deliveryFilters.collectInPerson &&
              auction.delivery === "Collection") ||
            (deliveryFilters.both && auction.delivery === "Both");

      const durationFilterPassed = (() => {
        const now = new Date();
        const endDate = new Date(auction.auctionEndDate);
        const timeRemaining = (endDate - now) / 1000;

        return (
          (!durationFilters.moreThanDay &&
            !durationFilters.lessThan12Hours &&
            !durationFilters.between12And24Hours) ||
          (durationFilters.moreThanDay && timeRemaining > 86400) ||
          (durationFilters.between12And24Hours &&
            timeRemaining > 43200 &&
            timeRemaining <= 86400) ||
          (durationFilters.lessThan12Hours && timeRemaining <= 43200)
        );
      })();

      const auctionEndedFilterPassed = (() => {
        const now = new Date();
        const endDate = new Date(auction.auctionEndDate);
        return now < endDate;
      })();

      const maxBidFilterPassed =
        maxBidFilter === Infinity || auction.currentBid <= maxBidFilter;

      const searchFilterPassed =
        searchQuery === "" ||
        auction.title.toLowerCase().includes(searchQuery.toLowerCase());

      return (
        conditionFilterPassed &&
        verificationFilterPassed &&
        durationFilterPassed &&
        locationFilterPassed &&
        deliveryFilterPassed &&
        maxBidFilterPassed &&
        searchFilterPassed &&
        auctionEndedFilterPassed
      );
    });
  };

  function AuctionItem({ auction }) {
    const {
      id,
      title,
      thumbnailURL,
      startingBid,
      auctionStartDate,
      auctionEndDate,
      currentBid,
      condition,
      isVerified,
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
      return condition
        .split(/(?=[A-Z])/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    return (
      <div className="auction-item">
        <img
          src={thumbnailURL}
          alt={`Thumbnail for auction item: ${title}`}
          className="thumbnail"
        />
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
            <p>Current Bid: €{currentBid || 0}</p>
            <p>
              Verification Status: {isVerified ? "Verified" : "Not Verified"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar hideHomeBtn />
      <div className="home-page-container">
        <div className="left-sidebar">
          <Link to="/create-auction" style={{ textDecoration: "none" }}>
            <button
              className="create-auction-btn"
              aria-label="Create an Auction"
            >
              Create an Auction
            </button>
          </Link>
          <div className="filter-section">
            <h3>Condition</h3>
            <label>
              <input
                type="checkbox"
                onChange={(e) =>
                  handleCheckboxChange(e, "condition", "brandNewWithPackaging")
                }
              />{" "}
              Brand new with packaging
            </label>
            <label>
              <input
                type="checkbox"
                onChange={(e) =>
                  handleCheckboxChange(
                    e,
                    "condition",
                    "brandNewWithoutPackaging"
                  )
                }
              />{" "}
              Brand new without packaging
            </label>
            <label>
              <input
                type="checkbox"
                onChange={(e) => handleCheckboxChange(e, "condition", "used")}
              />{" "}
              Used
            </label>
          </div>
          <div className="filter-section">
            <h3>Duration</h3>
            <label>
              <input
                type="checkbox"
                onChange={(e) =>
                  handleCheckboxChange(e, "duration", "moreThanDay")
                }
              />{" "}
              More than a day
            </label>
            <label>
              <input
                type="checkbox"
                onChange={(e) =>
                  handleCheckboxChange(e, "duration", "between12And24Hours")
                }
              />{" "}
              12-24 hours
            </label>
            <label>
              <input
                type="checkbox"
                onChange={(e) =>
                  handleCheckboxChange(e, "duration", "lessThan12Hours")
                }
              />{" "}
              Less than 12 hours
            </label>
          </div>
          <div className="filter-section">
            <h3>Item Location</h3>
            <label>
              <input
                type="checkbox"
                onChange={(e) =>
                  handleCheckboxChange(e, "location", "irelandOnly")
                }
              />{" "}
              Ireland only
            </label>
            <label>
              <input
                type="checkbox"
                onChange={(e) =>
                  handleCheckboxChange(e, "location", "ukAndIreland")
                }
              />{" "}
              UK & Ireland
            </label>
            <label>
              <input
                type="checkbox"
                onChange={(e) =>
                  handleCheckboxChange(e, "location", "restOfEurope")
                }
              />{" "}
              Rest of Europe
            </label>
          </div>
          <div className="filter-section">
            <h3>Delivery Method</h3>
            <label>
              <input
                type="checkbox"
                onChange={(e) => handleCheckboxChange(e, "delivery", "postage")}
              />{" "}
              Postage
            </label>
            <label>
              <input
                type="checkbox"
                onChange={(e) =>
                  handleCheckboxChange(e, "delivery", "collectInPerson")
                }
              />{" "}
              Collect in person
            </label>
            <label>
              <input
                type="checkbox"
                onChange={(e) => handleCheckboxChange(e, "delivery", "both")}
              />{" "}
              Both
            </label>
          </div>
          <div className="filter-section">
            <h3>Verification Status</h3>
            <label>
              <input
                type="checkbox"
                onChange={(e) =>
                  handleCheckboxChange(e, "verification", "verified")
                }
              />{" "}
              Verified
            </label>
            <label>
              <input
                type="checkbox"
                onChange={(e) =>
                  handleCheckboxChange(e, "verification", "unverified")
                }
              />{" "}
              Unverified
            </label>
          </div>
          <div className="filter-section">
            <label htmlFor="max-bid-filter">Max Current Bid</label>
            <input
              type="number"
              id="max-bid-filter"
              onChange={(e) =>
                setMaxBidFilter(
                  e.target.value === "" ? Infinity : Number(e.target.value)
                )
              }
              value={maxBidFilter === Infinity ? "" : maxBidFilter}
            />
          </div>
        </div>
        <div className="main-content">
          <div className="auctions-list">
            {filterAuctions(auctions).map((auction) => (
              <AuctionItem key={auction.id} auction={auction} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
