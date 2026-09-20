const Opportunity = require('../models/Opportunity');
const Student = require('../models/Student');
const Proctor = require('../models/Proctor');
const { sendEmailBatch, emailTemplates } = require('../services/emailService');

// @desc    Create a new opportunity
// @route   POST /api/opportunities
// @access  Admin
exports.createOpportunity = async (req, res) => {
    try {
        const {
            title, type, organization, description,
            minCGPA, minCredits, allowedDepartments, eligibleYears,
            deadline, eventDate, upcomingHackathonId
        } = req.body;

        // When using Cloudinary, req.file.path contains the secure URL
        const poster = req.file ? req.file.path : null;

        // Parse arrays if they come as strings (from FormData)
        const parsedDepartments = typeof allowedDepartments === 'string' ? JSON.parse(allowedDepartments) : allowedDepartments;
        const parsedYears = typeof eligibleYears === 'string' ? JSON.parse(eligibleYears) : eligibleYears;

        const opportunity = new Opportunity({
            title,
            type,
            organization,
            description,
            poster,
            criteria: {
                minCGPA: minCGPA || 0,
                minCredits: minCredits || 0,
                allowedDepartments: parsedDepartments || [],
                eligibleYears: parsedYears || []
            },
            deadline,
            eventDate,
            createdBy: req.user.id,
            upcomingHackathonId
        });

        await opportunity.save();
        res.status(201).json(opportunity);
    } catch (error) {
        console.error('Create Opportunity Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Scan for eligible candidates
// @route   POST /api/opportunities/:id/scan
// @access  Admin
exports.scanForCandidates = async (req, res) => {
    try {
        const opportunity = await Opportunity.findById(req.params.id);
        if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

        const criteria = opportunity.criteria;

        // Build query
        const query = {
            cgpa: { $gte: criteria.minCGPA },
            credits: { $gte: criteria.minCredits }
        };

        if (criteria.allowedDepartments && criteria.allowedDepartments.length > 0) {
            query.department = { $in: criteria.allowedDepartments };
        }

        if (criteria.eligibleYears && criteria.eligibleYears.length > 0) {
            query.year = { $in: criteria.eligibleYears };
        }

        const candidates = await Student.find(query).select('name email cgpa credits department year proctorId');

        res.json({
            count: candidates.length,
            candidates
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send invites to candidates
// @route   POST /api/opportunities/:id/invite
// @access  Admin
exports.sendInvites = async (req, res) => {
    try {
        const { candidateIds } = req.body; // Array of Student IDs
        const opportunity = await Opportunity.findById(req.params.id);

        if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

        // Add to invitedStudents list (avoid duplicates)
        // Convert existing IDs to strings to ensure Set works correctly with new IDs
        const existingIds = opportunity.invitedStudents.map(id => id.toString());
        const uniqueIds = [...new Set([...existingIds, ...candidateIds])];
        opportunity.invitedStudents = uniqueIds;
        await opportunity.save();

        // 📧 Fetch students and send emails in background
        const students = await Student.find({ _id: { $in: candidateIds } }).select('name email');

        // Don't await this, let it run
        sendEmailBatch(students, (student) =>
            emailTemplates.opportunityExposed(student.name, student.email, opportunity.title, 'http://portal.tce.edu')
        ).catch(err => console.error('Invite Email Error:', err));

        res.json({ message: `Successfully invited ${candidateIds.length} students. Emails are queued.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get recommended opportunities for logged-in student
// @route   GET /api/opportunities/recommended
// @access  Student
exports.getRecommendedOpportunities = async (req, res) => {
    try {
        // Find opportunities where this student is in the 'invitedStudents' list
        const opportunities = await Opportunity.find({
            invitedStudents: req.user.id,
            status: 'Open'
        }).populate('upcomingHackathonId').sort({ createdAt: -1 });

        const results = opportunities.map(opp => {
            const oppObj = opp.toObject();
            if (!oppObj.poster && opp.upcomingHackathonId && opp.upcomingHackathonId.posterPath) {
                oppObj.poster = opp.upcomingHackathonId.posterPath;
            }
            return {
                ...oppObj,
                markedInterest: opp.interestedStudents.includes(req.user.id)
            };
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Student marks interest
// @route   PUT /api/opportunities/:id/interest
// @access  Student
exports.markInterest = async (req, res) => {
    try {
        const opportunity = await Opportunity.findById(req.params.id);
        if (!opportunity) return res.status(404).json({ message: 'Not found' });

        if (!opportunity.interestedStudents.includes(req.user.id)) {
            opportunity.interestedStudents.push(req.user.id);
            await opportunity.save();
        }

        res.json({ message: 'Interest marked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get opportunities involving a proctor's students
// @route   GET /api/opportunities/proctor-radar
// @access  Proctor
exports.getProctorRadar = async (req, res) => {
    try {
        // 1. Find all students belonging to this proctor
        const myStudents = await Student.find({ proctorId: req.user.id }).select('_id name');
        const studentIds = myStudents.map(s => s._id);

        // 2. Find opportunities where ANY of these students are invited
        const opportunities = await Opportunity.find({
            invitedStudents: { $in: studentIds },
            status: 'Open'
        }).populate('invitedStudents', 'name email year department'); // Populate to show names

        // 3. Filter the populated list to ONLY show this proctor's students
        // 3. Filter the populated list to ONLY show this proctor's students
        const relevantData = opportunities.map(opp => {
            // Filter list to only 'my' students
            const myInvitedCount = opp.invitedStudents.filter(s => studentIds.find(id => id.toString() === s._id.toString()));

            // Remove duplicates from myInvitedCount (in case the student ID appears multiple times in invitedStudents array in DB)
            const uniqueInvited = myInvitedCount.filter((student, index, self) =>
                index === self.findIndex((t) => (
                    t._id.toString() === student._id.toString()
                ))
            );

            // Map them to include 'hasAccepted' status
            const studentsWithStatus = uniqueInvited.map(student => {
                const isInterested = opp.interestedStudents.includes(student._id);
                return {
                    _id: student._id,
                    name: student.name,
                    email: student.email,
                    year: student.year,
                    hasAccepted: isInterested
                };
            });

            return {
                _id: opp._id,
                title: opp.title,
                type: opp.type,
                organization: opp.organization,
                deadline: opp.deadline,
                myStudentsInvited: studentsWithStatus
            };
        });

        res.json(relevantData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all opportunities (Admin)
// @route   GET /api/opportunities
// @access  Admin
exports.getAllOpportunities = async (req, res) => {
    try {
        const opportunities = await Opportunity.find().sort({ createdAt: -1 });
        res.json(opportunities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
