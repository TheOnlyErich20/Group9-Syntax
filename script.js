// =========================
// IMPORT FIREBASE AUTH
// =========================
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const db = getFirestore();

// =========================
// ROLE CHECKING FUNCTIONS
// =========================

/**
 * Get user role from Firestore
 * @param {string} userId - The user ID
 * @returns {Promise<string|null>} - 'instructor', 'student', or null
 */
export async function getUserRole(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            return userDoc.data().role || "student";
        }
        return null;
    } catch (error) {
        console.error("Error getting user role:", error);
        return null;
    }
}

/**
 * Check if current user is instructor
 * @returns {Promise<boolean>}
 */
export async function isInstructor() {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData) return false;
    
    const role = await getUserRole(userData.id);
    return role === "instructor";
}

/**
 * Check if current user is student
 * @returns {Promise<boolean>}
 */
export async function isStudent() {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData) return false;
    
    const role = await getUserRole(userData.id);
    return role === "student";
}

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

            // Get user role from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            let userRole = "student";
            if (userDoc.exists()) {
                userRole = userDoc.data().role || "student";
            }

            // Store logged-in user in localStorage
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userData", JSON.stringify({ 
                id: user.uid, 
                name: user.displayName || email,
                role: userRole
            }));

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
        const role = document.getElementById("userRole").value || "student";

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

            await setDoc(doc(db, "users", user.uid), {
                fullName,
                email,
                phone,
                course,
                role: role,
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
    const userRoleEl = document.getElementById("userRoleDisplay");

    if (userNameEl) userNameEl.textContent = userData.name;
    if (dashboardNameEl) dashboardNameEl.textContent = userData.name.split(" ")[0];
    if (userRoleEl) userRoleEl.textContent = (userData.role || "student").toUpperCase();

    if (greetingEl) {
        const hour = new Date().getHours();
        greetingEl.textContent = hour < 12 ? "Good morning 🌅" :
                                 hour < 17 ? "Good afternoon ☀️" :
                                             "Good evening 🌙";
    }

    // Apply role-based UI restrictions
    applyRoleBasedUI();
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
async function initializeSubjects() {
    const listContainer = document.getElementById('subjectsList');
    const detailsContainer = document.getElementById('subjectDetailsPanel');
    const addBtn = document.getElementById('addSubjectBtn');
    const addModal = document.getElementById('addSubjectModal');
    const addForm = document.getElementById('addSubjectForm');

    if (!listContainer || !detailsContainer) return;

    // Get user role
    const userData = JSON.parse(localStorage.getItem("userData"));
    const isInstructor = userData?.role === "instructor";

    // Load subjects from Firestore
    let subjects = await getAllSubjects();
    
    // Fallback to dummy data if no subjects in Firestore
    if (subjects.length === 0) {
        subjects = [
            { name: "Mathematics", teacher: "Mr. Anderson", time: "08:00 AM - 09:30 AM", description: "Advanced Calculus and Algebra" },
            { name: "Physics", teacher: "Ms. Curie", time: "10:00 AM - 11:30 AM", description: "Fundamentals of Physics" },
            { name: "Computer Science", teacher: "Mr. Turing", time: "01:00 PM - 02:30 PM", description: "Algorithms and Data Structures" }
        ];
    }

    // Dummy lessons data
    const dummyLessons = [
        { title: "Introduction to the Course", duration: "45 mins", status: "Completed" },
        { title: "Chapter 1: Fundamentals", duration: "1 hr 20 mins", status: "In Progress" },
        { title: "Chapter 2: Advanced Concepts", duration: "55 mins", status: "Locked" },
        { title: "Midterm Review", duration: "2 hrs", status: "Locked" }
    ];

    // -------------------------
    // RENDER SUBJECTS
    // -------------------------
    function renderSubjects() {
        listContainer.innerHTML = subjects.map((sub, index) => `
            <div class="subject-list-item" data-id="${sub.id}" data-index="${index}">
                <h4>${sub.name}</h4>
                <p><i class="fas fa-chalkboard-teacher"></i> ${sub.teacher}</p>
            </div>
        `).join('');

        // Add click listeners
        document.querySelectorAll('.subject-list-item').forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all
                document.querySelectorAll('.subject-list-item').forEach(i => i.classList.remove('active'));
                // Add active to clicked
                item.classList.add('active');
                // Show details
                renderSubjectDetails(item.dataset.index);
            });
        });
    }

    // -------------------------
    // RENDER DETAILS
    // -------------------------
    function renderSubjectDetails(index) {
        const sub = subjects[index];
        if (!sub) return;

        detailsContainer.innerHTML = `
            <div class="detail-header">
                <h2>${sub.name}</h2>
                <div class="detail-meta">
                    <span><i class="fas fa-chalkboard-teacher"></i> ${sub.teacher}</span>
                    <span><i class="fas fa-clock"></i> ${sub.time}</span>
                </div>
                <p class="detail-description">${sub.description || "No description available."}</p>
            </div>

            <div class="lessons-container">
                <h3><i class="fas fa-list-ul"></i> Lessons</h3>
                ${dummyLessons.map(lesson => `
                    <div class="lesson-item">
                        <div class="lesson-info">
                            <h4>${lesson.title}</h4>
                            <p><i class="fas fa-clock"></i> ${lesson.duration} • ${lesson.status}</p>
                        </div>
                        <button class="btn-start-lesson">
                            ${lesson.status === 'Locked' ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-play"></i> Start'}
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // -------------------------
    // OPEN ADD MODAL (Instructor only)
    // -------------------------
    if (isInstructor) {
        addBtn?.addEventListener('click', () => {
            addModal.style.display = 'block';
        });
    } else {
        // Hide add button for non-instructors
        addBtn?.style.display = 'none';
    }

    // -------------------------
    // CLOSE MODALS
    // -------------------------
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', e => {
        if (e.target === addModal) addModal.style.display = 'none';
    });

    // -------------------------
    // ADD SUBJECT (FORM - Instructor only)
    // -------------------------
    if (isInstructor) {
        addForm?.addEventListener('submit', async e => {
            e.preventDefault();

            const subject = {
                name: document.getElementById('newSubjectName').value.trim(),
                teacher: document.getElementById('newTeacherName').value.trim(),
                time: document.getElementById('newSubjectTime').value.trim(),
                description: document.getElementById('newSubjectDescription').value.trim()
            };

            try {
                // Save to Firestore
                const subjectId = await addSubject(subject);
                
                // Add to local array with ID
                subjects.push({ id: subjectId, ...subject });
                renderSubjects();

                addForm.reset();
                addModal.style.display = 'none';
            } catch (error) {
                console.error("Error adding subject:", error);
                alert("Error adding subject: " + error.message);
            }
        });
    } else {
        // Disable form for non-instructors
        addForm?.querySelectorAll('input, textarea').forEach(el => {
            el.disabled = true;
        });
    }

    // Initial Render
    renderSubjects();
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
// ROLE-BASED UI RESTRICTIONS
// =========================
function applyRoleBasedUI() {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData) return;

    const role = userData.role || "student";
    const isInstructor = role === "instructor";

    // Hide/Show instructor-only elements
    document.querySelectorAll('.instructor-only').forEach(el => {
        el.style.display = isInstructor ? '' : 'none';
    });

    // Hide/Show student-only elements
    document.querySelectorAll('.student-only').forEach(el => {
        el.style.display = isInstructor ? 'none' : '';
    });

    // Disable instructor-only forms for students
    if (!isInstructor) {
        document.querySelectorAll('.instructor-form input, .instructor-form select, .instructor-form textarea').forEach(el => {
            el.disabled = true;
        });
    }
}

