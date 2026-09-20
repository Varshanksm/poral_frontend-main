const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const Team = require('./models/Team');

async function checkTeam() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        const teamId = '69523df0e4d6d96322babed0';
        const team = await Team.findById(teamId);
        if (team) {
            console.log('Team Found:', team.teamName);
            console.log('Members:', team.members.length);
        } else {
            console.log('Team NOT Found in database');
            // List all teams to see if any exist
            const allTeams = await Team.find({});
            console.log('Total Teams in DB:', allTeams.length);
            allTeams.forEach(t => console.log(`- ${t.teamName} (${t._id})`));
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkTeam();
