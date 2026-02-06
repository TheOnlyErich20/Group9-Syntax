// =========================
// IMPORT FIREBASE AUTH
// =========================
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const db = getFirestore();

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Global Google Sign-In function
window.signInWithGoogle = async function() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        // Store user data
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userData", JSON.stringify({
            id: user.uid,
            name: user.displayName || user.email,
            email: user.email,
            role: "student" // Default role for Google sign-in
        }));
        
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            localStorage.setItem("userData", JSON.stringify({
                id: user.uid,
                name: userData.fullName || user.displayName || user.email,
                email: user.email,
                role: userData.role || "student"
            }));
        }
        
        window.location.href = "index.html";
    } catch (error) {
        console.error("Google sign-in error:", error);
        const errorEl = document.getElementById("loginError");
        if (errorEl) {
            errorEl.textContent = error.message;
            errorEl.style.display = "block";
        }
    }
};

// =========================
// INSTRUCTOR ACCESS CODES
// =========================
// Add your approved access codes here
const INSTRUCTOR_ACCESS_CODES = {
    "INSTRUCTOR2024": true,
    "TEACHER123": true,
    "SCHOOLADMIN": true
};

// =========================
// THEME TOGGLE
// =========================
function initializeTheme() {
    const theme = localStorage.getItem("theme") || "dark";
    applyTheme(theme);
    
    // Add click handlers for theme toggle buttons
    const darkBtn = document.getElementById("darkModeBtn") || document.getElementById("darkThemeBtn");
    const lightBtn = document.getElementById("lightModeBtn") || document.getElementById("lightThemeBtn");
    
    darkBtn?.addEventListener("click", () => {
        localStorage.setItem("theme", "dark");
        applyTheme("dark");
    });
    
    lightBtn?.addEventListener("click", () => {
        localStorage.setItem("theme", "light");
        applyTheme("light");
    });
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
// ROLE SELECTION TOGGLE
// =========================
function initializeRoleSelection() {
    const roleOptions = document.querySelectorAll('.role-option');
    const studentBenefits = document.querySelector('.student-benefits');
    const instructorBenefits = document.querySelector('.instructor-benefits');
    const accessCodeGroup = document.getElementById('accessCodeGroup');

    roleOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active from all
            roleOptions.forEach(opt => opt.classList.remove('active'));
            // Add active to clicked
            option.classList.add('active');
            
            // Update radio button
            const radio = option.querySelector('input[type="radio"]');
            radio.checked = true;

            // Show/hide benefits
            const role = radio.value;
            if (role === 'instructor') {
                if (studentBenefits) studentBenefits.style.display = 'none';
                if (instructorBenefits) instructorBenefits.style.display = 'block';
                if (accessCodeGroup) accessCodeGroup.style.display = 'block';
            } else {
                if (studentBenefits) studentBenefits.style.display = 'block';
                if (instructorBenefits) instructorBenefits.style.display = 'none';
                if (accessCodeGroup) accessCodeGroup.style.display = 'none';
            }
        });
    });
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
            let userRole = 'student';
            let userName = user.displayName || email;

            // Check students collection
            const studentDoc = await getDoc(doc(db, "students", user.uid));
            if (studentDoc.exists()) {
                userRole = studentDoc.data().role || 'student';
                userName = studentDoc.data().fullName || userName;
            } else {
                // Check instructors collection
                const instructorDoc = await getDoc(doc(db, "instructors", user.uid));
                if (instructorDoc.exists()) {
                    userRole = 'instructor';
                    userName = instructorDoc.data().fullName || userName;
                }
            }

            // Store logged-in user in localStorage
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userData", JSON.stringify({ 
                id: user.uid, 
                name: userName,
                email: email,
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
        const role = document.querySelector('input[name="role"]:checked').value;
        const accessCode = document.getElementById("accessCode")?.value.trim() || "";

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

        // Validate instructor access code
        if (role === "instructor") {
            if (!accessCode) {
                setMessage("signupMessage", "Access code is required for instructor accounts");
                return;
            }
            if (!INSTRUCTOR_ACCESS_CODES[accessCode]) {
                setMessage("signupMessage", "Invalid access code. Please contact admin.");
                return;
            }
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: fullName });

            // Save user data based on role
            const userData = {
                fullName,
                email,
                phone,
                course,
                role: role,
                createdAt: serverTimestamp()
            };

            if (role === "student") {
                await setDoc(doc(db, "students", user.uid), userData);
            } else if (role === "instructor") {
                await setDoc(doc(db, "instructors", user.uid), {
                    ...userData,
                    accessCode: accessCode, // Store for verification
                    subjects: [] // Will hold subject IDs
                });
            }

            // Also save to users collection for quick lookup
            await setDoc(doc(db, "users", user.uid), {
                fullName,
                email,
                role,
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
async function initializeSubjects() {
    const listContainer = document.getElementById('subjectsList');
    const detailsContainer = document.getElementById('subjectDetailsPanel');
    const addBtn = document.getElementById('addSubjectBtn');
    const addModal = document.getElementById('addSubjectModal');
    const addForm = document.getElementById('addSubjectForm');

    if (!listContainer || !detailsContainer) return;

    // Get current user role
    const userData = JSON.parse(localStorage.getItem("userData"));
    const isInstructor = userData?.role === 'instructor';

    // Show/hide add button based on role
    if (addBtn) {
        addBtn.style.display = isInstructor ? 'block' : 'none';
    }

    let subjects = [];

    // Load subjects from Firestore
    try {
        if (isInstructor) {
            // Load instructor's subjects
            const instructorDoc = await getDoc(doc(db, "instructors", userData.id));
            if (instructorDoc.exists()) {
                const subjectIds = instructorDoc.data().subjects || [];
                for (const subId of subjectIds) {
                    const subDoc = await getDoc(doc(db, "subjects", subId));
                    if (subDoc.exists()) {
                        subjects.push({ id: subDoc.id, ...subDoc.data() });
                    }
                }
            }
        } else {
            // Load student's enrolled subjects
            const studentDoc = await getDoc(doc(db, "students", userData.id));
            if (studentDoc.exists()) {
                const enrolledSubjectIds = studentDoc.data().enrolledSubjects || [];
                for (const subId of enrolledSubjectIds) {
                    const subDoc = await getDoc(doc(db, "subjects", subId));
                    if (subDoc.exists()) {
                        subjects.push({ id: subDoc.id, ...subDoc.data() });
                    }
                }
            }
        }
    } catch (err) {
        console.error("Error loading subjects:", err);
        // Fallback to dummy data if Firestore fails
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

    // =========================
    // RENDER SUBJECTS
    // =========================
    function renderSubjects() {
        if (subjects.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 20px; color: #aaa;">
                    <i class="fas fa-book"></i>
                    <p>${isInstructor ? 'No subjects yet. Click + to add one.' : 'No subjects enrolled.'}</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = subjects.map((sub, index) => `
            <div class="subject-list-item" data-index="${index}">
                <h4>${sub.name}</h4>
                <p><i class="fas fa-chalkboard-teacher"></i> ${sub.teacher || 'TBA'}</p>
            </div>
        `).join('');

        // Add click listeners
        document.querySelectorAll('.subject-list-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.subject-list-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                renderSubjectDetails(item.dataset.index);
            });
        });
    }

    // =========================
    // RENDER DETAILS
    // =========================
    function renderSubjectDetails(index) {
        const sub = subjects[index];
        if (!sub) return;

        let lessonsHtml = '';
        let tasksHtml = '';

        // Generate lessons/tasks based on role
        if (isInstructor) {
            // Instructor sees task management
            tasksHtml = `
                <div class="tasks-container" style="margin-top: 20px;">
                    <h3><i class="fas fa-tasks"></i> Tasks & Assignments</h3>
                    <button class="btn-add-task" onclick="showAddTaskModal('${sub.id}')" style="margin-bottom: 15px;">
                        <i class="fas fa-plus"></i> Add New Task
                    </button>
                    <div class="task-list">
                        ${dummyLessons.map(lesson => `
                            <div class="task-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px;">
                                <div>
                                    <h4>${lesson.title}</h4>
                                    <p style="font-size: 12px; color: #aaa;"><i class="fas fa-clock"></i> ${lesson.duration}</p>
                                </div>
                                <div class="task-actions">
                                    <button class="btn-edit-task" style="background: rgba(59, 130, 246, 0.2); border: none; padding: 8px 12px; border-radius: 6px; color: #60a5fa; cursor: pointer; margin-right: 5px;">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-delete-task" style="background: rgba(239, 68, 68, 0.2); border: none; padding: 8px 12px; border-radius: 6px; color: #f87171; cursor: pointer;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="upload-section" style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                    <h3><i class="fas fa-cloud-upload-alt"></i> Upload Materials</h3>
                    <div style="margin-top: 10px;">
                        <input type="file" id="fileUpload" style="display: none;" multiple />
                        <button onclick="document.getElementById('fileUpload').click()" class="login-btn" style="width: auto; padding: 10px 20px;">
                            <i class="fas fa-file-upload"></i> Select Files
                        </button>
                        <button class="login-btn" style="width: auto; padding: 10px 20px; background: #4ade80;">
                            <i class="fas fa-cloud-upload-alt"></i> Upload to Supabase
                        </button>
                    </div>
                    <p style="font-size: 12px; color: #aaa; margin-top: 10px;">
                        Supported: PDF, DOC, DOCX, PPT, PPTX, Images, Videos
                    </p>
                </div>
            `;
        } else {
            // Student sees lessons and can submit
            tasksHtml = `
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

                <div class="submissions-section" style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                    <h3><i class="fas fa-paper-plane"></i> Submit Assignment</h3>
                    <div style="margin-top: 10px;">
                        <input type="file" id="submissionFile" style="display: none;" />
                        <button onclick="document.getElementById('submissionFile').click()" class="login-btn" style="width: auto; padding: 10px 20px;">
                            <i class="fas fa-file-upload"></i> Select File
                        </button>
                        <button class="login-btn" style="width: auto; padding: 10px 20px; background: #4ade80;">
                            <i class="fas fa-paper-plane"></i> Submit
                        </button>
                    </div>
                    <p style="font-size: 12px; color: #aaa; margin-top: 10px;">
                        Upload your assignment files here. Supported formats: PDF, DOC, DOCX, Images
                    </p>
                </div>
            `;
        }

        detailsContainer.innerHTML = `
            <div class="detail-header">
                <h2>${sub.name}</h2>
                <div class="detail-meta">
                    <span><i class="fas fa-chalkboard-teacher"></i> ${sub.teacher || 'TBA'}</span>
                    <span><i class="fas fa-clock"></i> ${sub.time || 'TBA'}</span>
                </div>
                <p class="detail-description">${sub.description || "No description available."}</p>
            </div>

            ${tasksHtml}
        `;
    }

    // =========================
    // OPEN ADD MODAL
    // =========================
    addBtn?.addEventListener('click', () => {
        addModal.style.display = 'block';
    });

    // =========================
    // CLOSE MODALS
    // =========================
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', e => {
        if (e.target === addModal) addModal.style.display = 'none';
    });

    // =========================
    // ADD SUBJECT (FORM)
    // =========================
    addForm?.addEventListener('submit', async e => {
        e.preventDefault();

        const subjectData = {
            name: document.getElementById('newSubjectName').value.trim(),
            teacher: document.getElementById('newTeacherName').value.trim(),
            time: document.getElementById('newSubjectTime').value.trim(),
            description: document.getElementById('newSubjectDescription').value.trim(),
            instructorId: userData.id,
            instructorName: userData.name,
            createdAt: serverTimestamp()
        };

        try {
            // Add to subjects collection
            const subjectRef = await addDoc(collection(db, "subjects"), subjectData);
            const subjectId = subjectRef.id;

            // Update instructor's subjects array
            const instructorRef = doc(db, "instructors", userData.id);
            const instructorDoc = await getDoc(instructorRef);
            if (instructorDoc.exists()) {
                const currentSubjects = instructorDoc.data().subjects || [];
                await updateDoc(instructorRef, {
                    subjects: [...currentSubjects, subjectId]
                });
            }

            // Add to local subjects array
            subjects.push({ id: subjectId, ...subjectData });
            renderSubjects();

            addForm.reset();
            addModal.style.display = 'none';
        } catch (err) {
            console.error("Error adding subject:", err);
            alert("Error adding subject: " + err.message);
        }
    });

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
        const userData = JSON.parse(localStorage.getItem("userData")) || {};
        userData.name = newData.fullName;
        localStorage.setItem("userData", JSON.stringify(userData));

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
// SUPABASE UPLOAD FUNCTIONS
// =========================
// These functions will be used when you add Supabase SDK
async function uploadToSupabase(file, bucket, folder) {
    // This is a placeholder - actual implementation requires Supabase SDK
    console.log("Uploading file:", file.name, "to", bucket, folder);
    
    // Example implementation with Supabase:
    // const { data, error } = await supabase.storage
    //     .from(bucket)
    //     .upload(`${folder}${Date.now()}_${file.name}`, file);
    
    // return { data, error };
}

// =========================
// INITIALIZE EVERYTHING ON DOM
// =========================
document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeRoleSelection();
    initializeLogin();
    initializeSignup();
    initializePasswordToggles();
    initializeDashboard();
    initializeHelp();
    initializeSubjects();
});
