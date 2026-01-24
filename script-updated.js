// Add this at the beginning of your existing script.js

const API_URL = 'http://localhost:3000/api';

// Updated login handler with backend
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showLoginError('Please fill in all fields');
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
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userData', JSON.stringify(data.user));
            localStorage.setItem('userId', data.user.id);

            // Show success message
            showLoginSuccess('Login successful! Redirecting...');

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showLoginError(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Connection error. Make sure the server is running on port 3000');
    }
}

// Updated signup handler with backend
async function handleSignupSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const fullName = document.getElementById('fullName').value;
    const studentId = document.getElementById('studentId').value;
    const course = document.getElementById('course').value;

    // Validate inputs
    if (!email || !password || !confirmPassword || !fullName) {
        showSignupError('Please fill in all required fields');
        return;
    }

    if (password !== confirmPassword) {
        showSignupError('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        showSignupError('Password must be at least 6 characters long');
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
                name: fullName.split(' ')[0],
                fullName: fullName,
                studentId: studentId,
                course: course
            })
        });

        const data = await response.json();

        if (data.success) {
            showSignupSuccess('Account created successfully! Redirecting to login...');

            setTimeout(() => {
                window.location.href = 'Login.html';
            }, 1500);
        } else {
            showSignupError(data.message || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showSignupError('Connection error. Make sure the server is running on port 3000');
    }
}

// Helper function to show login error
function showLoginError(message) {
    // Create error element if it doesn't exist
    let errorElement = document.getElementById('loginError');
    if (!errorElement) {
        const form = document.getElementById('loginForm');
        errorElement = document.createElement('div');
        errorElement.id = 'loginError';
        errorElement.style.cssText = 'color: #ff6b6b; margin-bottom: 15px; padding: 10px; border-radius: 5px; background-color: rgba(255, 107, 107, 0.1); border: 1px solid #ff6b6b;';
        form.insertBefore(errorElement, form.firstChild);
    }
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Helper function to show login success
function showLoginSuccess(message) {
    let successElement = document.getElementById('loginSuccess');
    if (!successElement) {
        const form = document.getElementById('loginForm');
        successElement = document.createElement('div');
        successElement.id = 'loginSuccess';
        successElement.style.cssText = 'color: #51cf66; margin-bottom: 15px; padding: 10px; border-radius: 5px; background-color: rgba(81, 207, 102, 0.1); border: 1px solid #51cf66;';
        form.insertBefore(successElement, form.firstChild);
    }
    successElement.textContent = message;
    successElement.style.display = 'block';
}

// Helper function to show signup error
function showSignupError(message) {
    let errorElement = document.getElementById('signupError');
    if (!errorElement) {
        const form = document.getElementById('signupForm');
        if (!form) return;
        errorElement = document.createElement('div');
        errorElement.id = 'signupError';
        errorElement.style.cssText = 'color: #ff6b6b; margin-bottom: 15px; padding: 10px; border-radius: 5px; background-color: rgba(255, 107, 107, 0.1); border: 1px solid #ff6b6b;';
        form.insertBefore(errorElement, form.firstChild);
    }
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Helper function to show signup success
function showSignupSuccess(message) {
    let successElement = document.getElementById('signupSuccess');
    if (!successElement) {
        const form = document.getElementById('signupForm');
        if (!form) return;
        successElement = document.createElement('div');
        successElement.id = 'signupSuccess';
        successElement.style.cssText = 'color: #51cf66; margin-bottom: 15px; padding: 10px; border-radius: 5px; background-color: rgba(81, 207, 102, 0.1); border: 1px solid #51cf66;';
        form.insertBefore(successElement, form.firstChild);
    }
    successElement.textContent = message;
    successElement.style.display = 'block';
}

// Logout function
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');
    localStorage.removeItem('userId');
    window.location.href = 'Login.html';
}
