// =========================
// IMPORT FIREBASE AUTH
// =========================
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

    const darkBtn = document.getElementById("darkModeBtn") || document.getElementById("darkThemeBtn");
    const lightBtn = document.getElementById("lightModeBtn") || document.getElementById("lightThemeBtn");

    // Remove active from all
    [document.getElementById("darkModeBtn"), document.getElementById("lightModeBtn"), 
     document.getElementById("darkThemeBtn"), document.getElementById("lightThemeBtn")].forEach(btn => {
        if (btn) btn.classList.remove("active");
    });

    // Add active to the correct button
    if (theme === "dark") {
        document.getElementById("darkModeBtn")?.classList.add("active");
        document.getElementById("darkThemeBtn")?.classList.add("active");
    } else {
        document.getElementById("lightModeBtn")?.classList.add("active");
        document.getElementById("lightThemeBtn")?.classList.add("active");
    }
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
// LOGIN FUNCTIONALITY
// =========================
function initializeLogin() {
    const loginForm = document.getElementById("loginForm");
    loginForm?.addEventListener("submit", async e => {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            setMessage("loginError", "Please fill in all fields");
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store logged-in user in localStorage
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userData", JSON.stringify({ id: user.uid, name: user.displayName || email }));

            setMessage("loginSuccess", "Login successful! Redirecting...", true);
            setTimeout(() => location.href = "index.html", 1200);
        } catch (err) {
            setMessage("loginError", err.message);
        }
    });
}

// =========================
// SIGNUP FUNCTIONALITY
// =========================
function initializeSignup() {
    const signupForm = document.getElementById("signupForm");

    signupForm?.addEventListener("submit", async e => {
        e.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const phone = document.getElementById("phone").value.trim();
        const course = document.getElementById("course").value.trim();

        if (!fullName || !email || !password || !confirmPassword || !course) {
            setMessage("signupMessage", "Please fill in all required fields");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("signupMessage", "Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setMessage("signupMessage", "Password must be at least 6 characters");
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

            setMessage("signupMessage", "Account created successfully! Redirecting...", true);
            setTimeout(() => window.location.href = "Login.html", 1500);

        } catch (err) {
            setMessage("signupMessage", err.message);
        }
    });
}

// =========================
// PASSWORD TOGGLE
// =========================
function initializePasswordToggles() {
    function togglePassword(inputId, iconId) {
        const input = document.getElementById(inputId);
        const icon = document.querySelector(`#${iconId} i`);
        if (!input || !icon) return;
        input.type = input.type === "password" ? "text" : "password";
        icon.classList.toggle("fa-eye-slash");
        icon.classList.toggle("fa-eye");
    }

    document.getElementById("togglePassword")?.addEventListener("click", () => togglePassword("password", "togglePassword"));
    document.getElementById("toggleSignupPassword")?.addEventListener("click", () => togglePassword("signupPassword", "toggleSignupPassword"));
    document.getElementById("toggleConfirmPassword")?.addEventListener("click", () => togglePassword("confirmPassword", "toggleConfirmPassword"));
}

// =========================
// DASHBOARD USER INFO
// =========================
function initializeDashboard() {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData) return;

    const userNameEl = document.getElementById("headerUserName");
    const dashboardNameEl = document.getElementById("dashboardUserName");
    const greetingEl = document.getElementById("greetingMessage");

    if (userNameEl) userNameEl.textContent = userData.name;
    if (dashboardNameEl) dashboardNameEl.textContent = userData.name.split(" ")[0];

    if (greetingEl) {
        const hour = new Date().getHours();
        greetingEl.textContent = hour < 12 ? "Good morning 🌅" :
                                 hour < 17 ? "Good afternoon ☀️" :
                                             "Good evening 🌙";
    }
}

// =========================
// LOGOUT
// =========================
function logout(e) {
    if (e) e.preventDefault();
    localStorage.clear();
    location.href = "Login.html";
}

