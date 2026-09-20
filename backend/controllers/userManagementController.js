const Student = require('../models/Student');
const Proctor = require('../models/Proctor');
const Admin = require('../models/Admin');
const XLSX = require('xlsx');
const fs = require('fs');

// Get all students

exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find().select('-password').sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all proctors
exports.getAllProctors = async (req, res) => {
    try {
        const proctors = await Proctor.find().select('-password').sort({ createdAt: -1 });
        res.json(proctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all admins
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update student
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Don't allow password updates through this endpoint
        delete updates.password;

        const currentStudent = await Student.findById(id);
        if (!currentStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Handle Proctor Assignment Change
        if (updates.proctorId !== undefined) {
            const oldProctorId = currentStudent.proctorId;
            const newProctorId = updates.proctorId;

            // If proctor is changing
            if (oldProctorId && (!newProctorId || oldProctorId.toString() !== newProctorId)) {
                // Remove from old proctor
                await Proctor.findByIdAndUpdate(oldProctorId, {
                    $pull: { assignedStudents: id }
                });
            }

            // If new proctor is assigned
            if (newProctorId) {
                // Add to new proctor
                await Proctor.findByIdAndUpdate(newProctorId, {
                    $addToSet: { assignedStudents: id }
                });
            }
        }

        const student = await Student.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update proctor
exports.updateProctor = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Don't allow password updates through this endpoint
        delete updates.password;

        const proctor = await Proctor.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!proctor) {
            return res.status(404).json({ message: 'Proctor not found' });
        }

        res.json(proctor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update admin
exports.updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Don't allow password updates through this endpoint
        delete updates.password;

        const admin = await Admin.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json(admin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete student
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        // Also delete related hackathons
        const Hackathon = require('../models/Hackathon');
        await Hackathon.deleteMany({ studentId: id });

        const student = await Student.findByIdAndDelete(id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ message: 'Student and related hackathons deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete proctor
exports.deleteProctor = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if proctor has assigned hackathons
        const Hackathon = require('../models/Hackathon');
        const assignedHackathons = await Hackathon.find({ proctorId: id });

        if (assignedHackathons.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete proctor with assigned hackathons. Please reassign hackathons first.'
            });
        }

        const proctor = await Proctor.findByIdAndDelete(id);

        if (!proctor) {
            return res.status(404).json({ message: 'Proctor not found' });
        }

        res.json({ message: 'Proctor deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete admin (prevent self-deletion)
exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (id === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own admin account' });
        }

        const admin = await Admin.findByIdAndDelete(id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
    try {
        const studentCount = await Student.countDocuments();
        const proctorCount = await Proctor.countDocuments();
        const adminCount = await Admin.countDocuments();

        res.json({
            students: studentCount,
            proctors: proctorCount,
            admins: adminCount,
            total: studentCount + proctorCount + adminCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Bulk upload students
exports.bulkUploadStudents = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const summary = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                // Normalize keys to lowercase and remove spaces
                const normalizedRow = {};
                Object.keys(row).forEach(key => {
                    const normalizedKey = key.toLowerCase().replace(/\s/g, '').replace(/no$/, 'no');
                    normalizedRow[normalizedKey] = row[key];
                });

                const name = normalizedRow.name || normalizedRow.fullname;
                const email = normalizedRow.email;
                const registerNo = normalizedRow.registerno || normalizedRow.regno || normalizedRow.registerid;
                const department = normalizedRow.department || normalizedRow.dept;
                const year = normalizedRow.year;
                const password = normalizedRow.password || 'Tce@123';

                if (!email || !name || !registerNo) {
                    throw new Error('Email, name, and Register No are required');
                }

                // Check for duplicate
                const existing = await Student.findOne({ $or: [{ email }, { registerNo }] });
                if (existing) {
                    throw new Error(`Student with email ${email} or Register No ${registerNo} already exists`);
                }

                const student = new Student({
                    name,
                    email,
                    registerNo,
                    department: department || 'General',
                    year: year || '1st',
                    password
                });

                await student.save();
                summary.success++;
            } catch (err) {
                summary.failed++;
                summary.errors.push({ row: i + 2, error: err.message });
            }
        }

        // Clean up temp file
        // In-memory processing, no cleanup needed

        res.json({ message: 'Bulk upload complete', summary });
    } catch (error) {
        // In-memory processing, no cleanup needed
        res.status(500).json({ error: error.message });
    }
};

// Bulk upload proctors
exports.bulkUploadProctors = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const summary = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                // Normalize keys
                const normalizedRow = {};
                Object.keys(row).forEach(key => {
                    normalizedRow[key.toLowerCase().replace(/\s/g, '')] = row[key];
                });

                const name = normalizedRow.name || normalizedRow.fullname;
                const email = normalizedRow.email;
                const department = normalizedRow.department || normalizedRow.dept;
                const password = normalizedRow.password || 'Proctor@123';

                if (!email || !name) {
                    throw new Error('Email and name are required');
                }

                // Check for duplicate
                const existing = await Proctor.findOne({ email });
                if (existing) {
                    throw new Error(`Proctor with email ${email} already exists`);
                }

                const proctor = new Proctor({
                    name,
                    email,
                    department: department || 'General',
                    password
                });

                await proctor.save();
                summary.success++;
            } catch (err) {
                summary.failed++;
                summary.errors.push({ row: i + 2, error: err.message });
            }
        }

        // Clean up temp file
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.json({ message: 'Bulk upload complete', summary });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: error.message });
    }
};
