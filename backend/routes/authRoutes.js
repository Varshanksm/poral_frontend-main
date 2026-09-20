const express = require('express');
const { registerStudent, loginStudent, loginProctor, loginAdmin, forgotPassword, resetPassword, googleLogin } = require('../controllers/authController');
const router = express.Router();

router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);
router.post('/proctor/login', loginProctor);
router.post('/admin/login', loginAdmin);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Google OAuth route
router.post('/google-login', googleLogin);

module.exports = router;
