// =========================
// IMPORT FROM EXISTING MODULES
// =========================

// Import Firebase functions from firebase.js
import { 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    where, 
    doc, 
    updateDoc, 
    deleteDoc, 
    getDoc,
    serverTimestamp 
} from './firebase.js';

// Supabase is already loaded globally from supabase.js
const supabase = window.supabase.createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.anonKey
);

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

// =========================
// MODAL FUNCTIONS
// =========================

window.openTaskModal = function(subjectId, subjectName) {
    document.getElementById('currentSubjectId').value = subjectId;
    document.getElementById('currentSubjectName').value = subjectName;
    document.getElementById('addTaskModal').style.display = 'block';
};

window.openEditTaskModal = function(taskId, subjectId) {
    loadTaskForEdit(taskId, subjectId);
};

window.openFileUploadModal = function(subjectId, taskId = '', type = 'subject') {
    document.getElementById('uploadSubjectId').value = subjectId;
    document.getElementById('uploadTaskId').value = taskId;
    document.getElementById('uploadType').value = type;
    document.getElementById('fileUploadModal').style.display = 'block';
};

window.openSubmissionModal = function(taskId, subjectId) {
    document.getElementById('submitTaskId').value = taskId;
    document.getElementById('submitSubjectId').value = subjectId;
    document.getElementById('submissionModal').style.display = 'block';
};

window.openViewSubmissionsModal = function(taskId, subjectId) {
    loadSubmissions(taskId, subjectId);
};

window.openEditSubjectModal = function(subjectId) {
    loadSubjectForEdit(subjectId);
};

window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
};

window.deleteSubject = async function(subjectId) {
    if (!confirm("Are you sure you want to delete this subject? All tasks and files will also be deleted.")) return;
    
    try {
        await deleteDoc(doc(db, 'subjects', subjectId));
        
        const tasksQuery = query(collection(db, 'tasks'), where('subjectId', '==', subjectId));
        const tasksSnapshot = await getDocs(tasksQuery);
        for (const taskDoc of tasksSnapshot.docs) {
            await deleteDoc(doc(db, 'tasks', taskDoc.id));
        }
        
        alert('Subject deleted successfully!');
        loadSubjects();
    } catch (err) {
        console.error('Error deleting subject:', err);
        alert('Error deleting subject: ' + err.message);
    }
};

window.deleteTask = async function(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
        await deleteDoc(doc(db, 'tasks', taskId));
        alert('Task deleted successfully!');
        loadSubjects();
    } catch (err) {
        console.error('Error deleting task:', err);
        alert('Error deleting task: ' + err.message);
    }
};

// =========================
// LOAD DATA FUNCTIONS
// =========================

async function loadSubjectForEdit(subjectId) {
    try {
        const docRef = doc(db, 'subjects', subjectId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const subject = docSnap.data();
            document.getElementById('editSubjectId').value = subjectId;
            document.getElementById('editSubjectName').value = subject.name;
            document.getElementById('editTeacherName').value = subject.teacher;
            document.getElementById('editSubjectTime').value = subject.time;
            document.getElementById('editSubjectDescription').value = subject.description || '';
            document.getElementById('editSubjectModal').style.display = 'block';
        }
    } catch (err) {
        console.error('Error loading subject:', err);
        alert('Error loading subject: ' + err.message);
    }
}

async function loadTaskForEdit(taskId, subjectId) {
    try {
        const docRef = doc(db, 'tasks', taskId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const task = docSnap.data();
            document.getElementById('editTaskId').value = taskId;
            document.getElementById('editTaskSubjectId').value = subjectId;
            document.getElementById('editTaskTitle').value = task.title;
            document.getElementById('editTaskDescription').value = task.description || '';
            
            const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
            document.getElementById('editTaskDueDate').value = dueDate.toISOString().slice(0, 16);
            
            document.getElementById('editTaskPriority').value = task.priority || 'medium';
            document.getElementById('editTaskMaxScore').value = task.maxScore || 100;
            
            document.getElementById('editTaskModal').style.display = 'block';
        }
    } catch (err) {
        console.error('Error loading task:', err);
        alert('Error loading task: ' + err.message);
    }
}

