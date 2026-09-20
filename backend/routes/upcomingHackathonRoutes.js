const express = require('express');
const {
    createUpcomingHackathon,
    getUpcomingHackathons,
    getUpcomingHackathonById,
    updateUpcomingHackathon,
    deleteUpcomingHackathon,
    enrollInHackathon,
    getMyEnrollments,
    getParticipationApprovals,
    updateParticipationApproval
} = require('../controllers/upcomingHackathonController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

// Public routes
router.get('/', getUpcomingHackathons);
router.get('/:id', getUpcomingHackathonById);

// Admin routes
router.post('/', protect, authorize('admin'), upload.fields([{ name: 'poster', maxCount: 1 }]), createUpcomingHackathon);
router.put('/:id', protect, authorize('admin'), upload.fields([{ name: 'poster', maxCount: 1 }]), updateUpcomingHackathon);
router.delete('/:id', protect, authorize('admin'), deleteUpcomingHackathon);

// Student routes
router.post('/:upcomingHackathonId/enroll', protect, authorize('student'), enrollInHackathon);
router.get('/my/enrollments', protect, authorize('student'), getMyEnrollments);

// Proctor routes
router.get('/proctor/approvals', protect, authorize('proctor'), getParticipationApprovals);
router.put('/proctor/:id/status', protect, authorize('proctor'), updateParticipationApproval);

module.exports = router;
