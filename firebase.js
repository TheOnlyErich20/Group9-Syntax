// Import modular Firebase API
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    updateDoc, 
    deleteDoc, 
    getDoc,
    setDoc,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

// Create Google Auth Provider instance
const googleProvider = new GoogleAuthProvider();

// Expose globally for non-module scripts
window.firebaseApp = app;
window.firebaseDb = db;
window.firebaseAuth = auth;
window.firebaseFirestore = db;
window.googleProvider = googleProvider;

// Export all functions for use in other scripts
export { 
    db,
    auth,
    app,
    googleProvider,
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    updateDoc, 
    deleteDoc, 
    getDoc,
    setDoc,
    serverTimestamp,
    onSnapshot,
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
};
