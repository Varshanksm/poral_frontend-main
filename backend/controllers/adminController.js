const Hackathon = require('../models/Hackathon');
const Student = require('../models/Student');

const { sendEmail, emailTemplates } = require('../services/emailService');

// Get Dashboard Statistics
exports.getStats = async (req, res) => {
    try {
        const totalHackathons = await Hackathon.countDocuments();
        const pendingHackathons = await Hackathon.countDocuments({ status: 'Pending' });
        const approvedHackathons = await Hackathon.countDocuments({ status: 'Accepted' });
        const rejectedHackathons = await Hackathon.countDocuments({ status: 'Declined' });

        const onlineCount = await Hackathon.countDocuments({ mode: 'Online' });
        const offlineCount = await Hackathon.countDocuments({ mode: 'Offline' });

        // Attendance statistics
        const attendedCount = await Hackathon.countDocuments({ attendanceStatus: 'Attended' });
        const didNotAttendCount = await Hackathon.countDocuments({ attendanceStatus: 'Did Not Attend' });
        const registeredOnlyCount = await Hackathon.countDocuments({ attendanceStatus: 'Registered' });

        // Achievement statistics
        const winnersCount = await Hackathon.countDocuments({ achievementLevel: 'Winner' });
        const runnerUpsCount = await Hackathon.countDocuments({ achievementLevel: 'Runner-up' });
        const participationOnlyCount = await Hackathon.countDocuments({ achievementLevel: 'Participation' });

        // Count students with at least one approved hackathon
        const uniqueHackathonStudents = await Hackathon.distinct('studentId', { status: 'Accepted' });
        const studentsWithHackathons = uniqueHackathonStudents.length;

        const totalStudents = await Student.countDocuments();
        const totalProctors = await Student.countDocuments({ role: 'proctor' });

        res.json({
            totalHackathons,
            pendingHackathons,
            acceptedHackathons: approvedHackathons,
            declinedHackathons: rejectedHackathons,
            onlineCount,
            offlineCount,
            studentsWithHackathons,
            totalStudents,
            totalProctors,
            // Attendance breakdown
            attendedCount,
            didNotAttendCount,
            registeredOnlyCount,
            attendanceRate: totalHackathons > 0 ? ((attendedCount / totalHackathons) * 100).toFixed(1) : 0,
            // Achievement breakdown
            winnersCount,
            runnerUpsCount,
            participationOnlyCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get All Hackathons
exports.getAllHackathons = async (req, res) => {
    try {
        const hackathons = await Hackathon.find().populate('studentId', 'name registerNo department year');
        res.json(hackathons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLowParticipationStudents = async (req, res) => {
    try {
        const students = await Student.find({ credits: { $lt: 3 } }).select('name registerNo email department year credits');
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.sendLowParticipationAlerts = async (req, res) => {
    try {
        const students = await Student.find({ credits: { $lt: 3 } });
        let sentCount = 0;
        let failedCount = 0;

        for (const student of students) {
            const emailResult = await sendEmail(emailTemplates.participationAlert(student.name, student.email, student.credits));
            if (emailResult.success) {
                sentCount++;
            } else {
                failedCount++;
            }
        }

        res.json({
            message: 'Alerts process completed',
            sent: sentCount,
            failed: failedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
