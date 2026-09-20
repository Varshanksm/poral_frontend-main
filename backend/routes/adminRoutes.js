const express = require('express');
const { getStats, getAllHackathons, getLowParticipationStudents, sendLowParticipationAlerts } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/stats', protect, authorize('admin'), getStats);
router.get('/hackathons', protect, authorize('admin'), getAllHackathons);
router.get('/low-participation', protect, authorize('admin'), getLowParticipationStudents);
router.post('/send-participation-alerts', protect, authorize('admin'), sendLowParticipationAlerts);

module.exports = router;
