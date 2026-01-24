/* =========================
   GLOBAL CONFIG
========================= */
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

/* =========================
   AUTH GUARD
========================= */
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const page = location.pathname.split("/").pop().toLowerCase();

    if (!isLoggedIn && page !== "login.html" && page !== "signup.html") {
        location.href = "Login.html";
    }
}
checkLoginStatus();

/* =========================
   LOGIN (Firebase)
========================= */
async function handleLoginSubmit(e) {
    e.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!email || !password) {
        showLoginError("Please fill in all fields");
        return;
    }

    try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);

        // Save user info in localStorage
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userData", JSON.stringify({
            uid: userCred.user.uid,
            email: userCred.user.email
        }));
        localStorage.setItem("userId", userCred.user.uid);

        showLoginSuccess("Login successful! Redirecting...");
        setTimeout(() => location.href = "index.html", 1200);

    } catch (err) {
        let msg = "Login failed";
        if (err.code === "auth/user-not-found") msg = "User not found";
        else if (err.code === "auth/wrong-password") msg = "Incorrect password";
        else if (err.code === "auth/invalid-email") msg = "Invalid email";
        showLoginError(msg);
    }
}

/* =========================
   SIGNUP (Firebase)
========================= */
async function handleSignupSubmit(e) {
    e.preventDefault();

    const fullName = document.getElementById("fullName")?.value.trim();
    const email = document.getElementById("signupEmail")?.value.trim();
    const password = document.getElementById("signupPassword")?.value.trim();
    const confirm = document.getElementById("confirmPassword")?.value.trim();

    if (!fullName || !email || !password || !confirm) {
        showSignupError("Please fill in all required fields");
        return;
    }

    if (password !== confirm) {
        showSignupError("Passwords do not match");
        return;
    }

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);

        // Save user info in localStorage
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userData", JSON.stringify({
            uid: userCred.user.uid,
            email: userCred.user.email,
            fullName
        }));
        localStorage.setItem("userId", userCred.user.uid);

        showSignupSuccess("Account created! Redirecting...");
        setTimeout(() => location.href = "index.html", 1200);

    } catch (err) {
        let msg = "Signup failed";
        if (err.code === "auth/email-already-in-use") msg = "Email already in use";
        else if (err.code === "auth/invalid-email") msg = "Invalid email";
        else if (err.code === "auth/weak-password") msg = "Password is too weak";
        showSignupError(msg);
    }
}

/* =========================
   UI HELPERS
========================= */
function showLoginError(msg) { setMessage("loginError", msg, false); }
function showLoginSuccess(msg) { setMessage("loginSuccess", msg, true); }
function showSignupError(msg) { setMessage("signupError", msg, false); }
function showSignupSuccess(msg) { setMessage("signupSuccess", msg, true); }

function setMessage(id, msg, success) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    el.style.color = success ? "#51cf66" : "#ff6b6b";
}

const val = id => document.getElementById(id)?.value.trim();

function updateThemeButtons(theme) {
    const darkBtn = document.getElementById("darkModeBtn");
    const lightBtn = document.getElementById("lightModeBtn");
    if (!darkBtn || !lightBtn) return;
    darkBtn.classList.toggle("active", theme === "dark");
    lightBtn.classList.toggle("active", theme === "light");
}

/* =========================
   DASHBOARD
========================= */
function initializeUser() {
    const user = JSON.parse(localStorage.getItem("userData"));
    if (!user) return;
    const header = document.getElementById("headerUserName");
    if (header) header.textContent = user.fullName || user.name || "User";
}

function updateDashboardGreeting() {
    const el = document.getElementById("greetingMessage");
    if (!el) return;
    const h = new Date().getHours();
    el.textContent =
        h < 12 ? "Good morning 🌅" :
        h < 17 ? "Good afternoon ☀️" :
        "Good evening 🌙";
}

/* =========================
   LOGOUT
========================= */
function logout() {
    localStorage.clear();
    location.href = "Login.html";
}

/* =========================
   THEME
========================= */
function initializeTheme() {
    const theme = localStorage.getItem("theme") || "dark";
    document.body.classList.toggle("light-mode", theme === "light");
    updateThemeButtons(theme);
}

function toggleHeaderTheme() {
    const current = localStorage.getItem("theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    initializeTheme();
}

function applyTheme(theme) {
    document.body.classList.toggle("light-mode", theme === "light");
    localStorage.setItem("theme", theme);
    updateThemeButtons(theme);
}

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeUser();
    updateDashboardGreeting();

    document.getElementById("loginForm")
        ?.addEventListener("submit", handleLoginSubmit);

    document.getElementById("signupForm")
        ?.addEventListener("submit", handleSignupSubmit);

    document.getElementById("darkModeBtn")
        ?.addEventListener("click", () => applyTheme("dark"));

    document.getElementById("lightModeBtn")
        ?.addEventListener("click", () => applyTheme("light"));
});
// Make applyTheme globally accessible (for buttons if needed)
window.applyTheme = applyTheme;

// Ensure buttons work even in module
const darkBtn = document.getElementById("darkModeBtn");
const lightBtn = document.getElementById("lightModeBtn");

if (darkBtn && lightBtn) {
    darkBtn.addEventListener("click", () => applyTheme("dark"));
    lightBtn.addEventListener("click", () => applyTheme("light"));
}