// =========================
// INSTRUCTOR CRUD FUNCTIONS - SUBJECTS
// =========================

/**
 * Add a new subject to Firestore (Instructor only)
 */
export async function addSubject(subjectData) {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData || (userData.role !== "instructor")) {
        throw new Error("Only instructors can add subjects");
    }

    const subjectRef = await addDoc(collection(db, "subjects"), {
        ...subjectData,
        instructorId: userData.id,
        createdAt: serverTimestamp()
    });

    return subjectRef.id;
}

/**
 * Update a subject in Firestore (Instructor only)
 */
export async function updateSubject(subjectId, subjectData) {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData || (userData.role !== "instructor")) {
        throw new Error("Only instructors can update subjects");
    }

    await updateDoc(doc(db, "subjects", subjectId), {
        ...subjectData,
        updatedAt: serverTimestamp()
    });
}

/**
 * Delete a subject from Firestore (Instructor only)
 */
export async function deleteSubject(subjectId) {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData || (userData.role !== "instructor")) {
        throw new Error("Only instructors can delete subjects");
    }

    await deleteDoc(doc(db, "subjects", subjectId));
}

/**
 * Get all subjects
 */
export async function getAllSubjects() {
    const subjects = [];
    const querySnapshot = await getDocs(collection(db, "subjects"));
    querySnapshot.forEach(doc => {
        subjects.push({ id: doc.id, ...doc.data() });
    });
    return subjects;
}

