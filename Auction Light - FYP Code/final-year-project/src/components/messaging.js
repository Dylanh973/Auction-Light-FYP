import React, { useState, useEffect } from "react";
import { UserAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import Navbar from "./Navbar";
import "../styles/messaging.css";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

const Messaging = () => {
  const { sellerId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const { user } = UserAuth();

  const sendMessage = async (e) => {
    e.preventDefault();
    const users = [user.uid, sellerId].sort();
    const conversationRef = collection(db, "conversations");
    const q = query(conversationRef, where("userIds", "==", users));

    const querySnapshot = await getDocs(q);
    let conversationDoc;

    if (querySnapshot.empty) {
      conversationDoc = await addDoc(conversationRef, { userIds: users });
    } else {
      conversationDoc = querySnapshot.docs[0];
    }

    try {
      await addDoc(
        collection(db, `conversations/${conversationDoc.id}/messages`),
        {
          message: input,
          timestamp: serverTimestamp(),
          senderId: user.uid,
        }
      );
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    const users = [user.uid, sellerId].sort();
    const conversationRef = collection(db, "conversations");
    const q = query(conversationRef, where("userIds", "==", users));

    onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const conversationDoc = querySnapshot.docs[0];
        const messagesRef = collection(
          db,
          `conversations/${conversationDoc.id}/messages`
        );
        const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(messagesQuery, (messagesSnapshot) => {
          const fetchedMessages = [];
          messagesSnapshot.forEach((doc) => {
            fetchedMessages.push({
              id: doc.id,
              ...doc.data(),
            });
          });
          setMessages(fetchedMessages);
        });

        return () => {
          unsubscribe();
        };
      }
    });
  }, []);

  return (
    <>
      <Navbar hideSearchBar />
      <div className="conversation">
        <div className="messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${
                message.senderId === user.uid ? "sent" : "received"
              }`}
            >
              <p className="message-text">{message.message}</p>
              <span className="message-sender">
                {message.senderId === user.uid ? "You" : "Recipient"}
              </span>
            </div>
          ))}
        </div>
        <div className="form-container">
          <form onSubmit={sendMessage}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="text"
              placeholder="Type a message"
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Messaging;
