const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    type: {
        type: String,
        required: true,
        enum: ['Conference', 'Hackathon', 'Workshop', 'Competition'],
        default: 'Conference'
    },
    organization: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    poster: { type: String }, // Path to uploaded image

    // Eligibility Criteria
    criteria: {
        minCGPA: { type: Number, default: 0 },
        minCredits: { type: Number, default: 0 }, // Based on past participation
        allowedDepartments: [{ type: String }], // e.g. ['CSE', 'ECE']
        eligibleYears: [{ type: String }] // e.g. ['2nd', '3rd']
    },

    // Important Dates
    deadline: { type: Date, required: true },
    eventDate: { type: Date, required: true },

    // Status
    status: {
        type: String,
        enum: ['Open', 'Closed', 'Archived'],
        default: 'Open'
    },

    // Tracking Interactions
    invitedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    interestedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }], // Students who clicked "I'm Interested"

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    upcomingHackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'UpcomingHackathon' }
}, { timestamps: true });

module.exports = mongoose.model('Opportunity', opportunitySchema);
