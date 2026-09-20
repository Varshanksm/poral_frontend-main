const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    teamName: {
        type: String,
        required: true,
        trim: true
    },
    teamCode: {
        type: String,
        required: true,
        unique: true
    },
    upcomingHackathonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UpcomingHackathon',
        required: true
    },
    leaderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    members: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        },
        name: String,
        registerNo: String,
        email: String,
        department: String,
        status: {
            type: String,
            enum: ['Joined', 'Pending'],
            default: 'Joined'
        },
        certificatePath: {
            type: String
        },
        certificateStatus: {
            type: String,
            enum: ['Pending', 'Uploaded', 'Verified'],
            default: 'Pending'
        }
    }],
    proctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proctor',
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending Approval', 'Approved', 'Declined'],
        default: 'Draft'
    },
    rejectionReason: {
        type: String
    },
    submittedAt: {
        type: Date
    },
    approvedAt: {
        type: Date
    }
}, { timestamps: true });

// Ensure team name is unique within a specific hackathon
teamSchema.index({ teamName: 1, upcomingHackathonId: 1 }, { unique: true });

module.exports = mongoose.model('Team', teamSchema);
