const Team = require('../models/Team');
const Student = require('../models/Student');
const UpcomingHackathon = require('../models/UpcomingHackathon');
const Proctor = require('../models/Proctor');
const crypto = require('crypto');

// Helper to generate unique team code
const generateTeamCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Create a new team
exports.createTeam = async (req, res) => {
    try {
        const { teamName, upcomingHackathonId } = req.body;
        const studentId = req.user.id;

        // Check if student is already in a team for this hackathon
        const existingTeam = await Team.findOne({
            upcomingHackathonId,
            'members.studentId': studentId
        });

        if (existingTeam) {
            return res.status(400).json({ message: 'You are already in a team for this hackathon.' });
        }

        // Get student details for member list
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Get proctor for the student's department
        const proctor = await Proctor.findOne({ department: student.department });
        if (!proctor) {
            return res.status(400).json({ message: 'No proctor assigned to your department.' });
        }

        const teamCode = generateTeamCode();

        const team = new Team({
            teamName,
            teamCode,
            upcomingHackathonId,
            leaderId: studentId,
            proctorId: proctor._id,
            members: [{
                studentId: student._id,
                name: student.name,
                registerNo: student.registerNo,
                email: student.email,
                department: student.department,
                status: 'Joined'
            }]
        });

        await team.save();
        res.status(201).json({ message: 'Team created successfully', team });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Team name already exists for this hackathon.' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Join a team using team code
exports.joinTeam = async (req, res) => {
    try {
        const { teamCode } = req.body;
        const studentId = req.user.id;

        const team = await Team.findOne({ teamCode });
        if (!team) {
            return res.status(404).json({ message: 'Invalid team code.' });
        }

        if (team.status !== 'Draft') {
            return res.status(400).json({ message: 'Cannot join team. It has already been submitted or approved.' });
        }

        // Check if student is already in a team for THIS hackathon
        const alreadyInAnyTeam = await Team.findOne({
            upcomingHackathonId: team.upcomingHackathonId,
            'members.studentId': studentId
        });

        if (alreadyInAnyTeam) {
            return res.status(400).json({ message: 'You are already in a team for this hackathon.' });
        }

        const student = await Student.findById(studentId);

        team.members.push({
            studentId: student._id,
            name: student.name,
            registerNo: student.registerNo,
            email: student.email,
            department: student.department,
            status: 'Joined'
        });

        await team.save();
        res.json({ message: 'Joined team successfully', team });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get my team for a specific hackathon
exports.getMyTeam = async (req, res) => {
    try {
        const { hackathonId } = req.params;
        const team = await Team.findOne({
            upcomingHackathonId: hackathonId,
            'members.studentId': req.user.id
        }).populate('upcomingHackathonId', 'title organization');

        if (!team) {
            return res.status(404).json({ message: 'No team found' });
        }
        res.json(team);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Submit team for proctor approval
exports.submitTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const team = await Team.findById(teamId);

        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (team.leaderId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Only the team leader can submit for approval.' });
        }

        if (team.members.length < 2) {
            return res.status(400).json({ message: 'Team must have at least 2 members before submitting.' });
        }

        team.status = 'Pending Approval';
        team.submittedAt = new Date();
        await team.save();

        res.json({ message: 'Team submitted for proctor approval.', team });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upload member certificate
exports.uploadMemberCertificate = async (req, res) => {
    console.log('--- START CERTIFICATE UPLOAD ---');
    console.log('Team ID:', req.params.teamId);
    console.log('User ID:', req.user._id);

    try {
        const { teamId } = req.params;
        const studentId = req.user._id;

        if (!req.file) {
            console.log('Upload Failed: No file provided');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const team = await Team.findById(teamId);
        if (!team) {
            console.log('Upload Failed: Team not found in DB:', teamId);
            return res.status(404).json({ message: 'Team not found' });
        }

        // Update the specific member's certificate info
        // Using .equals() for reliable ObjectId comparison
        const memberIndex = team.members.findIndex(m => m.studentId.toString() === studentId.toString());

        console.log('Member Index Found:', memberIndex);

        if (memberIndex === -1) {
            console.log('Upload Failed: User not a member of team');
            return res.status(403).json({ message: 'You are not a member of this team' });
        }

        // When using Cloudinary, req.file.path contains the secure URL
        team.members[memberIndex].certificatePath = req.file.path;
        team.members[memberIndex].certificateStatus = 'Uploaded';

        await team.save();
        console.log('Upload Successful! Path:', team.members[memberIndex].certificatePath);
        res.json({ message: 'Certificate uploaded successfully', team });
    } catch (error) {
        console.error('Upload Process Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Proctor: Get teams for approval
exports.getProctorTeams = async (req, res) => {
    try {
        const teams = await Team.find({ proctorId: req.user.id })
            .populate('upcomingHackathonId', 'title organization hackathonDate')
            .sort({ submittedAt: -1 });
        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Proctor: Update team status
exports.updateTeamStatus = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { status, rejectionReason } = req.body;

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (team.proctorId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to approve this team.' });
        }

        team.status = status;
        if (status === 'Approved') {
            team.approvedAt = new Date();
            team.rejectionReason = undefined;
        } else if (status === 'Declined') {
            team.rejectionReason = rejectionReason;
        }

        await team.save();
        res.json({ message: `Team ${status} successfully`, team });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
