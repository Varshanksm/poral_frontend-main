const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Student Routes
router.post('/create', protect, authorize('student'), teamController.createTeam);
router.post('/join', protect, authorize('student'), teamController.joinTeam);
router.get('/my-team/:hackathonId', protect, authorize('student', 'proctor'), teamController.getMyTeam);
router.post('/submit/:teamId', protect, authorize('student'), teamController.submitTeam);

// Certificate Upload - Moved up and simplified
const upload = require('../middleware/uploadMiddleware');
router.post('/upload-certificate/:teamId',
    protect,
    authorize('student'),
    (req, res, next) => {
        console.log('Upload Route Hit:', req.params.teamId);
        next();
    },
    upload.single('certificate'),
    teamController.uploadMemberCertificate
);

// Proctor Routes
router.get('/proctor/list', protect, authorize('proctor'), teamController.getProctorTeams);
router.put('/proctor/status/:teamId', protect, authorize('proctor'), teamController.updateTeamStatus);

module.exports = router;
