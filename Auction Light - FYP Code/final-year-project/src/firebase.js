import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGC2BzcmOCy-fNgSLbLfeog-rvebo1ZsM",
  authDomain: "auction-light.firebaseapp.com",
  projectId: "auction-light",
  storageBucket: "auction-light.appspot.com",
  messagingSenderId: "550305595004",
  appId: "1:550305595004:web:b940c03039001bc47d13f9",
  measurementId: "G-8TPHDWHCXG",
};

const app = initializeApp(firebaseConfig);

// Initialize authentication and database services
const auth = getAuth(app);
const database = getDatabase(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, database, db, storage };
export default app;
