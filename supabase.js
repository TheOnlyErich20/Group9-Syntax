// Supabase Configuration for LMS File Storage
// Bucket: lms-files
// Structure:
//   /assignments/{taskId}/ - Instructor uploads assignment files
//   /submissions/{taskId}/{userId}/ - Student submission files

const SUPABASE_URL = 'https://bhjzafenxdalggfucluo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoanphZmVueGRhbGdnZnVjbHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzU5NTIsImV4cCI6MjA4NTk1MTk1Mn0.--9A_MTKSFhBllDz_KqSwJu3uniXegkKyKbYgqGKk_Q';
const STORAGE_BUCKET = 'lms-files';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========================
// FILE UPLOAD FUNCTIONS
// =========================

/**
 * Upload assignment file (Instructor only)
 * @param {File} file - The file to upload
 * @param {string} taskId - The task ID
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadAssignmentFile(file, taskId) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `assignments/${taskId}/${fileName}`;

    const { data, error } = await supabaseClient
        .storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file);

    if (error) {
        return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
}

/**
 * Upload submission file (Student only)
 * @param {File} file - The file to upload
 * @param {string} taskId - The task ID
 * @param {string} userId - The user ID
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadSubmissionFile(file, taskId, userId) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `submissions/${taskId}/${userId}/${fileName}`;

    const { data, error } = await supabaseClient
        .storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file);

    if (error) {
        return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
}

/**
 * Download file from Supabase
 * @param {string} filePath - The file path in storage
 * @returns {Promise<{success: boolean, data?: Blob, error?: string}>}
 */
export async function downloadFile(filePath) {
    const { data, error } = await supabaseClient
        .storage
        .from(STORAGE_BUCKET)
        .download(filePath);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

/**
 * Delete file from Supabase
 * @param {string} filePath - The file path in storage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFile(filePath) {
    const { error } = await supabaseClient
        .storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Export supabaseClient for direct access if needed
export { supabaseClient };
