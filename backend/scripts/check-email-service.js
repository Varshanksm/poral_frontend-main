require('dotenv').config();
const { sendEmail, emailTemplates } = require('./services/emailService');

console.log('Email service loaded successfully');
console.log('Templates available:', Object.keys(emailTemplates));

if (typeof emailTemplates.newUpcomingHackathon === 'function') {
    console.log('newUpcomingHackathon template is a function');
} else {
    console.error('newUpcomingHackathon template is MISSING or NOT a function');
}
