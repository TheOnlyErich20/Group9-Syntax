// =========================
// SUBJECTS PAGE FUNCTIONALITY
// =========================
// Import Firebase functions
import { db } from './firebase.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async function() {
    const listContainer = document.getElementById('subjectsList');
    const detailsContainer = document.getElementById('subjectDetailsPanel');
    const addBtn = document.getElementById('addSubjectBtn');
    const addModal = document.getElementById('addSubjectModal');
    const addForm = document.getElementById('addSubjectForm');
    const subjectsGrid = document.getElementById('subjectsGrid');

    // Get current user role
    const userData = JSON.parse(localStorage.getItem("userData"));
    const isInstructor = userData?.role === 'instructor';

    // Show/hide add button based on role
    if (addBtn) {
        addBtn.style.display = isInstructor ? 'flex' : 'none';
    }

    let subjects = [];
    let tasks = [];

    // =========================
    // LOAD SUBJECTS FROM FIRESTORE
    // =========================
    async function loadSubjects() {
        if (!subjectsGrid) {
            // Fallback to list view if subjectsGrid doesn't exist
            if (!listContainer || !detailsContainer) return;
            return loadSubjectsListView();
        }

        try {
            const subjectsQuery = await getDocs(collection(db, "subjects"));
            subjectsQuery.forEach(doc => {
                const data = doc.data();
                subjects.push({ id: doc.id, ...data });
            });

            // Load tasks
            const tasksQuery = await getDocs(collection(db, "tasks"));
            tasksQuery.forEach(doc => {
                tasks.push({ id: doc.id, ...doc.data() });
            });

            renderSubjectsGrid();
        } catch (err) {
            console.error("Error loading data:", err);
            renderErrorState();
        }
    }

    // =========================
    // RENDER SUBJECTS (GRID VIEW)
    // =========================
    function renderSubjectsGrid() {
        if (!subjectsGrid) return;

        subjectsGrid.innerHTML = '';

        if (subjects.length === 0) {
            subjectsGrid.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #aaa; grid-column: 1 / -1;">
                    <i class="fas fa-book-open" style="font-size: 48px; margin-bottom: 20px;"></i>
                    <p style="font-size: 18px;">No subjects available yet.</p>
                    ${isInstructor ? '<button class="btn-primary" onclick="addSubject()" style="margin-top: 20px;"><i class="fas fa-plus"></i> Add Your First Subject</button>' : ''}
                </div>
            `;
            return;
        }

        subjects.forEach(sub => {
            const subjectTasks = tasks.filter(t => t.subjectId === sub.id);
            const card = document.createElement('div');
            card.className = 'subject-card';
            card.innerHTML = `
                <div class="subject-info">
                    <h3><i class="fas fa-book"></i> ${escapeHtml(sub.name)}</h3>
                    <p class="teacher"><i class="fas fa-chalkboard-teacher"></i> ${escapeHtml(sub.teacher || 'TBA')}</p>
                    <p class="time"><i class="fas fa-clock"></i> ${escapeHtml(sub.time || 'TBA')}</p>
                    ${sub.description ? `<p class="description"><i class="fas fa-info-circle"></i> ${escapeHtml(sub.description)}</p>` : ''}
                </div>
                <div class="subject-actions">
                    <button class="btn-view" onclick="viewSubject('${sub.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${isInstructor ? `
                        <button class="btn-add-task" onclick="openTaskModal('${sub.id}', '${escapeHtml(sub.name)}')">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                        <button class="btn-upload" onclick="openFileUploadModal('${sub.id}', '', 'subject')">
                            <i class="fas fa-cloud-upload-alt"></i> Upload
                        </button>
                    ` : ''}
                </div>
                <div class="tasks-section" id="tasks-${sub.id}">
                    <!-- Tasks will be loaded here -->
                </div>
            `;
            subjectsGrid.appendChild(card);

            // Load tasks for this subject
            loadTasks(sub.id, sub.name);
        });
    }

    // =========================
    // LOAD TASKS FOR SUBJECT
    // =========================
    async function loadTasks(subjectId, subjectName) {
        const tasksSection = document.getElementById(`tasks-${subjectId}`);
        if (!tasksSection) return;

        const subjectTasks = tasks.filter(t => t.subjectId === subjectId);

        if (subjectTasks.length === 0) return;

        const tasksList = document.createElement('div');
        tasksList.className = 'tasks-list';
        tasksList.innerHTML = '<h4><i class="fas fa-tasks"></i> Tasks</h4>';

        subjectTasks.forEach(task => {
            const dueDate = task.dueDate?.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
            const now = new Date();
            const isOverdue = dueDate < now;
            const priorityClass = task.priority === 'high' ? 'priority-high' : task.priority === 'medium' ? 'priority-medium' : 'priority-low';

            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${isOverdue ? 'overdue' : ''}`;
            taskItem.innerHTML = `
                <div class="task-header">
                    <span class="task-title">${escapeHtml(task.title)}</span>
                    <span class="task-priority ${priorityClass}">${capitalizeFirst(task.priority)}</span>
                </div>
                ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    <span class="due-date ${isOverdue ? 'overdue' : ''}">
                        <i class="fas fa-calendar"></i> Due: ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
                <div class="task-actions">
                    ${!isInstructor ? `
                        <button class="btn-submit" onclick="openSubmissionModal('${task.id}', '${subjectId}')">
                            <i class="fas fa-paper-plane"></i> Submit
                        </button>
                    ` : `
                        <button class="btn-upload" onclick="openFileUploadModal('${subjectId}', '${task.id}', 'task')">
                            <i class="fas fa-cloud-upload-alt"></i> Upload Material
                        </button>
                    `}
                </div>
            `;
            tasksList.appendChild(taskItem);
        });

        tasksSection.appendChild(tasksList);
    }

    // =========================
    // FALLBACK: LIST VIEW (if subjectsGrid doesn't exist)
    // =========================
    async function loadSubjectsListView() {
        if (!listContainer || !detailsContainer) return;

        try {
            const subjectsQuery = await getDocs(collection(db, "subjects"));
            subjectsQuery.forEach(doc => {
                const data = doc.data();
                subjects.push({ id: doc.id, ...data });
            });

            const tasksQuery = await getDocs(collection(db, "tasks"));
            tasksQuery.forEach(doc => {
                tasks.push({ id: doc.id, ...doc.data() });
            });

            renderSubjects();
        } catch (err) {
            console.error("Error loading data:", err);
            // Fallback data
            subjects = [
                { id: "demo1", name: "Mathematics", teacher: "Mr. Anderson", time: "08:00 AM - 09:30 AM", description: "Advanced Calculus" },
                { id: "demo2", name: "Physics", teacher: "Ms. Curie", time: "10:00 AM - 11:30 AM", description: "Fundamentals of Physics" }
            ];
            tasks = [
                { id: "t1", title: "Assignment 1", description: "Chapter 1 exercises", dueDate: new Date(Date.now() + 86400000), maxScore: 100, subjectId: "demo1" },
                { id: "t2", title: "Quiz 1", description: "Quick quiz", dueDate: new Date(Date.now() + 172800000), maxScore: 50, subjectId: "demo1" }
            ];
            renderSubjects();
        }
    }

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
                <h4>${sub.name}</h4>
                <p><i class="fas fa-chalkboard-teacher"></i> ${sub.teacher || 'TBA'}</p>
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

    function renderSubjectDetails(index) {
        const sub = subjects[index];
        if (!sub) return;

        const subjectTasks = tasks.filter(t => t.subjectId === sub.id);

        if (isInstructor) {
            detailsContainer.innerHTML = `
                <div class="detail-header">
                    <h2>${sub.name}</h2>
                    <div class="detail-meta">
                        <span><i class="fas fa-chalkboard-teacher"></i> ${sub.teacher || 'TBA'}</span>
                        <span><i class="fas fa-clock"></i> ${sub.time || 'TBA'}</span>
                    </div>
                    <p class="detail-description">${sub.description || 'No description available.'}</p>
                </div>

                <div class="tasks-section" style="margin-top: 20px;">
                    <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <i class="fas fa-tasks"></i> Tasks & Assignments
                        <button onclick="openTaskModal('${sub.id}')" class="btn-add-mini" title="Add Task">
                            <i class="fas fa-plus"></i>
                        </button>
                    </h3>
                    <div class="tasks-list" id="tasksList">
                        ${subjectTasks.length > 0 ? subjectTasks.map(task => `
                            <div class="task-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px;">
                                <div>
                                    <h4 style="margin: 0 0 5px;">${task.title}</h4>
                                    <p style="font-size: 12px; color: #aaa; margin: 0;">
                                        <i class="fas fa-clock"></i> Due: ${new Date(task.dueDate).toLocaleDateString()}
                                        <span style="margin-left: 10px;"><i class="fas fa-star"></i> ${task.maxScore} pts</span>
                                    </p>
                                </div>
                                <div class="task-actions" style="display: flex; gap: 8px;">
                                    <button onclick="openTaskModal('${sub.id}', '${task.id}')" class="btn-action" title="Edit" style="background: rgba(59, 130, 246, 0.2); border: none; padding: 8px 12px; border-radius: 6px; color: #60a5fa; cursor: pointer;">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteTask('${sub.id}', '${task.id}')" class="btn-action" title="Delete" style="background: rgba(239, 68, 68, 0.2); border: none; padding: 8px 12px; border-radius: 6px; color: #f87171; cursor: pointer;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<p style="color: #aaa;">No tasks yet. Click + to add one.</p>'}
                    </div>
                </div>

                <div class="upload-section" style="margin-top: 25px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                    <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <i class="fas fa-cloud-upload-alt"></i> Upload Materials
                    </h3>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="openUploadModal('${sub.id}')" class="login-btn" style="width: auto; padding: 10px 20px;">
                            <i class="fas fa-file-upload"></i> Upload File
                        </button>
                    </div>
                    <p style="font-size: 12px; color: #aaa; margin-top: 10px;">
                        Supported: PDF, DOC, DOCX, PPT, PPTX, Images, Videos (Max 50MB)
                    </p>
                </div>
            `;
        } else {
            detailsContainer.innerHTML = `
                <div class="detail-header">
                    <h2>${sub.name}</h2>
                    <div class="detail-meta">
                        <span><i class="fas fa-chalkboard-teacher"></i> ${sub.teacher || 'TBA'}</span>
                        <span><i class="fas fa-clock"></i> ${sub.time || 'TBA'}</span>
                    </div>
                    <p class="detail-description">${sub.description || 'No description available.'}</p>
                </div>

                <div class="lessons-section" style="margin-top: 20px;">
                    <h3 style="margin-bottom: 15px;"><i class="fas fa-list-ul"></i> Lessons</h3>
                    <div class="lessons-list">
                        ${[
                            { title: "Introduction", duration: "45 mins", status: "Completed" },
                            { title: "Chapter 1", duration: "1 hr 20 mins", status: "In Progress" },
                            { title: "Chapter 2", duration: "55 mins", status: "Locked" }
                        ].map(lesson => `
                            <div class="lesson-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px;">
                                <div>
                                    <h4 style="margin: 0 0 5px;">${lesson.title}</h4>
                                    <p style="font-size: 12px; color: #aaa; margin: 0;">
                                        <i class="fas fa-clock"></i> ${lesson.duration} • ${lesson.status}
                                    </p>
                                </div>
                                <button class="btn-start-lesson" style="background: ${lesson.status === 'Locked' ? 'rgba(255,255,255,0.1)' : 'var(--accent)'}; border: none; padding: 8px 16px; border-radius: 6px; color: #fff; cursor: ${lesson.status === 'Locked' ? 'not-allowed' : 'pointer'};">
                                    ${lesson.status === 'Locked' ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-play"></i> Start'}
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="assignments-section" style="margin-top: 25px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                    <h3 style="margin-bottom: 15px;"><i class="fas fa-tasks"></i> Your Assignments</h3>
                    <div class="assignments-list">
                        ${subjectTasks.length > 0 ? subjectTasks.map(task => `
                            <div class="assignment-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px;">
                                <div>
                                    <h4 style="margin: 0 0 5px;">${task.title}</h4>
                                    <p style="font-size: 12px; color: #aaa; margin: 0;">
                                        <i class="fas fa-clock"></i> Due: ${new Date(task.dueDate).toLocaleDateString()}
                                        <span style="margin-left: 10px;"><i class="fas fa-star"></i> ${task.maxScore} pts</span>
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
    // TASK MANAGEMENT
    // =========================
    const taskForm = document.getElementById('addTaskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const taskId = document.getElementById('editTaskId')?.value;
            const taskData = {
                title: document.getElementById('taskTitle')?.value,
                description: document.getElementById('taskDescription')?.value,
                dueDate: new Date(document.getElementById('taskDueDate')?.value),
                maxScore: parseInt(document.getElementById('taskMaxScore')?.value) || 100,
                subjectId: document.getElementById('currentSubjectId')?.value || ''
            };

            if (!taskData.title || !taskData.dueDate || !taskData.subjectId) {
                alert('Please fill in all required fields');
                return;
            }

            try {
                if (taskId) {
                    await updateDoc(doc(db, "tasks", taskId), taskData);
                    const idx = tasks.findIndex(t => t.id === taskId);
                    if (idx !== -1) tasks[idx] = { ...tasks[idx], ...taskData };
                } else {
                    const taskRef = await addDoc(collection(db, "tasks"), {
                        ...taskData,
                        instructorId: userData.id,
                        createdAt: serverTimestamp()
                    });
                    tasks.push({ id: taskRef.id, ...taskData, status: "open" });
                }

                closeTaskModal();
                location.reload();
            } catch (err) {
                console.error("Error saving task:", err);
                alert("Error saving task: " + err.message);
            }
        });
    }

    // =========================
    // DELETE TASK
    // =========================
    window.deleteTask = async function(subjectId, taskId) {
        if (!confirm("Are you sure you want to delete this task?")) return;

        try {
            await deleteDoc(doc(db, "tasks", taskId));
            tasks = tasks.filter(t => t.id !== taskId);
            location.reload();
        } catch (err) {
            console.error("Error deleting task:", err);
            alert("Error deleting task: " + err.message);
        }
    };

    // =========================
    // FILE UPLOAD
    // =========================
    const uploadForm = document.getElementById('fileUploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('fileToUpload');
            const file = fileInput.files[0];
            if (!file) {
                alert("Please select a file");
                return;
            }

            if (file.size > 50 * 1024 * 1024) {
                alert("File size must be less than 50MB");
                return;
            }

            const subjectId = document.getElementById('uploadSubjectId')?.value;
            const taskId = document.getElementById('uploadTaskId')?.value;
            const uploadType = document.getElementById('uploadType')?.value;
            const fileDescription = document.getElementById('fileDescription')?.value;

            try {
                await addDoc(collection(db, "files"), {
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    description: fileDescription,
                    subjectId: subjectId,
                    taskId: taskId || null,
                    uploadType: uploadType,
                    uploadedBy: userData.name,
                    uploadedById: userData.id,
                    uploadedAt: serverTimestamp()
                });

                alert("File uploaded successfully!");
                closeFileUploadModal();
                uploadForm.reset();
                location.reload();
            } catch (err) {
                console.error("Error saving file:", err);
                alert("Error saving file: " + err.message);
            }
        });
    }

    // =========================
    // SUBMISSION
    // =========================
    const submissionForm = document.getElementById('submissionForm');
    if (submissionForm) {
        submissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submissionText = document.getElementById('submissionText')?.value.trim();
            const fileInput = document.getElementById('submissionFile');
            const taskId = document.getElementById('submitTaskId')?.value;
            const subjectId = document.getElementById('submitSubjectId')?.value;

            if (!submissionText && fileInput.files.length === 0) {
                alert('Please provide a text answer or attach a file');
                return;
            }

            const submissionData = {
                taskId: taskId,
                subjectId: subjectId,
                studentId: userData.id,
                studentName: userData.name,
                answer: submissionText,
                submittedAt: serverTimestamp(),
                status: "submitted"
            };

            try {
                await addDoc(collection(db, "submissions"), submissionData);
                alert("Assignment submitted successfully!");
                closeSubmissionModal();
                submissionForm.reset();
                location.reload();
            } catch (err) {
                console.error("Error submitting:", err);
                alert("Error submitting: " + err.message);
            }
        });
    }

    // =========================
    // GLOBAL MODAL FUNCTIONS (must be global for onclick handlers)
    // =========================
    window.openTaskModal = function(subjectId, subjectName) {
        document.getElementById('currentSubjectId').value = subjectId;
        document.getElementById('currentSubjectName').value = subjectName;
        document.getElementById('addTaskModal').style.display = 'block';
    };

    window.closeTaskModal = function() {
        document.getElementById('addTaskModal').style.display = 'none';
    };

    window.openFileUploadModal = function(subjectId, taskId = '', type = 'subject') {
        document.getElementById('uploadSubjectId').value = subjectId;
        document.getElementById('uploadTaskId').value = taskId;
        document.getElementById('uploadType').value = type;
        document.getElementById('fileUploadModal').style.display = 'block';
    };

    window.closeFileUploadModal = function() {
        document.getElementById('fileUploadModal').style.display = 'none';
    };

    window.openSubmissionModal = function(taskId, subjectId) {
        document.getElementById('submitTaskId').value = taskId;
        document.getElementById('submitSubjectId').value = subjectId;
        document.getElementById('submissionModal').style.display = 'block';
    };

    window.closeSubmissionModal = function() {
        document.getElementById('submissionModal').style.display = 'none';
    };

    window.closeModal = function(modalId) {
        document.getElementById(modalId).style.display = 'none';
    };

    window.addSubject = function() {
        document.getElementById('addSubjectModal').style.display = 'block';
    };

    window.viewSubject = function(subjectId) {
        window.location.href = `Subjects.html?id=${subjectId}`;
    };

    // =========================
    // ADD SUBJECT BUTTON HANDLER
    // =========================
    function initAddSubjectBtn() {
        const btn = document.getElementById('addSubjectBtn');
        const modal = document.getElementById('addSubjectModal');
        
        if (btn && modal) {
            btn.addEventListener('click', () => {
                modal.style.display = 'block';
            });
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Close button handlers for all modals
        document.querySelectorAll('.modal .close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').style.display = 'none';
            });
        });
    }

    // =========================
    // ADD SUBJECT FORM
    // =========================
    function initAddSubjectForm() {
        const form = document.getElementById('addSubjectForm');
        const modal = document.getElementById('addSubjectModal');
        
        if (!form || !modal) {
            console.log('Add Subject form or modal not found');
            return;
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Add Subject form submitted');
            
            const name = document.getElementById('newSubjectName')?.value?.trim();
            const teacher = document.getElementById('newTeacherName')?.value?.trim();
            const time = document.getElementById('newSubjectTime')?.value?.trim();
            const description = document.getElementById('newSubjectDescription')?.value?.trim();
            
            if (!name || !teacher || !time) {
                alert('Please fill in all required fields');
                return;
            }
            
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (!userData?.id) {
                alert('User not logged in. Please log in first.');
                return;
            }
            
            const subjectData = {
                name: name,
                teacher: teacher,
                time: time,
                description: description,
                instructorId: userData.id,
                instructorName: userData.name,
                createdAt: serverTimestamp()
            };
            
            console.log('Saving subject:', subjectData);
            
            try {
                const subjectRef = await addDoc(collection(db, 'subjects'), subjectData);
                console.log('Subject saved with ID:', subjectRef.id);
                
                alert('Subject added successfully!');
                form.reset();
                modal.style.display = 'none';
                location.reload();
            } catch (err) {
                console.error('Error adding subject:', err);
                alert('Error adding subject: ' + err.message);
            }
        });
    }

    // =========================
    // HELPER FUNCTIONS
    // =========================
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function renderErrorState() {
        if (subjectsGrid) {
            subjectsGrid.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #f87171; grid-column: 1 / -1;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                    <p style="font-size: 18px;">Error loading subjects. Please try again.</p>
                </div>
            `;
        }
    }

    // =========================
    // INITIALIZE PAGE
    // =========================
    initAddSubjectBtn();
    initAddSubjectForm();

    // Load subjects (will use grid or list view depending on available elements)
    await loadSubjects();
});
