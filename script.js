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
    serverTimestamp,
    onSnapshot
} from './firebase.js';

// Initialize Supabase from global config
const supabase = window.supabase ? window.supabase.createClient(
    window.SUPABASE_CONFIG?.url || '',
    window.SUPABASE_CONFIG?.anonKey || ''
) : null;

// File size limit (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// =========================
// HELPER FUNCTIONS
// =========================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(date) {
    if (!date) return '';
    const d = date.toMillis ? date.toMillis() : new Date(date);
    return new Date(d).toLocaleDateString() + ' ' + new Date(d).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function formatDateShort(date) {
    if (!date) return '';
    const d = date.toMillis ? date.toMillis() : new Date(date);
    return new Date(d).toLocaleDateString();
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
    const editModal = document.getElementById('editSubjectModal');
    const editForm = document.getElementById('editSubjectForm');
    const addTaskModal = document.getElementById('addTaskModal');
    const addTaskForm = document.getElementById('addTaskForm');
    const submissionModal = document.getElementById('submissionModal');
    const submissionForm = document.getElementById('submissionForm');
    const uploadModal = document.getElementById('uploadModal');
    const uploadForm = document.getElementById('uploadForm');

    if (!listContainer || !detailsContainer) return;

    const userData = JSON.parse(localStorage.getItem("userData"));
    const isInstructor = userData?.role === 'instructor';

    // Show/hide add button based on role (optional - remove to allow all users)
    // if (addBtn) {
    //     addBtn.style.display = isInstructor ? 'flex' : 'none';
    // }

    let subjects = [];
    let currentSubjectIndex = null;
    let currentSubjectId = null;
    let unsubscribeTasks = null;
    let unsubscribeSubmissions = null;

    // =========================
    // REALTIME SUBSCRIPTION (Optimized)
    // =========================
    function startRealtimeForSubject(subjectId) {
        // Stop existing subscriptions first
        stopRealtime();

        if (!subjectId) return;

        // Listen for task changes (only when viewing a subject)
        const tasksQuery = query(collection(db, "tasks"), where("subjectId", "==", subjectId));
        unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            // Only re-render if we're still on the same subject
            if (currentSubjectId === subjectId && currentSubjectIndex !== null) {
                renderSubjectDetails(currentSubjectIndex, false); // false = don't reload subjects list
            }
        }, (error) => {
            console.error("Task snapshot error:", error);
        });

        // For students: listen for their own submissions
        if (!isInstructor) {
            const submissionsQuery = query(
                collection(db, "submissions"),
                where("studentId", "==", userData.id)
            );
            unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
                if (currentSubjectId === subjectId && currentSubjectIndex !== null) {
                    renderSubjectDetails(currentSubjectIndex, false);
                }
            }, (error) => {
                console.error("Submission snapshot error:", error);
            });
        }
    }

    function stopRealtime() {
        if (unsubscribeTasks) {
            unsubscribeTasks();
            unsubscribeTasks = null;
        }
        if (unsubscribeSubmissions) {
            unsubscribeSubmissions();
            unsubscribeSubmissions = null;
        }
    }

    // =========================
    // LOAD SUBJECTS (Only once on init)
    // =========================
    async function loadSubjects() {
        try {
            let q;
            if (isInstructor) {
                q = query(collection(db, "subjects"), where("instructorId", "==", userData.id));
            } else {
                q = query(collection(db, "subjects"));
            }
            
            const snapshot = await getDocs(q);
            subjects = [];
            snapshot.forEach(doc => {
                subjects.push({ id: doc.id, ...doc.data() });
            });
            renderSubjects();
        } catch (err) {
            console.error("Error loading subjects:", err);
        }
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
            <div class="subject-list-item ${index === currentSubjectIndex ? 'active' : ''}" data-index="${index}" data-id="${sub.id}">
                <h4>${escapeHtml(sub.name)}</h4>
                <p><i class="fas fa-chalkboard-teacher"></i> ${escapeHtml(sub.teacher || 'TBA')}</p>
            </div>
        `).join('');

        document.querySelectorAll('.subject-list-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.subject-list-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                currentSubjectIndex = item.dataset.index;
                currentSubjectId = item.dataset.id;
                renderSubjectDetails(item.dataset.index, true); // true = start realtime
            });
        });
    }

    // =========================
    // RENDER DETAILS
    // =========================
    async function renderSubjectDetails(index, startRealtime = false) {
        const sub = subjects[index];
        if (!sub) return;

        currentSubjectId = sub.id;

        // Start realtime only when explicitly requested
        if (startRealtime) {
            startRealtimeForSubject(sub.id);
        }

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

        // Load student submissions if student
        let submissions = [];
        if (!isInstructor) {
            try {
                const subQuery = query(
                    collection(db, "submissions"),
                    where("studentId", "==", userData.id)
                );
                const subSnapshot = await getDocs(subQuery);
                subSnapshot.forEach(doc => {
                    submissions.push({ id: doc.id, ...doc.data() });
                });
            } catch (err) {
                console.error("Error loading submissions:", err);
            }
        }

        if (isInstructor) {
            // INSTRUCTOR VIEW
            detailsContainer.innerHTML = `
                <div class="detail-header">
                    <h2>${escapeHtml(sub.name)}</h2>
                    <div class="detail-meta">
                        <span><i class="fas fa-chalkboard-teacher"></i> ${escapeHtml(sub.teacher || 'TBA')}</span>
                        <span><i class="fas fa-clock"></i> ${escapeHtml(sub.time || 'TBA')}</span>
                    </div>
                    <p class="detail-description">${escapeHtml(sub.description || 'No description available.')}</p>
                    <div class="detail-actions" style="margin-top: 15px;">
                        <button onclick="openEditSubjectModal('${sub.id}')" class="btn-action" style="background: rgba(59, 130, 246, 0.2); border: none; padding: 8px 16px; border-radius: 6px; color: #60a5fa; cursor: pointer; margin-right: 10px;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="deleteSubject('${sub.id}')" class="btn-action" style="background: rgba(239, 68, 68, 0.2); border: none; padding: 8px 16px; border-radius: 6px; color: #f87171; cursor: pointer;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>

                <div class="lessons-container" style="margin-top: 20px;">
                    <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <i class="fas fa-tasks"></i> Tasks & Assignments
                        <button onclick="openTaskModal('${sub.id}')" class="btn-add-mini" title="Add Task">
                            <i class="fas fa-plus"></i>
                        </button>
                    </h3>
                    <div class="tasks-list" id="tasksList">
                        ${tasks.length > 0 ? tasks.map(task => renderTaskItem(task, true)).join('') : '<p style="color: #aaa;">No tasks yet. Click + to add one.</p>'}
                    </div>
                </div>
            `;
        } else {
            // STUDENT VIEW
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
                        ${tasks.length > 0 ? tasks.map(task => {
                            const taskSubmissions = submissions.filter(s => s.taskId === task.id);
                            const hasSubmitted = taskSubmissions.length > 0;
                            return renderStudentTaskItem(task, hasSubmitted, taskSubmissions[0]);
                        }).join('') : '<p style="color: #aaa;">No assignments available.</p>'}
                    </div>
                </div>
            `;
        }
    }

    // =========================
    // RENDER TASK ITEMS
    // =========================
    function renderTaskItem(task, isInstructor) {
        const dueDate = task.dueDate?.toMillis?.() || new Date(task.dueDate);
        const isOverdue = dueDate < new Date();
        
        return `
            <div class="task-item" style="display: flex; justify-content: space-between; align-items: flex-start; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px;">${escapeHtml(task.title)}</h4>
                    <p style="font-size: 12px; color: #aaa; margin: 0;">
                        <i class="fas fa-clock"></i> Due: ${formatDateShort(dueDate)}
                        <span style="margin-left: 10px;"><i class="fas fa-star"></i> ${task.maxScore || 100} pts</span>
                        ${isOverdue ? '<span style="margin-left: 10px; color: #f87171;">(Overdue)</span>' : ''}
                    </p>
                    ${task.description ? `<p style="font-size: 12px; color: #888; margin: 5px 0 0;">${escapeHtml(task.description)}</p>` : ''}
                    
                    <!-- Task Files Section -->
                    <div class="task-files" id="task-files-${task.id}" style="margin-top: 10px;">
                        ${renderTaskFiles(task.id)}
                    </div>
                </div>
                <div class="task-actions" style="display: flex; gap: 8px; flex-shrink: 0;">
                    ${isInstructor ? `
                        <button onclick="openUploadModal('${task.subjectId}', '${task.id}')" class="btn-action" title="Upload File" style="background: rgba(59, 130, 246, 0.2); border: none; padding: 8px 12px; border-radius: 6px; color: #60a5fa; cursor: pointer;">
                            <i class="fas fa-cloud-upload-alt"></i>
                        </button>
                        <button onclick="openEditTaskModal('${task.id}', '${task.subjectId}')" class="btn-action" title="Edit" style="background: rgba(59, 130, 246, 0.2); border: none; padding: 8px 12px; border-radius: 6px; color: #60a5fa; cursor: pointer;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteTask('${task.subjectId}', '${task.id}')" class="btn-action" title="Delete" style="background: rgba(239, 68, 68, 0.2); border: none; padding: 8px 12px; border-radius: 6px; color: #f87171; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function renderStudentTaskItem(task, hasSubmitted, submission) {
        const dueDate = task.dueDate?.toMillis?.() || new Date(task.dueDate);
        const isOverdue = dueDate < new Date();
        
        return `
            <div class="assignment-item" style="display: flex; justify-content: space-between; align-items: flex-start; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px;">${escapeHtml(task.title)}</h4>
                    <p style="font-size: 12px; color: #aaa; margin: 0;">
                        <i class="fas fa-clock"></i> Due: ${formatDateShort(dueDate)}
                        <span style="margin-left: 10px;"><i class="fas fa-star"></i> ${task.maxScore || 100} pts</span>
                        ${isOverdue ? '<span style="margin-left: 10px; color: #f87171;">(Overdue)</span>' : ''}
                    </p>
                    ${task.description ? `<p style="font-size: 12px; color: #888; margin: 5px 0 0;">${escapeHtml(task.description)}</p>` : ''}
                    
                    ${hasSubmitted ? `
                        <div style="margin-top: 10px; padding: 8px; background: rgba(74, 222, 128, 0.2); border-radius: 6px; font-size: 12px;">
                            <i class="fas fa-check-circle" style="color: #4ade80;"></i> Submitted on ${formatDate(submission.submittedAt)}
                            ${submission.fileURL ? `
                                <br><i class="fas fa-file" style="color: #60a5fa;"></i> 
                                <a href="${submission.fileURL}" target="_blank" style="color: #60a5fa;">${escapeHtml(submission.fileName)}</a>
                                (${formatFileSize(submission.fileSize)})
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                ${!hasSubmitted && !isOverdue ? `
                    <button onclick="openSubmissionModal('${task.id}', '${task.subjectId}')" class="login-btn" style="width: auto; padding: 8px 16px; background: #4ade80;">
                        <i class="fas fa-paper-plane"></i> Submit
                    </button>
                ` : hasSubmitted ? `
                    <button class="login-btn" style="width: auto; padding: 8px 16px; background: rgba(74, 222, 128, 0.3); color: #4ade80; cursor: default;">
                        <i class="fas fa-check"></i> Submitted
                    </button>
                ` : `
                    <button class="login-btn" style="width: auto; padding: 8px 16px; background: rgba(239, 68, 68, 0.3); color: #f87171; cursor: default;">
                        <i class="fas fa-times"></i> Closed
                    </button>
                `}
            </div>
        `;
    }

    // =========================
    // RENDER TASK FILES
    // =========================
    async function renderTaskFiles(taskId) {
        if (!isInstructor) return '';
        
        try {
            const filesQuery = query(collection(db, "taskFiles"), where("taskId", "==", taskId));
            const filesSnapshot = await getDocs(filesQuery);
            let files = [];
            filesSnapshot.forEach(doc => {
                files.push({ id: doc.id, ...doc.data() });
            });
            
            if (files.length === 0) return '';
            
            return `
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                    ${files.map(file => `
                        <a href="${file.fileURL}" target="_blank" style="display: flex; align-items: center; gap: 5px; padding: 4px 10px; background: rgba(59, 130, 246, 0.2); border-radius: 4px; font-size: 11px; color: #60a5fa; text-decoration: none;">
                            <i class="fas fa-file"></i> ${escapeHtml(file.fileName)}
                        </a>
                    `).join('')}
                </div>
            `;
        } catch (err) {
            console.error("Error loading files:", err);
            return '';
        }
    }

    // =========================
    // MODAL FUNCTIONS
    // =========================
    window.openTaskModal = function(subjectId) {
        document.getElementById('currentSubjectId').value = subjectId;
        addTaskModal.style.display = 'block';
    };

    window.openEditTaskModal = async function(taskId, subjectId) {
        try {
            const taskDoc = await getDoc(doc(db, "tasks", taskId));
            if (taskDoc.exists()) {
                const task = taskDoc.data();
                document.getElementById('editTaskId').value = taskId;
                document.getElementById('editTaskSubjectId').value = subjectId;
                document.getElementById('editTaskTitle').value = task.title || '';
                document.getElementById('editTaskDescription').value = task.description || '';
                
                const dueDate = task.dueDate?.toMillis?.() || new Date(task.dueDate);
                document.getElementById('editTaskDueDate').value = new Date(dueDate).toISOString().slice(0, 16);
                
                document.getElementById('editTaskMaxScore').value = task.maxScore || 100;
                
                if (document.getElementById('editTaskModal')) {
                    document.getElementById('editTaskModal').style.display = 'block';
                }
            }
        } catch (err) {
            console.error("Error loading task:", err);
            alert("Error loading task: " + err.message);
        }
    };

    window.openEditSubjectModal = function(subjectId) {
        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
            document.getElementById('editSubjectId').value = subjectId;
            document.getElementById('editSubjectName').value = subject.name || '';
            document.getElementById('editTeacherName').value = subject.teacher || '';
            document.getElementById('editSubjectTime').value = subject.time || '';
            document.getElementById('editSubjectDescription').value = subject.description || '';
            editModal.style.display = 'block';
        }
    };

    window.openSubmissionModal = function(taskId, subjectId) {
        document.getElementById('submitTaskId').value = taskId;
        document.getElementById('submitSubjectId').value = subjectId;
        submissionModal.style.display = 'block';
    };

    window.openUploadModal = function(subjectId, taskId) {
        document.getElementById('uploadSubjectId').value = subjectId;
        document.getElementById('uploadTaskId').value = taskId;
        if (uploadModal) {
            uploadModal.style.display = 'block';
        }
    };

    window.deleteSubject = async function(subjectId) {
        if (!confirm("Are you sure you want to delete this subject and all its tasks?")) return;

        try {
            await deleteDoc(doc(db, "subjects", subjectId));
            
            // Delete all tasks
            const tasksQuery = query(collection(db, "tasks"), where("subjectId", "==", subjectId));
            const tasksSnapshot = await getDocs(tasksQuery);
            for (const taskDoc of tasksSnapshot.docs) {
                await deleteDoc(doc(db, "tasks", taskDoc.id));
            }
            
            subjects = subjects.filter(s => s.id !== subjectId);
            stopRealtime();
            renderSubjects();
            detailsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>Select a subject from the list to view details.</p>
                </div>
            `;
        } catch (err) {
            console.error("Error deleting subject:", err);
            alert("Error deleting subject: " + err.message);
        }
    };

    window.deleteTask = async function(subjectId, taskId) {
        if (!confirm("Are you sure you want to delete this task?")) return;

        try {
            await deleteDoc(doc(db, "tasks", taskId));
            renderSubjectDetails(currentSubjectIndex);
        } catch (err) {
            console.error("Error deleting task:", err);
            alert("Error deleting task: " + err.message);
        }
    };

    // =========================
    // FILE UPLOAD TO SUPABASE
    // =========================
    async function uploadFile(file, path) {
        if (!supabase) {
            throw new Error("Supabase not configured");
        }
        
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
        }

        const { data, error } = await supabase.storage
            .from('task-files')
            .upload(path, file);
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
            .from('task-files')
            .getPublicUrl(path);
        
        return urlData.publicUrl;
    }

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
    // EDIT SUBJECT (FORM)
    // =========================
    editForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const subjectId = document.getElementById('editSubjectId').value;

        try {
            await updateDoc(doc(db, "subjects", subjectId), {
                name: document.getElementById('editSubjectName').value.trim(),
                teacher: document.getElementById('editTeacherName').value.trim(),
                time: document.getElementById('editSubjectTime').value.trim(),
                description: document.getElementById('editSubjectDescription').value.trim(),
                updatedAt: serverTimestamp()
            });

            const index = subjects.findIndex(s => s.id === subjectId);
            if (index !== -1) {
                subjects[index] = {
                    ...subjects[index],
                    name: document.getElementById('editSubjectName').value.trim(),
                    teacher: document.getElementById('editTeacherName').value.trim(),
                    time: document.getElementById('editSubjectTime').value.trim(),
                    description: document.getElementById('editSubjectDescription').value.trim()
                };
            }

            renderSubjects();
            if (currentSubjectIndex !== null) {
                renderSubjectDetails(currentSubjectIndex);
            }
            editForm.reset();
            editModal.style.display = 'none';
        } catch (err) {
            console.error("Error updating subject:", err);
            alert("Error updating subject: " + err.message);
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
            maxScore: parseInt(document.getElementById('newTaskMaxScore').value) || 100,
            subjectId: document.getElementById('currentSubjectId').value,
            createdAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "tasks"), task);
            if (currentSubjectIndex !== null) {
                renderSubjectDetails(currentSubjectIndex);
            }
            addTaskForm.reset();
            addTaskModal.style.display = 'none';
        } catch (err) {
            console.error("Error adding task:", err);
            alert("Error adding task: " + err.message);
        }
    });

    // =========================
    // EDIT TASK (FORM)
    // =========================
    const editTaskForm = document.getElementById('editTaskForm');
    editTaskForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const taskId = document.getElementById('editTaskId').value;
        const subjectId = document.getElementById('editTaskSubjectId').value;

        try {
            await updateDoc(doc(db, "tasks", taskId), {
                title: document.getElementById('editTaskTitle').value.trim(),
                description: document.getElementById('editTaskDescription').value.trim(),
                dueDate: new Date(document.getElementById('editTaskDueDate').value),
                maxScore: parseInt(document.getElementById('editTaskMaxScore').value) || 100,
                updatedAt: serverTimestamp()
            });

            if (currentSubjectIndex !== null) {
                renderSubjectDetails(currentSubjectIndex);
            }
            editTaskForm.reset();
            if (document.getElementById('editTaskModal')) {
                document.getElementById('editTaskModal').style.display = 'none';
            }
        } catch (err) {
            console.error("Error updating task:", err);
            alert("Error updating task: " + err.message);
        }
    });

    // =========================
    // UPLOAD FILE (FORM)
    // =========================
    uploadForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById('uploadFile');
        const subjectId = document.getElementById('uploadSubjectId').value;
        const taskId = document.getElementById('uploadTaskId').value;

        if (!fileInput.files.length) {
            alert('Please select a file');
            return;
        }

        const file = fileInput.files[0];

        if (file.size > MAX_FILE_SIZE) {
            alert(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
            return;
        }

        try {
            const filePath = `task-files/${subjectId}/${taskId}/${Date.now()}_${file.name}`;
            const fileURL = await uploadFile(file, filePath);

            await addDoc(collection(db, "taskFiles"), {
                taskId: taskId,
                subjectId: subjectId,
                fileName: file.name,
                fileURL: fileURL,
                filePath: filePath,
                fileSize: file.size,
                uploadedBy: userData.name,
                uploadedAt: serverTimestamp()
            });

            alert('File uploaded successfully!');
            uploadForm.reset();
            if (uploadModal) {
                uploadModal.style.display = 'none';
            }
            renderSubjectDetails(currentSubjectIndex);
        } catch (err) {
            console.error("Error uploading file:", err);
            alert("Error uploading file: " + err.message);
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
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                
                if (file.size > MAX_FILE_SIZE) {
                    alert(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
                    return;
                }

                const filePath = `submissions/${subjectId}/${taskId}/${userData.id}/${Date.now()}_${file.name}`;
                const fileURL = await uploadFile(file, filePath);
                
                submission.fileURL = fileURL;
                submission.fileName = file.name;
                submission.fileSize = file.size;
            }

            await addDoc(collection(db, "submissions"), submission);
            
            alert('Submission successful!');
            submissionForm.reset();
            submissionModal.style.display = 'none';
            renderSubjectDetails(currentSubjectIndex);
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

    // Cleanup on page unload
    window.addEventListener('beforeunload', stopRealtime);

    // Initial Load
    await loadSubjects();
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