async function loadSubmissions(taskId, subjectId) {
    const submissionsList = document.getElementById('submissionsList');
    submissionsList.innerHTML = '<p>Loading submissions...</p>';
    document.getElementById('viewSubmissionsModal').style.display = 'block';
    
    try {
        const q = query(
            collection(db, 'submissions'),
            where('taskId', '==', taskId),
            orderBy('submittedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            submissionsList.innerHTML = '<p>No submissions yet.</p>';
            return;
        }
        
        let html = '<div style="max-height: 400px; overflow-y: auto;">';
        snapshot.forEach(doc => {
            const submission = doc.data();
            const submittedAt = submission.submittedAt.toDate ? submission.submittedAt.toDate() : new Date(submission.submittedAt);
            
            html += `
                <div style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px;">
                    <h4 style="margin: 0 0 5px;">${escapeHtml(submission.studentName)}</h4>
                    <p style="font-size: 12px; color: #aaa; margin: 0 0 10px;">
                        <i class="fas fa-clock"></i> ${submittedAt.toLocaleString()}
                    </p>
                    <p style="margin: 0 0 10px;">${escapeHtml(submission.answer) || 'No text answer'}</p>
                    ${submission.fileURL ? `
                        <a href="${submission.fileURL}" target="_blank" style="color: #60a5fa;">
                            <i class="fas fa-file"></i> ${escapeHtml(submission.fileName)}
                        </a>
                    ` : ''}
                </div>
            `;
        });
        html += '</div>';
        submissionsList.innerHTML = html;
    } catch (err) {
        console.error('Error loading submissions:', err);
        submissionsList.innerHTML = '<p>Error loading submissions: ' + err.message + '</p>';
    }
}

async function loadTasksForSubject(subjectId) {
    try {
        const q = query(
            collection(db, 'tasks'),
            where('subjectId', '==', subjectId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (err) {
        console.error('Error loading tasks:', err);
        return [];
    }
}

function createTaskItem(task, subjectId, isInstructor) {
    const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    const now = new Date();
    const isOverdue = dueDate < now;
    const priorityClass = task.priority === 'high' ? 'priority-high' : task.priority === 'medium' ? 'priority-medium' : 'priority-low';
    
    return `
        <div class="task-item">
            <div class="task-header">
                <span class="task-title">${escapeHtml(task.title)}</span>
                <span class="task-priority ${priorityClass}">${capitalizeFirst(task.priority)}</span>
            </div>
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
            <div class="task-meta">
                <span class="due-date ${isOverdue ? 'overdue' : ''}">
                    <i class="fas fa-calendar"></i> Due: ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                <span class="max-score">
                    <i class="fas fa-star"></i> ${task.maxScore || 100} pts
                </span>
            </div>
            <div class="task-actions">
                ${isInstructor ? `
                    <button class="btn-action" onclick="openEditTaskModal('${task.id}', '${subjectId}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteTask('${task.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-upload" onclick="openFileUploadModal('${subjectId}', '${task.id}', 'task')">
                        <i class="fas fa-cloud-upload-alt"></i> Upload Material
                    </button>
                    <button class="btn-view" onclick="openViewSubmissionsModal('${task.id}', '${subjectId}')">
                        <i class="fas fa-users"></i> Submissions
                    </button>
                ` : `
                    <button class="btn-submit" onclick="openSubmissionModal('${task.id}', '${subjectId}')">
                        <i class="fas fa-paper-plane"></i> Submit
                    </button>
                `}
            </div>
        </div>
    `;
}

async function createSubjectCard(subjectId, subject, userData) {
    const card = document.createElement('div');
    card.className = 'subject-card';
    const isInstructor = userData.role === 'instructor';
    
    const tasks = await loadTasksForSubject(subjectId);
    
    card.innerHTML = `
        <div class="subject-info">
            <div class="subject-header-row">
                <h3><i class="fas fa-book"></i> ${escapeHtml(subject.name)}</h3>
                ${isInstructor ? `
                    <div class="subject-actions-row">
                        <button class="btn-action" onclick="openEditSubjectModal('${subjectId}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteSubject('${subjectId}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
            <p class="teacher"><i class="fas fa-chalkboard-teacher"></i> ${escapeHtml(subject.teacher)}</p>
            <p class="time"><i class="fas fa-clock"></i> ${escapeHtml(subject.time)}</p>
            ${subject.description ? `<p class="description"><i class="fas fa-info-circle"></i> ${escapeHtml(subject.description)}</p>` : ''}
        </div>
        <div class="subject-actions">
            ${isInstructor ? `
                <button class="btn-add-task" onclick="openTaskModal('${subjectId}', '${escapeHtml(subject.name)}')">
                    <i class="fas fa-plus"></i> Add Task
                </button>
                <button class="btn-upload" onclick="openFileUploadModal('${subjectId}', '', 'subject')">
                    <i class="fas fa-cloud-upload-alt"></i> Upload
                </button>
            ` : ''}
        </div>
        <div class="tasks-section" id="tasks-${subjectId}">
            ${tasks.length > 0 ? `
                <h4><i class="fas fa-tasks"></i> Tasks</h4>
                <div class="tasks-list">
                    ${tasks.map(task => createTaskItem(task, subjectId, isInstructor)).join('')}
                </div>
            ` : '<p class="no-tasks">No tasks yet.</p>'}
        </div>
    `;
    
    return card;
}

async function loadSubjects() {
    const subjectsGrid = document.getElementById('subjectsGrid');
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const isInstructor = userData.role === 'instructor';
    
    if (addSubjectBtn) {
        addSubjectBtn.style.display = isInstructor ? 'flex' : 'none';
    }
    
    if (!subjectsGrid) return;
    
    subjectsGrid.innerHTML = '<p>Loading subjects...</p>';
    
    try {
        let q;
        if (isInstructor) {
            q = query(
                collection(db, 'subjects'),
                where('instructorId', '==', userData.id),
                orderBy('createdAt', 'desc')
            );
        } else {
            q = query(collection(db, 'subjects'), orderBy('createdAt', 'desc'));
        }
        
        const snapshot = await getDocs(q);
        
        subjectsGrid.innerHTML = '';
        
        if (snapshot.empty) {
            subjectsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>${isInstructor ? 'No subjects yet. Click + Add Subject to create one.' : 'No subjects available.'}</p>
                </div>
            `;
            return;
        }
        
        for (const subjectDoc of snapshot.docs) {
            const subject = subjectDoc.data();
            const subjectCard = await createSubjectCard(subjectDoc.id, subject, userData);
            subjectsGrid.appendChild(subjectCard);
        }
    } catch (err) {
        console.error('Error loading subjects:', err);
        subjectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading subjects. Please try again.</p>
                <p style="font-size: 12px; color: #aaa;">${err.message}</p>
            </div>
        `;
    }
}

// =========================
// FORM HANDLERS
// =========================

async function initAddSubjectForm() {
    const form = document.getElementById('addSubjectForm');
    const modal = document.getElementById('addSubjectModal');
    const addBtn = document.getElementById('addSubjectBtn');
    
    if (!form || !modal) return;
    
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            modal.style.display = 'block';
        });
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('newSubjectName').value.trim();
        const teacher = document.getElementById('newTeacherName').value.trim();
        const time = document.getElementById('newSubjectTime').value.trim();
        const description = document.getElementById('newSubjectDescription').value.trim();
        
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (!name || !teacher || !time) {
            alert('Please fill in all required fields');
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
        
        try {
            const docRef = await addDoc(collection(db, 'subjects'), subjectData);
            alert('Subject added successfully!');
            form.reset();
            modal.style.display = 'none';
            loadSubjects();
        } catch (err) {
            console.error('Error adding subject:', err);
            alert('Error adding subject: ' + err.message);
        }
    });
}

async function initEditSubjectForm() {
    const form = document.getElementById('editSubjectForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const subjectId = document.getElementById('editSubjectId').value;
        const name = document.getElementById('editSubjectName').value.trim();
        const teacher = document.getElementById('editTeacherName').value.trim();
        const time = document.getElementById('editSubjectTime').value.trim();
        const description = document.getElementById('editSubjectDescription').value.trim();
        
        try {
            await updateDoc(doc(db, 'subjects', subjectId), {
                name: name,
                teacher: teacher,
                time: time,
                description: description,
                updatedAt: serverTimestamp()
            });
            
            alert('Subject updated successfully!');
            document.getElementById('editSubjectModal').style.display = 'none';
            loadSubjects();
        } catch (err) {
            console.error('Error updating subject:', err);
            alert('Error updating subject: ' + err.message);
        }
    });
}

async function initAddTaskForm() {
    const form = document.getElementById('addTaskForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('newTaskTitle').value.trim();
        const description = document.getElementById('newTaskDescription').value.trim();
        const dueDate = document.getElementById('newTaskDueDate').value;
        const priority = document.getElementById('newTaskPriority').value;
        const maxScore = document.getElementById('newTaskMaxScore').value;
        const subjectId = document.getElementById('currentSubjectId').value;
        const subjectName = document.getElementById('currentSubjectName').value;
        const fileInput = document.getElementById('newTaskAttachments');
        
        if (!title || !dueDate) {
            alert('Please fill in all required fields');
            return;
        }
        
        const taskData = {
            title: title,
            description: description,
            dueDate: new Date(dueDate),
            priority: priority,
            maxScore: parseInt(maxScore) || 100,
            subjectId: subjectId,
            subjectName: subjectName,
            status: 'active',
            createdAt: serverTimestamp()
        };
        
        try {
            const taskRef = await addDoc(collection(db, 'tasks'), taskData);
            
            if (fileInput.files.length > 0) {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                
                for (const file of fileInput.files) {
                    const fileName = file.name;
                    const fileSize = file.size;
                    
                    if (fileSize > 10 * 1024 * 1024) {
                        alert(`File ${fileName} is too large. Max size is 10MB.`);
                        continue;
                    }
                    
                    const filePath = `task-attachments/${subjectId}/${taskRef.id}/${Date.now()}_${fileName}`;
                    
                    const { data, error } = await supabase.storage
                        .from('task-attachments')
                        .upload(filePath, file);
                    
                    if (error) {
                        console.error('Error uploading file:', error);
                        continue;
                    }
                    
                    const { data: urlData } = supabase.storage
                        .from('task-attachments')
                        .getPublicUrl(filePath);
                    
                    await addDoc(collection(db, 'taskAttachments'), {
                        taskId: taskRef.id,
                        subjectId: subjectId,
                        fileName: fileName,
                        fileURL: urlData.publicUrl,
                        filePath: filePath,
                        fileSize: fileSize,
                        uploadedBy: userData.name,
                        uploadedAt: serverTimestamp()
                    });
                }
            }
            
            alert('Task added successfully!');
            form.reset();
            document.getElementById('addTaskModal').style.display = 'none';
            loadSubjects();
        } catch (err) {
            console.error('Error adding task:', err);
            alert('Error adding task: ' + err.message);
        }
    });
}

async function initEditTaskForm() {
    const form = document.getElementById('editTaskForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const taskId = document.getElementById('editTaskId').value;
        const subjectId = document.getElementById('editTaskSubjectId').value;
        const title = document.getElementById('editTaskTitle').value.trim();
        const description = document.getElementById('editTaskDescription').value.trim();
        const dueDate = document.getElementById('editTaskDueDate').value;
        const priority = document.getElementById('editTaskPriority').value;
        const maxScore = document.getElementById('editTaskMaxScore').value;
        
        try {
            await updateDoc(doc(db, 'tasks', taskId), {
                title: title,
                description: description,
                dueDate: new Date(dueDate),
                priority: priority,
                maxScore: parseInt(maxScore) || 100,
                updatedAt: serverTimestamp()
            });
            
            alert('Task updated successfully!');
            document.getElementById('editTaskModal').style.display = 'none';
            loadSubjects();
        } catch (err) {
            console.error('Error updating task:', err);
            alert('Error updating task: ' + err.message);
        }
    });
}

async function initFileUploadForm() {
    const form = document.getElementById('fileUploadForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('fileToUpload');
        const fileDescription = document.getElementById('fileDescription').value.trim();
        const subjectId = document.getElementById('uploadSubjectId').value;
        const taskId = document.getElementById('uploadTaskId').value;
        const uploadType = document.getElementById('uploadType').value;
        
        if (fileInput.files.length === 0) {
            alert('Please select a file');
            return;
        }
        
        const file = fileInput.files[0];
        const fileName = file.name;
        const fileSize = file.size;
        
        if (fileSize > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }
        
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        try {
            let bucket, filePath;
            
            if (uploadType === 'task') {
                bucket = 'task-attachments';
                filePath = `task-attachments/${subjectId}/${taskId}/${Date.now()}_${fileName}`;
            } else {
                bucket = 'subject-files';
                filePath = `subject-files/${subjectId}/${Date.now()}_${fileName}`;
            }
            
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);
            
            if (error) throw error;
            
            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);
            
            const fileData = {
                fileName: fileName,
                fileURL: urlData.publicUrl,
                filePath: filePath,
                description: fileDescription,
                subjectId: subjectId,
                taskId: taskId || null,
                uploadType: uploadType,
                uploadedBy: userData.name,
                uploadedById: userData.id,
                uploadedAt: serverTimestamp()
            };
            
            await addDoc(collection(db, 'files'), fileData);
            
            alert('File uploaded successfully!');
            form.reset();
            document.getElementById('fileUploadModal').style.display = 'none';
            loadSubjects();
        } catch (err) {
            console.error('Error uploading file:', err);
            alert('Error uploading file: ' + err.message);
        }
    });
}

async function initSubmissionForm() {
    const form = document.getElementById('submissionForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submissionText = document.getElementById('submissionText').value.trim();
        const fileInput = document.getElementById('submissionFile');
        const taskId = document.getElementById('submitTaskId').value;
        const subjectId = document.getElementById('submitSubjectId').value;
        
        if (!submissionText && fileInput.files.length === 0) {
            alert('Please provide a text answer or attach a file');
            return;
        }
        
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        const submissionData = {
            taskId: taskId,
            subjectId: subjectId,
            studentId: userData.id,
            studentName: userData.name,
            answer: submissionText,
            submittedAt: serverTimestamp(),
            status: 'submitted'
        };
        
        try {
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const fileName = file.name;
                const fileSize = file.size;
                
                if (fileSize > 10 * 1024 * 1024) {
                    alert('File size must be less than 10MB');
                    return;
                }
                
                const filePath = `student-submissions/${subjectId}/${taskId}/${userData.id}/${Date.now()}_${fileName}`;
                
                const { data, error } = await supabase.storage
                    .from('student-submissions')
                    .upload(filePath, file);
                
                if (error) throw error;
                
                const { data: urlData } = supabase.storage
                    .from('student-submissions')
                    .getPublicUrl(filePath);
                
                submissionData.fileURL = urlData.publicUrl;
                submissionData.fileName = fileName;
                submissionData.fileSize = fileSize;
            }
            
            await addDoc(collection(db, 'submissions'), submissionData);
            
            alert('Submission successful!');
            form.reset();
            document.getElementById('submissionModal').style.display = 'none';
            loadSubjects();
        } catch (err) {
            console.error('Error submitting:', err);
            alert('Error submitting: ' + err.message);
        }
    });
}

function initModalCloseHandlers() {
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// =========================
// PAGE INITIALIZATION
// =========================

document.addEventListener('DOMContentLoaded', async function() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = userData.name || 'User';
    }
    
    initAddSubjectForm();
    initEditSubjectForm();
    initAddTaskForm();
    initEditTaskForm();
    initFileUploadForm();
    initSubmissionForm();
    initModalCloseHandlers();
    
    loadSubjects();
});
