// Import modular Firebase API
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBCMV6CerYS4QCnZ52Q1zcF3bpTwUIuK0w",
  authDomain: "darkboard-f4c38.firebaseapp.com",
  projectId: "darkboard-f4c38",
  storageBucket: "darkboard-f4c38.appspot.com", // <- FIXED
  messagingSenderId: "164112373154",
  appId: "1:164112373154:web:57b154d6ff322a50ae4efb",
  measurementId: "G-KKB3PGBJS5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Export auth to use in other scripts
export { auth };
