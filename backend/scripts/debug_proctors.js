const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Proctor = require('./models/Proctor');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkProctors() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const proctors = await Proctor.find({}, 'name email password');
        console.log('Proctors in DB:');
        proctors.forEach(p => {
            console.log(`Name: ${p.name}, Email: ${p.email}, Password Hash: ${p.password}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkProctors();
