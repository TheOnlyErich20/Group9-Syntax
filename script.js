/* =========================
   AUTH GUARD
========================= */
import { auth } from './firebase.js';

// Example login:
auth.signInWithEmailAndPassword(email, password)
firebase.auth().onAuthStateChanged(user => {
    const page = location.pathname.split("/").pop().toLowerCase();
    if (!user && page !== "login.html" && page !== "signup.html") {
        location.href = "Login.html";
    }
});

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
   UI HELPERS
========================= */
function showLoginError(msg) { setMessage("loginError", msg, false); }
function showLoginSuccess(msg) { setMessage("loginSuccess", msg, true); }
function setMessage(id, msg, success) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    el.style.color = success ? "#51cf66" : "#ff6b6b";
}

/* =========================
   THEME TOGGLE
========================= */
function initializeTheme() {
    const theme = localStorage.getItem("theme") || "dark";
    document.body.classList.toggle("light-mode", theme === "light");
    updateThemeButtons(theme);
}

function applyTheme(theme) {
    document.body.classList.toggle("light-mode", theme === "light");
    localStorage.setItem("theme", theme);
    updateThemeButtons(theme);
}

function updateThemeButtons(theme) {
    const darkBtn = document.getElementById("darkModeBtn");
    const lightBtn = document.getElementById("lightModeBtn");
    if (!darkBtn || !lightBtn) return;
    darkBtn.classList.toggle("active", theme === "dark");
    lightBtn.classList.toggle("active", theme === "light");
}

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {
    // Initialize theme
    initializeTheme();

    // Theme toggle buttons
    document.getElementById("darkModeBtn")
        ?.addEventListener("click", () => applyTheme("dark"));
    document.getElementById("lightModeBtn")
        ?.addEventListener("click", () => applyTheme("light"));
});

/* =========================
   UTILS
========================= */
const val = id => document.getElementById(id)?.value.trim();
