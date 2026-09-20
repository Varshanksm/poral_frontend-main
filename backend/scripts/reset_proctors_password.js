const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Proctor = require('./models/Proctor');

dotenv.config({ path: path.join(__dirname, '.env') });

async function resetPasswords() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const proctors = [
            { email: 'proctor1@portal.com', password: '123456789' },
            { email: 'proctor2@portal.com', password: '123456a' }
        ];

        for (const p of proctors) {
            const proctor = await Proctor.findOne({ email: p.email });
            if (proctor) {
                proctor.password = p.password;
                await proctor.save();
                console.log(`Password reset for ${p.email}`);
            } else {
                console.log(`Proctor ${p.email} not found`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetPasswords();
