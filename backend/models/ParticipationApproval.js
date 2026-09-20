const mongoose = require('mongoose');

const participationApprovalSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    upcomingHackathonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UpcomingHackathon',
        required: true
    },
    proctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proctor',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Declined'],
        default: 'Pending'
    },
    enrollmentDetails: {
        studentName: {
            type: String,
            required: true
        },
        registerNo: {
            type: String,
            required: true
        },
        department: {
            type: String,
            required: true
        },
        year: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        experience: {
            type: String,
            required: true
        },
        motivation: {
            type: String,
            required: true
        },
        teamPreference: {
            type: String,
            enum: ['Individual', 'Team'],
            default: 'Individual'
        },
        skills: {
            type: String,
            required: true
        }
    },
    rejectionReason: {
        type: String
    },
    approvedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

participationApprovalSchema.index({ studentId: 1, upcomingHackathonId: 1 }, { unique: true });

module.exports = mongoose.model('ParticipationApproval', participationApprovalSchema);
