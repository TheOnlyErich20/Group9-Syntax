// Import modular Firebase API
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    where, 
    doc, 
    updateDoc, 
    deleteDoc, 
    getDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAx3BTNnEDw4AXEkk5GVR5NLeGjsfVAmlA",
    authDomain: "darkbroads.firebaseapp.com",
    projectId: "darkbroads",
    storageBucket: "darkbroads.firebasestorage.app",
    messagingSenderId: "271741371558",
    appId: "1:271741371558:web:45372043bfe9d3205ee067",
    measurementId: "G-SLEM50XYCK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Expose globally for non-module scripts
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseFirestore = db;

// Export all Firestore functions for use in other scripts
export { 
    auth, 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    updateDoc, 
    deleteDoc, 
    getDoc,
    serverTimestamp 
};
