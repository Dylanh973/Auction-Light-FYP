import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase";
import "../styles/sharedStyles.css";
import "../styles/signIn.css";
import "../styles/responsive.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignIn = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log(userCredential);
        navigate("/homepage");
      })
      .catch((error) => {
        console.log(error);
      });
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
      <div className="sign-in-container">
        <h1 className="login-title">Log In to your Account</h1>
        <form className="sign-in-form" onSubmit={handleSignIn}>
          <input
            className="form-input"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          ></input>
          <input
            className="form-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          ></input>
          <button className="login-btn" type="submit">
            Log In
          </button>
        </form>
      </div>
      <div className="not-a-user">
        <p>Not a user? Click below to create an account</p>
        <Link to="/register">
          <button>Sign up</button>
        </Link>
      </div>
    </>
  );
};

export default SignIn;
