// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBCMV6CerYS4QCnZ52Q1zcF3bpTwUIuK0w",
  authDomain: "darkboard-f4c38.firebaseapp.com",
  projectId: "darkboard-f4c38",
  storageBucket: "darkboard-f4c38.firebasestorage.app",
  messagingSenderId: "164112373154",
  appId: "1:164112373154:web:57b154d6ff322a50ae4efb",
  measurementId: "G-KKB3PGBJS5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
