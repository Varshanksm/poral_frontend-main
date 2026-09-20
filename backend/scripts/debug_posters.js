const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const UpcomingHackathon = require('./models/UpcomingHackathon');

async function checkPosters() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const hackathons = await UpcomingHackathon.find({});
        console.log(`Found ${hackathons.length} upcoming hackathons`);

        hackathons.forEach(h => {
            console.log('------------------------------------------------');
            console.log(`Title: ${h.title}`);
            console.log(`ID: ${h._id}`);
            console.log(`posterPath (${typeof h.posterPath}): ${h.posterPath}`);
            if (h.posterPath) {
                console.log(`Starts with http? ${h.posterPath.startsWith('http')}`);
            }
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPosters();