// =========================
// HELP PAGE FUNCTIONALITY
// =========================
function initializeHelp() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (!question) return;

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });

            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Contact Form Handling (Visual only)
    const contactForm = document.getElementById('helpContactForm');
    contactForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('.btn-submit');
        const originalText = btn.textContent;
        btn.textContent = 'Message Sent!';
        btn.style.background = '#4ade80';
        setTimeout(() => { btn.textContent = originalText; btn.style.background = ''; contactForm.reset(); }, 3000);
    });
}

// =========================
// SUBJECTS PAGE FUNCTIONALITY
// =========================
function initializeSubjects() {
    const container = document.querySelector('.subjects-container');
    if (!container) return;

    const addBtn = document.getElementById('addSubjectBtn');
    const addModal = document.getElementById('addSubjectModal');
    const addForm = document.getElementById('addSubjectForm');

    // Open modal
    addBtn?.addEventListener('click', () => addModal.style.display = 'block');

    // Close modals
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Render a subject card
    function renderSubject(subject) {
        const subjectCard = document.createElement("div");
        subjectCard.classList.add("subject-card");
        subjectCard.innerHTML = `
            <div class="subject-card-content">
                <div class="subject-icon"><i class="fas fa-book"></i></div>
                <h3>${subject.name}</h3>
                <div class="subject-meta">
                    <p><i class="fas fa-chalkboard-teacher"></i> ${subject.teacher}</p>
                    <p><i class="fas fa-clock"></i> ${subject.time}</p>
                </div>
                <div class="grade-display">${subject.grade || ""}</div>
                <span class="subject-badge">${subject.description || ""}</span>
            </div>
        `;
        container.appendChild(subjectCard);

        const subjectModal = document.getElementById('subjectModal');
        subjectCard.addEventListener('click', () => {
            if (!subjectModal) return;
            document.getElementById('modalTitle').textContent = subject.name;
            document.getElementById('modalTeacher').textContent = subject.teacher;
            document.getElementById('modalTime').textContent = subject.time;
            document.getElementById('modalGrade').textContent = subject.grade || "-";
            document.getElementById('modalDescription').textContent = subject.description || "-";
            subjectModal.style.display = 'block';
        });
    }

    // Real-time Firestore listener
    auth.onAuthStateChanged((user) => {
        if (!user) return;

        container.innerHTML = ""; // Clear existing

        const subjectsRef = collection(db, "subjects");
        const q = query(subjectsRef, where("uid", "==", user.uid));

        onSnapshot(q, (snapshot) => {
            container.innerHTML = "";
            snapshot.forEach(docSnap => {
                renderSubject(docSnap.data());
            });
        }, (err) => console.error("Error fetching subjects:", err));
    });

    // Handle Add Subject form
    addForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return alert("You must be logged in to add subjects.");

        const name = document.getElementById('newSubjectName').value.trim();
        const teacher = document.getElementById('newTeacherName').value.trim();
        const time = document.getElementById('newSubjectTime').value.trim();
        const grade = document.getElementById('newSubjectGrade').value.trim();
        const description = document.getElementById('newSubjectDescription').value.trim();

        if (!name || !teacher || !time) return alert("Please fill in required fields.");

        const subjectData = { name, teacher, time, grade, description, uid: user.uid };

        try {
            await setDoc(doc(collection(db, "subjects")), subjectData); // Auto-ID
            addForm.reset();
            addModal.style.display = 'none';
            // Real-time listener updates automatically
        } catch (err) {
            console.error("Error adding subject:", err);
            alert("Failed to add subject. Try again.");
        }
    });
}
// =========================
// PROFILE PAGE FUNCTIONALITY
// =========================
function initializeProfile() {
    const editBtn = document.getElementById('editProfileBtn');
    const modal = document.getElementById('editProfileModal');
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const editForm = document.getElementById('editForm');

    if (!editBtn || !modal || !editForm) return;

    // Load saved profile data
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        const data = JSON.parse(savedProfile);
        updateProfileUI(data);
    }

    // Open Modal
    editBtn.addEventListener('click', () => {
        // Populate form with current values
        document.getElementById('editName').value = document.getElementById('fullName').textContent;
        document.getElementById('editEmail').value = document.getElementById('infoEmail').textContent;
        document.getElementById('editPhone').value = document.getElementById('infoPhone').textContent;
        document.getElementById('editGender').value = document.getElementById('infoGender').textContent;
        
        // Handle Date (Convert "March 15, 2003" to "2003-03-15")
        const dobText = document.getElementById('infoDOB').textContent;
        const dateObj = new Date(dobText);
        if (!isNaN(dateObj.getTime())) {
             document.getElementById('editDOB').value = dateObj.toISOString().split('T')[0];
        }
        
        modal.style.display = 'block';
    });

    // Close Modal
    const closeModal = () => modal.style.display = 'none';
    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    if(cancelBtn) cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Save Changes
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newData = {
            fullName: document.getElementById('editName').value,
            email: document.getElementById('editEmail').value,
            phone: document.getElementById('editPhone').value,
            dob: document.getElementById('editDOB').value,
            gender: document.getElementById('editGender').value
        };

        // Format Date for display (YYYY-MM-DD to Month DD, YYYY)
        const dateObj = new Date(newData.dob);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const displayDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', options) : newData.dob;
        
        const uiData = { ...newData, dob: displayDate };

        updateProfileUI(uiData);
        localStorage.setItem('userProfile', JSON.stringify(uiData));
        
        // Update main user data for dashboard greeting
        const userData = JSON.parse(localStorage.getItem('userData')) || {};
        userData.name = newData.fullName;
        localStorage.setItem('userData', JSON.stringify(userData));

        closeModal();
    });
}

