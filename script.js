// =========================
// IMPORT FROM FIREBASE JS
// =========================
import { 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    updateDoc, 
    deleteDoc, 
    getDoc,
    serverTimestamp 
} from './firebase.js';

// Initialize Supabase from global config
const supabase = window.supabase ? window.supabase.createClient(
    window.SUPABASE_CONFIG?.url || '',
    window.SUPABASE_CONFIG?.anonKey || ''
) : null;

// =========================
// HELPER FUNCTIONS
// =========================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
// SUBJECTS PAGE FUNCTIONALITY
// =========================
async function initializeSubjects() {
    const listContainer = document.getElementById('subjectsList');
    const detailsContainer = document.getElementById('subjectDetailsPanel');
    const addBtn = document.getElementById('addSubjectBtn');
    const addModal = document.getElementById('addSubjectModal');
    const addForm = document.getElementById('addSubjectForm');
    const addTaskModal = document.getElementById('addTaskModal');
    const addTaskForm = document.getElementById('addTaskForm');
    const submissionModal = document.getElementById('submissionModal');
    const submissionForm = document.getElementById('submissionForm');

    if (!listContainer || !detailsContainer) return;

    const userData = JSON.parse(localStorage.getItem("userData"));
    const isInstructor = userData?.role === 'instructor';

    // Show/hide add button based on role
    if (addBtn) {
        addBtn.style.display = isInstructor ? 'flex' : 'none';
    }

    let subjects = [];

    // Load subjects from Firestore
    try {
        let q;
        if (isInstructor) {
            q = query(collection(db, "subjects"), where("instructorId", "==", userData.id));
        } else {
            q = query(collection(db, "subjects"));
        }
        
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            subjects.push({ id: doc.id, ...doc.data() });
        });
    } catch (err) {
        console.error("Error loading subjects:", err);
        // Fallback dummy data
        subjects = [
            { id: "demo1", name: "Mathematics", teacher: "Mr. Anderson", time: "08:00 AM - 09:30 AM", description: "Advanced Calculus and Algebra" },
            { id: "demo2", name: "Physics", teacher: "Ms. Curie", time: "10:00 AM - 11:30 AM", description: "Fundamentals of Physics" },
            { id: "demo3", name: "Computer Science", teacher: "Mr. Turing", time: "01:00 PM - 02:30 PM", description: "Algorithms and Data Structures" }
        ];
    }

    // =========================
    // RENDER SUBJECTS
    // =========================
    function renderSubjects() {
        if (subjects.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 20px; color: #aaa;">
                    <i class="fas fa-book"></i>
                    <p>${isInstructor ? 'No subjects yet. Click + to add one.' : 'No subjects available.'}</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = subjects.map((sub, index) => `
            <div class="subject-list-item" data-index="${index}" data-id="${sub.id}">
                <h4>${escapeHtml(sub.name)}</h4>
                <p><i class="fas fa-chalkboard-teacher"></i> ${escapeHtml(sub.teacher || 'TBA')}</p>
            </div>
        `).join('');

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
    async function renderSubjectDetails(index) {
        const sub = subjects[index];
        if (!sub) return;

        // Load tasks for this subject
        let tasks = [];
        try {
            const tasksQuery = query(collection(db, "tasks"), where("subjectId", "==", sub.id));
            const tasksSnapshot = await getDocs(tasksQuery);
            tasksSnapshot.forEach(doc => {
                tasks.push({ id: doc.id, ...doc.data() });
            });
        } catch (err) {
            console.error("Error loading tasks:", err);
        }

        // Sort tasks by due date
        tasks.sort((a, b) => {
            const aDate = a.dueDate?.toMillis?.() || new Date(a.dueDate).getTime();
            const bDate = b.dueDate?.toMillis?.() || new Date(b.dueDate).getTime();
            return aDate - bDate;
        });

        if (isInstructor) {
            detailsContainer.innerHTML = `
                <div class="detail-header">
                    <h2>${escapeHtml(sub.name)}</h2>
                    <div class="detail-meta">
                        <span><i class="fas fa-chalkboard-teacher"></i> ${escapeHtml(sub.teacher || 'TBA')}</span>
                        <span><i class="fas fa-clock"></i> ${escapeHtml(sub.time || 'TBA')}</span>
                    </div>
                    <p class="detail-description">${escapeHtml(sub.description || 'No description available.')}</p>
                </div>

                <div class="lessons-container" style="margin-top: 20px;">
                    <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <i class="fas fa-tasks"></i> Tasks & Assignments
                        <button onclick="openTaskModal('${sub.id}')" class="btn-add-mini" title="Add Task">
                            <i class="fas fa-plus"></i>
                        </button>
                    </h3>
                    <div class="tasks-list" id="tasksList">
                        ${tasks.length > 0 ? tasks.map(task => `
                            <div class="task-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px;">
                                <div>
                                    <h4 style="margin: 0 0 5px;">${escapeHtml(task.title)}</h4>
                                    <p style="font-size: 12px; color: #aaa; margin: 0;">
                                        <i class="fas fa-clock"></i> Due: ${new Date(task.dueDate?.toMillis?.() || task.dueDate).toLocaleDateString()}
                                        <span style="margin-left: 10px;"><i class="fas fa-star"></i> ${task.maxScore || 100} pts</span>
                                    </p>
                                </div>
                                <div class="task-actions" style="display: flex; gap: 8px;">
                                    <button onclick="deleteTask('${sub.id}', '${task.id}')" class="btn-action" title="Delete" style="background: rgba(239, 68, 68, 0.2); border: none; padding: 8px 12px; border-radius: 6px; color: #f87171; cursor: pointer;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<p style="color: #aaa;">No tasks yet. Click + to add one.</p>'}
                    </div>
                </div>
            `;
        } else {
            detailsContainer.innerHTML = `
                <div class="detail-header">
                    <h2>${escapeHtml(sub.name)}</h2>
                    <div class="detail-meta">
                        <span><i class="fas fa-chalkboard-teacher"></i> ${escapeHtml(sub.teacher || 'TBA')}</span>
                        <span><i class="fas fa-clock"></i> ${escapeHtml(sub.time || 'TBA')}</span>
                    </div>
                    <p class="detail-description">${escapeHtml(sub.description || 'No description available.')}</p>
                </div>

                <div class="assignments-section" style="margin-top: 25px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                    <h3 style="margin-bottom: 15px;"><i class="fas fa-tasks"></i> Your Assignments</h3>
                    <div class="assignments-list">
                        ${tasks.length > 0 ? tasks.map(task => `
                            <div class="assignment-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px;">
                                <div>
                                    <h4 style="margin: 0 0 5px;">${escapeHtml(task.title)}</h4>
                                    <p style="font-size: 12px; color: #aaa; margin: 0;">
                                        <i class="fas fa-clock"></i> Due: ${new Date(task.dueDate?.toMillis?.() || task.dueDate).toLocaleDateString()}
                                        <span style="margin-left: 10px;"><i class="fas fa-star"></i> ${task.maxScore || 100} pts</span>
                                    </p>
                                </div>
                                <button onclick="openSubmissionModal('${task.id}', '${sub.id}')" class="login-btn" style="width: auto; padding: 8px 16px; background: #4ade80;">
                                    <i class="fas fa-paper-plane"></i> Submit
                                </button>
                            </div>
                        `).join('') : '<p style="color: #aaa;">No assignments available.</p>'}
                    </div>
                </div>
            `;
        }
    }

    // =========================
    // OPEN MODALS
    // =========================
    window.openTaskModal = function(subjectId) {
        document.getElementById('currentSubjectId').value = subjectId;
        addTaskModal.style.display = 'block';
    };

    window.openSubmissionModal = function(taskId, subjectId) {
        document.getElementById('submitTaskId').value = taskId;
        document.getElementById('submitSubjectId').value = subjectId;
        submissionModal.style.display = 'block';
    };

    window.deleteTask = async function(subjectId, taskId) {
        if (!confirm("Are you sure you want to delete this task?")) return;

        try {
            await deleteDoc(doc(db, "tasks", taskId));
            const activeIndex = document.querySelector('.subject-list-item.active')?.dataset.index || 0;
            renderSubjectDetails(activeIndex);
        } catch (err) {
            console.error("Error deleting task:", err);
            alert("Error deleting task: " + err.message);
        }
    };

    // =========================
    // ADD SUBJECT (FORM)
    // =========================
    addForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const subject = {
            name: document.getElementById('newSubjectName').value.trim(),
            teacher: document.getElementById('newTeacherName').value.trim(),
            time: document.getElementById('newSubjectTime').value.trim(),
            description: document.getElementById('newSubjectDescription').value.trim(),
            instructorId: userData.id,
            instructorName: userData.name,
            createdAt: serverTimestamp()
        };

        if (!userData?.id) {
            alert('User not logged in. Please log in first.');
            return;
        }

        try {
            const subjectRef = await addDoc(collection(db, "subjects"), subject);
            subjects.push({ id: subjectRef.id, ...subject });
            renderSubjects();
            addForm.reset();
            addModal.style.display = 'none';
        } catch (err) {
            console.error("Error adding subject:", err);
            alert("Error adding subject: " + err.message);
        }
    });

    // =========================
    // ADD TASK (FORM)
    // =========================
    addTaskForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const task = {
            title: document.getElementById('newTaskTitle').value.trim(),
            description: document.getElementById('newTaskDescription').value.trim(),
            dueDate: new Date(document.getElementById('newTaskDueDate').value),
            maxScore: parseInt(document.getElementById('newTaskMaxScore').value),
            subjectId: document.getElementById('currentSubjectId').value,
            createdAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "tasks"), task);
            const activeIndex = document.querySelector('.subject-list-item.active')?.dataset.index || 0;
            renderSubjectDetails(activeIndex);
            addTaskForm.reset();
            addTaskModal.style.display = 'none';
        } catch (err) {
            console.error("Error adding task:", err);
            alert("Error adding task: " + err.message);
        }
    });

    // =========================
    // SUBMISSION (FORM)
    // =========================
    submissionForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const taskId = document.getElementById('submitTaskId').value;
        const subjectId = document.getElementById('submitSubjectId').value;
        const answer = document.getElementById('submissionText').value.trim();
        const fileInput = document.getElementById('submissionFile');

        if (!answer && !fileInput.files.length) {
            alert('Please provide an answer or attach a file.');
            return;
        }

        const submission = {
            taskId: taskId,
            subjectId: subjectId,
            studentId: userData.id,
            studentName: userData.name,
            answer: answer,
            submittedAt: serverTimestamp()
        };

        try {
            // Upload file if attached
            if (fileInput.files.length > 0 && supabase) {
                const file = fileInput.files[0];
                const filePath = `submissions/${subjectId}/${taskId}/${userData.id}/${Date.now()}_${file.name}`;
                
                const { data, error } = await supabase.storage
                    .from('student-submissions')
                    .upload(filePath, file);
                
                if (!error) {
                    const { data: urlData } = supabase.storage
                        .from('student-submissions')
                        .getPublicUrl(filePath);
                    
                    submission.fileURL = urlData.publicUrl;
                    submission.fileName = file.name;
                }
            }

            await addDoc(collection(db, "submissions"), submission);
            
            alert('Submission successful!');
            submissionForm.reset();
            submissionModal.style.display = 'none';
        } catch (err) {
            console.error("Error submitting:", err);
            alert("Error submitting: " + err.message);
        }
    });

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

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
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

    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        const data = JSON.parse(savedProfile);
        updateProfileUI(data);
    }

    editBtn.addEventListener('click', () => {
        document.getElementById('editName').value = document.getElementById('fullName').textContent;
        document.getElementById('editEmail').value = document.getElementById('infoEmail').textContent;
        document.getElementById('editPhone').value = document.getElementById('infoPhone').textContent;
        document.getElementById('editGender').value = document.getElementById('infoGender').textContent;
        
        const dobText = document.getElementById('infoDOB').textContent;
        const dateObj = new Date(dobText);
        if (!isNaN(dateObj.getTime())) {
             document.getElementById('editDOB').value = dateObj.toISOString().split('T')[0];
        }
        
        modal.style.display = 'block';
    });

    const closeModal = () => modal.style.display = 'none';
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newData = {
            fullName: document.getElementById('editName').value,
            email: document.getElementById('editEmail').value,
            phone: document.getElementById('editPhone').value,
            dob: document.getElementById('editDOB').value,
            gender: document.getElementById('editGender').value
        };

        const dateObj = new Date(newData.dob);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const displayDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', options) : newData.dob;
        
        const uiData = { ...newData, dob: displayDate };
        updateProfileUI(uiData);
        localStorage.setItem('userProfile', JSON.stringify(uiData));
        
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
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const term = button.dataset.term;
            table.classList.remove('show-prelim', 'show-midterm', 'show-final');

            if (term !== 'all') {
                table.classList.add(`show-${term}`);
            }
        });
    });
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
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

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
// INITIALIZE EVERYTHING ON DOM
// =========================
document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeSubjects();
    initializeProfile();
    initializeGradesTable();
    initializeGradesFilter();
    initializeHelp();

    // Theme buttons
    document.getElementById("darkModeBtn")?.addEventListener("click", () => applyTheme("dark"));
    document.getElementById("lightModeBtn")?.addEventListener("click", () => applyTheme("light"));
    document.getElementById("darkThemeBtn")?.addEventListener("click", () => applyTheme("dark"));
    document.getElementById("lightThemeBtn")?.addEventListener("click", () => applyTheme("light"));
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
});

// Export for use
export { logout, applyTheme };
