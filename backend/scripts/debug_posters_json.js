const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const UpcomingHackathon = require('./models/UpcomingHackathon');

async function checkPosters() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const hackathons = await UpcomingHackathon.find({});

        console.log('JSON_START');
        console.log(JSON.stringify(hackathons.map(h => ({
            title: h.title,
            id: h._id,
            posterPath: h.posterPath,
            isCloudinary: h.posterPath && h.posterPath.startsWith('http')
        })), null, 2));
        console.log('JSON_END');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPosters();