function updateProfileUI(data) {
    if(data.fullName) {
        document.getElementById('fullName').textContent = data.fullName;
        const displayName = document.getElementById('displayName');
        if(displayName) displayName.textContent = data.fullName;
    }
    if(data.email) {
        document.getElementById('infoEmail').textContent = data.email;
        const displayEmail = document.getElementById('displayEmail');
        if(displayEmail) displayEmail.textContent = data.email;
    }
    if(data.phone) document.getElementById('infoPhone').textContent = data.phone;
    if(data.dob) document.getElementById('infoDOB').textContent = data.dob;
    if(data.gender) document.getElementById('infoGender').textContent = data.gender;
}

// =========================
// GRADES PAGE FUNCTIONALITY
// =========================
function initializeGradesTable() {
    const rows = document.querySelectorAll('.grades-table .table-row');
    
    rows.forEach(row => {
        row.addEventListener('click', () => {
            // Close other rows (accordion style)
            rows.forEach(r => {
                if (r !== row) r.classList.remove('active');
            });
            row.classList.toggle('active');
        });
    });
}

function initializeGradesFilter() {
    const controls = document.querySelector('.grades-controls');
    if (!controls) return;

    const table = document.querySelector('.grades-table');
    if (!table) return;

    const buttons = controls.querySelectorAll('button[data-term]');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const term = button.dataset.term;

            // Remove all term-specific classes from the table
            table.classList.remove('show-prelim', 'show-midterm', 'show-final');

            // Add the specific class if not 'all'
            if (term !== 'all') {
                table.classList.add(`show-${term}`);
            }
        });
    });
}

// =========================
// INITIALIZE EVERYTHING ON DOM
// =========================
document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeLogin();
    initializeSignup();
    initializePasswordToggles();
    initializeDashboard();
    initializeHelp();
    initializeSubjects();
    initializeProfile();
    initializeGradesTable();
    initializeGradesFilter();

    // THEME BUTTONS FOR MULTIPLE PAGES
    document.getElementById("darkModeBtn")?.addEventListener("click", () => applyTheme("dark"));
    document.getElementById("lightModeBtn")?.addEventListener("click", () => applyTheme("light"));
    document.getElementById("darkThemeBtn")?.addEventListener("click", () => applyTheme("dark"));
    document.getElementById("lightThemeBtn")?.addEventListener("click", () => applyTheme("light"));
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
});

// =========================
// EXPORT LOGOUT & THEME
// =========================
export { logout, applyTheme };
