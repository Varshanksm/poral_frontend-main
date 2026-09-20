const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const UpcomingHackathon = require('./models/UpcomingHackathon');

async function checkHackathons() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        const hackathons = await UpcomingHackathon.find({});
        console.log('Upcoming Hackathons in DB:');
        hackathons.forEach(h => {
            console.log(`- Title: ${h.title}`);
            console.log(`  PosterPath: ${h.posterPath}`);
            console.log(`  isActive: ${h.isActive}`);
            console.log(`  deadline: ${h.registrationDeadline}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkHackathons();
