const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Team = require('./models/Team');
const Proctor = require('./models/Proctor');
const Student = require('./models/Student');

dotenv.config({ path: path.join(__dirname, '.env') });

async function debugTeams() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        console.log('\n--- PROCTORS ---');
        const proctors = await Proctor.find({});
        proctors.forEach(p => {
            console.log(`ID: ${p._id}, Name: ${p.name}, Dept: ${p.department}, Email: ${p.email}`);
        });

        console.log('\n--- STUDENTS ---');
        const students = await Student.find({});
        students.forEach(s => {
            console.log(`ID: ${s._id}, Name: ${s.name}, Dept: ${s.department}, Email: ${s.email}`);
        });

        console.log('\n--- TEAMS ---');
        const teams = await Team.find({});
        if (teams.length === 0) {
            console.log('No teams found.');
        } else {
            teams.forEach(t => {
                console.log(`ID: ${t._id}, Name: ${t.teamName}, Status: ${t.status}`);
                console.log(`  Assigned Proctor ID: ${t.proctorId}`);
                console.log(`  Leader ID: ${t.leaderId}`);
                console.log(`  Members: ${t.members.length}`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugTeams();
