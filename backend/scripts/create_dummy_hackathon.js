const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('./models/Student');
const Hackathon = require('./models/Hackathon');
const Proctor = require('./models/Proctor');

dotenv.config();

const createData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        // Find a student
        const student = await Student.findOne();
        if (!student) {
            console.log('No student found!');
            process.exit();
        }

        // FIX: Update department to CSBS
        student.department = 'CSBS';
        await student.save();

        console.log('Student found:', student.name, student.department);

        // Find a proctor
        const proctor = await Proctor.findOne({ email: 'proctor1@portal.com' }) || await Proctor.findOne();
        console.log('Proctor found:', proctor.name, proctor.department);

        // Create Hackathon
        await Hackathon.create({
            studentId: student._id,
            proctorId: proctor._id, // Assign to Proctor 1
            hackathonTitle: 'Debug Hackathon 2025',
            eventType: 'Hackathon',
            organization: 'Google',
            mode: 'Online',
            date: new Date(),
            year: 2025,
            description: 'Auto-generated for debugging',
            status: 'Pending',
            attendanceStatus: 'Attended',
            achievementLevel: 'Participation'
        });

        console.log('Dummy Hackathon Created for student:', student.name);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

createData();
