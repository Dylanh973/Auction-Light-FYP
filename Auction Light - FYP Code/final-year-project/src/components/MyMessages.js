import React, { useState, useEffect } from "react";
import { UserAuth } from "../context/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import "../styles/MyMessages.css";

const MyMessages = () => {
  const { user } = UserAuth();
  const [conversations, setConversations] = useState([]);

  const updateLastReadMessage = async (conversationId, messageId) => {
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationDoc = await getDoc(conversationRef);
    const lastReadMessage = conversationDoc.data()?.lastReadMessage;
    await updateDoc(conversationRef, {
      lastReadMessage: {
        ...(lastReadMessage || {}),
        [user.uid]: messageId,
      },
      updatedAt: serverTimestamp(),
    });
  };

  useEffect(() => {
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("userIds", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const fetchedConversations = [];
      for (const conversationDoc of querySnapshot.docs) {
        const conversation = conversationDoc.data();
        const receiverId = getReceiverId(conversation);
        const receiverDoc = await getDoc(doc(db, "users", receiverId));
        const receiverName = receiverDoc.data().username;
        const messagesRef = collection(
          db,
          "conversations",
          conversationDoc.id,
          "messages"
        );
        const messagesQuery = query(
          messagesRef,
          orderBy("timestamp", "desc"),
          limit(1)
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        const lastMessageDoc = messagesSnapshot.docs[0];
        const lastMessage = lastMessageDoc?.data();

        fetchedConversations.push({
          id: conversationDoc.id,
          receiverName,
          ...conversation,
        });
      }
      setConversations(fetchedConversations);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getReceiverId = (conversation) => {
    return conversation.userIds.find((id) => id !== user.uid);
  };

  return (
    <>
      <Navbar hideSearchBar />
      <div className="my-messages">
        <h2>My Messages</h2>
        {conversations.map((conversation) => (
          <div
            className="conversation123"
            key={conversation.id}
            onClick={() =>
              updateLastReadMessage(conversation.id, conversation.lastMessageId)
            }
          >
            <Link to={`/message/${getReceiverId(conversation)}`}>
              Conversation with {conversation.receiverName}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
};

export default MyMessages;
