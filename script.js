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
    let tasks = [];

    // Load subjects from Firestore
    try {
        // Query all subjects
        const subjectsQuery = await getDocs(collection(db, "subjects"));
        subjectsQuery.forEach(doc => {
            const data = doc.data();
            if (isInstructor) {
                if (data.instructorId === userData.id) {
                    subjects.push({ id: doc.id, ...data });
                }
            } else {
                subjects.push({ id: doc.id, ...data });
            }
        });

        // Load tasks
        const tasksQuery = await getDocs(collection(db, "tasks"));
        tasksQuery.forEach(doc => {
            tasks.push({ id: doc.id, ...doc.data() });
        });
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

    // =========================
    // RENDER DETAILS
    // =========================
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
            const taskId = document.getElementById('editTaskId').value;
            const taskData = {
                title: document.getElementById('taskTitle').value,
                description: document.getElementById('taskDescription').value,
                dueDate: new Date(document.getElementById('taskDueDate').value),
                maxScore: parseInt(document.getElementById('taskMaxScore').value),
                subjectId: document.querySelector('#addTaskModal [name="subjectId"]')?.value || ''
            };

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
                const activeIndex = document.querySelector('.subject-list-item.active')?.dataset.index || 0;
                renderSubjectDetails(activeIndex);
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
            const activeIndex = document.querySelector('.subject-list-item.active')?.dataset.index || 0;
            renderSubjectDetails(activeIndex);
        } catch (err) {
            console.error("Error deleting task:", err);
            alert("Error deleting task: " + err.message);
        }
    };

    // =========================
    // FILE UPLOAD
    // =========================
    const uploadForm = document.getElementById('uploadFileForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('materialFile');
            const file = fileInput.files[0];
            if (!file) {
                alert("Please select a file");
                return;
            }

            if (file.size > 50 * 1024 * 1024) {
                alert("File size must be less than 50MB");
                return;
            }

            try {
                await addDoc(collection(db, "materials"), {
                    title: document.getElementById('fileTitle').value,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    subjectId: document.getElementById('uploadSubjectId').value,
                    uploadedBy: userData.id,
                    uploadedAt: serverTimestamp()
                });

                alert("File metadata saved! Upload to Supabase bucket: " + file.name);
                closeUploadModal();
                uploadForm.reset();
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
            const fileInput = document.getElementById('submissionFile');
            const file = fileInput.files[0];
            if (!file) {
                alert("Please select a file to submit");
                return;
            }

            try {
                await addDoc(collection(db, "submissions"), {
                    taskId: document.getElementById('submissionTaskId').value,
                    subjectId: document.getElementById('submissionSubjectId').value,
                    studentId: userData.id,
                    studentName: userData.name,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    comments: document.getElementById('submissionComments').value,
                    submittedAt: serverTimestamp(),
                    status: "submitted"
                });

                alert("Assignment submitted successfully!");
                closeSubmissionModal();
                submissionForm.reset();
            } catch (err) {
                console.error("Error submitting:", err);
                alert("Error submitting: " + err.message);
            }
        });
    }

    // =========================
    // OPEN ADD MODAL
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
    
    initAddSubjectBtn();

    // =========================
    // ADD SUBJECT (FORM)
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
                const subjectRef = await addDoc(collection(db, "subjects"), subjectData);
                console.log('Subject saved with ID:', subjectRef.id);
                
                subjects.push({ id: subjectRef.id, ...subjectData });
                renderSubjects();
                form.reset();
                modal.style.display = 'none';
                
                alert('Subject added successfully!');
            } catch (err) {
                console.error('Error adding subject:', err);
                alert('Error adding subject: ' + err.message);
            }
        });
    }
    
    // Initialize form when DOM is ready
    initAddSubjectForm();

    // Initial Render
    renderSubjects();
}
