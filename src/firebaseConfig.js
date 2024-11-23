import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC38NVkTVrPDr_ebcJl-UPlZVW9qHNpQTM",
    authDomain: "retna-e0b0d.firebaseapp.com",
    projectId: "retna-e0b0d",
    storageBucket: "retna-e0b0d.firebasestorage.app",
    messagingSenderId: "1017334381285",
    appId: "1:1017334381285:web:cbf8c28ff6334c056c720c",
    measurementId: "G-LHBNH5X7KJ"
  };
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  
  export { db, auth };
  