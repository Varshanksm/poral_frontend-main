const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Proctor = require('../models/Proctor');
const Admin = require('../models/Admin');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user based on role to ensure we have full details (like name/regNo)
            if (decoded.role === 'student') {
                req.user = await Student.findById(decoded.id).select('-password');
            } else if (decoded.role === 'proctor') {
                req.user = await Proctor.findById(decoded.id).select('-password');
            } else if (decoded.role === 'admin') {
                req.user = await Admin.findById(decoded.id).select('-password');
            }

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Ensure role is preserved from token if needed, or rely on DB
            req.user.role = decoded.role;

            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'User role not authorized' });
        }
        next();
    };
};
