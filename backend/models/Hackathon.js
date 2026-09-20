const mongoose = require('mongoose');

const hackathonSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    eventType: {
        type: String,
        required: true,
        enum: ['Hackathon', 'Codeathon'],
        default: 'Hackathon'
    },
    hackathonTitle: { type: String, required: true },
    organization: { type: String, required: true },
    mode: { type: String, required: true, enum: ['Online', 'Offline'] },
    date: { type: Date, required: true },
    year: { type: Number, required: true },
    description: { type: String, required: true },
    certificateFilePath: { type: String }, // Optional - not required for 'Registered' or 'Did Not Attend'
    status: { type: String, default: 'Pending', enum: ['Pending', 'Accepted', 'Declined'] },
    proctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proctor' },
    rejectionReason: { type: String },
    participantCount: { type: Number, default: 1 },
    upcomingHackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'UpcomingHackathon' },

    // Enhanced tracking fields
    attendanceStatus: {
        type: String,
        enum: ['Registered', 'Attended', 'Did Not Attend'],
        default: 'Attended' // For backward compatibility with existing submissions
    },
    achievementLevel: {
        type: String,
        enum: ['Participation', 'Winner', 'Runner-up', 'None'],
        default: 'Participation'
    },
    certificateType: {
        type: String,
        enum: ['Participation Certificate', 'Winner Certificate', 'Runner-up Certificate', 'None'],
        default: 'Participation Certificate'
    }
}, { timestamps: true });

// Index for efficient queries
// Removed unique index to allow multiple students to submit for the same hackathon title
hackathonSchema.index({ hackathonTitle: 1, year: 1 });
hackathonSchema.index({ studentId: 1 });
hackathonSchema.index({ year: 1 });
hackathonSchema.index({ status: 1 });

// Compound unique index to prevent the same student from submitting the same hackathon twice
// This allows multiple students to submit for the same hackathon in the same year
hackathonSchema.index({ studentId: 1, hackathonTitle: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Hackathon', hackathonSchema);
