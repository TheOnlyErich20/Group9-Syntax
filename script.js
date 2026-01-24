// ===== USER AUTHENTICATION & DASHBOARD =====

// Check if user is logged in (redirect if not on login page)
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const currentFile = window.location.pathname.split("/").pop().toLowerCase();
    
    // Allow access to Login.html without being logged in
    if (currentFile !== "login.html" && currentFile !== "") {
        if (!isLoggedIn) {
            window.location.href = "Login.html";
            return false;
        }
    }
    return true;
}

// Check login status on every page load
checkLoginStatus();

// Initialize user data on page load
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Content Loaded");
    
    // Setup login form listener first
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        console.log("Login form found, attaching listener");
        loginForm.addEventListener("submit", handleLoginSubmit);
    }
    
    // Setup signup form listener
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        console.log("Signup form found, attaching listener");
        signupForm.addEventListener("submit", handleSignupSubmit);
    }
    
    initializeUser();
    setupProfileForm();
    updateDashboardGreeting();
    initializeTheme();
});

function initializeUser() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userData = JSON.parse(localStorage.getItem("userData")) || {
        name: "John Doe",
        email: "john.doe@icct.edu.ph",
        fullName: "John Michael Doe",
        studentId: "2024-00123",
        course: "BS Information Technology",
        phone: "+63 912 345 6789",
        dob: "2003-03-15",
        gender: "Male"
    };

    // Store user data
    localStorage.setItem("userData", JSON.stringify(userData));

    // Update header with user info if on dashboard
    const headerUserName = document.getElementById("headerUserName");
    if (headerUserName) {
        headerUserName.textContent = userData.name;
    }
}

function updateDashboardGreeting() {
    const userData = JSON.parse(localStorage.getItem("userData"));
    const dashboardUserName = document.getElementById("dashboardUserName");
    
    if (dashboardUserName && userData) {
        const firstName = userData.name.split(" ")[0];
        dashboardUserName.textContent = firstName;
    }

    const greetingMessage = document.getElementById("greetingMessage");
    if (greetingMessage) {
        const hour = new Date().getHours();
        let greeting = "Good morning!";
        
        if (hour >= 12 && hour < 17) {
            greeting = "Good afternoon! ☀️";
        } else if (hour >= 17) {
            greeting = "Good evening! 🌙";
        } else {
            greeting = "Good morning! 🌅";
        }
        
        greetingMessage.textContent = greeting;
    }
}

function toggleUserMenu() {
    const userMenu = document.getElementById("userMenu");
    if (userMenu) {
        userMenu.classList.toggle("active");
    }
}

// Close user menu when clicking outside
document.addEventListener("click", (e) => {
    const userMenu = document.getElementById("userMenu");
    const userBtn = document.querySelector(".user-btn");
    if (userMenu && userBtn && !userMenu.contains(e.target) && !userBtn.contains(e.target)) {
        userMenu.classList.remove("active");
    }
});

// Handle logout
function handleLogout(event) {
    if (event) event.preventDefault();
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userData");
    window.location.href = "Login.html";
}

// ===== LOGIN PAGE FUNCTIONALITY =====

const API_URL = 'http://localhost:3000/api';

async function handleLoginSubmit(e) {
    e.preventDefault();
    console.log("Login form submitted");
    
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    
    console.log("Email:", email, "Password:", password);
    
    // Simple validation
    if (!email || !password) {
        showLoginError("Please fill in all fields");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (data.success) {
            // Store user data in localStorage
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userData", JSON.stringify(data.user));
            localStorage.setItem("userId", data.user.id);

            showLoginSuccess("Login successful! Redirecting...");
            
            console.log("Login data stored. Redirecting...");
            console.log("isLoggedIn:", localStorage.getItem("isLoggedIn"));
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        } else {
            showLoginError(data.message || "Invalid email or password");
        }
    } catch (error) {
        console.error("Login error:", error);
        showLoginError("Connection error. Make sure the server is running on port 3000");
    }
}

