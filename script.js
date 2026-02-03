// =========================
// IMPORT FIREBASE AUTH
// =========================
import { auth } from './firebase.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const db = getFirestore();

// =========================
// THEME TOGGLE
// =========================
function initializeTheme() {
    const theme = localStorage.getItem("theme") || "dark";
    applyTheme(theme);
}

function applyTheme(theme) {
    if (theme === "light") document.body.classList.add("light-mode");
    else document.body.classList.remove("light-mode");

    localStorage.setItem("theme", theme);

    [
        "darkModeBtn",
        "lightModeBtn",
        "darkThemeBtn",
        "lightThemeBtn"
    ].forEach(id => document.getElementById(id)?.classList.remove("active"));

    document.getElementById(theme === "dark" ? "darkModeBtn" : "lightModeBtn")?.classList.add("active");
    document.getElementById(theme === "dark" ? "darkThemeBtn" : "lightThemeBtn")?.classList.add("active");
}

// =========================
// LOGIN / SIGNUP MESSAGES
// =========================
function setMessage(id, msg, success = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    el.style.color = success ? "#51cf66" : "#ff6b6b";
}

// =========================
// LOGIN
// =========================
function initializeLogin() {
    document.getElementById("loginForm")?.addEventListener("submit", async e => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            setMessage("loginError", "Please fill in all fields");
            return;
        }

        try {
            const { user } = await signInWithEmailAndPassword(auth, email, password);

            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userData", JSON.stringify({
                id: user.uid,
                name: user.displayName || email
            }));

            setMessage("loginSuccess", "Login successful!", true);
            setTimeout(() => location.href = "index.html", 1200);
        } catch (err) {
            setMessage("loginError", err.message);
        }
    });
}

// =========================
// SIGNUP
// =========================
function initializeSignup() {
    document.getElementById("signupForm")?.addEventListener("submit", async e => {
        e.preventDefault();

        const fullName = fullNameInput.value.trim();
        const email = signupEmail.value.trim();
        const password = signupPassword.value;
        const confirm = confirmPassword.value;
        const phone = phoneInput?.value.trim() || "";
        const course = courseInput.value.trim();

        if (!fullName || !email || !password || !confirm || !course) {
            setMessage("signupMessage", "Fill in all required fields");
            return;
        }

        if (password !== confirm) {
            setMessage("signupMessage", "Passwords do not match");
            return;
        }

        try {
            const { user } = await createUserWithEmailAndPassword(auth, email, password);

            await updateProfile(user, { displayName: fullName });
            await setDoc(doc(db, "students", user.uid), {
                fullName,
                email,
                phone,
                course,
                role: "student",
                createdAt: serverTimestamp()
            });

            setMessage("signupMessage", "Account created!", true);
            setTimeout(() => location.href = "Login.html", 1500);
        } catch (err) {
            setMessage("signupMessage", err.message);
        }
    });
}

// =========================
// PASSWORD TOGGLE
// =========================
function initializePasswordToggles() {
    const toggle = (input, icon) => {
        input.type = input.type === "password" ? "text" : "password";
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
    };

    togglePassword?.addEventListener("click", () =>
        toggle(passwordInput, togglePassword.querySelector("i"))
    );
    toggleSignupPassword?.addEventListener("click", () =>
        toggle(signupPassword, toggleSignupPassword.querySelector("i"))
    );
    toggleConfirmPassword?.addEventListener("click", () =>
        toggle(confirmPassword, toggleConfirmPassword.querySelector("i"))
    );
}

// =========================
// DASHBOARD USER
// =========================
function initializeDashboard() {
    const user = JSON.parse(localStorage.getItem("userData"));
    if (!user) return;

    headerUserName.textContent = user.name;
    dashboardUserName.textContent = user.name.split(" ")[0];

    const hour = new Date().getHours();
    greetingMessage.textContent =
        hour < 12 ? "Good morning 🌅" :
        hour < 17 ? "Good afternoon ☀️" :
                    "Good evening 🌙";
}

// =========================
// LOGOUT
// =========================
function logout(e) {
    e?.preventDefault();
    localStorage.clear();
    location.href = "Login.html";
}

// =========================
// SUBJECTS PAGE (MERGED)
// =========================
function initializeSubjects() {
    const container = document.querySelector(".subjects-container");
    if (!container) return;

    const subjects = [];

    addSubjectBtn.onclick = () => addSubjectModal.style.display = "block";

    document.querySelectorAll(".close").forEach(btn =>
        btn.onclick = () => btn.closest(".modal").style.display = "none"
    );

    window.onclick = e => {
        if (e.target.classList.contains("modal")) e.target.style.display = "none";
    };

    addSubjectForm.onsubmit = e => {
        e.preventDefault();

        const subject = {
            id: Date.now(),
            name: newSubjectName.value,
            teacher: newTeacherName.value,
            time: newSubjectTime.value,
            grade: newSubjectGrade.value || "—",
            desc: newSubjectDescription.value
        };

        subjects.push(subject);
        render();
        addSubjectForm.reset();
        addSubjectModal.style.display = "none";
    };

    function render() {
        container.innerHTML = subjects.map(s => `
            <div class="subject-card" data-id="${s.id}">
                <div class="subject-icon"><i class="fas fa-book"></i></div>
                <h3>${s.name}</h3>
                <p>${s.teacher}</p>
                <p>${s.time}</p>
                <div class="grade-display">${s.grade}</div>
            </div>
        `).join("");
    }

    container.onclick = e => {
        const card = e.target.closest(".subject-card");
        if (!card) return;

        const s = subjects.find(x => x.id == card.dataset.id);
        modalTitle.textContent = s.name;
        modalTeacher.textContent = s.teacher;
        modalTime.textContent = s.time;
        modalGrade.textContent = s.grade;
        subjectModal.style.display = "block";
    };
}

// =========================
// INITIALIZE ALL
// =========================
document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeLogin();
    initializeSignup();
    initializePasswordToggles();
    initializeDashboard();
    initializeSubjects();

    darkModeBtn?.addEventListener("click", () => applyTheme("dark"));
    lightModeBtn?.addEventListener("click", () => applyTheme("light"));
    darkThemeBtn?.addEventListener("click", () => applyTheme("dark"));
    lightThemeBtn?.addEventListener("click", () => applyTheme("light"));
    logoutBtn?.addEventListener("click", logout);
});

// =========================
// EXPORTS
// =========================
export { logout, applyTheme };
