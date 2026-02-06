// Supabase Configuration
// Add your Supabase keys here - keep this file private

const SUPABASE_URL = "https://bhjzafenxdalggfucluo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoanphZmVueGRhbGdnZnVjbHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzU5NTIsImV4cCI6MjA4NTk1MTk1Mn0.--9A_MTKSFhBllDz_KqSwJu3uniXegkKyKbYgqGKk_Q";

// Initialize Supabase client
// Note: You'll need to include the Supabase JS SDK in your HTML
// Add this to your HTML head:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// Bucket names for your project
const SUPABASE_BUCKETS = {
    SUBJECT_FILES: "subject-files",      // For instructor uploaded materials
    TASK_ATTACHMENTS: "task-attachments", // For task-related files
    STUDENT_SUBMISSIONS: "student-submissions", // For student answers/submissions
    PROFILE_PICTURES: "profile-pictures", // For user profile images
    ANNOUNCEMENTS: "announcements"        // For announcement attachments
};

// Folder structure within buckets
const SUPABASE_FOLDERS = {
    SUBJECTS: "subjects/",
    TASKS: "tasks/",
    SUBMISSIONS: "submissions/",
    PROFILES: "profiles/",
    ANNOUNCEMENTS: "announcements/"
};

// Export for use in other scripts
window.SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    buckets: SUPABASE_BUCKETS,
    folders: SUPABASE_FOLDERS
};