function showLoginError(message) {
    let errorElement = document.getElementById("loginError");
    if (!errorElement) {
        const form = document.getElementById("loginForm");
        if (!form) return;
        errorElement = document.createElement("div");
        errorElement.id = "loginError";
        errorElement.style.cssText = "color: #ff6b6b; margin-bottom: 15px; padding: 10px; border-radius: 5px; background-color: rgba(255, 107, 107, 0.1); border: 1px solid #ff6b6b;";
        form.insertBefore(errorElement, form.firstChild);
    }
    errorElement.textContent = message;
    errorElement.style.display = "block";
}

function showLoginSuccess(message) {
    let successElement = document.getElementById("loginSuccess");
    if (!successElement) {
        const form = document.getElementById("loginForm");
        if (!form) return;
        successElement = document.createElement("div");
        successElement.id = "loginSuccess";
        successElement.style.cssText = "color: #51cf66; margin-bottom: 15px; padding: 10px; border-radius: 5px; background-color: rgba(81, 207, 102, 0.1); border: 1px solid #51cf66;";
        form.insertBefore(successElement, form.firstChild);
    }
    successElement.textContent = message;
    successElement.style.display = "block";
}

function togglePassword() {
    const passwordInput = document.getElementById("password");
    const toggleIcon = document.querySelector(".toggle-password i");
    if (passwordInput) {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggleIcon.classList.remove("fa-eye");
            toggleIcon.classList.add("fa-eye-slash");
        } else {
            passwordInput.type = "password";
            toggleIcon.classList.remove("fa-eye-slash");
            toggleIcon.classList.add("fa-eye");
        }
    }
}

// ===== SIGNUP PAGE FUNCTIONALITY =====

async function handleSignupSubmit(e) {
    e.preventDefault();
    console.log("Signup form submitted");
    
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const course = document.getElementById("course").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    
    // Validation
    if (!fullName || !email || !course || !password || !confirmPassword) {
        showSignupError("Please fill in all required fields");
        return;
    }
    
    if (password.length < 6) {
        showSignupError("Password must be at least 6 characters long");
        return;
    }
    
    if (password !== confirmPassword) {
        showSignupError("Passwords do not match");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                name: fullName.split(" ")[0],
                fullName: fullName,
                course: course,
                phone: phone
            })
        });

        const data = await response.json();

        if (data.success) {
            showSignupSuccess("Account created successfully! Redirecting to login...");
            setTimeout(() => {
                window.location.href = "Login.html";
            }, 1500);
        } else {
            showSignupError(data.message || "Signup failed");
        }
    } catch (error) {
        console.error("Signup error:", error);
        showSignupError("Connection error. Make sure the server is running on port 3000");
    }
}

function showSignupError(message) {
    let errorElement = document.getElementById("signupError");
    if (!errorElement) {
        const form = document.getElementById("signupForm");
        errorElement = document.createElement("div");
        errorElement.id = "signupError";
        errorElement.style.cssText = "color: #ff6b6b; margin-bottom: 15px; padding: 10px; border-radius: 5px; background-color: rgba(255, 107, 107, 0.1); border: 1px solid #ff6b6b;";
        form.insertBefore(errorElement, form.firstChild);
    }
    errorElement.textContent = message;
    errorElement.style.display = "block";
}

function showSignupSuccess(message) {
    let successElement = document.getElementById("signupSuccess");
    if (!successElement) {
        const form = document.getElementById("signupForm");
        successElement = document.createElement("div");
        successElement.id = "signupSuccess";
        successElement.style.cssText = "color: #51cf66; margin-bottom: 15px; padding: 10px; border-radius: 5px; background-color: rgba(81, 207, 102, 0.1); border: 1px solid #51cf66;";
        form.insertBefore(successElement, form.firstChild);
    }
    successElement.textContent = message;
    successElement.style.display = "block";
}

function toggleSignupPassword() {
    const passwordInput = document.getElementById("signupPassword");
    const toggleIcon = event.currentTarget.querySelector("i");
    if (passwordInput) {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggleIcon.classList.remove("fa-eye");
            toggleIcon.classList.add("fa-eye-slash");
        } else {
            passwordInput.type = "password";
            toggleIcon.classList.remove("fa-eye-slash");
            toggleIcon.classList.add("fa-eye");
        }
    }
}

