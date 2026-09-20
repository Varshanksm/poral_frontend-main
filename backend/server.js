const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Local upload directories creation removed for cloud deployment

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hackathons', require('./routes/hackathonRoutes'));
app.use('/api/upcoming-hackathons', require('./routes/upcomingHackathonRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/users', require('./routes/userManagementRoutes'));
app.use('/api/opportunities', require('./routes/opportunityRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));

app.get('/', (req, res) => {
    res.send('Hackathon Portal API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('=== SERVER ERROR ===');
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({
        message: 'Server error',
        error: err.message,
        stack: err.stack
    });
});

// Start Server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (err) => {
    console.error('SERVER ERROR:', err);
});
