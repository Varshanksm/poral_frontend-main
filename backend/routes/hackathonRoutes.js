const express = require('express');
const {
    submitHackathon,
    getMyHackathons,
    getAssignedHackathons,
    updateHackathonStatus,
    getAcceptedHackathons,
    getAllHackathons,
    getHackathonsByYear,
    getHackathonParticipants,
    getStudentHackathons,
    getHackathonStats,
    getHackathonNames
} = require('../controllers/hackathonController');
const { bulkUpdateHackathonStatus, getAssignedHackathonsPaginated } = require('../controllers/hackathonBulkController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

// Student routes
router.post('/submit', protect, authorize('student'), upload.fields([
    { name: 'certificate', maxCount: 1 }
]), submitHackathon);
router.get('/my-hackathons', protect, authorize('student'), getMyHackathons);
router.get('/names', protect, authorize('student'), getHackathonNames);

// Proctor/Staff routes
router.get('/assigned', protect, authorize('proctor'), getAssignedHackathons);
router.get('/assigned/paginated', protect, authorize('proctor'), getAssignedHackathonsPaginated);
// Bulk update must come BEFORE individual update logic to prevent collision
router.put('/bulk/status', protect, authorize('proctor'), bulkUpdateHackathonStatus);
router.put('/:id/status', protect, authorize('proctor'), updateHackathonStatus);

// Staff filtering and analytics routes
router.get('/by-year', protect, authorize('proctor', 'admin'), getHackathonsByYear);
router.get('/participants', protect, authorize('proctor', 'admin'), getHackathonParticipants);
router.get('/student/:studentId', protect, authorize('proctor', 'admin'), getStudentHackathons);
router.get('/stats', protect, authorize('proctor', 'admin'), getHackathonStats);
router.get('/all', protect, authorize('admin'), getAllHackathons);

// Public route
router.get('/accepted', getAcceptedHackathons);

module.exports = router;
