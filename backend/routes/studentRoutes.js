const express = require('express');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/authMiddleware');
const { sendEmail, emailTemplates } = require('../services/emailService');
const router = express.Router();

// Get student participation count
router.get('/participation-count', protect, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        res.json({ credits: student.credits || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check participation and send alert if needed
router.post('/check-participation', protect, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);

        if (student.credits < 3) {
            // Send participation alert email
            console.log('Sending participation alert email to:', student.email);
            const emailResult = await sendEmail(emailTemplates.participationAlert(student.name, student.email, student.credits));

            if (!emailResult.success) {
                console.error('Participation alert email failed');
            }
        }

        res.json({ message: 'Participation check completed' });
    } catch (error) {
        console.error('Participation check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Student Profile
router.put('/profile', protect, authorize('student'), async (req, res) => {
    try {
        const { cgpa, registerNo, year, department, phone } = req.body;
        const student = await Student.findById(req.user.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (cgpa !== undefined) student.cgpa = cgpa;
        if (registerNo) student.registerNo = registerNo;
        if (year) student.year = year;
        if (department) student.department = department;

        await student.save();

        res.json({
            message: 'Profile updated successfully',
            student: {
                id: student._id,
                name: student.name,
                email: student.email,
                role: 'student',
                registerNo: student.registerNo,
                year: student.year,
                department: student.department,
                cgpa: student.cgpa,
                credits: student.credits
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
