import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = { ... };
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// firebase.js
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
firebase.initializeApp(firebaseConfig);
