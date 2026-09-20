const mongoose = require('mongoose');
const UpcomingHackathon = require('../models/UpcomingHackathon');
const Student = require('../models/Student');
const ParticipationApproval = require('../models/ParticipationApproval');
const Proctor = require('../models/Proctor');

// Create Upcoming Hackathon (Admin only)
exports.createUpcomingHackathon = async (req, res) => {
    try {
        console.log('=== CREATE UPCOMING HACKATHON ===');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        console.log('User:', req.user);

        // Extract data from request
        const {
            title,
            organization,
            description,
            registrationDeadline,
            hackathonDate,
            mode,
            location,
            maxParticipants
        } = req.body;

        // When using Cloudinary, req.files['poster'][0].path contains the secure URL
        let posterPath = null;
        if (req.files && req.files['poster'] && req.files['poster'][0]) {
            posterPath = req.files['poster'][0].path;
            console.log('Poster URL from Cloudinary:', posterPath);
        } else {
            console.log('No poster uploaded');
        }

        // Validate required fields
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }
        if (!organization) {
            return res.status(400).json({ message: 'Organization is required' });
        }
        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }
        if (!registrationDeadline) {
            return res.status(400).json({ message: 'Registration deadline is required' });
        }
        if (!hackathonDate) {
            return res.status(400).json({ message: 'Hackathon date is required' });
        }

        // Prepare hackathon data
        const hackathonData = {
            title: title.trim(),
            organization: organization.trim(),
            description: description.trim(),
            posterPath: posterPath,
            registrationDeadline: new Date(registrationDeadline),
            hackathonDate: new Date(hackathonDate),
            mode: mode || 'Online',
            location: location ? location.trim() : '',
            maxParticipants: maxParticipants ? parseInt(maxParticipants) : 100,
            createdBy: req.user.id,
            isActive: true
        };

        console.log('Creating hackathon with data:', hackathonData);

        // Create the hackathon
        const upcomingHackathon = new UpcomingHackathon(hackathonData);
        await upcomingHackathon.save();

        console.log('Hackathon created successfully with ID:', upcomingHackathon._id);

        // Send success response
        res.status(201).json({
            message: 'Upcoming hackathon created successfully',
            upcomingHackathon
        });

    } catch (error) {
        console.error('=== ERROR IN CREATE UPCOMING HACKATHON ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'A hackathon with this title already exists'
            });
        }

        // Generic error
        res.status(500).json({
            message: 'Failed to create upcoming hackathon',
            error: error.message
        });
    }
};

// Get All Upcoming Hackathons (Public)
exports.getUpcomingHackathons = async (req, res) => {
    try {
        // Show hackathons where deadline is today or in the future
        // We use start of today to ensure hackathons expiring later today are shown
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const hackathons = await UpcomingHackathon.find({
            isActive: true,
            registrationDeadline: { $gte: startOfToday }
        })
            .populate('createdBy', 'name')
            .sort({ registrationDeadline: 1 });

        res.json(hackathons || []);
    } catch (error) {
        console.error('Error in getUpcomingHackathons:', error);
        res.status(500).json({
            error: 'Failed to fetch upcoming hackathons',
            details: error.message
        });
    }
};

