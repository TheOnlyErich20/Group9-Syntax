// Import Firebase auth from firebase.js
import { auth } from './firebase.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* =========================
   THEME TOGGLE
========================= */
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
    darkBtn.classList.toggle("active", theme === "dark");
    lightBtn.classList.toggle("active", theme === "light");
}

/* =========================
   LOGIN UI
========================= */
function setMessage(id, msg, success) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    el.style.color = success ? "#51cf66" : "#ff6b6b";
}

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();

    // Theme buttons
    document.getElementById("darkModeBtn")?.addEventListener("click", () => applyTheme("dark"));
    document.getElementById("lightModeBtn")?.addEventListener("click", () => applyTheme("light"));

    // Password toggle
    document.getElementById("togglePassword")?.addEventListener("click", () => {
        const pwd = document.getElementById("password");
        pwd.type = pwd.type === "password" ? "text" : "password";
        document.querySelector("#togglePassword i")?.classList.toggle("fa-eye-slash");
    });

    // Login form
    document.getElementById("loginForm")?.addEventListener("submit", async e => {
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
});
