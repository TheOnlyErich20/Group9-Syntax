// ---------------------------
// Firebase Auth & Firestore
// ---------------------------
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const db = getFirestore();

// ---------------------------
// Theme Functions
// ---------------------------
function initializeTheme() {
    const theme = localStorage.getItem("theme") || "dark";
    document.body.classList.toggle("light-mode", theme === "light");
    updateThemeButtons(theme);
}

function applyTheme(theme) {
    if (theme === "light") document.body.classList.add("light-mode");
    else document.body.classList.remove("light-mode");
    localStorage.setItem("theme", theme);
    updateThemeButtons(theme);
}

function updateThemeButtons(theme) {
    const darkBtn = document.getElementById("darkModeBtn");
    const lightBtn = document.getElementById("lightModeBtn");
    darkBtn?.classList.toggle("active", theme === "dark");
    lightBtn?.classList.toggle("active", theme === "light");
}

// ---------------------------
// Password Toggle
// ---------------------------
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.querySelector(`#${iconId} i`);
    if (!input || !icon) return;
    input.type = input.type === "password" ? "text" : "password";
    icon.classList.toggle("fa-eye-slash");
}

// ---------------------------
// Login Message Helper
// ---------------------------
function setMessage(id, msg, success) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    el.style.color = success ? "#51cf66" : "#ff6b6b";
}

// ---------------------------
// DOM Ready
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();

    // Theme Buttons
    document.getElementById("darkModeBtn")?.addEventListener("click", () => applyTheme("dark"));
    document.getElementById("lightModeBtn")?.addEventListener("click", () => applyTheme("light"));

    // Password Toggles
    document.getElementById("togglePassword")?.addEventListener("click", () => togglePassword("password", "togglePassword"));
    document.getElementById("toggleSignupPassword")?.addEventListener("click", () => togglePassword("signupPassword", "toggleSignupPassword"));
    document.getElementById("toggleConfirmPassword")?.addEventListener("click", () => togglePassword("confirmPassword", "toggleConfirmPassword"));

    // ---------------------------
    // LOGIN FORM
    // ---------------------------
    const loginForm = document.getElementById("loginForm");
    loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            setMessage("loginError", "Please fill in all fields", false);
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userData", JSON.stringify({ id: user.uid, name: user.displayName || email }));
            localStorage.setItem("userId", user.uid);

            setMessage("loginSuccess", "Login successful! Redirecting...", true);
            setTimeout(() => location.href = "index.html", 1200);
        } catch (err) {
            setMessage("loginError", err.message, false);
        }
    });

    // ---------------------------
    // SIGNUP FORM
    // ---------------------------
    const signupForm = document.getElementById("signupForm");
    signupForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const phone = document.getElementById("phone").value.trim();
        const course = document.getElementById("course").value.trim();
        const signupMessage = document.getElementById("signupMessage");

        if (!fullName || !email || !password || !confirmPassword || !course) {
            signupMessage.style.color = "#ff6b6b";
            signupMessage.textContent = "Please fill in all required fields.";
            signupMessage.style.display = "block";
            return;
        }

        if (password !== confirmPassword) {
            signupMessage.style.color = "#ff6b6b";
            signupMessage.textContent = "Passwords do not match.";
            signupMessage.style.display = "block";
            return;
        }

        if (password.length < 6) {
            signupMessage.style.color = "#ff6b6b";
            signupMessage.textContent = "Password must be at least 6 characters.";
            signupMessage.style.display = "block";
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: fullName });

            await setDoc(doc(db, "students", user.uid), {
                fullName,
                email,
                phone,
                course,
                role: "student",
                createdAt: serverTimestamp()
            });

            signupMessage.style.color = "#51cf66";
            signupMessage.textContent = "Account created successfully! Redirecting to login...";
            signupMessage.style.display = "block";

            setTimeout(() => window.location.href = "Login.html", 1500);
        } catch (err) {
            signupMessage.style.color = "#ff6b6b";
            signupMessage.textContent = err.message;
            signupMessage.style.display = "block";
        }
    });
});