function toggleConfirmPassword() {
    const passwordInput = document.getElementById("confirmPassword");
    const toggleIcon = event.currentTarget.querySelector("i");
    if (passwordInput) {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggleIcon.classList.remove("fa-eye");
            toggleIcon.classList.add("fa-eye-slash");
        } else {
            passwordInput.type = "password";
            toggleIcon.classList.remove("fa-eye-slash");
            toggleIcon.classList.add("fa-eye");
        }
    }
}

// ===== PROFILE PAGE FUNCTIONALITY =====

function setupProfileForm() {
    const editForm = document.getElementById("editForm");
    if (editForm) {
        const userData = JSON.parse(localStorage.getItem("userData"));
        
        // Populate form with current data
        if (userData) {
            document.getElementById("editName").value = userData.fullName || "";
            document.getElementById("editEmail").value = userData.email || "";
            document.getElementById("editPhone").value = userData.phone || "";
            document.getElementById("editDOB").value = userData.dob || "";
            document.getElementById("editGender").value = userData.gender || "Male";
        }

        editForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const updatedData = {
                ...userData,
                fullName: document.getElementById("editName").value,
                email: document.getElementById("editEmail").value,
                phone: document.getElementById("editPhone").value,
                dob: document.getElementById("editDOB").value,
                gender: document.getElementById("editGender").value,
                name: document.getElementById("editName").value.split(" ")[0]
            };

            localStorage.setItem("userData", JSON.stringify(updatedData));
            toggleEditMode();
            location.reload();
        });
    }

    // Load profile data on profile page
    if (document.querySelector(".profile-section")) {
        loadProfileData();
    }
}

function loadProfileData() {
    const userData = JSON.parse(localStorage.getItem("userData"));
    
    if (userData) {
        document.getElementById("fullName").textContent = userData.fullName;
        document.getElementById("studentId").textContent = `Student ID: ${userData.studentId}`;
        document.getElementById("course").textContent = userData.course;
        
        document.getElementById("infoName").textContent = userData.fullName;
        document.getElementById("infoEmail").textContent = userData.email;
        document.getElementById("infoPhone").textContent = userData.phone;
        document.getElementById("infoDOB").textContent = new Date(userData.dob).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        document.getElementById("infoGender").textContent = userData.gender;
    }
}

function toggleEditMode() {
    const modal = document.getElementById("editProfileModal");
    if (modal) {
        modal.style.display = modal.style.display === "block" ? "none" : "block";
    }
}

// Close modal when clicking outside
window.addEventListener("click", (e) => {
    const modal = document.getElementById("editProfileModal");
    if (modal && e.target == modal) {
        modal.style.display = "none";
    }
});



// Sample subject data
const subjects = [
    {
        id: 1,
        name: "Mathematics",
        icon: "📐",
        category: "core",
        teacher: "Mr. Johnson",
        time: "Monday, Wednesday, Friday 9:00 AM",
        grade: "A",
        description: "Advanced algebra, calculus, and geometry concepts"
    },
    {
        id: 2,
        name: "English Literature",
        icon: "📚",
        category: "core",
        teacher: "Ms. Smith",
        time: "Tuesday, Thursday 10:30 AM",
        grade: "A+",
        description: "Classic and contemporary literature analysis"
    },
    {
        id: 3,
        name: "Physics",
        icon: "⚛️",
        category: "core",
        teacher: "Dr. Williams",
        time: "Monday, Wednesday 1:00 PM",
        grade: "B+",
        description: "Mechanics, waves, and modern physics"
    },
    {
        id: 4,
        name: "Chemistry",
        icon: "🧪",
        category: "core",
        teacher: "Ms. Brown",
        time: "Tuesday, Thursday 2:00 PM",
        grade: "A",
        description: "Organic and inorganic chemistry"
    },
    {
        id: 5,
        name: "History",
        icon: "🏛️",
        category: "elective",
        teacher: "Mr. Davis",
        time: "Friday 11:00 AM",
        grade: "A-",
        description: "World history from ancient civilizations to modern era"
    },
    {
        id: 6,
        name: "Computer Science",
        icon: "💻",
        category: "core",
        teacher: "Mr. Chen",
        time: "Monday, Wednesday 3:00 PM",
        grade: "A+",
        description: "Programming, algorithms, and data structures"
    },
    {
        id: 7,
        name: "Art & Design",
        icon: "🎨",
        category: "elective",
        teacher: "Ms. Garcia",
        time: "Saturday 10:00 AM",
        grade: "B",
        description: "Digital and traditional art techniques"
    },
    {
        id: 8,
        name: "Physical Education",
        icon: "🏃",
        category: "elective",
        teacher: "Coach Miller",
        time: "Tuesday, Thursday 4:00 PM",
        grade: "A",
        description: "Sports training and fitness development"
    }
];

