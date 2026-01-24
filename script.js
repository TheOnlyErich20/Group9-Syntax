/* =========================
   GLOBAL CONFIG
========================= */
import { auth } from "./firebase.js";

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
   LOGIN
========================= */
async function handleLoginSubmit(e) {
    e.preventDefault();

    const email = val("email");
    const password = val("password");

    if (!email || !password) {
        showLoginError("Please fill in all fields");
        return;
    }

    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userData", JSON.stringify({ id: user.uid, name: user.displayName || email }));
        localStorage.setItem("userId", user.uid);

        showLoginSuccess("Login successful! Redirecting...");
        setTimeout(() => location.href = "index.html", 1200);

    } catch (err) {
        showLoginError(err.message);
    }
}

/* =========================
   SIGNUP
========================= */
async function handleSignupSubmit(e) {
    e.preventDefault();

    const fullName = val("fullName");
    const email = val("signupEmail");
    const password = val("signupPassword");
    const confirm = val("confirmPassword");
    const course = val("course");

    if (!fullName || !email || !password || !confirm) {
        showSignupError("Please fill in all required fields");
        return;
    }

    if (password !== confirm) {
        showSignupError("Passwords do not match");
        return;
    }

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update display name
        await user.updateProfile({ displayName: fullName.split(" ")[0] });

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userData", JSON.stringify({ id: user.uid, name: fullName.split(" ")[0], fullName, course }));
        localStorage.setItem("userId", user.uid);

        showSignupSuccess("Account created! Redirecting...");
        setTimeout(() => location.href = "Login.html", 1200);

    } catch (err) {
        showSignupError(err.message);
    }
}

/* =========================
   UI HELPERS
========================= */
function showLoginError(msg) {
    setMessage("loginError", msg, false);
}
function showLoginSuccess(msg) {
    setMessage("loginSuccess", msg, true);
}
function showSignupError(msg) {
    setMessage("signupError", msg, false);
}
function showSignupSuccess(msg) {
    setMessage("signupSuccess", msg, true);
}

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
    if (header) header.textContent = user.name;
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

    // 🔥 ADD THESE
    document.getElementById("darkModeBtn")
        ?.addEventListener("click", () => applyTheme("dark"));

    document.getElementById("lightModeBtn")
        ?.addEventListener("click", () => applyTheme("light"));
});
firebase.auth().onAuthStateChanged(user => {
    const page = location.pathname.split("/").pop().toLowerCase();
    if (!user && page !== "login.html" && page !== "signup.html") {
        location.href = "Login.html";
    }
});
