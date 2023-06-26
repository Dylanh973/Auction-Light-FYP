import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useSearch } from "../context/SearchContext";
import "../styles/sharedStyles.css";
import "../styles/Navbar.css";

const ProfileDropdown = () => {
  const { user, logout } = UserAuth();
  const [username, setUsername] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef();
  const dropdownRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsername = async () => {
      if (user && user.uid) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUsername(userDocSnap.data().username);
        }
      }
    };

    fetchUsername();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/homepage");
      console.log("You are logged out");
    } catch (e) {
      console.log(e.message);
    }
  };

  const handleClickOutside = (event) => {
    if (
      buttonRef.current &&
      !buttonRef.current.contains(event.target) &&
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className={`dropdown-content ${isOpen ? "show" : ""}`}
    >
      {user ? (
        <>
          <p>{username}</p>
          <Link to="/my-profile">My Profile</Link>
          <Link to="/my-auctions">My Auctions</Link>
          <Link to="/bid-history">Bid History</Link>
          <Link to="/items-won">Items Won</Link>
          <Link to="/my-messages">My Messages</Link>
          <button onClick={handleLogout}>Log Out</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Sign up</Link>
        </>
      )}
    </div>
  );

  return (
    <div className="dropdown">
      <button ref={buttonRef} className="icon-button" onClick={toggleDropdown}>
        <FontAwesomeIcon icon={faUser} />
      </button>
      {dropdownContent}
    </div>
  );
};

const Navbar = ({ hideSearchBar, hideHomeBtn }) => {
  const { setSearchQuery, searchQuery } = useSearch();
  const navigate = useNavigate();

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    navigate(`/homepage?search=${searchQuery}`);
  };

  return (
    <div className="header-container">
      <header>
        <div className="left-section">
          <h1 className="auction-light">Auction Light⚡</h1>
          {!hideHomeBtn && (
            <Link to="/homepage">
              <button className="home-btn">Home Page</button>
            </Link>
          )}
        </div>
        {!hideSearchBar && (
          <div className="search-container">
            <form onSubmit={handleSearchSubmit}>
              <input
                type="search"
                placeholder="Search for auction items"
                className="search-bar"
                onChange={handleSearch}
              />
            </form>
          </div>
        )}
        <ProfileDropdown />
      </header>
    </div>
  );
};

export default Navbar;