// Initialize subjects on page load
document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".subjects-container");
    
    // Only load subjects if on the subjects page
    if (container) {
        renderSubjects(subjects);
        setupFilterButtons();
        setupModal();
    }
});

// Render subject cards
function renderSubjects(subjectsToRender) {
    const container = document.querySelector(".subjects-container");
    container.innerHTML = '';

    subjectsToRender.forEach(subject => {
        const card = document.createElement("div");
        card.className = "subject-card";
        card.dataset.category = subject.category;
        card.innerHTML = `
            <div class="subject-icon">${subject.icon}</div>
            <h3>${subject.name}</h3>
            <div class="subject-meta">
                <p><strong>Teacher:</strong> ${subject.teacher}</p>
                <p><strong>Time:</strong> ${subject.time}</p>
            </div>
            <div class="grade-display">${subject.grade}</div>
            <span class="subject-badge">${subject.category.charAt(0).toUpperCase() + subject.category.slice(1)}</span>
            <div class="card-footer">
                <button class="view-btn" onclick="openModal(${subject.id})">View Details</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Setup filter buttons
function setupFilterButtons() {
    const filterBtns = document.querySelectorAll(".filter-btn");
    
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const filter = btn.dataset.filter;
            filterSubjects(filter);
        });
    });
}

// Filter subjects based on category
function filterSubjects(filter) {
    const cards = document.querySelectorAll(".subject-card");
    
    cards.forEach(card => {
        if (filter === "all" || card.dataset.category === filter) {
            card.classList.remove("hide");
        } else {
            card.classList.add("hide");
        }
    });
}

// Setup modal functionality
function setupModal() {
    const modal = document.getElementById("subjectModal");
    const closeBtn = document.querySelector(".close");
    
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });
    
    window.addEventListener("click", (e) => {
        if (e.target == modal) {
            modal.style.display = "none";
        }
    });
}

// Open modal with subject details
function openModal(subjectId) {
    const subject = subjects.find(s => s.id === subjectId);
    const modal = document.getElementById("subjectModal");
    
    document.getElementById("modalTitle").textContent = subject.name;
    document.getElementById("modalTeacher").textContent = subject.teacher;
    document.getElementById("modalTime").textContent = subject.time;
    document.getElementById("modalGrade").textContent = subject.grade;
    document.getElementById("modalDescription").textContent = subject.description;
    
    modal.style.display = "block";
}

// ===== THEME MANAGEMENT =====
function initializeTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    applyTheme(savedTheme);
    setupThemeButtons();
}

function applyTheme(theme) {
    if (theme === "light") {
        document.body.classList.add("light-mode");
    } else {
        document.body.classList.remove("light-mode");
    }
    localStorage.setItem("theme", theme);
    updateThemeButtons(theme);
}

function setupThemeButtons() {
    const lightModeBtn = document.getElementById("lightModeBtn");
    const darkModeBtn = document.getElementById("darkModeBtn");
    
    if (lightModeBtn) {
        lightModeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            applyTheme("light");
        });
    }
    
    if (darkModeBtn) {
        darkModeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            applyTheme("dark");
        });
    }
    
    // Update button states on page load
    const currentTheme = localStorage.getItem("theme") || "dark";
    updateThemeButtons(currentTheme);
}

function updateThemeButtons(theme) {
    const lightModeBtn = document.getElementById("lightModeBtn");
    const darkModeBtn = document.getElementById("darkModeBtn");
    
    if (lightModeBtn && darkModeBtn) {
        if (theme === "light") {
            lightModeBtn.classList.add("active");
            darkModeBtn.classList.remove("active");
        } else {
            darkModeBtn.classList.add("active");
            lightModeBtn.classList.remove("active");
        }
    }
}

function toggleHeaderTheme() {
    const currentTheme = localStorage.getItem("theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
}