// Get Upcoming Hackathon by ID
exports.getUpcomingHackathonById = async (req, res) => {
    try {
        const hackathon = await UpcomingHackathon.findById(req.params.id)
            .populate('createdBy', 'name');

        if (!hackathon) {
            return res.status(404).json({ message: 'Upcoming hackathon not found' });
        }

        res.json(hackathon);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Upcoming Hackathon (Admin only)
exports.updateUpcomingHackathon = async (req, res) => {
    try {
        const { title, organization, description, registrationDeadline, hackathonDate, mode, location, maxParticipants, isActive } = req.body;

        const updateData = {
            title: title?.trim(),
            organization: organization?.trim(),
            description: description?.trim(),
            registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
            hackathonDate: hackathonDate ? new Date(hackathonDate) : undefined,
            mode,
            location: location?.trim(),
            maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
            isActive
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        // Update poster if provided
        if (req.files && req.files['poster']) {
            updateData.posterPath = req.files['poster'][0].path;
        }

        const hackathon = await UpcomingHackathon.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!hackathon) {
            return res.status(404).json({ message: 'Upcoming hackathon not found' });
        }

        res.json({ message: 'Upcoming hackathon updated successfully', hackathon });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete Upcoming Hackathon (Admin only)
exports.deleteUpcomingHackathon = async (req, res) => {
    try {
        const hackathon = await UpcomingHackathon.findByIdAndDelete(req.params.id);

        if (!hackathon) {
            return res.status(404).json({ message: 'Upcoming hackathon not found' });
        }

        // Also delete related participation approvals
        await ParticipationApproval.deleteMany({ upcomingHackathonId: req.params.id });

        res.json({ message: 'Upcoming hackathon deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Enroll in Upcoming Hackathon (Student)
exports.enrollInHackathon = async (req, res) => {
    try {
        console.log('=== ENROLL IN HACKATHON ===');
        console.log('Params:', req.params);
        console.log('Body:', req.body);
        console.log('User:', req.user);

        const { upcomingHackathonId } = req.params;
        const { experience, motivation, teamPreference, skills, phone } = req.body;

        // Check if hackathon exists and registration is still open
        const hackathon = await UpcomingHackathon.findById(upcomingHackathonId);
        if (!hackathon) {
            return res.status(404).json({ message: 'Upcoming hackathon not found' });
        }

        console.log('Hackathon found:', hackathon.title);

        if (hackathon.registrationDeadline <= new Date()) {
            return res.status(400).json({ message: 'Registration deadline has passed' });
        }

        // Check if already enrolled
        const existingEnrollment = await ParticipationApproval.findOne({
            studentId: req.user.id,
            upcomingHackathonId
        });

        if (existingEnrollment) {
            return res.status(400).json({ message: 'You have already enrolled in this hackathon' });
        }

        console.log('No existing enrollment found');

        // Get student details
        const student = await Student.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        console.log('Student found:', student.name, 'Department:', student.department);

        // Find proctor for student's department
        const proctor = await Proctor.findOne({ department: student.department });
        if (!proctor) {
            console.log('No proctor found for department:', student.department);
            return res.status(400).json({ message: 'No proctor assigned to your department' });
        }

        console.log('Proctor found:', proctor.name);

        // Create participation approval request
        const participationApproval = await ParticipationApproval.create({
            studentId: req.user.id,
            upcomingHackathonId,
            proctorId: proctor._id,
            enrollmentDetails: {
                studentName: student.name,
                registerNo: student.registerNo,
                department: student.department,
                year: student.year,
                email: student.email,
                phone,
                experience,
                motivation,
                teamPreference,
                skills
            }
        });

        console.log('Participation approval created:', participationApproval._id);

        res.status(201).json({
            message: 'Enrollment request submitted successfully. Please wait for proctor approval.',
            participationApproval
        });
    } catch (error) {
        console.error('=== ENROLLMENT ERROR ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message });
    }
};

// Get Student's Enrollment Requests
exports.getMyEnrollments = async (req, res) => {
    try {
        const enrollments = await ParticipationApproval.find({ studentId: req.user.id })
            .populate('upcomingHackathonId', 'title organization registrationDeadline hackathonDate mode')
            .sort({ createdAt: -1 });

        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Proctor's Participation Approvals
exports.getParticipationApprovals = async (req, res) => {
    try {
        const approvals = await ParticipationApproval.find({ proctorId: req.user.id })
            .populate('studentId', 'name registerNo department year email')
            .populate('upcomingHackathonId', 'title organization registrationDeadline hackathonDate mode')
            .sort({ createdAt: -1 });

        res.json(approvals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Participation Approval Status
exports.updateParticipationApproval = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const approval = await ParticipationApproval.findById(req.params.id);

        if (!approval) {
            return res.status(404).json({ message: 'Participation approval not found' });
        }

        if (approval.proctorId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this approval' });
        }

        approval.status = status;

        if (status === 'Declined') {
            approval.rejectionReason = rejectionReason;
        } else if (status === 'Approved') {
            approval.approvedAt = new Date();
            approval.rejectionReason = undefined;
        }

        await approval.save();

        res.json({ message: `Participation ${status}`, approval });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
