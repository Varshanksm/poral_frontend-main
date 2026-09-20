const express = require('express');
const router = express.Router();
const {
    createOpportunity,
    getAllOpportunities,
    scanForCandidates,
    sendInvites,
    getRecommendedOpportunities,
    markInterest,
    getProctorRadar
} = require('../controllers/opportunityController');

const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Admin Routes
router.post('/', protect, authorize('admin'), upload.single('poster'), createOpportunity);
router.get('/', protect, authorize('admin'), getAllOpportunities);
router.post('/:id/scan', protect, authorize('admin'), scanForCandidates);
router.post('/:id/invite', protect, authorize('admin'), sendInvites);

// Student Routes
router.get('/recommended', protect, authorize('student'), getRecommendedOpportunities);
router.put('/:id/interest', protect, authorize('student'), markInterest);

// Proctor Routes
router.get('/proctor-radar', protect, authorize('proctor'), getProctorRadar);

module.exports = router;