// =========================
// INSTRUCTOR CRUD FUNCTIONS - TASKS
// =========================

/**
 * Add a new task to Firestore (Instructor only)
 */
export async function addTask(subjectId, taskData) {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData || (userData.role !== "instructor")) {
        throw new Error("Only instructors can add tasks");
    }

    const taskRef = await addDoc(collection(db, "subjects", subjectId, "tasks"), {
        ...taskData,
        instructorId: userData.id,
        createdAt: serverTimestamp()
    });

    return taskRef.id;
}

/**
 * Update a task in Firestore (Instructor only)
 */
export async function updateTask(subjectId, taskId, taskData) {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData || (userData.role !== "instructor")) {
        throw new Error("Only instructors can update tasks");
    }

    await updateDoc(doc(db, "subjects", subjectId, "tasks", taskId), {
        ...taskData,
        updatedAt: serverTimestamp()
    });
}

/**
 * Delete a task from Firestore (Instructor only)
 */
export async function deleteTask(subjectId, taskId) {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData || (userData.role !== "instructor")) {
        throw new Error("Only instructors can delete tasks");
    }

    await deleteDoc(doc(db, "subjects", subjectId, "tasks", taskId));
}

/**
 * Get all tasks for a subject
 */
export async function getTasksBySubject(subjectId) {
    const tasks = [];
    const querySnapshot = await getDocs(collection(db, "subjects", subjectId, "tasks"));
    querySnapshot.forEach(doc => {
        tasks.push({ id: doc.id, ...doc.data() });
    });
    return tasks;
}

// =========================
// STUDENT SUBMISSION FUNCTIONS
// =========================

/**
 * Submit an assignment (Student only)
 * @param {string} taskId - The task ID
 * @param {string} fileUrl - The Supabase file URL
 * @param {string} fileName - The original file name
 * @param {string} subjectId - The subject ID
 */
export async function submitAssignment(taskId, fileUrl, fileName, subjectId) {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData || (userData.role !== "student")) {
        throw new Error("Only students can submit assignments");
    }

    const submissionRef = await addDoc(collection(db, "tasks", taskId, "submissions"), {
        studentId: userData.id,
        studentName: userData.name,
        fileUrl: fileUrl,
        fileName: fileName,
        subjectId: subjectId,
        submittedAt: serverTimestamp()
    });

    return submissionRef.id;
}

/**
 * Get student submissions for a task (Instructor: all, Student: own only)
 */
export async function getSubmissions(taskId) {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData) throw new Error("User not logged in");

    const submissions = [];
    let q;

    if (userData.role === "instructor") {
        // Instructor sees all submissions
        q = query(collection(db, "tasks", taskId, "submissions"));
    } else {
        // Student sees only their own submissions
        q = query(collection(db, "tasks", taskId, "submissions"), 
                 where("studentId", "==", userData.id));
    }

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => {
        submissions.push({ id: doc.id, ...doc.data() });
    });
    return submissions;
}

// =========================
// ANNOUNCEMENT FUNCTIONS (Instructor only)
// =========================

/**
 * Post an announcement (Instructor only)
 */
export async function postAnnouncement(announcementData) {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData || (userData.role !== "instructor")) {
        throw new Error("Only instructors can post announcements");
    }

    const announcementRef = await addDoc(collection(db, "announcements"), {
        ...announcementData,
        instructorId: userData.id,
        instructorName: userData.name,
        createdAt: serverTimestamp()
    });

    return announcementRef.id;
}

/**
 * Get all announcements
 */
export async function getAllAnnouncements() {
    const announcements = [];
    const querySnapshot = await getDocs(query(collection(db, "announcements"), 
                                              where("published", "==", true)));
    querySnapshot.forEach(doc => {
        announcements.push({ id: doc.id, ...doc.data() });
    });
    return announcements;
}

// =========================
// INITIALIZE EVERYTHING ON DOM
// =========================
document.addEventListener("DOMContentLoaded", async () => {
    initializeTheme();
    initializeLogin();
    initializeSignup();
    initializePasswordToggles();
    initializeDashboard();
    initializeHelp();
    await initializeSubjects();
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
export { 
    logout, 
    applyTheme,
    getUserRole,
    isInstructor,
    isStudent,
    addSubject,
    updateSubject,
    deleteSubject,
    getAllSubjects,
    addTask,
    updateTask,
    deleteTask,
    getTasksBySubject,
    submitAssignment,
    getSubmissions,
    postAnnouncement,
    getAllAnnouncements
};
