import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Register from "./components/signUp";
import Login from "./components/signIn";
import HomePage from "./components/HomePage";
import MyProfile from "./components/MyProfile";
import MyAuctions from "./components/MyAuctions";
import BidHistory from "./components/BidHistory";
import ItemsWon from "./components/ItemsWon";
import MyMessages from "./components/MyMessages";
import { AuthContextProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CreateAuction from "./components/createAuction";
import AuctionDetails from "./components/auctionDetails";
import Messaging from "./components/messaging";
import Verify from "./components/verifyID";

function App() {
  return (
    <AuthContextProvider>
      <div id="root">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/auction/:id" element={<AuctionDetails />} />
          <Route path="/my-auctions" element={<MyAuctions />} />
          <Route path="/bid-history" element={<BidHistory />} />
          <Route path="/items-won" element={<ItemsWon />} />
          <Route path="/verify-id" element={<Verify />} />
          <Route
            path="my-messages"
            element={
              <ProtectedRoute>
                {" "}
                <MyMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/message/:sellerId"
            element={
              <ProtectedRoute>
                {" "}
                <Messaging />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-profile"
            element={
              <ProtectedRoute>
                {" "}
                <MyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-auction"
            element={
              <ProtectedRoute>
                {" "}
                <CreateAuction />{" "}
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </AuthContextProvider>
  );
}

export default App;
