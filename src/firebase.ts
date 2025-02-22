// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getDatabase, ref, set, onValue, remove, onChildAdded, update, push } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2Kg16v8P8mG8B-A_ndF1Xdgbyspq5UQ4",
  authDomain: "duck-hunt-70e38.firebaseapp.com",
  projectId: "duck-hunt-70e38",
  storageBucket: "duck-hunt-70e38.firebasestorage.app",
  messagingSenderId: "160593117252",
  appId: "1:160593117252:web:dcc09a0df69e7308553c11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, onValue, remove, onChildAdded, update, push };