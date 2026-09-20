const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Team = require('./models/Team');
const Proctor = require('./models/Proctor');

dotenv.config({ path: path.join(__dirname, '.env') });

async function reassignTeam() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const targetProctorEmail = 'proctor2@portal.com';
        const proctor = await Proctor.findOne({ email: targetProctorEmail });

        if (!proctor) {
            console.log(`Proctor ${targetProctorEmail} not found`);
            process.exit(1);
        }

        console.log(`Target Proctor: ${proctor.name} (${proctor._id})`);

        // Find Pending Approval teams
        const teams = await Team.find({ status: 'Pending Approval' });

        if (teams.length === 0) {
            console.log('No pending teams found to reassign.');
        } else {
            for (const team of teams) {
                team.proctorId = proctor._id;
                await team.save();
                console.log(`Reassigned team "${team.teamName}" to ${proctor.name}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

reassignTeam();
