const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: 'admin@tce.edu' });
        if (existingAdmin) {
            console.log('Admin already exists');
            process.exit(0);
        }

        // Create admin
        const admin = await Admin.create({
            email: 'admin@tce.edu',
            password: 'admin123'
        });

        console.log('Admin created successfully:');
        console.log('Email: admin@tce.edu');
        console.log('Password: admin123');
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
