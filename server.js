const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// In-memory user database (you can replace with a real database later)
const users = [
    {
        id: 1,
        email: 'Jaymie.John@icct.edu.ph',
        password: 'password123',
        name: 'Jaymie John',
        fullName: 'Jaymie John Arogante',
        studentId: '2024-00123',
        course: 'BS Information Technology',
        phone: '+63 912 345 6789',
        dob: '2003-03-15',
        gender: 'Male'
    },
    {
        id: 2,
        email: 'jane.smith@icct.edu.ph',
        password: 'password456',
        name: 'Jane Smith',
        fullName: 'Jane Marie Smith',
        studentId: '2024-00124',
        course: 'BS Computer Science',
        phone: '+63 912 345 6790',
        dob: '2003-05-20',
        gender: 'Female'
    }
];

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required' 
        });
    }

    // Find user
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid email or password' 
        });
    }

    // Check password
    if (user.password !== password) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid email or password' 
        });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userWithoutPassword
    });
});

// Signup endpoint
app.post('/api/signup', (req, res) => {
    const { email, password, name, fullName, studentId, course } = req.body;

    // Validate input
    if (!email || !password || !name) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email, password, and name are required' 
        });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(409).json({ 
            success: false, 
            message: 'User already exists' 
        });
    }

    // Create new user
    const newUser = {
        id: users.length + 1,
        email,
        password,
        name,
        fullName: fullName || name,
        studentId: studentId || `2024-${String(users.length + 1).padStart(5, '0')}`,
        course: course || 'Unknown',
        phone: '+63 900 000 0000',
        dob: '2000-01-01',
        gender: 'Not specified'
    };

    users.push(newUser);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
        success: true,
        message: 'Signup successful',
        user: userWithoutPassword
    });
});

// Get user profile endpoint
app.get('/api/user/:id', (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));

    if (!user) {
        return res.status(404).json({ 
            success: false, 
            message: 'User not found' 
        });
    }

    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
        success: true,
        user: userWithoutPassword
    });
});

// Update user profile endpoint
app.put('/api/user/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ 
            success: false, 
            message: 'User not found' 
        });
    }

    // Update user fields
    const { name, fullName, phone, dob, gender, course } = req.body;
    if (name) user.name = name;
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (dob) user.dob = dob;
    if (gender) user.gender = gender;
    if (course) user.course = course;

    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: userWithoutPassword
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: 'Server is running' 
    });
});

// Serve login page at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Darkboard server is running at http://localhost:${PORT}`);
    console.log('');
    console.log('Test credentials:');
    console.log('Email: john.doe@icct.edu.ph');
    console.log('Password: password123');
    console.log('');
    console.log('Or');
    console.log('Email: jane.smith@icct.edu.ph');
    console.log('Password: password456');
});
