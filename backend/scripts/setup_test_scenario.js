const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('./models/Student');
const Hackathon = require('./models/Hackathon');
const Proctor = require('./models/Proctor');

dotenv.config();

const setupScenario = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        // 1. Find Student
        const student = await Student.findOne();
        if (!student) throw new Error('Student not found');

        // 2. Find Proctor 2 (Dr. Priya)
        const proctor2 = await Proctor.findOne({ email: 'proctor2@portal.com' });
        if (!proctor2) throw new Error('Proctor 2 not found');

        // 3. Assign Student to Proctor 2
        student.proctorId = proctor2._id;
        student.department = 'CSBS'; // Ensure department match if not already
        await student.save();
        console.log(`Updated Student ${student.name} -> Assigned to ${proctor2.name}`);

        // 4. Update existing hackathons to reflect this history? 
        // Note: Hackathon.proctorId is less important now as our controller uses student.proctorId, but let's update it for consistency.
        await Hackathon.updateMany({ studentId: student._id }, { proctorId: proctor2._id });
        console.log('Updated hackathons to point to Proctor 2');

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

setupScenario();
