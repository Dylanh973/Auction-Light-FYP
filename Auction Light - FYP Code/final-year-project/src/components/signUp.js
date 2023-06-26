import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import "../styles/signUp.css";
import "../styles/sharedStyles.css";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmEmail, setconfirmEmail] = useState("");
  const [confirmPassword, setconfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();
  const [redirectTimeoutId, setRedirectTimeoutId] = useState(null);
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;

  useEffect(() => {
    if (redirectTimeoutId) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [redirectTimeoutId]);

  const handleKeyPress = (e) => {
    if (e.key === " ") {
      e.preventDefault();
    }
  };

  const signUp = async (e) => {
    e.preventDefault();
    const db = getFirestore();
    const usersRef = collection(db, "users");
    const usernameQuery = query(usersRef, where("username", "==", username));
    const usernameSnapshot = await getDocs(usernameQuery);
    const emailQuery = query(usersRef, where("email", "==", email));
    const emailSnapshot = await getDocs(emailQuery);

    if (!USERNAME_REGEX.test(username)) {
      setErrorMessage("Username must contain only letters and numbers");
      return;
    }
    if (!usernameSnapshot.empty) {
      setErrorMessage("Username already exists. Please choose another one.");
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setErrorMessage(
        "Please enter a valid email address in the format 'example@example.com'."
      );
      return;
    }
    if (!emailSnapshot.empty) {
      setErrorMessage("Email already exists. Please login");
      return;
    }
    if (email !== confirmEmail) {
      setErrorMessage("Emails do not match please recheck and try again");
      return;
    }
    if (!PWD_REGEX.test(password)) {
      setErrorMessage(
        "Your password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one digit."
      );
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match please recheck and try again");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const db = getFirestore();
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        email: email,
        username: username,
        isVerified: false,
      });

      setSuccessMessage("Your account has been created, you may now login!");

      const timeoutId = setTimeout(() => {
        navigate("/login");
      }, 5000);

      setRedirectTimeoutId(timeoutId);
      setCountdown(5);
    } catch (error) {
      console.log(error);
    }
  };

  const stopRedirect = () => {
    clearTimeout(redirectTimeoutId);
    setRedirectTimeoutId(null);
    setCountdown(null);
  };

  return (
    <>
      <div className="header-container">
        <header>
          <h1 className="auction-light">Auction Light⚡</h1>
          <Link to="/homepage">
            <button className="home-btn">Home Page</button>
          </Link>
          <div className="icon-container">
            <FontAwesomeIcon icon={faUser} color="white" />
          </div>
        </header>
      </div>
      <div className="sign-up-container">
        <form className="sign-up-form" onSubmit={signUp}>
          <h1 className="signup-title">Create Account</h1>
          <div className="countdown-container">
            <p className="success-message">{successMessage}</p>
            {redirectTimeoutId && (
              <>
                <p className="countdown-message">
                  Redirecting in {countdown} seconds..{" "}
                </p>
                <button onClick={stopRedirect} className="stop-redirect-btn">
                  Stop Redirect
                </button>
              </>
            )}
          </div>
          <p className="error-message">{errorMessage}</p>
          <input
            className="form-input"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => setErrorMessage("")}
            onKeyPress={handleKeyPress}
          ></input>
          <input
            className="form-input"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setErrorMessage("")}
            onKeyPress={handleKeyPress}
          ></input>
          <input
            className="form-input"
            type="email"
            placeholder="Confirm your email"
            value={confirmEmail}
            onChange={(e) => setconfirmEmail(e.target.value)}
            onFocus={() => setErrorMessage("")}
            onKeyPress={handleKeyPress}
          ></input>
          <input
            className="form-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setErrorMessage("")}
            onKeyPress={handleKeyPress}
          ></input>
          <input
            className="form-input"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setconfirmPassword(e.target.value)}
            onFocus={() => setErrorMessage("")}
            onKeyPress={handleKeyPress}
          ></input>
          <button className="signup-btn" type="submit">
            Sign Up
          </button>
        </form>
      </div>
      <div className="already-user">
        <p>Already a user? Click below to login to your account</p>
        <Link to="/login">
          <button>Log in</button>
        </Link>
      </div>
    </>
  );
};

export default SignUp;
